import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flame, ShieldAlert, ShieldCheck, Zap, ArrowLeft, RefreshCw, Cpu, AlertTriangle, Crosshair } from 'lucide-react-native';
import { adversarialApi } from '../../api/client';
import { Colors } from '../../constants/theme';
import { AdversarialCampaignResult } from '../../types/anomaly';
import { AdversarialShieldArena } from '../../components/AdversarialShieldArena';

export const AdversarialLabScreen = ({ navigation }: any) => {
  const [selectedAttack, setSelectedAttack] = useState<'FGSM' | 'PGD' | 'STEALTH_DRIFT'>('FGSM');
  const [epsilon, setEpsilon] = useState<number>(0.20);

  // Query latest report or fallback
  const { data: initialReport, isLoading: isFetching } = useQuery({
    queryKey: ['adversarialReport'],
    queryFn: () => adversarialApi.getRobustnessReport()
  });

  // Mutation to run a live red-team campaign
  const campaignMutation = useMutation({
    mutationFn: () => adversarialApi.runCampaign(selectedAttack, epsilon, 6)
  });

  const report: AdversarialCampaignResult | undefined = campaignMutation.data || initialReport;
  const isRunning = campaignMutation.isPending;

  const getVulnerabilityColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#10b981';
      case 'MODERATE': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return Colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Flame size={20} color="#f97316" style={{ marginRight: 6 }} />
            <Text style={styles.title}>Adversarial Red-Team Lab</Text>
          </View>
          <Text style={styles.subtitle}>AI Robustness & Evasion Stress Testing</Text>
        </View>
      </View>

      {/* Attack Console Card */}
      <View style={styles.consoleCard}>
        <View style={styles.consoleHeader}>
          <Text style={styles.cardTag}>ATTACK CAMPAIGN GENERATOR</Text>
          <Crosshair size={16} color="#f97316" />
        </View>
        <Text style={styles.consoleTitle}>Probe & Stress-Test AI Defense</Text>
        <Text style={styles.consoleDesc}>
          Inject targeted mathematical perturbations (FGSM / Stealth Drift) to test if the 3 models can be fooled into missing critical anomalies.
        </Text>

        {/* Attack Type Selector */}
        <Text style={styles.fieldLabel}>Select Attack Algorithm:</Text>
        <View style={styles.attackTypeRow}>
          {(['FGSM', 'PGD', 'STEALTH_DRIFT'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.attackTypeBtn, selectedAttack === type && styles.attackTypeBtnActive]}
              onPress={() => setSelectedAttack(type)}
            >
              <Text style={[styles.attackTypeBtnText, selectedAttack === type && styles.attackTypeBtnTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Epsilon Intensity Selector */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
          <Text style={styles.fieldLabel}>Perturbation Intensity (ε):</Text>
          <Text style={styles.epsilonVal}>{epsilon.toFixed(2)} ({epsilon > 0.25 ? 'Aggressive' : epsilon > 0.12 ? 'Moderate' : 'Subtle'})</Text>
        </View>

        <View style={styles.presetRow}>
          {[0.05, 0.12, 0.20, 0.35].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.presetBtn, epsilon === val && styles.presetBtnActive]}
              onPress={() => setEpsilon(val)}
            >
              <Text style={[styles.presetText, epsilon === val && styles.presetTextActive]}>
                ε = {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Launch Campaign Button */}
        <TouchableOpacity 
          style={styles.launchBtn}
          onPress={() => campaignMutation.mutate()}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Flame size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.launchBtnText}>Launch Red-Team Campaign</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 🚀 LIVE ADVERSARIAL SHIELD INTEGRITY ARENA */}
      <AdversarialShieldArena epsilon={epsilon} attackType={selectedAttack} />

      {/* Executive Summary Card */}
      {report && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTag}>MOST RESILIENT MODEL</Text>
              <Text style={styles.summaryHeroText}>{report.mostResilientModel}</Text>
            </View>
            <ShieldCheck size={28} color="#10b981" />
          </View>
          <Text style={styles.execSummaryText}>{report.executiveSummary}</Text>
        </View>
      )}

      {/* Model Robustness Scorecards */}
      <Text style={styles.sectionHeader}>Model Robustness Scorecards</Text>
      {isFetching && !report ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        report?.scorecards.map((card, idx) => {
          const vulnColor = getVulnerabilityColor(card.vulnerabilityLevel);
          return (
            <View key={idx} style={[styles.scorecard, { borderLeftColor: vulnColor }]}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.modelTitle}>{card.modelName}</Text>
                  <Text style={styles.weakFeatureText}>Weakest Sensor: <Text style={{ color: Colors.primary }}>{card.weakestFeature}</Text></Text>
                </View>

                <View style={[styles.vulnBadge, { backgroundColor: `${vulnColor}25` }]}>
                  <Text style={[styles.vulnBadgeText, { color: vulnColor }]}>{card.vulnerabilityLevel} VULN</Text>
                </View>
              </View>

              {/* Progress Gauges */}
              <View style={styles.metricsRow}>
                <View style={styles.scoreMetric}>
                  <Text style={styles.mLabel}>Robustness Score</Text>
                  <Text style={[styles.mVal, { color: '#10b981' }]}>{card.robustnessScore}%</Text>
                </View>

                <View style={styles.scoreMetric}>
                  <Text style={styles.mLabel}>Evasion Rate</Text>
                  <Text style={[styles.mVal, { color: '#ef4444' }]}>{card.evasionRate}%</Text>
                </View>

                <View style={styles.scoreMetric}>
                  <Text style={styles.mLabel}>Breakdown ε</Text>
                  <Text style={styles.mVal}>ε = {card.breakdownEpsilon}</Text>
                </View>
              </View>

              {/* Recommended Hardening */}
              <View style={styles.hardeningBox}>
                <Text style={styles.hardeningLabel}>🛡️ RECOMMENDED MODEL HARDENING:</Text>
                <Text style={styles.hardeningText}>{card.recommendedHardening}</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Accuracy Degradation Curve Table */}
      {report?.campaignCurve && (
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Epsilon Degradation Retention (%)</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: '22%' }]}>Epsilon</Text>
            <Text style={[styles.th, { width: '26%' }]}>Autoencoder</Text>
            <Text style={[styles.th, { width: '26%' }]}>IsoForest</Text>
            <Text style={[styles.th, { width: '26%' }]}>OC-SVM</Text>
          </View>
          {report.campaignCurve.map((point, idx) => (
            <View key={idx} style={styles.tableDataRow}>
              <Text style={[styles.td, { width: '22%', fontWeight: '700' }]}>ε={point.epsilon}</Text>
              <Text style={[styles.td, { width: '26%', color: '#10b981' }]}>{point.autoencoderAccuracy}%</Text>
              <Text style={[styles.td, { width: '26%', color: '#f59e0b' }]}>{point.isolationForestAccuracy}%</Text>
              <Text style={[styles.td, { width: '26%', color: '#ef4444' }]}>{point.oneClassSVMAccuracy}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8, backgroundColor: Colors.surfaceCard, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textMuted },

  consoleCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f97316',
    marginBottom: 16
  },
  consoleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTag: { fontSize: 10, fontWeight: '800', color: '#f97316', letterSpacing: 0.5 },
  consoleTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  consoleDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 12 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  attackTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  attackTypeBtn: {
    width: '31%',
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  attackTypeBtnActive: { borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.15)' },
  attackTypeBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  attackTypeBtnTextActive: { color: '#f97316' },

  epsilonVal: { fontSize: 12, fontWeight: '800', color: '#f97316' },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  presetBtn: {
    width: '23%',
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  presetBtnActive: { borderColor: '#f97316', backgroundColor: '#f97316' },
  presetText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  presetTextActive: { color: '#ffffff' },

  launchBtn: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  launchBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },

  summaryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 16
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryTag: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  summaryHeroText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  execSummaryText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

  scorecard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderLeftWidth: 4,
    marginBottom: 12
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modelTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  weakFeatureText: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  vulnBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  vulnBadgeText: { fontSize: 10, fontWeight: '800' },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scoreMetric: {
    width: '31%',
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  mLabel: { fontSize: 9, color: Colors.textMuted, marginBottom: 2 },
  mVal: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },

  hardeningBox: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8
  },
  hardeningLabel: { fontSize: 9, fontWeight: '800', color: Colors.primary, marginBottom: 2 },
  hardeningText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },

  tableCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 6
  },
  tableTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, paddingBottom: 6 },
  th: { fontSize: 10, fontWeight: '800', color: Colors.textMuted },
  tableDataRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  td: { fontSize: 11, color: Colors.textSecondary }
});
