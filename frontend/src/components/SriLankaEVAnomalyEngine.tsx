/**
 * SriLankaEVAnomalyEngine.tsx
 *
 * 🇱🇰 FLAGSHIP COMPONENT: Sri Lanka Multi-Physics EV Anomaly Defense Matrix (SL-MADE 2.0)
 *
 * Distinct Differentiators from Global/Western EV Systems:
 * 1. 6-Vector Sri Lankan Neural Anomaly Radar:
 *    - Tropical Heat Thermal Squeeze (Air-cooled Leaf degradation in 34°C ambient)
 *    - Mountain Incline Strain (Kadugannawa / Ramboda Pass 9.2% grade)
 *    - Mountain Descent Continuous Regen Overcharge (Ella Gap / Nuwara Eliya)
 *    - Monsoon Flood Insulation Leakage (Megohm MΩ resistance loss from road splash)
 *    - CEB (Ceylon Electricity Board) Grid Fluctuation (182V brownouts & 49.1Hz frequency flutter)
 *    - Reconditioned Pack Cell Imbalance (Local CALB/CATL cell retrofits in Nissan Leaf shells)
 * 2. Interactive Route & Microclimate Physics Switcher (Live Route Simulation)
 * 3. Sri Lankan Rupee (LKR) Degradation Cost & CEB Tariff Financial Shield
 * 4. Multilingual Sri Lankan Operational Playbook (Sinhala / Tamil / English)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Polygon, Circle, Line, Defs, RadialGradient, Stop, G, Text as SvgText, Rect } from 'react-native-svg';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Thermometer, 
  CloudRain, 
  Mountain, 
  Coins, 
  Cpu, 
  AlertTriangle, 
  Compass, 
  Languages, 
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react-native';
import { Telemetry, SimulatorScenario } from '../types/telemetry';
import { AnomalyResponse } from '../types/anomaly';
import { Colors, SeverityColors } from '../constants/theme';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useVehicleStore, SriLankanVehicle } from '../store/useVehicleStore';

interface Props {
  telemetry: Telemetry;
  anomaly?: AnomalyResponse | null;
  vehicle?: SriLankanVehicle;
}

export const SriLankaEVAnomalyEngine: React.FC<Props> = ({ telemetry, anomaly, vehicle }) => {
  const { setScenario, tickTelemetry } = useSimulatorStore();
  const { selectedVehicleId } = useVehicleStore();
  const [selectedLang, setSelectedLang] = useState<'EN' | 'SI' | 'TA'>('EN');

  const sriLankaData = anomaly?.sriLankaIntelligence;
  const severity = anomaly?.severity || 'NONE';
  const severityColor = SeverityColors[severity] || Colors.primary;
  const anomalyScore = anomaly?.anomalyScore ?? 0.0;

  // 6-Vector Sri Lankan Physics Values (0.0 to 1.0)
  const vThermal = Math.min(1.0, Math.max(0.1, (telemetry.batteryTemperature - 25.0) / 35.0));
  const vIncline = Math.min(1.0, Math.max(0.1, (telemetry.motorTemperature - 40.0) / 60.0));
  const vRegen = telemetry.chargingStatus === 'REGENERATIVE_BRAKING' ? 0.88 : (telemetry.batteryVoltage > 400 ? 0.75 : 0.2);
  const vMonsoon = telemetry.batteryVoltage < 310 ? 0.92 : (anomalyScore > 0.5 ? 0.65 : 0.15);
  const vCeb = telemetry.chargingStatus === 'CHARGING' && telemetry.batteryVoltage < 330 ? 0.85 : 0.22;
  const vRepack = Math.min(1.0, Math.max(0.15, anomalyScore * 1.1));

  // Compute Hexagon Radar Coordinates
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 95;

  const angles = [
    -Math.PI / 2,         // 1. Tropical Heat (Top)
    -Math.PI / 6,         // 2. Kadugannawa Incline (Top-Right)
    Math.PI / 6,          // 3. Ella Regen Surge (Bottom-Right)
    Math.PI / 2,          // 4. Monsoon Moisture (Bottom)
    (5 * Math.PI) / 6,    // 5. CEB Grid Sag (Bottom-Left)
    (-5 * Math.PI) / 6    // 6. Cell Repack Delta-V (Top-Left)
  ];

  const getPoints = (values: number[]) => {
    return values.map((val, i) => {
      const radius = r * Math.max(0.15, Math.min(1.0, val));
      const x = cx + radius * Math.cos(angles[i]);
      const y = cy + radius * Math.sin(angles[i]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const radarPolygon = getPoints([vThermal, vIncline, vRegen, vMonsoon, vCeb, vRepack]);
  const webPolygon100 = getPoints([1, 1, 1, 1, 1, 1]);
  const webPolygon60 = getPoints([0.6, 0.6, 0.6, 0.6, 0.6, 0.6]);
  const webPolygon30 = getPoints([0.3, 0.3, 0.3, 0.3, 0.3, 0.3]);

  // Route presets for instant interactive Sri Lankan physics testing
  const ROUTE_PRESETS: { id: SimulatorScenario; label: string; icon: any; location: string }[] = [
    {
      id: 'KANDY_INCLINE_THERMAL_STRESS',
      label: 'Kadugannawa Climb',
      icon: Mountain,
      location: 'A1 Colombo-Kandy (9.2% Grade)'
    },
    {
      id: 'ELLA_DESCENT_REGEN_SURGE',
      label: 'Ella Gap Descent',
      icon: RotateCcw,
      location: 'Central Highlands (-11% Downhill Regen)'
    },
    {
      id: 'COLOMBO_MONSOON_FLOOD_LEAKAGE',
      label: 'Monsoon Flood Ingress',
      icon: CloudRain,
      location: 'Baseline Rd Puddle Submersion'
    },
    {
      id: 'CEB_GRID_BROWNOUT_CHARGING',
      label: 'CEB 185V Brownout',
      icon: Zap,
      location: 'Domestic AC Evening Peak Sag'
    },
    {
      id: 'PETTAH_TRAFFIC_TUK_OVERLOAD',
      label: 'Pettah Tuk Gridlock',
      icon: Compass,
      location: 'Colombo Fort Stop-and-Go Heat'
    },
    {
      id: 'NORMAL_DRIVING',
      label: 'Nominal Baseline',
      icon: CheckCircle2,
      location: 'Western Province Normal Cruise'
    }
  ];

  const handleRouteSwitch = (scen: SimulatorScenario) => {
    setScenario(scen);
    tickTelemetry(selectedVehicleId);
  };

  return (
    <View style={styles.card}>
      {/* Flagship Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>SRI LANKA MULTI-PHYSICS DEFENSE MATRIX</Text>
          </View>
          <Text style={styles.mainTitle}>Adaptive Terrain & Climate Forensics</Text>
          <Text style={styles.subtitle}>
            Calibrated for: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{vehicle?.name || 'Sri Lankan EV'}</Text>
          </Text>
        </View>
        <View style={[styles.statusIconBox, { borderColor: severityColor }]}>
          {severity === 'NONE' ? (
            <ShieldCheck size={28} color={Colors.status.NORMAL} />
          ) : (
            <ShieldAlert size={28} color={severityColor} />
          )}
        </View>
      </View>

      {/* 6-Vector Neural Radar Visualizer */}
      <View style={styles.radarCard}>
        <View style={styles.radarHeader}>
          <Text style={styles.radarTitle}>6-Vector Sri Lankan Stress Radar</Text>
          <Text style={[styles.radarScore, { color: severityColor }]}>
            Ensemble Threat: {(anomalyScore * 100).toFixed(0)}%
          </Text>
        </View>

        <View style={styles.svgContainer}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={severityColor} stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#080e18" stopOpacity="0.0" />
              </RadialGradient>
            </Defs>

            {/* Radar Background & Grids */}
            <Circle cx={cx} cy={cy} r={r + 15} fill="#080e18" stroke="#162235" strokeWidth="1" />
            <Polygon points={webPolygon100} fill="none" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="3 3" />
            <Polygon points={webPolygon60} fill="none" stroke="#162235" strokeWidth="1" />
            <Polygon points={webPolygon30} fill="none" stroke="#162235" strokeWidth="1" />

            {/* Axis spokes */}
            {angles.map((ang, i) => (
              <Line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + r * Math.cos(ang)}
                y2={cy + r * Math.sin(ang)}
                stroke="#1e293b"
                strokeWidth="1"
              />
            ))}

            {/* Filled Radar Polygon */}
            <Polygon
              points={radarPolygon}
              fill="url(#radarGlow)"
              stroke={severityColor}
              strokeWidth="2.5"
            />

            {/* Axis Labels */}
            <SvgText x={cx} y={cy - r - 8} fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
              TROPICAL HEAT
            </SvgText>
            <SvgText x={cx + r + 14} y={cy - r / 2} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="start">
              KANDY GRADE
            </SvgText>
            <SvgText x={cx + r + 12} y={cy + r / 2 + 10} fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="start">
              ELLA REGEN
            </SvgText>
            <SvgText x={cx} y={cy + r + 18} fill="#06b6d4" fontSize="8" fontWeight="bold" textAnchor="middle">
              MONSOON MΩ
            </SvgText>
            <SvgText x={cx - r - 12} y={cy + r / 2 + 10} fill="#a855f7" fontSize="8" fontWeight="bold" textAnchor="end">
              CEB GRID SAG
            </SvgText>
            <SvgText x={cx - r - 14} y={cy - r / 2} fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="end">
              REPACK ΔV
            </SvgText>
          </Svg>
        </View>

        {/* Live Multi-Physics Metrics Strip */}
        <View style={styles.metricsStrip}>
          <View style={styles.stripItem}>
            <Thermometer size={14} color="#38bdf8" />
            <Text style={styles.stripLabel}>Tropical Squeeze</Text>
            <Text style={styles.stripValue}>{sriLankaData?.tropicalThermalIndex ?? 32}°C Index</Text>
          </View>
          <View style={styles.stripItem}>
            <CloudRain size={14} color="#06b6d4" />
            <Text style={styles.stripLabel}>Insulation MΩ</Text>
            <Text style={[styles.stripValue, { color: (sriLankaData?.insulationResistanceMOhm ?? 98) < 1.0 ? '#ef4444' : '#10b981' }]}>
              {sriLankaData?.insulationResistanceMOhm ?? 98.5} MΩ
            </Text>
          </View>
          <View style={styles.stripItem}>
            <Zap size={14} color="#f59e0b" />
            <Text style={styles.stripLabel}>Cell Skew ΔV</Text>
            <Text style={styles.stripValue}>{sriLankaData?.repackImbalanceMv ?? 12} mV</Text>
          </View>
        </View>
      </View>

      {/* 🗺️ Interactive Sri Lankan Route & Climate Physics Simulator */}
      <Text style={styles.sectionTitle}>Interactive Sri Lankan Terrain & Weather Simulator</Text>
      <Text style={styles.sectionSubtitle}>
        Switch real-world Sri Lankan road gradients & electrical stresses to observe live AI adaptation:
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
        {ROUTE_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <TouchableOpacity
              key={preset.id}
              style={styles.routeCard}
              onPress={() => handleRouteSwitch(preset.id)}
            >
              <View style={styles.routeIconRow}>
                <Icon size={18} color={Colors.primary} />
                <ChevronRight size={14} color={Colors.textMuted} />
              </View>
              <Text style={styles.routeLabel}>{preset.label}</Text>
              <Text style={styles.routeLocation} numberOfLines={2}>{preset.location}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 💰 Sri Lankan Rupee (LKR) Economic & CEB Tariff Shield */}
      <View style={styles.economicCard}>
        <View style={styles.economicHeader}>
          <Coins size={18} color="#eab308" style={{ marginRight: 6 }} />
          <Text style={styles.economicTitle}>Sri Lankan Rupee (LKR) Financial & CEB Shield</Text>
        </View>

        <View style={styles.tariffRow}>
          <View style={styles.tariffCol}>
            <Text style={styles.tariffSub}>Active CEB Tariff Window</Text>
            <Text style={styles.tariffMain}>{sriLankaData?.cebTariffWindow || 'DAY_WINDOW (LKR 54.00 / kWh)'}</Text>
          </View>
          <View style={styles.tariffColRight}>
            <Text style={styles.tariffSub}>Night Off-Peak Benefit</Text>
            <Text style={styles.tariffSave}>
              Save LKR {sriLankaData?.cebPeakAvoidanceSavingLkr || 1420}/charge
            </Text>
          </View>
        </View>

        <View style={styles.damageBox}>
          <AlertTriangle size={15} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.damageText}>
            Projected Unmitigated Degradation Risk:{' '}
            <Text style={styles.damageLkr}>
              LKR {(sriLankaData?.estimatedFailureRepairCostLkr ?? 0).toLocaleString()}
            </Text>{' '}
            {sriLankaData?.estimatedFailureRepairCostLkr ? '(Requires module replacement)' : '(Optimal health)'}
          </Text>
        </View>
      </View>

      {/* 🗣️ Multilingual Sri Lankan Operational Playbook */}
      <View style={styles.playbookCard}>
        <View style={styles.playbookHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Languages size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.playbookTitle}>Driver & Fleet Mission Advisory</Text>
          </View>
          <View style={styles.langSelector}>
            {(['EN', 'SI', 'TA'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, selectedLang === lang && styles.langBtnActive]}
                onPress={() => setSelectedLang(lang)}
              >
                <Text style={[styles.langText, selectedLang === lang && styles.langTextActive]}>
                  {lang === 'EN' ? 'English' : lang === 'SI' ? 'සිංහල' : 'தமிழ்'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.advisoryBody}>
          <Text style={styles.advisoryText}>
            {selectedLang === 'EN' && (sriLankaData?.advisoryEnglish || anomaly?.diagnosticAlert || 'Analyzing real-time Sri Lankan road vectors...')}
            {selectedLang === 'SI' && (sriLankaData?.advisorySinhala || 'ශ්‍රී ලංකා මාර්ග පද්ධතියේ තත්ත්වය විශ්ලේෂණය කෙරෙමින් පවතී...')}
            {selectedLang === 'TA' && (sriLankaData?.advisoryTamil || 'இலங்கை சாலை நிலவரங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1e3a5f',
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  titleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    marginBottom: 4
  },
  titleBadgeText: {
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  statusIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radarCard: {
    backgroundColor: '#050a12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#18283e',
    marginBottom: 14
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  radarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  radarScore: {
    fontSize: 12,
    fontWeight: '800'
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  metricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#162235'
  },
  stripItem: {
    alignItems: 'center',
    width: '32%'
  },
  stripLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2
  },
  stripValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8
  },
  routeScroll: {
    marginBottom: 14
  },
  routeCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  routeIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2
  },
  routeLocation: {
    fontSize: 9,
    color: Colors.textMuted
  },
  economicCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    marginBottom: 14
  },
  economicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  economicTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#eab308'
  },
  tariffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  tariffCol: {
    flex: 1
  },
  tariffColRight: {
    alignItems: 'flex-end'
  },
  tariffSub: {
    fontSize: 10,
    color: Colors.textMuted
  },
  tariffMain: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1
  },
  tariffSave: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 1
  },
  damageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  damageText: {
    fontSize: 11,
    color: Colors.textPrimary,
    flex: 1
  },
  damageLkr: {
    fontWeight: '800',
    color: '#ef4444'
  },
  playbookCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  playbookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  playbookTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 6,
    padding: 2
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4
  },
  langBtnActive: {
    backgroundColor: Colors.primary
  },
  langText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted
  },
  langTextActive: {
    color: Colors.background,
    fontWeight: '800'
  },
  advisoryBody: {
    backgroundColor: Colors.surfaceCard,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  advisoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18
  }
});
