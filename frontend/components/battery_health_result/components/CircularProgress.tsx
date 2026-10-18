import React from "react";
import { View, Text } from "react-native";
import { healthColor } from "../utils";

export function CircularProgress({
  value,
}: {
  value: number | null;
}) {

  const display =
    value === null
      ? "--"
      : `${Math.round(value)}%`;


  const safeValue =
    value === null
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            value
          )
        );


  const color =
    healthColor(value);


  const trackColor =
    value === null
      ? "#EEEDFE"
      : value >= 90
        ? "#E1F5EE"
        : value >= 80
          ? "#FAEEDA"
          : "#FCEBEB";


  const size = 140;

  const stroke = 10;


  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >

      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: trackColor,
        }}
      />


      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,

          borderColor:
            "transparent",

          borderTopColor:
            safeValue > 0
              ? color
              : "transparent",

          borderRightColor:
            safeValue > 25
              ? color
              : "transparent",

          borderBottomColor:
            safeValue > 50
              ? color
              : "transparent",

          borderLeftColor:
            safeValue > 75
              ? color
              : "transparent",

          transform: [
            {
              rotate: "-45deg",
            },
          ],
        }}
      />


      <Text
        style={{
          fontSize: 30,
          fontWeight: "600",
          color,
        }}
      >
        {display}
      </Text>


      <Text
        style={{
          fontSize: 11,
          color: "#999",
          marginTop: 2,
        }}
      >
        Current SOH
      </Text>

    </View>
  );
}

export default CircularProgress;
