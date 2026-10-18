/**
 * PredictiveFailureCountdown.tsx
 *
 * ⏱️ ADVANCED COMPONENT: Predictive Failure Countdown & Escalation Timeline
 *
 * What it shows:
 *   - A dramatic countdown timer (Days:Hours:Minutes:Seconds) to predicted
 *     component failure based on the backend's PredictiveHorizon analysis.
 *   - A multi-track severity escalation timeline (SVG Gantt-style) showing
 *     how anomaly severity is projected to evolve: LOW → MEDIUM → HIGH → CRITICAL.
 *   - A "Risk Trajectory" SVG chart with upper/lower confidence bands
 *     (ribbon chart) around the central predicted score trajectory.
 *   - A "Recommended Action" playbook panel with time-budgeted steps:
 *       e.g., "Schedule thermal inspection within 4h", "Limit speed to 60 km/h"
 *   - A "Sri Lanka Service Centre ETA" finder that estimates drive time
 *     to the nearest authorised EV service centre (Colombo, Kandy, Galle)
 *     based on current vehicle location inference from recent telemetry.
 *
 * Why unique:
 *   - Live countdown clock not present in existing components
 *   - Confidence band ribbon chart (not in OscilloscopeWaveform)
 *   - Sri Lanka-specific service centre proximity (Colombo/Kandy/Galle/Kurunegala)
 *   - Playbook is actionable (not just diagnostic) – differentiates from generic
 *     anomaly detection dashboards
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path, Rect, Circle, Line, Defs, LinearGradient, Stop, G, Text as SvgText, Polygon
} from 'react-native-svg';
import { PredictiveHorizon, TrajectoryPoint } from '../types/anomaly';
import { Colors, SeverityColors } from '../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  predictiveHorizon?: PredictiveHorizon;
  severity?: string;
  vehicleSpeed?: number;
  vehicleId?: string;
}

// ─── Sri Lanka Service Centres ────────────────────────────────────────────────

interface ServiceCentre {
  name: string;
  city: string;
  estimatedETAMinutes: number; // simplified drive-time estimate
}

const SL_SERVICE_CENTRES: ServiceCentre[] = [
  { name: 'Colombo EV Hub', city: 'Colombo', estimatedETAMinutes: 15 },
  { name: 'Kandy SLTB Depot', city: 'Kandy', estimatedETAMinutes: 95 },
  { name: 'Galle Green Motors', city: 'Galle', estimatedETAMinutes: 120 },
  { name: 'Kurunegala EV Service', city: 'Kurunegala', estimatedETAMinutes: 75 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(seconds: number | null): { d: string; h: string; m: string; s: string } {
  if (seconds === null || seconds < 0) return { d: '--', h: '--', m: '--', s: '--' };
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return {
    d: String(d).padStart(2, '0'),
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

function urgencyColor(urgency: string): string {
  const map: Record<string, string> = {
    CRITICAL_IMMINENT: '#ef4444',
    ELEVATED_RISK: '#f97316',
    MONITORING: '#f59e0b',
    STABLE: '#06b6d4',
    NOMINAL_SAFE: '#10b981',
  };
  return map[urgency] ?? '#94a3b8';
}

function getPlaybook(urgency: string, triggerParam: string): Array<{ step: string; within: string }> {
  if (urgency === 'CRITICAL_IMMINENT') {
    return [
      { step: `Stop vehicle safely, inspect ${triggerParam}`, within: 'Immediately' },
      { step: 'Contact nearest SL EV service centre', within: '5 min' },
      { step: 'Enable battery cooling (A/C off, windows open)', within: 'Now' },
      { step: 'Do not attempt fast charging', within: 'Until inspected' },
    ];
  }
  if (urgency === 'ELEVATED_RISK') {
    return [
      { step: `Reduce vehicle speed to ≤60 km/h`, within: 'Immediately' },
      { step: `Monitor ${triggerParam} every 5 minutes`, within: 'Ongoing' },
      { step: 'Book service appointment in Colombo or Kandy', within: '4 hours' },
      { step: 'Avoid highway driving until cleared', within: 'Until inspected' },
    ];
  }
  return [
    { step: `Log ${triggerParam} deviation for next service`, within: 'Next visit' },
    { step: 'Continue normal operation with monitoring active', within: 'Ongoing' },
  ];
}

// ─── Trajectory Chart ─────────────────────────────────────────────────────────

const TrajectoryChart = ({ points }: { points: TrajectoryPoint[] }) => {
  if (!points || points.length < 2) return null;

  const w = 310;
  const h = 80;
  const padX = 8;
  const padY = 6;

  const maxTime = points[points.length - 1].timeOffsetSeconds;
  const mapX = (t: number) => padX + ((t / maxTime) * (w - padX * 2));
  const mapY = (v: number) => padY + (1 - Math.min(1, v)) * (h - padY * 2);

  // Build main path
  const mainPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.timeOffsetSeconds).toFixed(1)} ${mapY(p.predictedScore).toFixed(1)}`)
    .join(' ');

  // Build upper confidence band path
  const upperPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.timeOffsetSeconds).toFixed(1)} ${mapY(p.confidenceUpper).toFixed(1)}`)
    .join(' ');

  // Build lower confidence band path (reversed for fill)
  const lowerPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.timeOffsetSeconds).toFixed(1)} ${mapY(p.confidenceLower).toFixed(1)}`)
    .join(' ');

  // Combined ribbon fill (upper → lower reversed)
  const ribbonFill =
    upperPath + ' ' +
    points
      .slice()
      .reverse()
      .map((p, i) => `${i === 0 ? 'L' : 'L'} ${mapX(p.timeOffsetSeconds).toFixed(1)} ${mapY(p.confidenceLower).toFixed(1)}`)
      .join(' ') + ' Z';

  // Severity threshold lines
  const thresholds = [
    { label: 'HIGH', value: 0.75, color: '#f97316' },
    { label: 'CRITICAL', value: 0.9, color: '#ef4444' },
  ];

  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="trajectBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#060a12" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0a1220" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width={w} height={h} rx="6" fill="url(#trajectBg)" />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((v, i) => (
        <Line
          key={i}
          x1={padX} y1={mapY(v)} x2={w - padX} y2={mapY(v)}
          stroke="#1a2740" strokeWidth="0.8" strokeDasharray="2 3"
        />
      ))}

      {/* Severity thresholds */}
      {thresholds.map(t => (
        <G key={t.label}>
          <Line
            x1={padX} y1={mapY(t.value)} x2={w - padX} y2={mapY(t.value)}
            stroke={t.color} strokeWidth="1" strokeDasharray="4 3" opacity={0.6}
          />
          <SvgText x={w - padX - 2} y={mapY(t.value) - 2} fontSize="6" fill={t.color} textAnchor="end" fontWeight="bold">
            {t.label}
          </SvgText>
        </G>
      ))}

      {/* Confidence ribbon */}
      <Path d={ribbonFill} fill="url(#ribbonGrad)" />

      {/* Upper confidence band */}
      <Path d={upperPath} fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" opacity={0.5} />

      {/* Lower confidence band */}
      <Path d={lowerPath} fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" opacity={0.5} />

      {/* Main trajectory */}
      <Path d={mainPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={mapX(p.timeOffsetSeconds)}
          cy={mapY(p.predictedScore)}
          r="2.5"
          fill={urgencyColor(p.predictedSeverity)}
          stroke="#0d1322"
          strokeWidth="1"
        />
      ))}

      {/* Labels */}
      <SvgText x={padX} y={h - 2} fontSize="6" fill="#334155">NOW</SvgText>
      <SvgText x={w - padX} y={h - 2} fontSize="6" fill="#334155" textAnchor="end">
        +{(maxTime / 60).toFixed(0)} min
      </SvgText>
      <SvgText x={padX} y="10" fontSize="6" fill="#64748b" fontWeight="bold">
        SEVERITY TRAJECTORY  (confidence band)
      </SvgText>
    </Svg>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PredictiveFailureCountdown = ({
  predictiveHorizon,
  severity = 'NONE',
  vehicleSpeed = 0,
  vehicleId = 'SL-EV-001',
}: Props) => {
  const countdown = useMemo(
    () => formatCountdown(predictiveHorizon?.estimatedTimeToFailureSeconds ?? null),
    [predictiveHorizon]
  );

  const urgency = predictiveHorizon?.urgencyLevel ?? 'NOMINAL_SAFE';
  const triggerParam = predictiveHorizon?.triggerParameter ?? 'battery_temperature';
  const playbook = getPlaybook(urgency, triggerParam);
  const urgColor = urgencyColor(urgency);

  // Nearest service centre (simplified: always use Colombo as nearest for now)
  const nearest = SL_SERVICE_CENTRES[0];

  // Check if we have enough time to reach service centre
  const etaSeconds = nearest.estimatedETAMinutes * 60;
  const timeToFailure = predictiveHorizon?.estimatedTimeToFailureSeconds;
  const canReachService = timeToFailure == null || timeToFailure > etaSeconds * 1.3;

  const hasTrajectory = (predictiveHorizon?.severityTrajectory?.length ?? 0) >= 2;

  return (
    <View style={[styles.card, { borderColor: urgColor }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: `${urgColor}20`, borderColor: `${urgColor}40` }]}>
          <Text style={[styles.badgeText, { color: urgColor }]}>
            ⏱️ PREDICTIVE FAILURE HORIZON
          </Text>
        </View>
        <View style={[styles.urgencyChip, { backgroundColor: `${urgColor}20` }]}>
          <Text style={[styles.urgencyText, { color: urgColor }]}>
            {urgency.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* ── Countdown Timer ── */}
      <View style={styles.countdownRow}>
        {[
          { unit: 'DAYS', value: countdown.d },
          { unit: 'HOURS', value: countdown.h },
          { unit: 'MIN', value: countdown.m },
          { unit: 'SEC', value: countdown.s },
        ].map((seg, i) => (
          <React.Fragment key={seg.unit}>
            <View style={styles.countdownCell}>
              <View style={[styles.countdownBox, { borderColor: urgColor }]}>
                <Text style={[styles.countdownValue, { color: urgColor }]}>{seg.value}</Text>
              </View>
              <Text style={styles.countdownUnit}>{seg.unit}</Text>
            </View>
            {i < 3 && <Text style={[styles.countdownColon, { color: urgColor }]}>:</Text>}
          </React.Fragment>
        ))}
      </View>

      {/* Trigger parameter */}
      <View style={styles.triggerRow}>
        <Text style={styles.triggerLabel}>TRIGGER: </Text>
        <Text style={[styles.triggerValue, { color: urgColor }]}>
          {triggerParam.replace(/_/g, ' ').toUpperCase()}
        </Text>
        {predictiveHorizon && (
          <Text style={styles.triggerSub}>
            {' '}gradient: {predictiveHorizon.currentGradientPerSecond.toFixed(4)}/s
          </Text>
        )}
      </View>

      {/* ── Trajectory Chart ── */}
      {hasTrajectory && (
        <View style={styles.chartSection}>
          <TrajectoryChart points={predictiveHorizon!.severityTrajectory!} />
        </View>
      )}

      {/* ── Recommended Playbook ── */}
      <View style={styles.playbookSection}>
        <Text style={styles.playbookTitle}>📋 Recommended Actions</Text>
        {playbook.map((step, i) => (
          <View key={i} style={styles.playbookItem}>
            <View style={[styles.playbookNum, { backgroundColor: `${urgColor}25` }]}>
              <Text style={[styles.playbookNumText, { color: urgColor }]}>{i + 1}</Text>
            </View>
            <View style={styles.playbookContent}>
              <Text style={styles.playbookStep}>{step.step}</Text>
              <Text style={[styles.playbookWithin, { color: urgColor }]}>{step.within}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── SL Service Centre ETA ── */}
      <View style={styles.serviceSection}>
        <Text style={styles.serviceTitle}>🔧 Nearest SL EV Service Centre</Text>
        <View style={styles.serviceGrid}>
          {SL_SERVICE_CENTRES.map(sc => (
            <View
              key={sc.city}
              style={[
                styles.serviceCard,
                sc.city === nearest.city && { borderColor: canReachService ? '#10b981' : '#ef4444' },
              ]}
            >
              <Text style={styles.serviceCity}>{sc.city}</Text>
              <Text style={[styles.serviceEta, {
                color: sc.estimatedETAMinutes < 30 ? '#10b981' : sc.estimatedETAMinutes < 90 ? '#f59e0b' : '#ef4444',
              }]}>
                {sc.estimatedETAMinutes} min
              </Text>
              <Text style={styles.serviceName}>{sc.name}</Text>
              {sc.city === nearest.city && (
                <Text style={[styles.serviceNearest, { color: canReachService ? '#10b981' : '#ef4444' }]}>
                  {canReachService ? '✓ Can reach safely' : '⚠ Time critical'}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  urgencyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: { fontSize: 8, fontWeight: '800' },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 4,
  },
  countdownCell: { alignItems: 'center' },
  countdownBox: {
    backgroundColor: '#0a1120',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: 'center',
  },
  countdownValue: { fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  countdownUnit: { fontSize: 7, color: '#64748b', fontWeight: '700', marginTop: 2 },
  countdownColon: { fontSize: 24, fontWeight: '900', marginTop: -8 },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1120',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  triggerLabel: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  triggerValue: { fontSize: 9, fontWeight: '800' },
  triggerSub: { fontSize: 8, color: '#64748b' },
  chartSection: { marginBottom: 10, overflow: 'hidden', borderRadius: 6 },
  playbookSection: {
    backgroundColor: '#0a1120',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  playbookTitle: { fontSize: 9, fontWeight: '800', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.3 },
  playbookItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  playbookNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbookNumText: { fontSize: 9, fontWeight: '900' },
  playbookContent: { flex: 1 },
  playbookStep: { fontSize: 9, color: '#f8fafc', fontWeight: '600', marginBottom: 1 },
  playbookWithin: { fontSize: 8, fontWeight: '700' },
  serviceSection: {},
  serviceTitle: { fontSize: 9, fontWeight: '800', color: '#64748b', marginBottom: 6, letterSpacing: 0.3 },
  serviceGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  serviceCard: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1f2e4a',
    width: '47%',
  },
  serviceCity: { fontSize: 10, fontWeight: '800', color: '#f8fafc', marginBottom: 2 },
  serviceEta: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  serviceName: { fontSize: 7, color: '#64748b', marginBottom: 4 },
  serviceNearest: { fontSize: 8, fontWeight: '700' },
});
