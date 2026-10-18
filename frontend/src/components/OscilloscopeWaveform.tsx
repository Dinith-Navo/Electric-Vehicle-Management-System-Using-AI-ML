import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Rect, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  voltage: number;
  current: number;
  label?: string;
}

export const OscilloscopeWaveform = ({ voltage, current, label = 'High Voltage Bus Waveform' }: Props) => {
  const width = 310;
  const height = 90;

  // Generate dynamic sinusoidal points modulated by live voltage and current
  const pathD = useMemo(() => {
    const points: string[] = [];
    const amplitude = Math.min(32, Math.max(8, (Math.abs(current) / 200) * 26 + 10));
    const frequency = 0.05 + (Math.abs(current) / 300) * 0.04;
    const verticalCenter = height / 2;

    for (let x = 0; x <= width; x += 4) {
      // Primary carrier wave + high frequency inverter ripple
      const y1 = Math.sin(x * frequency) * amplitude;
      const y2 = Math.sin(x * frequency * 3.5) * (amplitude * 0.25);
      const y = verticalCenter + y1 + y2;
      points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [voltage, current]);

  const p2pVoltage = (Math.abs(current) * 0.45 + 3.2).toFixed(1);
  const rippleFreq = (Math.abs(current) * 1.8 + 120).toFixed(0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.recordDot} />
          <Text style={styles.title}>{label}</Text>
        </View>
        <Text style={styles.stats}>Vpp: <Text style={{ color: '#06b6d4', fontWeight: '800' }}>{p2pVoltage}V</Text> | Freq: {rippleFreq}Hz</Text>
      </View>

      <View style={styles.svgContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="waveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
              <Stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

          {/* Oscilloscope CRT Dark Background */}
          <Rect x="0" y="0" width={width} height={height} rx="6" fill="#060a12" stroke="#172236" strokeWidth="1" />

          {/* Grid lines (horizontal & vertical) */}
          <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#1b2a44" strokeWidth="1" strokeDasharray="3 3" />
          <Line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="#111c2e" strokeWidth="0.8" strokeDasharray="2 4" />
          <Line x1="0" y1={(3 * height) / 4} x2={width} y2={(3 * height) / 4} stroke="#111c2e" strokeWidth="0.8" strokeDasharray="2 4" />

          {[width * 0.25, width * 0.5, width * 0.75].map((gx, idx) => (
            <Line key={idx} x1={gx} y1="0" x2={gx} y2={height} stroke="#111c2e" strokeWidth="0.8" strokeDasharray="2 4" />
          ))}

          {/* Trigger baseline indicator */}
          <Line x1="0" y1={height / 2} x2="14" y2={height / 2} stroke="#06b6d4" strokeWidth="2" />

          {/* Active Live Signal Waveform */}
          <Path
            d={pathD}
            fill="none"
            stroke="url(#waveGlow)"
            strokeWidth="2.2"
          />

          {/* Trigger marker tag */}
          <SvgText x={width - 48} y={height - 8} fill="#64748b" fontSize="8" fontWeight="bold">
            TRIG: AUTO
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
    borderWidth: 1,
    borderColor: '#1d2b45',
    marginBottom: 14
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.3
  },
  stats: {
    fontSize: 10,
    color: '#94a3b8'
  },
  svgContainer: {
    overflow: 'hidden',
    borderRadius: 6
  }
});
