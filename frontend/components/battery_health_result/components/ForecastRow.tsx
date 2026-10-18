import React from "react";
import { View, Text } from "react-native";
import { healthColor } from "../utils";
import { ProgressBar } from "./ProgressBar";
import { styles } from "../styles";

export function ForecastRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: number | null;
  colors: any;
}) {

  const color =
    healthColor(value);


  return (
    <View
      style={{
        marginTop: 14,
      }}
    >

      <View
        style={
          styles.rowBetween
        }
      >

        <Text
          style={{
            fontSize: 12,

            color:
              colors.textSecondary,
          }}
        >
          {label}
        </Text>


        <Text
          style={{
            fontSize: 13,

            fontWeight:
              "600",

            color,
          }}
        >

          {
            value === null
              ? "Pending"
              : `${value.toFixed(1)}%`
          }

        </Text>

      </View>


      <ProgressBar
        value={value}
        color={color}
        trackColor={
          colors.progressTrack
        }
      />

    </View>
  );
}

export default ForecastRow;
