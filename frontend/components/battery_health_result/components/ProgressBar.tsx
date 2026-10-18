import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { styles } from "../styles";

export function ProgressBar({
  value,
  color,
  trackColor,
}: {
  value: number | null;
  color: string;
  trackColor: string;
}) {

  const anim =
    useRef(
      new Animated.Value(0)
    ).current;


  useEffect(() => {

    const target =
      value === null
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              value / 100
            )
          );


    Animated.timing(
      anim,
      {
        toValue: target,

        duration: 800,

        useNativeDriver: false,
      }
    ).start();

  }, [
    anim,
    value,
  ]);


  return (
    <View
      style={[
        styles.progressTrack,
        {
          backgroundColor:
            trackColor,
        },
      ]}
    >

      <Animated.View
        style={{
          height: "100%",

          borderRadius: 4,

          backgroundColor:
            color,

          width:
            anim.interpolate({
              inputRange: [
                0,
                1,
              ],

              outputRange: [
                "0%",
                "100%",
              ],
            }),
        }}
      />

    </View>
  );
}

export default ProgressBar;
