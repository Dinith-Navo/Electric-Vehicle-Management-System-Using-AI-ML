import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi, StationFilterParams } from "../../ev_optimization/services/apiClient";

export default function ChargingStationsScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<StationFilterParams>({
    maxDistanceKm: 50,
    minPowerKw: 0,
    maxPricePerKWh: 1.0,
    connectorType: undefined,
    minRating: 0,
    onlyAvailable: false,
    availableOnly: false,
    sortBy: "recommended",
  });

  const handleOpenNavigation = async (station: any) => {
    const lat = station.location?.latitude ?? station.latitude;
    const lon = station.location?.longitude ?? station.longitude;

    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      isNaN(lat) ||
      isNaN(lon)
    ) {
      Alert.alert(
        "Navigation Unavailable",
        "Valid GPS coordinates are not available for this charging station."
      );
      return;
    }

    const label = encodeURIComponent(station.name || "EV Charging Station");
    const latLng = `${lat},${lon}`;

    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latLng}`,
    });

    const webFallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;

    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      if (canOpen) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webFallbackUrl);
      }
    } catch {
      try {
        await Linking.openURL(webFallbackUrl);
      } catch {
        Alert.alert(
          "Navigation Notice",
          "Could not open map navigation on this device."
        );
      }
    }
  };

  const loadStations = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await evOptimizationApi.getStations(currentFilters);
      if (res && res.success) {
        setStations(res.data);
      } else {
        setStations([]);
      }
    } catch (e: any) {
      console.log("Stations fetch notice, using fallback:", e.message);
      // Fallback default list
      setStations([
        {
          stationId: "CS-CMB-001",
          name: "Colombo Fort Supercharge Hub",
          operator: "ChargeNet LK",
          location: { address: "Lotus Road, Colombo 01", city: "Colombo", latitude: 6.9344, longitude: 79.8428 },
          ports: [
            {"type": "CCS2", "powerKw": 150.0, "total": 4, "available": 3, "pricePerKWh": 0.38},
            {"type": "CHAdeMO", "powerKw": 50.0, "total": 2, "available": 1, "pricePerKWh": 0.32}
          ],
          rating: 4.8,
          totalReviews: 56,
          distanceKm: 2.8,
          suitabilityScore: 94.5,
          amenities: ["Restroom", "Cafe", "WiFi"]
        },
        {
          stationId: "CS-KOL-002",
          name: "Kollupitiya Marine Drive Express",
          operator: "Vega Charging",
          location: { address: "Marine Drive, Colombo 03", city: "Colombo", latitude: 6.9015, longitude: 79.8510 },
          ports: [
            {"type": "CCS2", "powerKw": 120.0, "total": 2, "available": 1, "pricePerKWh": 0.35},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 0, "pricePerKWh": 0.24}
          ],
          rating: 4.6,
          totalReviews: 34,
          distanceKm: 4.2,
          suitabilityScore: 88.0,
          amenities: ["Cafe", "Restroom"]
        },
        {
          stationId: "CS-NEG-004",
          name: "Katunayake Airport Highway Fast Charger",
          operator: "ElectriFlow",
          location: { address: "Airport Expressway Exit", city: "Negombo", latitude: 7.1802, longitude: 79.8841 },
          ports: [
            {"type": "CCS2", "powerKw": 180.0, "total": 6, "available": 4, "pricePerKWh": 0.42}
          ],
          rating: 4.9,
          totalReviews: 88,
          distanceKm: 28.5,
          suitabilityScore: 82.5,
          amenities: ["24/7 Dining", "EV Lounge", "WiFi"]
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStations();
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    loadStations(filters);
  };

  const filteredStations = stations.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.operator?.toLowerCase().includes(q) ||
      s.location?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Charging Stations</Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={theme === "light" ? "moon-outline" : "sunny-outline"}
              size={18}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={18} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar & Active Filter Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search stations, operators, cities..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort & Availability Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortPillsScroll}>
          {/* Quick Available Only Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.sortPill,
              {
                backgroundColor: (filters.availableOnly || filters.onlyAvailable) ? "#059669" : colors.card,
                borderColor: (filters.availableOnly || filters.onlyAvailable) ? "#059669" : colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              },
            ]}
            onPress={() => {
              const nextAvail = !(filters.availableOnly || filters.onlyAvailable);
              const newFilters = { ...filters, availableOnly: nextAvail, onlyAvailable: nextAvail };
              setFilters(newFilters);
              loadStations(newFilters);
            }}
          >
            <Ionicons
              name={filters.availableOnly || filters.onlyAvailable ? "checkmark-circle" : "flash-outline"}
              size={13}
              color={filters.availableOnly || filters.onlyAvailable ? "#fff" : "#059669"}
            />
            <Text
              style={[
                styles.sortPillText,
                { color: filters.availableOnly || filters.onlyAvailable ? "#fff" : colors.textSecondary },
              ]}
            >
              Available Only
            </Text>
          </TouchableOpacity>

          {[
            { label: "✨ Recommended", value: "recommended" },
            { label: "📍 Nearest", value: "distance" },
            { label: "⚡ Fastest kW", value: "speed" },
            { label: "💲 Lowest Price", value: "price" },
            { label: "⭐ Top Rated", value: "rating" },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.sortPill,
                {
                  backgroundColor: filters.sortBy === item.value ? "#2563EB" : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                const newFilters = { ...filters, sortBy: item.value };
                setFilters(newFilters);
                loadStations(newFilters);
              }}
            >
              <Text
                style={[
                  styles.sortPillText,
                  { color: filters.sortBy === item.value ? "#fff" : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Finding stations nearby...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
        >
          <Text style={[styles.countHeader, { color: colors.textSecondary }]}>
            {filteredStations.length} STATIONS AVAILABLE
          </Text>

          {filteredStations.map((station, index) => {
            const ports = station.ports || [];
            const maxPower = Math.max(...ports.map((p: any) => p.powerKw || 0), 50);
            const minPrice = Math.min(...ports.map((p: any) => p.pricePerKWh || 0.35), 0.35);
            const totalAvail = ports.reduce((acc: number, p: any) => acc + (p.available || 0), 0);
            const totalPorts = ports.reduce((acc: number, p: any) => acc + (p.total || 1), 0);

            return (
              <View
                key={station.stationId || index}
                style={[styles.stationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Station Card Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stationName, { color: colors.textPrimary }]}>{station.name}</Text>
                    <Text style={[styles.operatorText, { color: colors.textSecondary }]}>
                      {station.operator} • {station.location?.city || "Colombo"}
                    </Text>
                  </View>

                  {station.suitabilityScore ? (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>{station.suitabilityScore}% Match</Text>
                    </View>
                  ) : null}
                </View>

                {/* Badges / Metrics Row */}
                <View style={styles.metricsRow}>
                  <View style={[styles.metricChip, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="location-outline" size={13} color="#2563EB" />
                    <Text style={[styles.metricChipText, { color: colors.textPrimary }]}>
                      {station.distanceKm ? `${station.distanceKm} km` : "Nearby"}
                    </Text>
                  </View>

                  <View style={[styles.metricChip, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="flash-outline" size={13} color="#059669" />
                    <Text style={[styles.metricChipText, { color: colors.textPrimary }]}>{maxPower} kW</Text>
                  </View>

                  <View style={[styles.metricChip, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="pricetag-outline" size={13} color="#D97706" />
                    <Text style={[styles.metricChipText, { color: colors.textPrimary }]}>${minPrice}/kWh</Text>
                  </View>

                  <View style={[styles.metricChip, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.metricChipText, { color: colors.textPrimary }]}>{station.rating || 4.5}</Text>
                  </View>
                </View>

                {/* Stalls & Connectors */}
                <View style={styles.connectorRow}>
                  <View style={styles.availStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: totalAvail > 0 ? "#10B981" : "#EF4444" },
                      ]}
                    />
                    <Text style={[styles.availText, { color: totalAvail > 0 ? "#059669" : "#DC2626" }]}>
                      {totalAvail > 0 ? `${totalAvail}/${totalPorts} Stalls Free` : "All Busy"}
                    </Text>
                  </View>

                  <View style={styles.portPills}>
                    {ports.map((p: any, idx: number) => (
                      <View key={idx} style={[styles.portPill, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={[styles.portPillText, { color: colors.textSecondary }]}>
                          {p.type} ({p.powerKw}kW)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtnSecondary, { borderColor: colors.border }]}
                    onPress={() => router.push("/ev_optimization/queue_prediction" as any)}
                  >
                    <Ionicons name="time-outline" size={14} color="#2563EB" />
                    <Text style={styles.actionBtnSecText}>Queue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnSecondary, { borderColor: colors.border }]}
                    onPress={() => router.push("/ev_optimization/route_optimization" as any)}
                  >
                    <Ionicons name="trail-sign-outline" size={14} color="#7C3AED" />
                    <Text style={[styles.actionBtnSecText, { color: "#7C3AED" }]}>Plan Route</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleOpenNavigation(station)}
                  >
                    <Ionicons name="navigate" size={14} color="#fff" />
                    <Text style={styles.actionBtnPrimText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filter Charging Stations</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Min Power Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Minimum Power (kW)</Text>
              <View style={styles.filterOptionsRow}>
                {[0, 50, 100, 150].map((kw) => (
                  <TouchableOpacity
                    key={kw}
                    style={[
                      styles.filterOptionBtn,
                      {
                        backgroundColor: filters.minPowerKw === kw ? "#2563EB" : colors.bgSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setFilters({ ...filters, minPowerKw: kw })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: filters.minPowerKw === kw ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {kw === 0 ? "All" : `${kw}+ kW`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Connector Type */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Connector Compatibility</Text>
              <View style={styles.filterOptionsRow}>
                {["All", "CCS2", "CHAdeMO", "Type 2"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.filterOptionBtn,
                      {
                        backgroundColor:
                          (t === "All" && !filters.connectorType) || filters.connectorType === t
                            ? "#2563EB"
                            : colors.bgSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setFilters({ ...filters, connectorType: t === "All" ? undefined : t })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color:
                            (t === "All" && !filters.connectorType) || filters.connectorType === t
                              ? "#fff"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Available Stalls Only Toggle */}
            <TouchableOpacity
              style={[styles.filterToggleRow, { backgroundColor: colors.bgSecondary }]}
              onPress={() => {
                const nextVal = !(filters.availableOnly || filters.onlyAvailable);
                setFilters({ ...filters, availableOnly: nextVal, onlyAvailable: nextVal });
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flash-outline" size={18} color="#059669" />
                <Text style={[styles.filterToggleText, { color: colors.textPrimary }]}>
                  Show Available Stalls Only
                </Text>
              </View>
              <Ionicons
                name={filters.availableOnly || filters.onlyAvailable ? "checkbox" : "square-outline"}
                size={22}
                color={filters.availableOnly || filters.onlyAvailable ? "#2563EB" : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
              <Text style={styles.applyFilterText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  searchContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13 },
  sortPillsScroll: { marginTop: 10 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
    marginRight: 8,
  },
  sortPillText: { fontSize: 11, fontWeight: "600" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13 },
  countHeader: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, marginBottom: 12 },
  stationCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  stationName: { fontSize: 15, fontWeight: "700" },
  operatorText: { fontSize: 11, marginTop: 2 },
  scoreBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricChipText: { fontSize: 11, fontWeight: "600" },
  connectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginBottom: 12,
  },
  availStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 11, fontWeight: "700" },
  portPills: { flexDirection: "row", gap: 4 },
  portPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  portPillText: { fontSize: 10, fontWeight: "500" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtnSecondary: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 0.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionBtnSecText: { color: "#2563EB", fontSize: 11, fontWeight: "600" },
  actionBtnPrimary: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionBtnPrimText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  filterSection: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  filterOptionsRow: { flexDirection: "row", gap: 8 },
  filterOptionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  filterOptionText: { fontSize: 11, fontWeight: "600" },
  filterToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  filterToggleText: { fontSize: 13, fontWeight: "600" },
  applyFilterBtn: {
    backgroundColor: "#2563EB",
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  applyFilterText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
