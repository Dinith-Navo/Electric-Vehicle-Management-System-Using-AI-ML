import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export function MetricRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {

  return (
    <View
      style={
        styles.metricRow
      }
    >

      <Text
        style={[
          styles.metricLabel,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>


      <Text
        style={[
          styles.metricValue,
          {
            color:
              valueColor ||
              colors.textPrimary,
          },
        ]}
      >
        {value}
      </Text>

    </View>
  );
}

export default MetricRow;
