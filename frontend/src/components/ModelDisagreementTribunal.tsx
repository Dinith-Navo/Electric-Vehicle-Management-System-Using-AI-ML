/**
 * ModelDisagreementTribunal.tsx
 *
 * ⚖️ ADVANCED COMPONENT: AI Model Disagreement Forensics Tribunal
 *
 * What it shows:
 *   - When the 3 AI models (Isolation Forest, One-Class SVM, Autoencoder)
 *     disagree on whether a vehicle state is anomalous, this component
 *     renders a "tribunal" visualisation that makes the disagreement
 *     forensically transparent and actionable.
 *   - A "Courtroom" SVG layout: 3 judge panels (one per model) with
 *     evidence score bars, their individual "verdict", and their
 *     primary sensitivity feature and known blind-spot risk.
 *   - An "Arbitration Chain" shows which model's vote was used as
 *     the authoritative decision and why.
 *   - A "Consensus Strength" radial widget pulsing with the agreement ratio.
 *   - A unique "Sri Lanka Road Condition Context" adds a terrain-aware
 *     explanation: e.g., "IsoForest triggered by normal Kandy hill vibration
 *     – this is a known false positive on rough SL mountain roads."
 *
 * Why unique:
 *   - No other component in the system renders model-level disagreement
 *     with individual evidence/reasoning exposed to the user
 *   - The tribunal metaphor (judge panels + arbitration) is visually
 *     unique in anomaly-detection UX
 *   - Sri Lanka road context as a model-calibration filter is unique
 *   - Consensus strength radial is different from all existing components
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, {
  Rect, Circle, Line, Path, Defs, LinearGradient, RadialGradient, Stop, G, Text as SvgText
} from 'react-native-svg';
import { DisagreementForensics, ModelDivergencePerspective } from '../types/anomaly';
import { Colors } from '../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  disagreementForensics?: DisagreementForensics;
  anomalyScore?: number;
  severity?: string;
  /** SL road condition context: helps explain IsoForest false positives on rough roads */
  roadCondition?: 'HIGHWAY_SMOOTH' | 'MOUNTAIN_ROUGH' | 'CITY_POTHOLED' | 'COASTAL_NORMAL';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_DISPLAY: Record<string, { icon: string; color: string; shortName: string }> = {
  'Isolation Forest': { icon: '🌲', color: '#10b981', shortName: 'ISO-FOREST' },
  'One-Class SVM': { icon: '🔮', color: '#6366f1', shortName: 'OC-SVM' },
  'Autoencoder': { icon: '🧠', color: '#06b6d4', shortName: 'AE-DNN' },
};

const SL_ROAD_CONTEXT: Record<Props['roadCondition'] & string, string> = {
  HIGHWAY_SMOOTH: 'E01/A2 expressway conditions – low vibration noise. Model readings reliable.',
  MOUNTAIN_ROUGH: 'Kandy/Nuwara Eliya mountain roads – high vibration. IsoForest may over-trigger on mechanical noise.',
  CITY_POTHOLED: 'Colombo urban grid – frequent speed bumps. SVM sensitive to current spikes from frequent stops.',
  COASTAL_NORMAL: 'Coastal highway (A2/Galle) – salt air detected. AE-DNN humidity degradation mode active.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
): string {
  const toRad = (a: number) => (a * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// ─── Consensus Radial ─────────────────────────────────────────────────────────

const ConsensusRadial = ({
  consensus, agreementState,
}: {
  consensus: number;
  agreementState: string;
}) => {
  const size = 90;
  const cx = size / 2;
  const cy = size / 2;
  const fillAngle = -90 + (consensus / 100) * 360;
  const color = consensus > 70 ? '#10b981' : consensus > 40 ? '#f59e0b' : '#ef4444';

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="cGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r="40" fill="url(#cGlow)" />
      {/* Track */}
      <Path d={describeArc(cx, cy, 35, -90, 270)} fill="none" stroke="#1a2740" strokeWidth="8" strokeLinecap="round" />
      {/* Fill */}
      {consensus > 0 && (
        <Path d={describeArc(cx, cy, 35, -90, fillAngle)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      <SvgText x={cx} y={cy - 6} fontSize="18" fontWeight="900" fill={color} textAnchor="middle">
        {consensus.toFixed(0)}%
      </SvgText>
      <SvgText x={cx} y={cy + 8} fontSize="6" fontWeight="700" fill="#64748b" textAnchor="middle">
        CONSENSUS
      </SvgText>
    </Svg>
  );
};

// ─── Judge Panel ──────────────────────────────────────────────────────────────

const JudgePanel = ({
  perspective,
  isAuthoritative,
}: {
  perspective: ModelDivergencePerspective;
  isAuthoritative: boolean;
}) => {
  const display = MODEL_DISPLAY[perspective.modelName] ?? {
    icon: '🤖',
    color: '#94a3b8',
    shortName: perspective.modelName,
  };
  const isAnomaly = perspective.vote === 'ANOMALY';
  const voteColor = isAnomaly ? '#ef4444' : '#10b981';
  const evidencePct = Math.round(perspective.evidenceScore * 100);

  return (
    <View style={[jStyles.panel, isAuthoritative && { borderColor: display.color, backgroundColor: '#111b2e' }]}>
      {isAuthoritative && (
        <View style={[jStyles.authBadge, { backgroundColor: `${display.color}20` }]}>
          <Text style={[jStyles.authText, { color: display.color }]}>⚡ AUTHORITATIVE</Text>
        </View>
      )}
      <Text style={jStyles.icon}>{display.icon}</Text>
      <Text style={[jStyles.modelName, { color: display.color }]}>{display.shortName}</Text>

      {/* Verdict */}
      <View style={[jStyles.verdict, { backgroundColor: `${voteColor}15`, borderColor: `${voteColor}40` }]}>
        <Text style={[jStyles.verdictText, { color: voteColor }]}>
          {isAnomaly ? '⚠️ GUILTY' : '✓ CLEAR'}
        </Text>
      </View>

      {/* Evidence bar */}
      <Text style={jStyles.evidenceLabel}>EVIDENCE</Text>
      <View style={jStyles.evidenceBarBg}>
        <View style={[jStyles.evidenceBarFill, {
          width: `${evidencePct}%` as any,
          backgroundColor: isAnomaly ? '#ef4444' : '#10b981',
        }]} />
      </View>
      <Text style={[jStyles.evidenceValue, { color: isAnomaly ? '#ef4444' : '#10b981' }]}>
        {evidencePct}%
      </Text>

      {/* Sensitivity feature */}
      <Text style={jStyles.sensitivityLabel}>SENSITIVE TO</Text>
      <Text style={[jStyles.sensitivityVal, { color: display.color }]} numberOfLines={2}>
        {perspective.primarySensitivityFeature}
      </Text>

      {/* Blind-spot risk */}
      <Text style={jStyles.blindspotLabel}>BLIND-SPOT</Text>
      <Text style={jStyles.blindspotVal} numberOfLines={2}>{perspective.blindspotRisk}</Text>
    </View>
  );
};

// ─── Arbitration Chain ────────────────────────────────────────────────────────

const ArbitrationChain = ({
  authoritative,
  dissenting,
  verdict,
}: {
  authoritative: string;
  dissenting: string;
  verdict: string;
}) => {
  const authDisplay = MODEL_DISPLAY[authoritative];
  const dissDisplay = MODEL_DISPLAY[dissenting];

  return (
    <View style={aStyles.chain}>
      <Text style={aStyles.chainTitle}>⚖️ ARBITRATION CHAIN</Text>
      <View style={aStyles.chainRow}>
        <View style={[aStyles.chainModel, { borderColor: authDisplay?.color ?? '#94a3b8' }]}>
          <Text style={aStyles.chainIcon}>{authDisplay?.icon ?? '🤖'}</Text>
          <Text style={[aStyles.chainName, { color: authDisplay?.color ?? '#94a3b8' }]}>
            {authDisplay?.shortName ?? authoritative}
          </Text>
          <Text style={aStyles.chainRole}>AUTHORITY</Text>
        </View>
        <View style={aStyles.chainArrowContainer}>
          <View style={aStyles.chainArrowLine} />
          <Text style={aStyles.chainArrowLabel}>overrides</Text>
          <View style={aStyles.chainArrowLine} />
        </View>
        <View style={[aStyles.chainModel, { borderColor: dissDisplay?.color ?? '#94a3b8', opacity: 0.6 }]}>
          <Text style={aStyles.chainIcon}>{dissDisplay?.icon ?? '🤖'}</Text>
          <Text style={[aStyles.chainName, { color: dissDisplay?.color ?? '#94a3b8' }]}>
            {dissDisplay?.shortName ?? dissenting}
          </Text>
          <Text style={aStyles.chainRole}>DISSENTING</Text>
        </View>
      </View>
      <View style={aStyles.verdictBox}>
        <Text style={aStyles.verdictLabel}>FINAL ARBITRATION VERDICT:</Text>
        <Text style={aStyles.verdictText}>{verdict}</Text>
      </View>
    </View>
  );
};

// ─── Fallback (no disagreement data) ─────────────────────────────────────────

const FullConsensusCard = ({ score }: { score: number }) => (
  <View style={styles.consensusCard}>
    <Text style={styles.consensusIcon}>🤝</Text>
    <Text style={styles.consensusTitle}>All models in full consensus</Text>
    <Text style={styles.consensusSubtitle}>Ensemble score: {(score * 100).toFixed(1)}%</Text>
    <Text style={styles.consensusDetail}>
      Isolation Forest, One-Class SVM, and Autoencoder all agree on this vehicle state.
      No arbitration required.
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ModelDisagreementTribunal = ({
  disagreementForensics,
  anomalyScore = 0,
  severity = 'NONE',
  roadCondition = 'CITY_POTHOLED',
}: Props) => {
  const hasDisagreement = !!(
    disagreementForensics &&
    disagreementForensics.divergencePerspectives?.length > 0
  );

  const consensus = disagreementForensics?.consensusStrength ?? 100;
  const agreementState = disagreementForensics?.agreementState ?? 'FULL_CONSENSUS';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚖️ AI MODEL DISAGREEMENT TRIBUNAL</Text>
        </View>
        {hasDisagreement && (
          <View style={styles.discordBadge}>
            <Text style={styles.discordText}>DISCORD</Text>
          </View>
        )}
      </View>

      {/* Consensus radial + agreement state */}
      <View style={styles.topRow}>
        <ConsensusRadial consensus={consensus} agreementState={agreementState} />
        <View style={styles.agreementInfo}>
          <Text style={styles.agreementLabel}>AGREEMENT STATE</Text>
          <Text style={[styles.agreementValue, {
            color: consensus > 70 ? '#10b981' : consensus > 40 ? '#f59e0b' : '#ef4444'
          }]}>
            {agreementState.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.agreementScore}>
            Anomaly score: <Text style={{ color: '#06b6d4', fontWeight: '800' }}>
              {(anomalyScore * 100).toFixed(1)}%
            </Text>
          </Text>
          <Text style={styles.agreementSeverity}>
            Severity: <Text style={{ fontWeight: '800', color: severity === 'NONE' ? '#10b981' : '#ef4444' }}>
              {severity}
            </Text>
          </Text>
        </View>
      </View>

      {/* Road condition SL context */}
      <View style={styles.roadContext}>
        <Text style={styles.roadContextTitle}>🛣️ Sri Lanka Road Condition Context</Text>
        <Text style={styles.roadContextText}>{SL_ROAD_CONTEXT[roadCondition]}</Text>
      </View>

      {/* Content: either full consensus or tribunal panels */}
      {!hasDisagreement ? (
        <FullConsensusCard score={anomalyScore} />
      ) : (
        <>
          {/* Judge panels */}
          <View style={styles.judgesRow}>
            {disagreementForensics!.divergencePerspectives.map(p => (
              <JudgePanel
                key={p.modelName}
                perspective={p}
                isAuthoritative={p.modelName === disagreementForensics!.authoritativeModel}
              />
            ))}
          </View>

          {/* Arbitration chain */}
          <ArbitrationChain
            authoritative={disagreementForensics!.authoritativeModel}
            dissenting={disagreementForensics!.dissentingModel}
            verdict={disagreementForensics!.arbitrationVerdict}
          />
        </>
      )}
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
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#6366f1', letterSpacing: 0.5 },
  discordBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  discordText: { fontSize: 9, fontWeight: '800', color: '#ef4444' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  agreementInfo: { flex: 1 },
  agreementLabel: { fontSize: 8, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  agreementValue: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
  agreementScore: { fontSize: 9, color: '#94a3b8', marginBottom: 2 },
  agreementSeverity: { fontSize: 9, color: '#94a3b8' },
  roadContext: {
    backgroundColor: '#0a1120',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a2740',
  },
  roadContextTitle: { fontSize: 8, fontWeight: '800', color: '#64748b', marginBottom: 4 },
  roadContextText: { fontSize: 9, color: '#94a3b8', lineHeight: 14 },
  judgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  consensusCard: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  consensusIcon: { fontSize: 24, marginBottom: 6 },
  consensusTitle: { fontSize: 12, fontWeight: '800', color: '#10b981', marginBottom: 4 },
  consensusSubtitle: { fontSize: 10, color: '#06b6d4', fontWeight: '700', marginBottom: 6 },
  consensusDetail: { fontSize: 9, color: '#64748b', textAlign: 'center', lineHeight: 14 },
});

// Judge panel styles
const jStyles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#0f1929',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1f2e4a',
    alignItems: 'center',
  },
  authBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  authText: { fontSize: 6, fontWeight: '800' },
  icon: { fontSize: 18, marginBottom: 2 },
  modelName: { fontSize: 7, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  verdict: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    marginBottom: 6,
    width: '100%',
    alignItems: 'center',
  },
  verdictText: { fontSize: 8, fontWeight: '900' },
  evidenceLabel: { fontSize: 6, fontWeight: '700', color: '#64748b', marginBottom: 2, alignSelf: 'flex-start' },
  evidenceBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#1a2740',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  evidenceBarFill: { height: 4, borderRadius: 2 },
  evidenceValue: { fontSize: 11, fontWeight: '900', marginBottom: 4, alignSelf: 'flex-start' },
  sensitivityLabel: { fontSize: 6, fontWeight: '700', color: '#64748b', alignSelf: 'flex-start', marginBottom: 1 },
  sensitivityVal: { fontSize: 7, fontWeight: '700', marginBottom: 4, alignSelf: 'flex-start', textAlign: 'left' },
  blindspotLabel: { fontSize: 6, fontWeight: '700', color: '#64748b', alignSelf: 'flex-start', marginBottom: 1 },
  blindspotVal: { fontSize: 7, color: '#94a3b8', alignSelf: 'flex-start', textAlign: 'left' },
});

// Arbitration chain styles
const aStyles = StyleSheet.create({
  chain: {
    backgroundColor: '#0a1120',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1a2740',
  },
  chainTitle: { fontSize: 9, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.3 },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chainModel: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
    width: '38%',
  },
  chainIcon: { fontSize: 18, marginBottom: 2 },
  chainName: { fontSize: 8, fontWeight: '900', marginBottom: 2 },
  chainRole: { fontSize: 6, color: '#64748b', fontWeight: '700' },
  chainArrowContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chainArrowLine: {
    height: 1,
    width: '80%',
    backgroundColor: '#1f2e4a',
  },
  chainArrowLabel: { fontSize: 7, color: '#64748b', fontStyle: 'italic' },
  verdictBox: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1f2e4a',
  },
  verdictLabel: { fontSize: 8, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  verdictText: { fontSize: 9, color: '#f8fafc', fontWeight: '600', lineHeight: 14 },
});
