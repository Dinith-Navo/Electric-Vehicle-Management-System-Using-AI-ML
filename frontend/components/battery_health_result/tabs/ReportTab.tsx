import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, MetricRow } from "../components";
import { BatteryFormData, PredictionResponse } from "../types";
import { healthLabel, formatSohChange } from "../utils";
import { styles } from "../styles";
import { generateBatteryReport } from "../services";

export interface ReportTabProps {
  form: BatteryFormData;
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  colors: any;
}

export function ReportTab({
  form,
  currentSOH,
  prediction,
  colors,
}: ReportTabProps) {
  const [generating, setGenerating] = useState(false);
  const recommendations = prediction?.recommendations || [];

  const handleDownload = async () => {
    try {
      await generateBatteryReport({
        form,
        currentSOH,
        prediction,
        setGenerating,
      });
    } catch (error) {
      console.error("Report generation error:", error);
      Alert.alert(
        "Report error",
        "Unable to create the PDF report. Please try again."
      );
    }
  };

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
        Battery health report
      </Text>

      <Text
        style={[
          styles.tabSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Review your current battery condition, future SOH forecast,
        usage profile and personalised battery-care guidance.
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
          Health summary
        </Text>

        <MetricRow
          label="Vehicle"
          value={form.vehicleModel || "Not provided"}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="Current SOH"
          value={
            currentSOH === null
              ? "Unknown"
              : `${currentSOH.toFixed(1)}%`
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
          SOH forecast
        </Text>

        <MetricRow
          label="After 3 months"
          value={
            prediction?.soh_3m != null
              ? `${Number(prediction.soh_3m).toFixed(1)}%`
              : "Pending"
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
          label="After 6 months"
          value={
            prediction?.soh_6m != null
              ? `${Number(prediction.soh_6m).toFixed(1)}%`
              : "Pending"
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
          label="After 12 months"
          value={
            prediction?.soh_12m != null
              ? `${Number(prediction.soh_12m).toFixed(1)}%`
              : "Pending"
          }
          colors={colors}
        />

      </Card>


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
          Predicted SOH change
        </Text>

        <MetricRow
          label="3-month change"
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
          label="6-month change"
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
          label="12-month change"
          value={formatSohChange(prediction?.degradation_12m)}
          colors={colors}
        />

      </Card>


      {recommendations.length > 0 && (

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
            Top recommendations
          </Text>

          {recommendations
            .slice(0, 3)
            .map((item, index) => (

              <React.Fragment
                key={`${item.title}-${index}`}
              >

                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                )}

                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.cardText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.message}
                </Text>

              </React.Fragment>
            ))}

        </Card>
      )}


      <Card colors={colors}>

        <View style={styles.infoRow}>

          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#534AB7"
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
            This forecast is intended to support day-to-day battery
            care. For maintenance, warranty, or safety decisions,
            confirm the battery condition with your vehicle
            manufacturer or a qualified EV service centre.
          </Text>

        </View>

      </Card>


      <TouchableOpacity
        style={[
          styles.downloadBtn,
          generating && { opacity: 0.6 },
        ]}
        activeOpacity={0.85}
        disabled={generating}
        onPress={handleDownload}
      >

        <Ionicons
          name={generating ? "hourglass-outline" : "document-text-outline"}
          size={16}
          color="#EEEDFE"
        />

        <Text style={styles.downloadText}>
          {generating ? "Generating report..." : "Generate PDF report"}
        </Text>

      </TouchableOpacity>

    </ScrollView>
  );
}

export const Report = ReportTab;
export default ReportTab;
