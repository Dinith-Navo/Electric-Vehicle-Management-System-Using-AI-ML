import React from "react";
import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Badge, CircularProgress, MetricRow, ForecastRow } from "../components";
import { toNumber, healthLabel, healthColor, formatSohChange } from "../utils";
import { PredictionResponse } from "../types";
import { styles } from "../styles";

export interface DashboardTabProps {
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  colors: any;
}

export function DashboardTab({
  currentSOH,
  prediction,
  colors,
}: {
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  colors: any;
}) {

  const soh3m =
    toNumber(
      prediction?.soh_3m
    );


  const soh6m =
    toNumber(
      prediction?.soh_6m
    );


  const soh12m =
    toNumber(
      prediction?.soh_12m
    );


  return (
    <ScrollView
      contentContainerStyle={
        styles.tabContent
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      {/* ================================================= */}
      {/* FRONTEND/BACKEND STATUS MESSAGE */}
      {/* ================================================= */}

      {!prediction && (

        <Card colors={colors}>

          <View
            style={
              styles.infoRow
            }
          >

            <Ionicons
              name="server-outline"
              size={19}
              color="#534AB7"
            />


            <View
              style={{
                flex: 1,
              }}
            >

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}
              >
                Frontend ready
              </Text>


              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >

                No battery analysis is available yet.
                Complete a battery health assessment to view your
                3-, 6- and 12-month forecasts and personalised insights.

              </Text>

            </View>

          </View>

        </Card>
      )}


      {/* ================================================= */}
      {/* CURRENT SOH */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View
          style={{
            alignItems:
              "center",

            paddingVertical:
              12,
          }}
        >

          <CircularProgress
            value={
              currentSOH
            }
          />


          <Badge
            type={
              currentSOH !== null &&
              currentSOH >= 90
                ? "good"

                : currentSOH !== null &&
                  currentSOH >= 80
                  ? "warn"

                  : "error"
            }

            label={
              healthLabel(
                currentSOH
              )
            }
          />

        </View>

      </Card>


      {/* ================================================= */}
      {/* FUTURE SOH */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View
          style={
            styles.cardHeader
          }
        >

          <View
            style={
              styles.purpleIcon
            }
          >

            <Ionicons
              name="trending-down-outline"
              size={15}
              color="#534AB7"
            />

          </View>


          <View
            style={{
              flex: 1,
            }}
          >

            <Text
              style={[
                styles.cardTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}
            >
              Future SOH forecasts
            </Text>


            <Text
              style={[
                styles.cardText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Estimated battery health over the next 12 months.
            </Text>

          </View>

        </View>


        <ForecastRow
          label="After 3 months"
          value={soh3m}
          colors={colors}
        />


        <ForecastRow
          label="After 6 months"
          value={soh6m}
          colors={colors}
        />


        <ForecastRow
          label="After 12 months"
          value={soh12m}
          colors={colors}
        />

      </Card>


      {/* ================================================= */}
      {/* USER-FACING SOH CHANGE */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View style={styles.cardHeader}>
          <View style={styles.purpleIcon}>
            <Ionicons
              name="analytics-outline"
              size={15}
              color="#534AB7"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.textPrimary },
              ]}
            >
              Predicted SOH change
            </Text>

            <Text
              style={[
                styles.cardText,
                { color: colors.textSecondary },
              ]}
            >
              Estimated change compared with your current battery health.
            </Text>
          </View>
        </View>

        <MetricRow
          label="After 3 months"
          value={formatSohChange(prediction?.degradation_3m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 6 months"
          value={formatSohChange(prediction?.degradation_6m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 12 months"
          value={formatSohChange(prediction?.degradation_12m)}
          colors={colors}
        />

      </Card>


      {/* ================================================= */}
      {/* BATTERY OUTLOOK */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View style={styles.cardHeader}>
          <View style={styles.purpleIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#534AB7"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.textPrimary },
              ]}
            >
              Battery outlook
            </Text>

            <Text
              style={[
                styles.cardText,
                { color: colors.textSecondary },
              ]}
            >
              A simple summary based on your current SOH and forecast.
            </Text>
          </View>
        </View>

        <MetricRow
          label="Current health"
          value={
            prediction?.health_status ||
            healthLabel(currentSOH)
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="12-month outlook"
          value={
            prediction?.risk_level
              ? `${prediction.risk_level} risk`
              : "Pending"
          }
          colors={colors}
        />

      </Card>

    </ScrollView>
  );
}

export default DashboardTab;
