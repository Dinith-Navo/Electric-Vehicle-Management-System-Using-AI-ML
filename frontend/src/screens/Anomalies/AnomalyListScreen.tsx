import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Search, Filter, ChevronRight, Dna, FileSearch, ShieldCheck } from 'lucide-react-native';
import { anomalyApi } from '../../api/client';
import { useVehicleStore } from '../../store/useVehicleStore';
import { AnomalyResponse, SeverityLevel } from '../../types/anomaly';
import { Colors, SeverityColors } from '../../constants/theme';

const SEVERITY_FILTERS: (SeverityLevel | 'ALL')[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const AnomalyListScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const [selectedFilter, setSelectedFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: anomalies = [], isLoading, refetch } = useQuery({
    queryKey: ['anomalyList', selectedVehicleId],
    queryFn: () => anomalyApi.list(selectedVehicleId, 100),
    refetchInterval: 5000
  });

  const filtered = anomalies.filter(item => {
    if (selectedFilter !== 'ALL' && item.severity !== selectedFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.diagnosticAlert.toLowerCase().includes(q) ||
        item.severity.toLowerCase().includes(q) ||
        (item.anomalyDNA?.strainType && item.anomalyDNA.strainType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const renderItem = ({ item }: { item: AnomalyResponse }) => {
    const color = SeverityColors[item.severity] || Colors.primary;
    const strain = item.anomalyDNA?.strainType;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color }]}
        onPress={() => navigation.navigate('AnomalyDetail', { anomalyId: item.anomalyId })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.categoryText}>{item.category}</Text>
            {strain && (
              <View style={styles.strainBadge}>
                <Dna size={10} color={Colors.primary} style={{ marginRight: 3 }} />
                <Text style={styles.strainBadgeText}>{strain}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.severityBadge, { backgroundColor: color }]}>{item.severity}</Text>
        </View>

        <Text style={styles.alertText} numberOfLines={2}>{item.diagnosticAlert}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>
            Score: <Text style={styles.boldText}>{item.anomalyScore.toFixed(2)}</Text> | Conf: <Text style={styles.boldText}>{(item.confidence * 100).toFixed(0)}%</Text>
          </Text>
          <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FileSearch size={22} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Neural Forensics Vault</Text>
        </View>
        <Text style={styles.subtitle}>Cryptographic Anomaly Dossier & Genome Archive</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search DNA strain, category, or alert..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {SEVERITY_FILTERS.map((sev) => (
          <TouchableOpacity
            key={sev}
            style={[styles.chip, selectedFilter === sev && styles.activeChip]}
            onPress={() => setSelectedFilter(sev)}
          >
            <Text style={[styles.chipText, selectedFilter === sev && styles.activeChipText]}>{sev}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.anomalyId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ShieldAlert size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No forensic anomalies cataloged matching criteria.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, paddingHorizontal: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  searchInput: { flex: 1, height: 40, color: Colors.textPrimary, fontSize: 13 },

  filterRow: { flexDirection: 'row', marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surfaceCard, marginRight: 8, borderWidth: 1, borderColor: Colors.surfaceBorder },
  activeChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  activeChipText: { color: Colors.background, fontWeight: '800' },

  listContent: { paddingBottom: 20 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.surfaceBorder, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryText: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  strainBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6, 182, 212, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  strainBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.primary },
  severityBadge: { fontSize: 9, fontWeight: '800', color: '#ffffff', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  alertText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 11, color: Colors.textMuted },
  boldText: { color: Colors.textPrimary, fontWeight: '700' },
  timeText: { fontSize: 10, color: Colors.textMuted },

  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 8 }
});
