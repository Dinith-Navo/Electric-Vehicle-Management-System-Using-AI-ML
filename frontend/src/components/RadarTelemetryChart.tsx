import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { Telemetry } from '../types/telemetry';

interface Props {
  telemetry: Telemetry;
  twinProfile?: any;
}

export const RadarTelemetryChart = ({ telemetry, twinProfile }: Props) => {
  const size = 260;
  const center = size / 2;
  const radius = 95;

  const axes = [
    { label: 'Voltage', key: 'batteryVoltage', min: 300, max: 450 },
    { label: 'Current', key: 'batteryCurrent', min: -50, max: 250 },
    { label: 'Batt Temp', key: 'batteryTemperature', min: 10, max: 70 },
    { label: 'Motor Temp', key: 'motorTemperature', min: 20, max: 110 },
    { label: 'Power', key: 'powerConsumption', min: -20, max: 150 },
    { label: 'Speed', key: 'vehicleSpeed', min: 0, max: 180 },
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Calculate polygon points for a given normalized values array
  const getCoordinates = (normValues: number[]) => {
    return normValues.map((val, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      const r = Math.max(0.1, Math.min(1.0, val)) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Current telemetry normalized (0.0 to 1.0)
  const currentNormalized = axes.map((axis) => {
    const raw = (telemetry as any)[axis.key] ?? axis.min;
    return (raw - axis.min) / (axis.max - axis.min);
  });

  // Digital Twin baseline normalized (typically nominal around 0.45)
  const twinNormalized = [0.55, 0.35, 0.38, 0.45, 0.32, 0.40];

  // Critical Boundary normalized
  const criticalThreshold = [0.85, 0.85, 0.85, 0.85, 0.85, 0.85];

  const currentPoints = getCoordinates(currentNormalized);
  const twinPoints = getCoordinates(twinNormalized);
  const critPoints = getCoordinates(criticalThreshold);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Multi-Dimensional Telemetry Radar</Text>
        <Text style={styles.sub}>Twin Baseline vs Live State</Text>
      </View>

      <View style={styles.svgContainer}>
        <Svg width={size} height={size}>
          {/* Concentric Web Rings (25%, 50%, 75%, 100%) */}
          {[0.25, 0.50, 0.75, 1.0].map((level, lIdx) => (
            <Circle
              key={lIdx}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="#1f2d45"
              strokeWidth="1"
              strokeDasharray={level === 1.0 ? undefined : '2 2'}
            />
          ))}

          {/* Radial Spokes from Center */}
          {axes.map((axis, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            // Label coordinates slightly outside the circle
            const labelDist = radius + 22;
            const lx = center + labelDist * Math.cos(angle);
            const ly = center + labelDist * Math.sin(angle) + 4;

            return (
              <G key={idx}>
                <Line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#233452"
                  strokeWidth="1"
                />
                <SvgText
                  x={lx}
                  y={ly}
                  fontSize="9"
                  fontWeight="bold"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {axis.label}
                </SvgText>
              </G>
            );
          })}

          {/* Critical Threshold Boundary Layer */}
          <Polygon
            points={critPoints}
            fill="rgba(239, 68, 68, 0.05)"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Digital Twin Learned Baseline Polygon */}
          <Polygon
            points={twinPoints}
            fill="rgba(99, 102, 241, 0.2)"
            stroke="#6366f1"
            strokeWidth="1.8"
          />

          {/* Current Live Telemetry Polygon */}
          <Polygon
            points={currentPoints}
            fill="rgba(6, 182, 212, 0.35)"
            stroke="#06b6d4"
            strokeWidth="2.5"
          />

          {/* Vertices Dots for Current Telemetry */}
          {currentNormalized.map((val, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const r = Math.max(0.1, Math.min(1.0, val)) * radius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return (
              <Circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}
        </Svg>
      </View>

      {/* Radar Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#06b6d4' }]} />
          <Text style={styles.legendText}>Live Telemetry</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Digital Twin Normal</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Critical Limit</Text>
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
    borderColor: '#1d2b45',
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc'
  },
  sub: {
    fontSize: 10,
    color: '#06b6d4',
    fontWeight: '600'
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 6
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  legendText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600'
  }
});
