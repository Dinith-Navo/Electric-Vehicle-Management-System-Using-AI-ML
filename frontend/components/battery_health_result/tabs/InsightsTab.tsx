import React from "react";
import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, MetricRow, Badge } from "../components";
import { hasVal } from "../utils";
import { PredictionResponse, BatteryFormData, BadgeType } from "../types";
import { styles } from "../styles";

export interface InsightsTabProps {
  prediction: PredictionResponse | null;
  form: BatteryFormData;
  colors: any;
}

export function InsightsTab({
  prediction,
  form,
  colors,
}: {
  prediction: PredictionResponse | null;
  form: BatteryFormData;
  colors: any;
}) {

  const recommendations =
    prediction?.recommendations || [];


  const usageItems = [
    {
      label: "Vehicle model",
      value: hasVal(form.vehicleModel) ? form.vehicleModel! : "Not provided",
    },
    {
      label: "Driving mode",
      value: hasVal(form.drivingMode)
        ? form.drivingMode!
        : hasVal(form.drivingStyle)
        ? form.drivingStyle!
        : "Not provided",
    },
    {
      label: "Charging habit",
      value: hasVal(form.chargingHabit) ? form.chargingHabit! : "Not provided",
    },
    {
      label: "Weekly driving distance",
      value: hasVal(form.weeklyDrivingDistanceKm)
        ? `${form.weeklyDrivingDistanceKm} km/week`
        : "Not provided",
    },
    {
      label: "Weekly charging sessions",
      value: hasVal(form.weeklyChargeSessions)
        ? `${form.weeklyChargeSessions} sessions/week`
        : hasVal(form.chargingSessions)
        ? `${form.chargingSessions} sessions/week`
        : "Not provided",
    },
    ...(hasVal(form.dcFastChargingSessions)
      ? [
          {
            label: "DC fast charging sessions",
            value: `${form.dcFastChargingSessions} sessions/week`,
          },
        ]
      : []),
    {
      label: "Fast charging fraction",
      value: hasVal(form.weeklyFastChargeFraction)
        ? `${form.weeklyFastChargeFraction}%`
        : "Not provided",
    },
  ];


  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >

      <Text
        style={[
          styles.tabTitle,
          { color: colors.textPrimary },
        ]}
      >
        Battery insights
      </Text>

      <Text
        style={[
          styles.tabSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Your driving and charging profile, together with personalised
        battery-care suggestions.
      </Text>


      <Card colors={colors}>

        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              marginBottom: 8,
            },
          ]}
        >
          Your usage profile
        </Text>

        {usageItems.map((item, index) => (
          <React.Fragment key={item.label}>

            {index > 0 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.divider },
                ]}
              />
            )}

            <MetricRow
              label={item.label}
              value={item.value}
              colors={colors}
            />

          </React.Fragment>
        ))}

      </Card>


      <Text
        style={[
          styles.sectionHeading,
          { color: colors.textPrimary },
        ]}
      >
        Personalised recommendations
      </Text>


      {recommendations.length === 0 ? (

        <Card colors={colors}>

          <View style={styles.infoRow}>

            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color="#0F6E56"
            />

            <Text
              style={[
                styles.cardText,
                {
                  color: colors.textSecondary,
                  flex: 1,
                },
              ]}
            >
              No additional battery-care alert is available for this
              analysis. Continue following the charging and driving
              practices shown in your usage profile.
            </Text>

          </View>

        </Card>

      ) : (

        recommendations.map((item, index) => {

          const type: BadgeType =
            item.priority === "High"
              ? "error"
              : item.priority === "Medium"
                ? "warn"
                : "good";

          return (

            <Card
              key={`${item.title}-${index}`}
              colors={colors}
            >

              <View style={styles.rowBetween}>

                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: colors.textPrimary,
                      flex: 1,
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Badge
                  type={type}
                  label={item.priority}
                />

              </View>

              <Text
                style={[
                  styles.cardText,
                  {
                    color: colors.textSecondary,
                    marginTop: 8,
                  },
                ]}
              >
                {item.message}
              </Text>

            </Card>
          );
        })
      )}

    </ScrollView>
  );
}

export default InsightsTab;
