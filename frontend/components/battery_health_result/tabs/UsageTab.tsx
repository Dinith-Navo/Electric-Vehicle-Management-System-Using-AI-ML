import React from "react";
import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components";
import { BatteryFormData } from "../types";
import { styles } from "../styles";

export interface UsageTabProps {
  form: BatteryFormData;
  colors: any;
}

export function UsageTab({
  form,
  colors,
}: {
  form: BatteryFormData;
  colors: any;
}) {

  const items = [
    {
      icon: "car-outline" as const,
      label: "Vehicle model",
      value: form.vehicleModel,
    },
    {
      icon: "car-sport-outline" as const,
      label: "Driving style",
      value: form.drivingStyle,
    },
    {
      icon: "battery-half-outline" as const,
      label: "Charging habit",
      value: form.chargingHabit,
    },
    {
      icon: "navigate-outline" as const,
      label: "Weekly driving distance",
      value: form.weeklyDrivingDistanceKm ? `${form.weeklyDrivingDistanceKm} km/week` : undefined,
    },
    {
      icon: "repeat-outline" as const,
      label: "Weekly charging sessions",
      value: form.weeklyChargeSessions ? `${form.weeklyChargeSessions} sessions/week` : undefined,
    },
    {
      icon: "flash-outline" as const,
      label: "Fast charging fraction",
      value: form.weeklyFastChargeFraction ? `${form.weeklyFastChargeFraction}%` : undefined,
    },
  ];


  return (
    <ScrollView
      contentContainerStyle={
        styles.tabContent
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      <Text
        style={[
          styles.tabTitle,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        Usage behaviour
      </Text>


      <Text
        style={[
          styles.tabSubtitle,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        These details help tailor your battery-care guidance
        and are shown exactly as submitted.
      </Text>


      {
        items.map(
          (
            item
          ) => (

            <Card
              key={
                item.label
              }

              colors={
                colors
              }
            >

              <View
                style={
                  styles.infoRow
                }
              >

                <View
                  style={
                    styles.purpleIcon
                  }
                >

                  <Ionicons
                    name={
                      item.icon
                    }

                    size={
                      15
                    }

                    color={
                      "#534AB7"
                    }
                  />

                </View>


                <View
                  style={{
                    flex:
                      1,
                  }}
                >

                  <Text
                    style={[
                      styles.smallLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>


                  <Text
                    style={[
                      styles.behaviorValue,
                      {
                        color:
                          colors.textPrimary,
                      },
                    ]}
                  >
                    {
                      item.value ||
                      "Not provided"
                    }
                  </Text>

                </View>

              </View>

            </Card>
          )
        )
      }

    </ScrollView>
  );
}

export const Behavior = UsageTab;
export default UsageTab;
