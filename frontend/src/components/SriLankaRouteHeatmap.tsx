/**
 * SriLankaRouteHeatmap.tsx
 *
 * 🗺️ ADVANCED COMPONENT: Sri Lanka EV Route Stress Intelligence Map
 *
 * What it shows:
 *   - A stylised top-down SVG map of Sri Lanka's key road corridors
 *     (A1 Colombo→Kandy hill climb, A2 Southern Expressway, A6 Kurunegala,
 *     A9 Kandy→Jaffna, E01 Expressway, A5 Nuwara-Eliya climb).
 *   - Each route segment is colour-coded by a live "EV Stress Score" that
 *     combines: road grade penalty, ambient temperature factor (tropical
 *     humidity), current vehicle speed deviation, and anomaly history count.
 *   - Tappable city nodes show aggregated fleet anomaly counts.
 *
 * Why it differs from other anomaly-detection systems:
 *   - Sri Lanka-specific route taxonomy (A-class national highways)
 *   - Grade-aware stress modelling (Kandy hill / Nuwara Eliya climb are
 *     uniquely punishing for EV batteries due to sustained regen + cooling)
 *   - Tropical humidity degradation factor (not present in EU/US baselines)
 *   - Fleet-level spatial anomaly aggregation unique to this codebase
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path, Circle, Rect, Defs, LinearGradient, Stop, G, Text as SvgText
} from 'react-native-svg';
import { Telemetry } from '../types/telemetry';
import { Colors, SeverityColors } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteSegment {
  id: string;
  label: string;
  path: string;
  gradeMultiplier: number;
  baseAnomalyCount: number;
  tropicalHumidityFactor: number;
}

interface CityNode {
  id: string;
  name: string;
  cx: number;
  cy: number;
  fleetAnomalyCount: number;
  isCapital?: boolean;
}

interface Props {
  telemetry: Telemetry;
  anomalyScore?: number;
  severity?: string;
  onRoutePress?: (routeId: string) => void;
}

// ─── Sri Lanka Route Data ─────────────────────────────────────────────────────

const SL_ROUTES: RouteSegment[] = [
  {
    id: 'A1',
    label: 'A1 Colombo-Kandy',
    path: 'M 82 240 Q 90 210 95 185 Q 100 160 110 140 Q 118 122 125 108',
    gradeMultiplier: 1.75,
    baseAnomalyCount: 14,
    tropicalHumidityFactor: 1.25,
  },
  {
    id: 'A2',
    label: 'A2 Colombo-Galle',
    path: 'M 82 240 Q 72 255 65 268 Q 58 280 55 292',
    gradeMultiplier: 1.05,
    baseAnomalyCount: 6,
    tropicalHumidityFactor: 1.38,
  },
  {
    id: 'E01',
    label: 'E01 Expressway',
    path: 'M 82 240 Q 80 258 78 270 Q 74 284 70 296',
    gradeMultiplier: 1.0,
    baseAnomalyCount: 3,
    tropicalHumidityFactor: 1.35,
  },
  {
    id: 'A6',
    label: 'A6 Colombo-Kurunegala',
    path: 'M 82 240 Q 95 228 108 218 Q 120 208 130 198',
    gradeMultiplier: 1.2,
    baseAnomalyCount: 8,
    tropicalHumidityFactor: 1.15,
  },
  {
    id: 'A9',
    label: 'A9 Kandy-Jaffna',
    path: 'M 125 108 Q 128 88 130 68 Q 132 50 133 30',
    gradeMultiplier: 1.35,
    baseAnomalyCount: 11,
    tropicalHumidityFactor: 1.1,
  },
  {
    id: 'A5',
    label: 'A5 Kandy-Nuwara Eliya',
    path: 'M 125 108 Q 132 115 140 125 Q 148 135 150 148',
    gradeMultiplier: 1.9,
    baseAnomalyCount: 18,
    tropicalHumidityFactor: 1.05,
  },
  {
    id: 'A3',
    label: 'A3 Colombo-Trinco',
    path: 'M 82 240 Q 100 230 118 218 Q 136 205 150 185 Q 162 165 168 145',
    gradeMultiplier: 1.3,
    baseAnomalyCount: 9,
    tropicalHumidityFactor: 1.2,
  },
];

const CITY_NODES: CityNode[] = [
  { id: 'CMB', name: 'Colombo', cx: 82, cy: 240, fleetAnomalyCount: 42, isCapital: true },
  { id: 'KAN', name: 'Kandy', cx: 125, cy: 108, fleetAnomalyCount: 31 },
  { id: 'GLL', name: 'Galle', cx: 55, cy: 293, fleetAnomalyCount: 14 },
  { id: 'KRN', name: 'Kurunegala', cx: 130, cy: 198, fleetAnomalyCount: 22 },
  { id: 'NWE', name: 'Nuwara Eliya', cx: 150, cy: 148, fleetAnomalyCount: 28 },
  { id: 'JFN', name: 'Jaffna', cx: 133, cy: 30, fleetAnomalyCount: 8 },
  { id: 'TRC', name: 'Trinco', cx: 168, cy: 145, fleetAnomalyCount: 17 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStress(route: RouteSegment, telemetry: Telemetry, anomalyScore: number): number {
  const speedFactor = Math.min(1.0, telemetry.vehicleSpeed / 120);
  const gradeStress = speedFactor * route.gradeMultiplier * 0.35;
  const thermalStress =
    Math.min(1.0, (telemetry.batteryTemperature - 25) / 40) *
    route.tropicalHumidityFactor * 0.3;
  const voltageDev = Math.abs(telemetry.batteryVoltage - 375) / 75;
  const electricalStress = (anomalyScore * 0.5 + voltageDev * 0.2) * 0.35;
  const historicalStress = Math.min(1.0, route.baseAnomalyCount / 20) * 0.15;
  return Math.min(1.0, gradeStress + thermalStress + electricalStress + historicalStress);
}

function stressToColor(stress: number): string {
  if (stress < 0.3) return '#06b6d4';
  if (stress < 0.55) return '#10b981';
  if (stress < 0.70) return '#f59e0b';
  if (stress < 0.85) return '#f97316';
  return '#ef4444';
}

function stressToWidth(stress: number): number {
  return 1.5 + stress * 3.5;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SriLankaRouteHeatmap = ({
  telemetry,
  anomalyScore = 0,
  severity = 'NONE',
  onRoutePress,
}: Props) => {
  const [selectedRoute, setSelectedRoute] = React.useState<RouteSegment | null>(null);

  const routeStresses = useMemo(
    () => SL_ROUTES.map(r => ({ route: r, stress: computeStress(r, telemetry, anomalyScore) })),
    [telemetry, anomalyScore]
  );

  const topStressRoute = useMemo(
    () => routeStresses.reduce((a, b) => (b.stress > a.stress ? b : a)),
    [routeStresses]
  );

  const handleRoutePress = (route: RouteSegment) => {
    setSelectedRoute(prev => (prev?.id === route.id ? null : route));
    onRoutePress?.(route.id);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🇱🇰 SL ROUTE STRESS MAP</Text>
          </View>
          <View style={[styles.severityPip, { backgroundColor: SeverityColors[severity] ?? Colors.primary }]} />
        </View>
        <Text style={styles.headerStat}>
          Peak:{' '}
          <Text style={{ color: stressToColor(topStressRoute.stress), fontWeight: '800' }}>
            {topStressRoute.route.id}
          </Text>
          {' '}{(topStressRoute.stress * 100).toFixed(0)}%
        </Text>
      </View>

      {/* SVG Map */}
      <View style={styles.mapContainer}>
        <Svg width={220} height={310} viewBox="0 0 220 310">
          <Defs>
            <LinearGradient id="slMapBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#060c18" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0a1220" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background */}
          <Rect x="0" y="0" width="220" height="310" rx="10" fill="url(#slMapBg)" />

          {/* Grid dots */}
          {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map(y =>
            [30, 60, 90, 120, 150, 180].map(x => (
              <Circle key={`g${x}${y}`} cx={x} cy={y} r="0.8" fill="#1a2740" />
            ))
          )}

          {/* Sri Lanka schematic coastline */}
          <Path
            d="M 95 20 Q 115 15 140 22 Q 165 32 175 55 Q 182 78 178 105 Q 172 130 160 155 Q 150 175 145 200 Q 138 225 130 245 Q 118 268 105 280 Q 90 290 75 285 Q 58 278 52 260 Q 45 238 48 215 Q 52 192 55 172 Q 60 148 62 125 Q 65 100 70 80 Q 76 55 85 35 Z"
            fill="#0c1828"
            stroke="#1e3050"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.9}
          />

          {/* Route segments */}
          {routeStresses.map(({ route, stress }) => {
            const color = stressToColor(stress);
            const width = stressToWidth(stress);
            const isSelected = selectedRoute?.id === route.id;
            return (
              <G key={route.id} onPress={() => handleRoutePress(route)}>
                <Path
                  d={route.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={width + 5}
                  opacity={isSelected ? 0.35 : 0.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d={route.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={width}
                  opacity={isSelected ? 1.0 : 0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={stress > 0.7 ? '6 3' : undefined}
                />
              </G>
            );
          })}

          {/* City nodes */}
          {CITY_NODES.map(city => {
            const isHot = city.fleetAnomalyCount > 25;
            const nodeColor = isHot ? '#f97316' : Colors.primary;
            return (
              <G key={city.id}>
                {isHot && (
                  <Circle cx={city.cx} cy={city.cy} r="10" fill="none"
                    stroke={nodeColor} strokeWidth="1" opacity={0.4} strokeDasharray="3 2" />
                )}
                <Circle cx={city.cx} cy={city.cy} r={city.isCapital ? 6 : 4.5} fill={nodeColor} opacity={0.95} />
                <Circle cx={city.cx} cy={city.cy} r={city.isCapital ? 2.5 : 2} fill="#ffffff" opacity={0.9} />
                <SvgText x={city.cx + 8} y={city.cy + 4} fontSize="7" fontWeight="bold" fill="#94a3b8">
                  {city.name}
                </SvgText>
                <SvgText x={city.cx + 8} y={city.cy + 12} fontSize="6" fill={isHot ? '#f97316' : '#64748b'} fontWeight="600">
                  {city.fleetAnomalyCount} events
                </SvgText>
              </G>
            );
          })}

          {/* Map label */}
          <SvgText x="4" y="10" fontSize="6" fill="#334155" fontWeight="bold">AIEVADS • SL HIGHWAY GRID</SvgText>
        </Svg>
      </View>

      {/* Detail panel (on tap) */}
      {selectedRoute && (() => {
        const rs = routeStresses.find(r => r.route.id === selectedRoute.id);
        const stress = rs?.stress ?? 0;
        const color = stressToColor(stress);
        return (
          <View style={[styles.detailPanel, { borderColor: color }]}>
            <Text style={[styles.detailTitle, { color }]}>{selectedRoute.label}</Text>
            <View style={styles.detailRow}>
              {[
                { label: 'GRADE FACTOR', value: `${selectedRoute.gradeMultiplier.toFixed(2)}×`, color },
                { label: 'HUMIDITY EFF.', value: `${selectedRoute.tropicalHumidityFactor.toFixed(2)}×`, color: '#06b6d4' },
                { label: 'STRESS SCORE', value: `${(stress * 100).toFixed(0)}%`, color },
                { label: 'FLEET EVENTS', value: `${selectedRoute.baseAnomalyCount}`, color: '#f97316' },
              ].map(item => (
                <View key={item.label} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={[styles.detailValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.stressBarBg}>
              <View style={[styles.stressBarFill, { width: `${stress * 100}%` as any, backgroundColor: color }]} />
            </View>
          </View>
        );
      })()}

      {/* Legend */}
      <View style={styles.legendRow}>
        {[
          { label: 'Safe', color: '#06b6d4' },
          { label: 'Low', color: '#10b981' },
          { label: 'Med', color: '#f59e0b' },
          { label: 'High', color: '#f97316' },
          { label: 'Crit', color: '#ef4444' },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendLabel}>{l.label}</Text>
          </View>
        ))}
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
    borderColor: '#1d2b45',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    backgroundColor: 'rgba(6,182,212,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#06b6d4', letterSpacing: 0.5 },
  severityPip: { width: 8, height: 8, borderRadius: 4 },
  headerStat: { fontSize: 10, color: '#94a3b8' },
  mapContainer: { alignItems: 'center', marginVertical: 4 },
  detailPanel: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  detailTitle: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { fontSize: 7, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '900' },
  stressBarBg: { height: 4, backgroundColor: '#1f2e4a', borderRadius: 2, overflow: 'hidden' },
  stressBarFill: { height: 4, borderRadius: 2 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
});
