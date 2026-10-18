import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Dna, ArrowLeft, Shield, AlertTriangle, Sparkles, Database, Search, CheckCircle2 } from 'lucide-react-native';
import { anomalyApi } from '../../api/client';
import { Colors } from '../../constants/theme';
import { AnomalyDNA, GenomeRecord } from '../../types/anomaly';
import { DnaHelixVisualizer } from '../../components/DnaHelixVisualizer';

export const AnomalyDNAScreen = ({ route, navigation }: any) => {
  const { dna, anomalyId }: { dna?: AnomalyDNA; anomalyId?: string } = route.params || {};

  const { data: catalogedStrains, isLoading } = useQuery({
    queryKey: ['genomeStrains'],
    queryFn: () => anomalyApi.getGenomeStrains()
  });

  const [selectedStrain, setSelectedStrain] = useState<GenomeRecord | null>(null);

  const barcode = dna?.barcode || [
    0.85, 0.42, 0.91, 0.12, 0.77, 0.63, 0.95, 0.33,
    0.54, 0.88, 0.22, 0.67, 0.45, 0.99, 0.18, 0.73,
    0.39, 0.82, 0.58, 0.29, 0.91, 0.44, 0.69, 0.83,
    0.15, 0.76, 0.52, 0.89, 0.36, 0.61, 0.94, 0.27
  ];

  const getBarcodeColor = (val: number, idx: number) => {
    if (val > 0.8) return '#ef4444'; // Red
    if (val > 0.6) return '#f97316'; // Orange
    if (val > 0.4) return '#06b6d4'; // Cyan
    if (val > 0.2) return '#6366f1'; // Indigo
    return '#a855f7';               // Purple
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
            <Dna size={20} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.title}>Neural DNA Forensics</Text>
          </View>
          <Text style={styles.subtitle}>Anomaly Genome Database & Genetic Barcode</Text>
        </View>
      </View>

      {/* 🧬 DNA DOUBLE-HELIX SEQUENCER */}
      <DnaHelixVisualizer 
        strainType={dna?.strainType || 'THERMAL_CASCADE'} 
        mutationScore={dna?.mutationScore ?? 0.18} 
      />

      {/* DNA Genetic Barcode Card */}
      <View style={styles.barcodeCard}>
        <View style={styles.barcodeHeader}>
          <Text style={styles.cardTag}>128-DIMENSIONAL EMBEDDING</Text>
          <View style={styles.strainBadge}>
            <Text style={styles.strainBadgeText}>{dna?.strainType || 'THERMAL_CASCADE'}</Text>
          </View>
        </View>

        <Text style={styles.barcodeTitle}>Visual DNA Signature Barcode</Text>
        <Text style={styles.hashText}>Hash: {dna?.fingerprintHash || 'a8b79f2e3c1d4a5b6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123'}</Text>

        {/* Dynamic 32-element Barcode Visualization */}
        <View style={styles.barcodeVisualContainer}>
          {barcode.map((val, idx) => (
            <View
              key={idx}
              style={[
                styles.barcodeStrip,
                {
                  height: 18 + val * 42,
                  backgroundColor: getBarcodeColor(val, idx),
                  opacity: 0.35 + val * 0.65
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.barcodeLegendRow}>
          <Text style={styles.barcodeLegendText}>LSH Slot 00</Text>
          <Text style={styles.barcodeLegendText}>Locality-Sensitive Hash</Text>
          <Text style={styles.barcodeLegendText}>Slot 31</Text>
        </View>

        {/* Mutation Novelty Score */}
        <View style={styles.mutationBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.mutaLabel}>Mutation Novelty Score</Text>
            <Text style={styles.mutaVal}>
              {dna ? `${(dna.mutationScore * 100).toFixed(0)}%` : '18% Novelty'}
            </Text>
          </View>
          <View style={styles.mutaBarBg}>
            <View 
              style={[
                styles.mutaBarFill, 
                { width: `${(dna?.mutationScore ?? 0.18) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.mutaDesc}>
            {dna?.mutationScore && dna.mutationScore > 0.5 
              ? '⚠️ Novel anomaly mutation: pattern has low similarity to historical database strains.' 
              : '✅ Known genetic signature: high alignment with cataloged fleet failure patterns.'}
          </Text>
        </View>
      </View>

      {/* Dominant Expressed Genes */}
      <Text style={styles.sectionTitle}>Dominant Expressed Genes (Features)</Text>
      <View style={styles.genesContainer}>
        {(dna?.dominantGenes || [
          { gene: 'batteryTemperature', strength: 0.94, expression: 'OVEREXPRESSED' },
          { gene: 'motorTemperature', strength: 0.86, expression: 'OVEREXPRESSED' },
          { gene: 'batteryCurrent', strength: 0.72, expression: 'OVEREXPRESSED' },
          { gene: 'batteryVoltage', strength: 0.61, expression: 'UNDEREXPRESSED' }
        ]).map((g, idx) => (
          <View key={idx} style={styles.geneCard}>
            <View style={styles.geneHeader}>
              <Text style={styles.geneName}>{g.gene}</Text>
              <Text 
                style={[
                  styles.geneExpression, 
                  g.expression === 'OVEREXPRESSED' ? { color: '#ef4444' } : { color: '#3b82f6' }
                ]}
              >
                {g.expression}
              </Text>
            </View>
            <View style={styles.geneBarBg}>
              <View 
                style={[
                  styles.geneBarFill, 
                  { 
                    width: `${g.strength * 100}%`,
                    backgroundColor: g.expression === 'OVEREXPRESSED' ? '#ef4444' : '#3b82f6'
                  }
                ]} 
              />
            </View>
            <Text style={styles.geneStrength}>Gene Weight: {(g.strength * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>

      {/* Anomaly Genome Knowledge Base */}
      <View style={styles.sectionHeaderRow}>
        <Database size={18} color={Colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>Cataloged Genome Database</Text>
      </View>
      <Text style={styles.sectionSub}>Historical failure archetypes and root cause playbooks</Text>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        (catalogedStrains || []).map((strain: GenomeRecord, idx: number) => {
          const isSelected = selectedStrain?.genomeId === strain.genomeId;
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.strainCard, isSelected && styles.strainCardSelected]}
              onPress={() => setSelectedStrain(isSelected ? null : strain)}
            >
              <View style={styles.strainHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.strainTitle}>{strain.strainName}</Text>
                  <Text style={styles.strainSub}>ID: {strain.genomeId} | Seen in {strain.occurrenceCount} vehicles</Text>
                </View>
                <View style={[styles.severityPill, { backgroundColor: strain.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }]}>
                  <Text style={styles.severityPillText}>{strain.severity}</Text>
                </View>
              </View>

              <Text style={styles.rootCauseText} numberOfLines={isSelected ? undefined : 2}>
                <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>Root Cause: </Text>
                {strain.rootCause}
              </Text>

              {isSelected && (
                <View style={styles.playbookBox}>
                  <Text style={styles.playbookLabel}>🛡️ RECOMMENDED MITIGATION PLAYBOOK:</Text>
                  <Text style={styles.playbookText}>{strain.recommendedPlaybook}</Text>
                  
                  <View style={styles.tagRow}>
                    {strain.dominantGenes.map((tag, tIdx) => (
                      <View key={tIdx} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
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

  barcodeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 20
  },
  barcodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTag: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  strainBadge: { backgroundColor: 'rgba(6, 182, 212, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  strainBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  barcodeTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  hashText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace', marginBottom: 14 },

  barcodeVisualContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
    backgroundColor: '#070b12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6
  },
  barcodeStrip: {
    width: 6,
    borderRadius: 2
  },
  barcodeLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  barcodeLegendText: { fontSize: 9, color: Colors.textMuted },

  mutationBox: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginTop: 4
  },
  mutaLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  mutaVal: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  mutaBarBg: { height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, marginVertical: 6 },
  mutaBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  mutaDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 2 },
  sectionSub: { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },

  genesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  geneCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 10
  },
  geneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  geneName: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  geneExpression: { fontSize: 9, fontWeight: '800' },
  geneBarBg: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginBottom: 4 },
  geneBarFill: { height: 4, borderRadius: 2 },
  geneStrength: { fontSize: 9, color: Colors.textMuted },

  strainCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 12
  },
  strainCardSelected: { borderColor: Colors.primary },
  strainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  strainTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  strainSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  severityPill: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  severityPillText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  rootCauseText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  playbookBox: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary
  },
  playbookLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  playbookText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.surfaceCard, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, color: Colors.primary }
});
