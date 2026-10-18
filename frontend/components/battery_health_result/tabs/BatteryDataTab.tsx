import React from "react";
import { ScrollView, View, Text } from "react-native";
import { Card, MetricRow } from "../components";
import { hasVal } from "../utils";
import { BatteryFormData } from "../types";
import { styles } from "../styles";

export interface BatteryDataTabProps {
  form: BatteryFormData;
  colors: any;
}

export function BatteryDataTab({
  form,
  colors,
}: {
  form: BatteryFormData;
  colors: any;
}) {

  const factors = [
    {
      label: "Battery age",
      value: hasVal(form.batteryAgeYears)
        ? `${form.batteryAgeYears} years`
        : hasVal(form.batteryAgeMonths)
        ? `${form.batteryAgeMonths} months`
        : "Not provided",
    },
    {
      label: "Odometer reading",
      value: hasVal(form.odometerKm)
        ? `${Number(form.odometerKm).toLocaleString()} km`
        : "Not provided",
    },
    {
      label: "Battery nominal capacity",
      value: hasVal(form.batteryNominalCapacityKwh)
        ? `${form.batteryNominalCapacityKwh} kWh`
        : "Not provided",
    },
    {
      label: "Nominal system voltage",
      value: hasVal(form.batteryNominalVoltageV)
        ? `${form.batteryNominalVoltageV} V`
        : "Not provided",
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
        ? `${form.chargingSessions} sessions`
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
    {
      label: "Routine charging SOC window",
      value:
        hasVal(form.weeklyAvgSocStartPct) && hasVal(form.weeklyAvgSocEndPct)
          ? `${form.weeklyAvgSocStartPct}% - ${form.weeklyAvgSocEndPct}%`
          : hasVal(form.avgSocChange)
          ? `Δ ${form.avgSocChange}%`
          : "Not provided",
    },
    {
      label: "Weekly energy consumption",
      value: hasVal(form.weeklyEnergyConsumptionKwhPer100km)
        ? `${form.weeklyEnergyConsumptionKwhPer100km} kWh/100km`
        : "Not provided",
    },
    {
      label: "Average charge duration",
      value: hasVal(form.weeklyAvgChargeDurationMin)
        ? `${form.weeklyAvgChargeDurationMin} min`
        : hasVal(form.avgChargeDuration)
        ? `${form.avgChargeDuration} min`
        : "Not provided",
    },
    {
      label: "Battery pack temperature",
      value: hasVal(form.batteryTemperatureC)
        ? `${form.batteryTemperatureC} °C`
        : hasVal(form.avgTemperature)
        ? `${form.avgTemperature} °C`
        : "Not provided",
    },
    {
      label: "Battery pack voltage",
      value: hasVal(form.batteryPackVoltageV)
        ? `${form.batteryPackVoltageV} V`
        : hasVal(form.avgVoltage)
        ? `${form.avgVoltage} V`
        : "Not provided",
    },
    {
      label: "Average charging current",
      value: hasVal(form.avgChargingCurrentA)
        ? `${form.avgChargingCurrentA} A`
        : hasVal(form.avgCurrent)
        ? `${form.avgCurrent} A`
        : "Not provided",
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
        Prediction factors
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
        Technical values passed to the forecasting
        backend. No artificial factor percentages are
        calculated in the frontend.
      </Text>


      <Card colors={colors}>

        {
          factors.map(
            (
              item,
              index
            ) => (

              <React.Fragment
                key={
                  item.label
                }
              >

                {
                  index > 0 && (

                    <View
                      style={[
                        styles.separator,
                        {
                          backgroundColor:
                            colors.divider,
                        },
                      ]}
                    />

                  )
                }


                <MetricRow
                  label={
                    item.label
                  }

                  value={
                    item.value
                  }

                  colors={
                    colors
                  }
                />

              </React.Fragment>
            )
          )
        }

      </Card>

    </ScrollView>
  );
}

export const Factors = BatteryDataTab;
export default BatteryDataTab;
