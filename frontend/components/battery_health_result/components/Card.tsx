import React from "react";
import { View, ViewStyle } from "react-native";
import { styles } from "../styles";

export function Card({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: any;
  style?: object;
}) {

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;
