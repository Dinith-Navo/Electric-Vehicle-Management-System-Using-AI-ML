import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { 
  Rect, 
  Path, 
  Circle, 
  Line, 
  Defs, 
  LinearGradient, 
  RadialGradient, 
  Stop, 
  G, 
  Text as SvgText 
} from 'react-native-svg';
import { Colors } from '../constants/theme';
import { Telemetry } from '../types/telemetry';

interface Props {
  telemetry: Telemetry;
  severity?: string;
  onSelectComponent?: (compName: string) => void;
}

export const HolographicVehicleChassis = ({ telemetry, severity = 'NONE', onSelectComponent }: Props) => {
  const [activeComponent, setActiveComponent] = useState<string>('Battery Pack');

  const bTemp = telemetry.batteryTemperature;
  const mTemp = telemetry.motorTemperature;
  const voltage = telemetry.batteryVoltage;
  const current = telemetry.batteryCurrent;

  // Temperature color interpolation
  const getBatteryColor = () => {
    if (bTemp > 55) return '#ef4444'; // Red
    if (bTemp > 42) return '#f97316'; // Orange
    if (bTemp > 35) return '#f59e0b'; // Amber
    return '#06b6d4';                 // Cyan
  };

  const getMotorColor = () => {
    if (mTemp > 85) return '#ef4444';
    if (mTemp > 65) return '#f97316';
    if (mTemp > 50) return '#f59e0b';
    return '#6366f1';
  };

  const batteryColor = getBatteryColor();
  const motorColor = getMotorColor();

  const handleSelect = (name: string) => {
    setActiveComponent(name);
    if (onSelectComponent) onSelectComponent(name);
  };

  return (
    <View style={styles.container}>
      {/* Header telemetry pill */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3D DIGITAL TWIN CHASSIS</Text>
        </View>
        <Text style={styles.activeText}>Active: <Text style={{ color: Colors.primary, fontWeight: '800' }}>{activeComponent}</Text></Text>
      </View>

      {/* Futuristic SVG Holographic Top-Down EV Schematics */}
      <View style={styles.svgWrapper}>
        <Svg width="100%" height="240" viewBox="0 0 340 240">
          <Defs>
            {/* Battery glow gradient */}
            <LinearGradient id="battGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={batteryColor} stopOpacity="0.85" />
              <Stop offset="100%" stopColor={batteryColor} stopOpacity="0.2" />
            </LinearGradient>

            {/* Motor glow gradient */}
            <LinearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={motorColor} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={motorColor} stopOpacity="0.3" />
            </LinearGradient>

            {/* Chassis background glow */}
            <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>

          {/* Background Ambient Glow */}
          <Circle cx="170" cy="120" r="100" fill="url(#coreGlow)" />

          {/* Cyber Grid Lines */}
          <Line x1="20" y1="120" x2="320" y2="120" stroke="#182236" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="170" y1="20" x2="170" y2="220" stroke="#182236" strokeWidth="1" strokeDasharray="4 4" />

          {/* Car Aerodynamic Outer Silhouette (Smooth Coupé profile) */}
          <Path
            d="M 120 25 C 150 20, 190 20, 220 25 C 245 32, 260 50, 265 85 C 270 120, 270 155, 265 190 C 260 215, 240 225, 220 228 C 190 230, 150 230, 120 228 C 100 225, 80 215, 75 190 C 70 155, 70 120, 75 85 C 80 50, 95 32, 120 25 Z"
            fill="none"
            stroke="#23324d"
            strokeWidth="2"
          />

          {/* Inner Safety Rollcage / Monocoque Frame */}
          <Path
            d="M 130 45 L 210 45 L 235 90 L 235 180 L 210 210 L 130 210 L 105 180 L 105 90 Z"
            fill="none"
            stroke="#1e2c45"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* 4 Wheels (Corner Axles) */}
          {/* Front Left */}
          <Rect x="52" y="55" width="20" height="42" rx="4" fill="#131a2a" stroke="#06b6d4" strokeWidth="1.5" />
          {/* Front Right */}
          <Rect x="268" y="55" width="20" height="42" rx="4" fill="#131a2a" stroke="#06b6d4" strokeWidth="1.5" />
          {/* Rear Left */}
          <Rect x="52" y="155" width="20" height="42" rx="4" fill="#131a2a" stroke="#06b6d4" strokeWidth="1.5" />
          {/* Rear Right */}
          <Rect x="268" y="155" width="20" height="42" rx="4" fill="#131a2a" stroke="#06b6d4" strokeWidth="1.5" />

          {/* Front Axle Tie Rod */}
          <Line x1="72" y1="76" x2="268" y2="76" stroke="#23324d" strokeWidth="2" />
          {/* Rear Axle Tie Rod */}
          <Line x1="72" y1="176" x2="268" y2="176" stroke="#23324d" strokeWidth="2" />

          {/* Front High-Performance Motor & Inverter */}
          <G onPress={() => handleSelect('Front Drive Motor')}>
            <Rect 
              x="140" 
              y="58" 
              width="60" 
              height="36" 
              rx="6" 
              fill="url(#motorGrad)" 
              stroke={motorColor} 
              strokeWidth={activeComponent.includes('Motor') ? '2.5' : '1.5'} 
            />
            {/* Motor Stator Windings visualization lines */}
            <Line x1="150" y1="64" x2="150" y2="88" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <Line x1="160" y1="64" x2="160" y2="88" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <Line x1="170" y1="64" x2="170" y2="88" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <Line x1="180" y1="64" x2="180" y2="88" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <Line x1="190" y1="64" x2="190" y2="88" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <SvgText x="170" y="80" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
              MOTOR {mTemp.toFixed(0)}°C
            </SvgText>
          </G>

          {/* High Voltage Bus Cabling (Glowing Pulsing Cable from Motor to Battery) */}
          <Path
            d="M 170 94 L 170 108"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="2 2"
          />

          {/* MAIN TRACTION BATTERY PACK (Floorpan Subsystem) */}
          <G onPress={() => handleSelect('Battery Pack')}>
            <Rect 
              x="118" 
              y="108" 
              width="104" 
              height="74" 
              rx="8" 
              fill="url(#battGrad)" 
              stroke={batteryColor} 
              strokeWidth={activeComponent === 'Battery Pack' ? '3' : '1.8'} 
            />
            {/* Battery Cell Grid Matrix (8 Modules) */}
            <Rect x="124" y="114" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="148" y="114" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="172" y="114" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="196" y="114" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />

            <Rect x="124" y="146" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="148" y="146" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="172" y="146" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />
            <Rect x="196" y="146" width="20" height="28" rx="2" fill="#070b12" stroke={batteryColor} strokeOpacity="0.6" strokeWidth="0.8" />

            {/* Battery Core Metrics Badge */}
            <SvgText x="170" y="140" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              BMS: {bTemp.toFixed(1)}°C
            </SvgText>
            <SvgText x="170" y="153" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="600">
              {voltage.toFixed(0)}V | {current > 0 ? `+${current.toFixed(0)}A` : `${current.toFixed(0)}A`}
            </SvgText>
          </G>

          {/* Rear Inverter / Thermal Exchanger */}
          <G onPress={() => handleSelect('Liquid Chiller Loop')}>
            <Rect 
              x="135" 
              y="190" 
              width="70" 
              height="20" 
              rx="4" 
              fill="#182236" 
              stroke="#06b6d4" 
              strokeWidth={activeComponent === 'Liquid Chiller Loop' ? '2.5' : '1'} 
            />
            <SvgText x="170" y="204" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
              COOLANT LOOP: 0.94 EFF
            </SvgText>
          </G>

          {/* Holographic Radar Rings around front & rear */}
          <Circle cx="170" cy="30" r="12" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
          <Circle cx="170" cy="225" r="10" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        </Svg>
      </View>

      {/* Subsystem Health Status Strip */}
      <View style={styles.subsystemsRow}>
        <TouchableOpacity 
          style={[styles.subsysCard, activeComponent === 'Battery Pack' && styles.subsysCardActive]}
          onPress={() => handleSelect('Battery Pack')}
        >
          <Text style={styles.subsysLabel}>TRACTION PACK</Text>
          <Text style={[styles.subsysValue, { color: batteryColor }]}>{bTemp.toFixed(1)}°C</Text>
          <Text style={styles.subsysSub}>{voltage.toFixed(0)}V | {current.toFixed(0)}A</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subsysCard, activeComponent === 'Front Drive Motor' && styles.subsysCardActive]}
          onPress={() => handleSelect('Front Drive Motor')}
        >
          <Text style={styles.subsysLabel}>DRIVE MOTOR</Text>
          <Text style={[styles.subsysValue, { color: motorColor }]}>{mTemp.toFixed(1)}°C</Text>
          <Text style={styles.subsysSub}>{telemetry.powerConsumption.toFixed(1)} kW</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subsysCard, activeComponent === 'Liquid Chiller Loop' && styles.subsysCardActive]}
          onPress={() => handleSelect('Liquid Chiller Loop')}
        >
          <Text style={styles.subsysLabel}>CHILLER LOOP</Text>
          <Text style={[styles.subsysValue, { color: '#10b981' }]}>NOMINAL</Text>
          <Text style={styles.subsysSub}>Delta 4.2°C</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#1d2b45',
    marginBottom: 16,
    overflow: 'hidden'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: 0.8
  },
  activeText: {
    fontSize: 11,
    color: '#94a3b8'
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  subsystemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  subsysCard: {
    width: '31%',
    backgroundColor: '#131b2e',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2e4a'
  },
  subsysCardActive: {
    borderColor: '#06b6d4',
    backgroundColor: '#18243d'
  },
  subsysLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2
  },
  subsysValue: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2
  },
  subsysSub: {
    fontSize: 9,
    color: '#94a3b8'
  }
});
