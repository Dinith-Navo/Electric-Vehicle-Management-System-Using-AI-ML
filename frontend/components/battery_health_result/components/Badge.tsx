import React from "react";
import { View, Text } from "react-native";
import { BadgeType } from "../types";
import { styles } from "../styles";

export const BADGE_STYLES: Record<
  BadgeType,
  {
    bg: string;
    color: string;
    label: string;
  }
> = {

  good: {
    bg: "#E1F5EE",
    color: "#0F6E56",
    label: "Good",
  },

  warn: {
    bg: "#FAEEDA",
    color: "#854F0B",
    label: "Warning",
  },

  info: {
    bg: "#EEEDFE",
    color: "#534AB7",
    label: "Info",
  },

  error: {
    bg: "#FCEBEB",
    color: "#A32D2D",
    label: "Critical",
  },
};

export function Badge({
  type,
  label,
}: {
  type: BadgeType;
  label?: string;
}) {

  const style = BADGE_STYLES[type];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.bg,
        },
      ]}
    >

      <Text
        style={[
          styles.badgeText,
          {
            color: style.color,
          },
        ]}
      >
        {label || style.label}
      </Text>

    </View>
  );
}

export default Badge;
