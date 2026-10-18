import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Path, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  strainType: string;
  mutationScore: number;
}

export const DnaHelixVisualizer = ({ strainType, mutationScore }: Props) => {
  const width = 310;
  const height = 90;
  const numRungs = 16;
  const step = width / numRungs;

  const basePairs = [
    { a: 'V (Volt)', b: 'I (Curr)', colorA: '#06b6d4', colorB: '#6366f1' },
    { a: 'T (Temp)', b: 'P (Power)', colorA: '#ef4444', colorB: '#f59e0b' },
    { a: 'M (Motor)', b: 'S (Speed)', colorA: '#a855f7', colorB: '#10b981' },
    { a: 'A (Accel)', b: 'Q (Qual)', colorA: '#3b82f6', colorB: '#ec4899' },
  ];

  const rungs = [];
  const strand1Points = [];
  const strand2Points = [];

  for (let i = 0; i <= numRungs; i++) {
    const x = i * step;
    const phase = (i / numRungs) * Math.PI * 4;
    const offset = Math.sin(phase) * 26;
    const y1 = 45 + offset;
    const y2 = 45 - offset;

    strand1Points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y1.toFixed(1)}`);
    strand2Points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y2.toFixed(1)}`);

    if (i < numRungs) {
      const pair = basePairs[i % basePairs.length];
      rungs.push({
        x: x + step / 2,
        y1: 45 + Math.sin(phase + (Math.PI / numRungs) * 2) * 26,
        y2: 45 - Math.sin(phase + (Math.PI / numRungs) * 2) * 26,
        colorA: pair.colorA,
        colorB: pair.colorB
      });
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEURAL GENOMIC HELIX</Text>
        </View>
        <Text style={styles.strainText}>Archetype: <Text style={{ color: '#06b6d4', fontWeight: '800' }}>{strainType}</Text></Text>
      </View>

      <View style={styles.svgContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="helixGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
            </LinearGradient>
            <LinearGradient id="helixGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Background */}
          <Rect x="0" y="0" width={width} height={height} rx="8" fill="#060a12" stroke="#162238" strokeWidth="1" />

          {/* Nucleotide Rung Connectors */}
          {rungs.map((r, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={r.x}
                y1={r.y1}
                x2={r.x}
                y2={(r.y1 + r.y2) / 2}
                stroke={r.colorA}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.85}
              />
              <Line
                x1={r.x}
                y1={(r.y1 + r.y2) / 2}
                x2={r.x}
                y2={r.y2}
                stroke={r.colorB}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.85}
              />
              <Circle cx={r.x} cy={r.y1} r="3" fill={r.colorA} />
              <Circle cx={r.x} cy={r.y2} r="3" fill={r.colorB} />
            </React.Fragment>
          ))}

          {/* Sugar-Phosphate Backbone Strands */}
          <Path
            d={strand1Points.join(' ')}
            fill="none"
            stroke="url(#helixGrad1)"
            strokeWidth="3"
          />
          <Path
            d={strand2Points.join(' ')}
            fill="none"
            stroke="url(#helixGrad2)"
            strokeWidth="3"
          />

          {/* Laser Genome Scanner Bar */}
          <Line
            x1={width * 0.65}
            y1="5"
            x2={width * 0.65}
            y2={height - 5}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <SvgText x={width * 0.65 + 4} y="15" fill="#ef4444" fontSize="8" fontWeight="bold">
            SEQUENCER LOCUS
          </SvgText>
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1322',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#06b6d4',
    marginBottom: 14
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06b6d4'
  },
  strainText: {
    fontSize: 11,
    color: '#94a3b8'
  },
  svgContainer: {
    overflow: 'hidden',
    borderRadius: 8
  }
});
