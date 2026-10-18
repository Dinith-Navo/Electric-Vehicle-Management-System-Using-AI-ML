import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi, RouteOptimizeInput } from "../../ev_optimization/services/apiClient";
import { getChargingStations, DEMO_STATIONS } from "../../ev_optimization/services/stationService";

interface DestinationItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: "preset" | "station" | "custom";
}

const PRESET_CORRIDORS: DestinationItem[] = [
  {
    id: "corridor-galle",
    name: "Colombo ➔ Galle (128 km)",
    lat: 6.0329,
    lon: 80.2168,
    category: "preset",
  },
  {
    id: "corridor-kandy",
    name: "Colombo ➔ Kandy (116 km)",
    lat: 7.2906,
    lon: 80.6337,
    category: "preset",
  },
  {
    id: "corridor-airport",
    name: "Colombo ➔ Katunayake Airport (36 km)",
    lat: 7.1802,
    lon: 79.8841,
    category: "preset",
  },
  {
    id: "corridor-nuwaraeliya",
    name: "Colombo ➔ Nuwara Eliya (175 km)",
    lat: 6.9497,
    lon: 80.7891,
    category: "preset",
  },
  {
    id: "corridor-jaffna",
    name: "Colombo ➔ Jaffna (395 km)",
    lat: 9.6615,
    lon: 80.0255,
    category: "preset",
  },
];

export default function RouteOptimizationScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    destLat?: string;
    destLon?: string;
    destName?: string;
    stationId?: string;
  }>();
  const { theme, colors, toggleTheme } = useTheme();

  // Origin (Default: Colombo Fort)
  const [originName, setOriginName] = useState("Colombo Fort");
  const [originLat, setOriginLat] = useState(6.9344);
  const [originLon, setOriginLon] = useState(79.8428);

  // Destination modes: "presets" | "stations" | "custom"
  const [destMode, setDestMode] = useState<"presets" | "stations" | "custom">("presets");
  const [availableStations, setAvailableStations] = useState<any[]>([]);

  // Selected Destination
  const [selectedDestName, setSelectedDestName] = useState("Galle Dutch Fort");
  const [selectedDestLat, setSelectedDestLat] = useState(6.0329);
  const [selectedDestLon, setSelectedDestLon] = useState(80.2168);

  // Custom Destination inputs
  const [customName, setCustomName] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");

  // Vehicle Parameters
  const [currentSoc, setCurrentSoc] = useState("35");
  const [consumption, setConsumption] = useState("15.5");
  const [batteryCapacity, setBatteryCapacity] = useState("64");
  const [isTelemetrySynced, setIsTelemetrySynced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<any>(null);

  // Sync telemetry from backend on user tap or mount
  const syncVehicleTelemetry = useCallback(async () => {
    try {
      const res = await evOptimizationApi.getDashboard();
      if (res && res.success && res.data?.vehicle) {
        const v = res.data.vehicle;
        if (v.currentSoc !== undefined) setCurrentSoc(String(v.currentSoc));
        if (v.batteryCapacityKWh !== undefined) setBatteryCapacity(String(v.batteryCapacityKWh));
        if (v.energyConsumption !== undefined) setConsumption(String(v.energyConsumption));
        setIsTelemetrySynced(true);
      }
    } catch {
      // Keep default values if telemetry endpoint is unreachable
    }
  }, []);

  // Fetch real stations from backend or fallback to 20 local demo stations for destination picker
  useEffect(() => {
    getChargingStations()
      .then((res) => {
        if (res.stations && res.stations.length > 0) {
          setAvailableStations(res.stations);
        } else {
          setAvailableStations(DEMO_STATIONS);
        }
      })
      .catch(() => {
        setAvailableStations(DEMO_STATIONS);
      });
  }, []);

  // Handle incoming search params (e.g., navigated from charging station card)
  useEffect(() => {
    if (searchParams.destLat && searchParams.destLon) {
      const pLat = parseFloat(searchParams.destLat);
      const pLon = parseFloat(searchParams.destLon);
      const pName = searchParams.destName || "Target Charging Station";

      if (!isNaN(pLat) && !isNaN(pLon)) {
        setSelectedDestLat(pLat);
        setSelectedDestLon(pLon);
        setSelectedDestName(pName);
        setDestMode("stations");
        setCustomName(pName);
        setCustomLat(String(pLat));
        setCustomLon(String(pLon));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.destLat, searchParams.destLon, searchParams.destName]);

  const handlePlanRoute = async () => {
    let destLat = selectedDestLat;
    let destLon = selectedDestLon;
    let destName = selectedDestName;

    if (destMode === "custom") {
      const parsedLat = parseFloat(customLat);
      const parsedLon = parseFloat(customLon);
      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        Alert.alert("Invalid Coordinates", "Please enter valid numeric latitude and longitude coordinates.");
        return;
      }
      destLat = parsedLat;
      destLon = parsedLon;
      destName = customName.trim() || `${destLat.toFixed(3)}, ${destLon.toFixed(3)}`;
    }

    setLoading(true);
    setRouteError(null);
    const payload: RouteOptimizeInput = {
      originLat,
      originLon,
      originName,
      destLat,
      destLon,
      destName,
      currentSoc: parseFloat(currentSoc) || 35,
      batteryCapacityKWh: parseFloat(batteryCapacity) || 64,
      consumptionKWhPer100Km: parseFloat(consumption) || 15.5,
    };

    try {
      const res = await evOptimizationApi.optimizeRoute(payload);
      if (res && res.success && res.data) {
        setRouteResult(res.data);
        setRouteError(null);
      } else {
        throw new Error(res?.message || "Route calculation error");
      }
    } catch (e: any) {
      console.warn("Route calculation error:", e.message);
      setRouteResult(null);
      setRouteError(e.message || "Unable to calculate route. Please verify that the backend API is active and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleMapsRoute = () => {
    let destLat = selectedDestLat;
    let destLon = selectedDestLon;
    if (destMode === "custom") {
      destLat = parseFloat(customLat) || selectedDestLat;
      destLon = parseFloat(customLon) || selectedDestLon;
    }

    let url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}&travelmode=driving`;
    if (routeResult?.recommendedChargingStops?.length > 0) {
      const stop = routeResult.recommendedChargingStops[0];
      if (stop.latitude && stop.longitude) {
        url += `&waypoints=${stop.latitude},${stop.longitude}`;
      }
    }

    Linking.openURL(url).catch(() => {
      Alert.alert("Navigation Notice", "Could not open Google Maps navigation.");
    });
  };

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

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Smart Route Planner</Text>

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
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Destination & Route Selection Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Travel Corridor & Destination</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Select or enter a travel destination to calculate battery feasibility and corridor charging stops.
          </Text>

          {/* Destination Mode Tabs */}
          <View style={[styles.tabSelector, { backgroundColor: colors.bgSecondary }]}>
            <TouchableOpacity
              style={[styles.tabBtn, destMode === "presets" && { backgroundColor: "#2563EB" }]}
              onPress={() => setDestMode("presets")}
            >
              <Text style={[styles.tabBtnText, { color: destMode === "presets" ? "#ffffff" : colors.textSecondary }]}>
                Popular Corridors
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, destMode === "stations" && { backgroundColor: "#2563EB" }]}
              onPress={() => setDestMode("stations")}
            >
              <Text style={[styles.tabBtnText, { color: destMode === "stations" ? "#ffffff" : colors.textSecondary }]}>
                Charging Hubs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, destMode === "custom" && { backgroundColor: "#2563EB" }]}
              onPress={() => setDestMode("custom")}
            >
              <Text style={[styles.tabBtnText, { color: destMode === "custom" ? "#ffffff" : colors.textSecondary }]}>
                Custom GPS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode 1: Preset Corridors */}
          {destMode === "presets" && (
            <View style={styles.presetsCol}>
              {PRESET_CORRIDORS.map((corridor) => {
                const isSelected = selectedDestLat === corridor.lat && selectedDestLon === corridor.lon;
                return (
                  <TouchableOpacity
                    key={corridor.id}
                    style={[
                      styles.destOptionBtn,
                      {
                        backgroundColor: isSelected ? "#2563EB" : colors.bgSecondary,
                        borderColor: isSelected ? "#2563EB" : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDestLat(corridor.lat);
                      setSelectedDestLon(corridor.lon);
                      setSelectedDestName(corridor.name);
                    }}
                  >
                    <Ionicons
                      name="navigate-circle"
                      size={20}
                      color={isSelected ? "#ffffff" : "#2563EB"}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.destOptionText,
                          { color: isSelected ? "#ffffff" : colors.textPrimary },
                        ]}
                      >
                        {corridor.name}
                      </Text>
                      <Text
                        style={[
                          styles.destOptionSub,
                          { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                        ]}
                      >
                        Destination: {corridor.lat.toFixed(4)}, {corridor.lon.toFixed(4)}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#ffffff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Mode 2: Charging Station Picker */}
          {destMode === "stations" && (
            <View style={styles.presetsCol}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Select an EV Charging Station as Destination:
              </Text>
              {availableStations.map((station) => {
                const sLat = station.location?.latitude ?? station.latitude;
                const sLon = station.location?.longitude ?? station.longitude;
                const isSelected = selectedDestLat === sLat && selectedDestLon === sLon;
                const ports = station.ports || [];
                const maxKw = Math.max(...ports.map((p: any) => p.powerKw || 0), 50);

                return (
                  <TouchableOpacity
                    key={station.stationId}
                    style={[
                      styles.destOptionBtn,
                      {
                        backgroundColor: isSelected ? "#2563EB" : colors.bgSecondary,
                        borderColor: isSelected ? "#2563EB" : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDestLat(sLat);
                      setSelectedDestLon(sLon);
                      setSelectedDestName(station.name);
                    }}
                  >
                    <Ionicons
                      name="flash"
                      size={18}
                      color={isSelected ? "#ffffff" : "#059669"}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.destOptionText,
                          { color: isSelected ? "#ffffff" : colors.textPrimary },
                        ]}
                      >
                        {station.name}
                      </Text>
                      <Text
                        style={[
                          styles.destOptionSub,
                          { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                        ]}
                      >
                        {station.operator} • {station.location?.city || "Colombo"} • {maxKw} kW
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#ffffff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Mode 3: Custom Coordinates */}
          {destMode === "custom" && (
            <View style={{ gap: 10, marginBottom: 14 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Destination Label / Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Unawatuna Beach / Kandy Lake"
                  placeholderTextColor={colors.textMuted}
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Latitude</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder="e.g. 6.0329"
                    placeholderTextColor={colors.textMuted}
                    value={customLat}
                    onChangeText={setCustomLat}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Longitude</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder="e.g. 80.2168"
                    placeholderTextColor={colors.textMuted}
                    value={customLon}
                    onChangeText={setCustomLon}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Vehicle Telemetry & Battery Header with Sync Action */}
          <View style={styles.telemetryHeaderRow}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginBottom: 0 }]}>
              Vehicle & Battery Parameters
            </Text>
            <TouchableOpacity
              style={[styles.syncBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              onPress={syncVehicleTelemetry}
            >
              <Ionicons name="refresh" size={12} color="#2563EB" />
              <Text style={styles.syncBtnText}>
                {isTelemetrySynced ? "Telemetry Synced" : "Sync Live Telemetry"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Parameters Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Battery SoC (%)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={currentSoc}
                onChangeText={setCurrentSoc}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Capacity (kWh)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={batteryCapacity}
                onChangeText={setBatteryCapacity}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cons. (kWh/100)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={consumption}
                onChangeText={setConsumption}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Calculate Route Button */}
          <TouchableOpacity
            style={styles.planBtn}
            onPress={handlePlanRoute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.planBtnText}>Calculate Route & Optimize Stops</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Route Error Notification */}
        {routeError && (
          <View style={[styles.card, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={{ color: "#991B1B", fontSize: 13, fontWeight: "600", flex: 1 }}>{routeError}</Text>
            </View>
            <TouchableOpacity
              onPress={handlePlanRoute}
              style={{
                backgroundColor: "#DC2626",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Route Optimization Results Card */}
        {routeResult && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resRouteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {routeResult.origin} ➔ {routeResult.destination}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  <Text style={[styles.resSub, { color: colors.textSecondary }]}>
                    {routeResult.totalDistanceKm} km • ~{routeResult.estimatedDriveTimeMinutes} mins
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: routeResult.routeEngine === "osrm-road-network" ? "#DCFCE7" : "#FEF3C7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: routeResult.routeEngine === "osrm-road-network" ? "#15803D" : "#B45309",
                      }}
                    >
                      {routeResult.routeEngine === "osrm-road-network" ? "🛣️ OSRM Road Network" : "⚠️ Sri Lankan Corridor Fallback"}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.chargingBadge,
                  {
                    backgroundColor: routeResult.isChargingRequired ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    borderColor: routeResult.isChargingRequired ? "#EF4444" : "#10B981",
                  },
                ]}
              >
                <Ionicons
                  name={routeResult.isChargingRequired ? "alert-circle" : "checkmark-circle"}
                  size={14}
                  color={routeResult.isChargingRequired ? "#DC2626" : "#059669"}
                />
                <Text
                  style={[
                    styles.chargingBadgeText,
                    { color: routeResult.isChargingRequired ? "#DC2626" : "#059669" },
                  ]}
                >
                  {routeResult.isChargingRequired ? "Charging Stop Required" : "Direct Route OK"}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>CURRENT RANGE</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>
                  {routeResult.currentEstimatedRangeKm} km
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>ENERGY NEEDED</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>
                  {routeResult.energyRequiredKWh} kWh
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>REMAINING AT DEST.</Text>
                <Text style={[styles.mVal, { color: routeResult.remainingRangeAtDestinationKm > 20 ? "#059669" : "#DC2626" }]}>
                  {routeResult.remainingRangeAtDestinationKm} km
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>TOTAL DURATION</Text>
                <Text style={[styles.mVal, { color: "#2563EB" }]}>
                  {routeResult.totalTripDurationMinutes} mins
                </Text>
              </View>
            </View>

            {/* Elevation & Regenerative Dynamics */}
            <View
              style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="trending-up" size={14} color="#7C3AED" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#7C3AED", letterSpacing: 0.5 }}>
                    TERRAIN & REGENERATIVE DYNAMICS
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "capitalize" }}>
                  ⛰️ {routeResult.terrainType || "flat / coastal"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Elevation Gain / Change:</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textPrimary }}>
                  {routeResult.elevationGainMeters !== undefined ? `${Math.round(routeResult.elevationGainMeters)} m` : "0 m"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Potential Energy Delta (ΔE):</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: (routeResult.elevationEnergyAdjustmentKWh || 0) < 0 ? "#059669" : (routeResult.elevationEnergyAdjustmentKWh || 0) > 0 ? "#D97706" : colors.textPrimary,
                  }}
                >
                  {(routeResult.elevationEnergyAdjustmentKWh || 0) < 0
                    ? `${routeResult.elevationEnergyAdjustmentKWh} kWh (Regen Recovery)`
                    : (routeResult.elevationEnergyAdjustmentKWh || 0) > 0
                    ? `+${routeResult.elevationEnergyAdjustmentKWh} kWh (Climb Extra)`
                    : "0.0 kWh (Flat)"}
                </Text>
              </View>
            </View>

            {/* Recommended Corridor Charging Stop Card */}
            {routeResult.recommendedChargingStops?.length > 0 ? (
              <View style={styles.stopCard}>
                <View style={styles.stopTag}>
                  <Ionicons name="flash" size={12} color="#D97706" />
                  <Text style={styles.stopTagText}>RECOMMENDED CHARGING STOP</Text>
                </View>

                {routeResult.recommendedChargingStops.map((stop: any, sIdx: number) => (
                  <View key={sIdx} style={styles.stopContent}>
                    <Text style={styles.stopStationName}>{stop.name}</Text>
                    <Text style={styles.stopDetails}>
                      Corridor Stop at km {stop.distanceFromOriginKm || stop.distanceKm} • Est. Arrival SoC: ~{stop.arrivalSocEstimated}%
                    </Text>

                    <View style={styles.chargeActionBox}>
                      <View>
                        <Text style={styles.chargeActionTitle}>
                          Charge {stop.arrivalSocEstimated}% ➔ {stop.recommendedChargeToSoc}%
                        </Text>
                        <Text style={styles.chargeActionSub}>
                          {stop.chargerSpeedKw} kW {stop.connectorType} Fast Charger
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.chargeTimeText}>+{stop.estimatedChargeTimeMinutes} mins</Text>
                        <Text style={styles.chargeCostText}>
                          Est. Rs. {typeof stop.estimatedCost === "number" ? Math.round(stop.estimatedCost > 50 ? stop.estimatedCost : stop.estimatedCost * 300).toLocaleString() : stop.estimatedCost} LKR
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.directRouteBanner}>
                <Ionicons name="leaf-outline" size={16} color="#059669" />
                <Text style={styles.directRouteText}>
                  Your estimated battery range ({routeResult.currentEstimatedRangeKm} km) comfortably exceeds route distance ({routeResult.totalDistanceKm} km). Direct driving without charging stops recommended.
                </Text>
              </View>
            )}

            {/* Checkpoints Timeline */}
            <Text style={[styles.timelineHeader, { color: colors.textSecondary }]}>ROUTE CORRIDOR CHECKPOINTS</Text>
            <View style={styles.timeline}>
              {routeResult.waypoints?.map((w: any, idx: number) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineInfo}>
                    <Text style={[styles.tlName, { color: colors.textPrimary }]}>{w.name}</Text>
                    <Text style={[styles.tlDist, { color: colors.textSecondary }]}>
                      {w.distanceFromOriginKm} km from start • Est. Remaining Battery: {w.remainingSocEstimated}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Launch Google Maps Navigation Button */}
            <TouchableOpacity
              style={styles.googleMapsNavBtn}
              onPress={handleOpenGoogleMapsRoute}
            >
              <Ionicons name="navigate" size={16} color="#ffffff" />
              <Text style={styles.googleMapsNavBtnText}>Open Route in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 14 },
  tabSelector: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  presetsCol: { gap: 8, marginBottom: 14 },
  destOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  destOptionText: { fontSize: 13, fontWeight: "600" },
  destOptionSub: { fontSize: 11, marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  telemetryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  row: { flexDirection: "row", gap: 10 },
  inputGroup: { marginBottom: 14 },
  textInput: { height: 42, borderRadius: 10, borderWidth: 0.5, paddingHorizontal: 12, fontSize: 13 },
  planBtn: {
    backgroundColor: "#2563EB",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  planBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  resultCard: { borderRadius: 16, borderWidth: 0.5, padding: 18 },
  resHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  resRouteTitle: { fontSize: 15, fontWeight: "700" },
  resSub: { fontSize: 11, marginTop: 2 },
  chargingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chargingBadgeText: { fontSize: 10, fontWeight: "700" },
  metricsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(156, 163, 175, 0.3)",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(156, 163, 175, 0.3)",
    paddingVertical: 10,
    marginBottom: 14,
  },
  metricItem: { alignItems: "center" },
  mLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  mVal: { fontSize: 12, fontWeight: "700" },
  stopCard: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: 14,
    marginBottom: 16,
  },
  stopTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  stopTagText: { fontSize: 9, fontWeight: "700", color: "#D97706", letterSpacing: 0.5 },
  stopContent: {},
  stopStationName: { fontSize: 14, fontWeight: "700", color: "#D97706" },
  stopDetails: { fontSize: 11, color: "#6B7280", marginTop: 2, marginBottom: 8 },
  chargeActionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeActionTitle: { fontSize: 12, fontWeight: "700", color: "#111827" },
  chargeActionSub: { fontSize: 10, color: "#6B7280", marginTop: 1 },
  chargeTimeText: { fontSize: 13, fontWeight: "700", color: "#2563EB" },
  chargeCostText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  directRouteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  directRouteText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
  timelineHeader: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, marginBottom: 10 },
  timeline: { gap: 10, marginBottom: 16 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB" },
  timelineInfo: { flex: 1 },
  tlName: { fontSize: 12, fontWeight: "600" },
  tlDist: { fontSize: 11 },
  googleMapsNavBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleMapsNavBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
