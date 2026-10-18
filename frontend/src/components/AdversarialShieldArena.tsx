import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, Path, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  epsilon: number;
  attackType: string;
}

export const AdversarialShieldArena = ({ epsilon, attackType }: Props) => {
  const size = 260;
  const center = size / 2;

  // Compute live shield degradation based on epsilon
  const aeIntegrity = Math.max(15, Math.round(100 - epsilon * 120));
  const ifIntegrity = Math.max(10, Math.round(100 - epsilon * 190));
  const svmIntegrity = Math.max(5, Math.round(100 - epsilon * 250));

  const getShieldColor = (integrity: number) => {
    if (integrity > 75) return '#06b6d4';
    if (integrity > 50) return '#f59e0b';
    return '#ef4444';
  };

  const aeColor = getShieldColor(aeIntegrity);
  const ifColor = getShieldColor(ifIntegrity);
  const svmColor = getShieldColor(svmIntegrity);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RED-TEAM BATTLE ARENA</Text>
        </View>
        <Text style={styles.headerStats}>Perturbation Vector: <Text style={{ color: '#f97316', fontWeight: '800' }}>{attackType} (ε={epsilon})</Text></Text>
      </View>

      <View style={styles.svgContainer}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="arenaCore" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#070b12" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>

          {/* Arena Background */}
          <Circle cx={center} cy={center} r="115" fill="#070b12" stroke="#1b2a44" strokeWidth="1.5" />
          <Circle cx={center} cy={center} r="45" fill="url(#arenaCore)" />

          {/* Concentric Crosshairs */}
          <Line x1={center} y1="15" x2={center} y2={size - 15} stroke="#18253a" strokeWidth="1" strokeDasharray="3 3" />
          <Line x1="15" y1={center} x2={size - 15} y2={center} stroke="#18253a" strokeWidth="1" strokeDasharray="3 3" />

          {/* Outer Layer: Deep Autoencoder Shield (r=95) */}
          <Circle
            cx={center}
            cy={center}
            r="95"
            fill="none"
            stroke={aeColor}
            strokeWidth="3.5"
            strokeDasharray={`${(aeIntegrity / 100) * 580} 30`}
            opacity={0.85}
          />
          <SvgText x={center} y="24" fill={aeColor} fontSize="8" fontWeight="bold" textAnchor="middle">
            L1 AUTOENCODER: {aeIntegrity}%
          </SvgText>

          {/* Mid Layer: Isolation Forest Perimeter (r=68) */}
          <Circle
            cx={center}
            cy={center}
            r="68"
            fill="none"
            stroke={ifColor}
            strokeWidth="3"
            strokeDasharray={`${(ifIntegrity / 100) * 410} 25`}
            opacity={0.9}
          />
          <SvgText x={center} y="52" fill={ifColor} fontSize="8" fontWeight="bold" textAnchor="middle">
            L2 ISOFOREST: {ifIntegrity}%
          </SvgText>

          {/* Inner Core: One-Class SVM Hyperplane (r=40) */}
          <Circle
            cx={center}
            cy={center}
            r="40"
            fill="none"
            stroke={svmColor}
            strokeWidth="2.5"
            strokeDasharray={`${(svmIntegrity / 100) * 240} 20`}
            opacity={0.95}
          />
          <SvgText x={center} y={center + 4} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
            SVM CORE
          </SvgText>
          <SvgText x={center} y={center + 16} fill={svmColor} fontSize="8" fontWeight="bold" textAnchor="middle">
            {svmIntegrity}%
          </SvgText>

          {/* Inbound Attack Perturbation Vectors (Laser Beams piercing shields) */}
          <G>
            {/* Top-Right Attack Ray */}
            <Line x1="240" y1="20" x2="195" y2="65" stroke="#ef4444" strokeWidth="2.5" />
            <Circle cx="195" cy="65" r="4" fill="#ef4444" />
            <Path d="M 190 60 L 200 70 M 200 60 L 190 70" stroke="#f59e0b" strokeWidth="1.5" />

            {/* Bottom-Left Attack Ray */}
            <Line x1="20" y1="220" x2="85" y2="155" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />
            <Circle cx="85" cy="155" r="3.5" fill="#f97316" />

            {/* Left High-Impact Ray */}
            <Line x1="10" y1="120" x2="75" y2="120" stroke="#ef4444" strokeWidth="3" />
            <Circle cx="75" cy="120" r="4.5" fill="#ef4444" />
          </G>
        </Svg>
      </View>

      {/* Defense Shell Status Readout */}
      <View style={styles.shellsRow}>
        <View style={styles.shellBox}>
          <Text style={styles.shellLabel}>AUTOENCODER</Text>
          <Text style={[styles.shellVal, { color: aeColor }]}>{aeIntegrity}%</Text>
          <Text style={styles.shellSub}>Outer Shell</Text>
        </View>

        <View style={styles.shellBox}>
          <Text style={styles.shellLabel}>ISOLATION FOREST</Text>
          <Text style={[styles.shellVal, { color: ifColor }]}>{ifIntegrity}%</Text>
          <Text style={styles.shellSub}>Mid Perimeter</Text>
        </View>

        <View style={styles.shellBox}>
          <Text style={styles.shellLabel}>ONE-CLASS SVM</Text>
          <Text style={[styles.shellVal, { color: svmColor }]}>{svmIntegrity}%</Text>
          <Text style={styles.shellSub}>Inner Core</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1322',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f97316',
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  badge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f97316'
  },
  headerStats: {
    fontSize: 10,
    color: '#94a3b8'
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  shellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  shellBox: {
    width: '31%',
    backgroundColor: '#131b2e',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2e4a'
  },
  shellLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2
  },
  shellVal: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2
  },
  shellSub: {
    fontSize: 8,
    color: '#94a3b8'
  }
});
