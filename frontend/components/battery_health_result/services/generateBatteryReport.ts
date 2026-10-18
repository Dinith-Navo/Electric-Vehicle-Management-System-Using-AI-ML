import { Alert, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { BatteryFormData, PredictionResponse, Recommendation } from "../types";
import { escapeHtml, hasVal, healthLabel, formatSohChange, toNumber } from "../utils";

export interface GenerateBatteryReportOptions {
  form: BatteryFormData;
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  setGenerating?: (generating: boolean) => void;
}

export async function generateBatteryReport({
  form,
  currentSOH,
  prediction,
  setGenerating,
}: GenerateBatteryReportOptions): Promise<void> {
  const recommendations = prediction?.recommendations || [];

  if (!prediction) {

    Alert.alert(
      "Report unavailable",
      "Generate a battery health analysis before creating a report."
    );

    return;
  }


  try {

    setGenerating?.(true);

    const generatedAt =
      new Date().toLocaleString();


    const recommendationHtml =
      recommendations.length > 0

        ? recommendations
          .map(
            (item) => `
                  <div class="recommendation">
                    <div>
                      <span class="priority">
                        ${escapeHtml(item.priority)}
                      </span>
                      <strong>
                        ${escapeHtml(item.title)}
                      </strong>
                    </div>
                    <p>
                      ${escapeHtml(item.message)}
                    </p>
                  </div>
                `
          )
          .join("")

        : `
              <p>
                No additional battery-care alert was generated
                for this analysis.
              </p>
            `;


    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />

            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                color: #222;
                padding: 32px;
                line-height: 1.5;
              }

              h1 {
                margin-bottom: 4px;
                color: #534AB7;
              }

              h2 {
                font-size: 17px;
                margin-top: 28px;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 6px;
              }

              .subtitle {
                color: #666;
                margin-top: 0;
              }

              .summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }

              .metric {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px 12px;
              }

              .label {
                color: #666;
                font-size: 12px;
              }

              .value {
                font-size: 16px;
                font-weight: bold;
                margin-top: 3px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              td {
                padding: 8px 4px;
                border-bottom: 1px solid #eee;
              }

              td:last-child {
                text-align: right;
                font-weight: bold;
              }

              .recommendation {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
              }

              .recommendation p {
                margin-bottom: 0;
              }

              .priority {
                display: inline-block;
                margin-right: 8px;
                padding: 2px 7px;
                border-radius: 12px;
                background: #EEEDFE;
                color: #534AB7;
                font-size: 11px;
                font-weight: bold;
              }

              .note {
                margin-top: 28px;
                padding: 12px;
                background: #f6f6f8;
                border-radius: 8px;
                color: #555;
                font-size: 12px;
              }
            </style>
          </head>

          <body>

            <h1>EV Battery Health Report</h1>

            <p class="subtitle">
              Generated ${escapeHtml(generatedAt)}
            </p>


            <h2>Battery health summary</h2>

            <div class="summary">

              <div class="metric">
                <div class="label">Vehicle</div>
                <div class="value">
                  ${escapeHtml(hasVal(form.vehicleModel) ? form.vehicleModel! : "Not provided")}
                </div>
              </div>

              <div class="metric">
                <div class="label">Current SOH</div>
                <div class="value">
                  ${currentSOH === null
        ? "Unknown"
        : `${currentSOH.toFixed(1)}%`
      }
                </div>
              </div>

              <div class="metric">
                <div class="label">Current health</div>
                <div class="value">
                  ${escapeHtml(
        prediction.health_status ||
        healthLabel(currentSOH)
      )}
                </div>
              </div>

              <div class="metric">
                <div class="label">12-month outlook</div>
                <div class="value">
                  ${escapeHtml(
        prediction.risk_level
          ? `${prediction.risk_level} risk`
          : "Not available"
      )}
                </div>
              </div>

            </div>


            <h2>SOH forecast</h2>

            <table>
              <tr>
                <td>After 3 months</td>
                <td>
                  ${prediction.soh_3m != null
        ? `${Number(prediction.soh_3m).toFixed(1)}%`
        : "Pending"
      }
                </td>
              </tr>

              <tr>
                <td>After 6 months</td>
                <td>
                  ${prediction.soh_6m != null
        ? `${Number(prediction.soh_6m).toFixed(1)}%`
        : "Pending"
      }
                </td>
              </tr>

              <tr>
                <td>After 12 months</td>
                <td>
                  ${prediction.soh_12m != null
        ? `${Number(prediction.soh_12m).toFixed(1)}%`
        : "Pending"
      }
                </td>
              </tr>
            </table>


            <h2>Predicted SOH change</h2>

            <table>
              <tr>
                <td>3-month change</td>
                <td>
                  ${escapeHtml(
        formatSohChange(prediction.degradation_3m)
      )}
                </td>
              </tr>

              <tr>
                <td>6-month change</td>
                <td>
                  ${escapeHtml(
        formatSohChange(prediction.degradation_6m)
      )}
                </td>
              </tr>

              <tr>
                <td>12-month change</td>
                <td>
                  ${escapeHtml(
        formatSohChange(prediction.degradation_12m)
      )}
                </td>
              </tr>
            </table>


            <h2>Your usage profile</h2>

            <table>
              <tr>
                <td>Vehicle model</td>
                <td>
                  ${escapeHtml(hasVal(form.vehicleModel) ? form.vehicleModel! : "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Driving style</td>
                <td>
                  ${escapeHtml(hasVal(form.drivingMode) ? form.drivingMode! : (hasVal(form.drivingStyle) ? form.drivingStyle! : "Not provided"))}
                </td>
              </tr>

              <tr>
                <td>Charging habit</td>
                <td>
                  ${escapeHtml(hasVal(form.chargingHabit) ? form.chargingHabit! : "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Weekly driving distance</td>
                <td>
                  ${escapeHtml(hasVal(form.weeklyDrivingDistanceKm) ? `${form.weeklyDrivingDistanceKm} km/week` : "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Weekly charging sessions</td>
                <td>
                  ${escapeHtml(hasVal(form.weeklyChargeSessions) ? `${form.weeklyChargeSessions} sessions/week` : (hasVal(form.chargingSessions) ? `${form.chargingSessions} sessions/week` : "Not provided"))}
                </td>
              </tr>

              <tr>
                <td>Fast charging fraction</td>
                <td>
                  ${escapeHtml(hasVal(form.weeklyFastChargeFraction) ? `${form.weeklyFastChargeFraction}%` : "Not provided")}
                </td>
              </tr>
            </table>


            <h2>Battery &amp; operational measurements</h2>

            <table>
              <tr>
                <td>Battery age</td>
                <td>${escapeHtml(hasVal(form.batteryAgeYears) ? `${form.batteryAgeYears} years` : (hasVal(form.batteryAgeMonths) ? `${form.batteryAgeMonths} months` : "Not provided"))}</td>
              </tr>
              <tr>
                <td>Odometer reading</td>
                <td>${escapeHtml(hasVal(form.odometerKm) ? `${Number(form.odometerKm).toLocaleString()} km` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Battery nominal capacity</td>
                <td>${escapeHtml(hasVal(form.batteryNominalCapacityKwh) ? `${form.batteryNominalCapacityKwh} kWh` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Nominal system voltage</td>
                <td>${escapeHtml(hasVal(form.batteryNominalVoltageV) ? `${form.batteryNominalVoltageV} V` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Weekly driving distance</td>
                <td>${escapeHtml(hasVal(form.weeklyDrivingDistanceKm) ? `${form.weeklyDrivingDistanceKm} km/week` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Weekly charging sessions</td>
                <td>${escapeHtml(hasVal(form.weeklyChargeSessions) ? `${form.weeklyChargeSessions} sessions/week` : (hasVal(form.chargingSessions) ? `${form.chargingSessions} sessions` : "Not provided"))}</td>
              </tr>
              ${hasVal(form.dcFastChargingSessions)
        ? `<tr>
                <td>DC fast charging sessions</td>
                <td>${escapeHtml(`${form.dcFastChargingSessions} sessions/week`)}</td>
              </tr>`
        : ""
      }
              <tr>
                <td>Weekly fast charging fraction</td>
                <td>${escapeHtml(hasVal(form.weeklyFastChargeFraction) ? `${form.weeklyFastChargeFraction}%` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Routine SOC charge window</td>
                <td>${escapeHtml(hasVal(form.weeklyAvgSocStartPct) && hasVal(form.weeklyAvgSocEndPct) ? `${form.weeklyAvgSocStartPct}% - ${form.weeklyAvgSocEndPct}%` : (hasVal(form.avgSocChange) ? `Δ ${form.avgSocChange}%` : "Not provided"))}</td>
              </tr>
              <tr>
                <td>Weekly energy consumption</td>
                <td>${escapeHtml(hasVal(form.weeklyEnergyConsumptionKwhPer100km) ? `${form.weeklyEnergyConsumptionKwhPer100km} kWh/100km` : "Not provided")}</td>
              </tr>
              <tr>
                <td>Average charge duration</td>
                <td>${escapeHtml(hasVal(form.weeklyAvgChargeDurationMin) ? `${form.weeklyAvgChargeDurationMin} min` : (hasVal(form.avgChargeDuration) ? `${form.avgChargeDuration} min` : "Not provided"))}</td>
              </tr>
              <tr>
                <td>Battery pack temperature</td>
                <td>${escapeHtml(hasVal(form.batteryTemperatureC) ? `${form.batteryTemperatureC} °C` : (hasVal(form.avgTemperature) ? `${form.avgTemperature} °C` : "Not provided"))}</td>
              </tr>
              <tr>
                <td>Battery pack voltage</td>
                <td>${escapeHtml(hasVal(form.batteryPackVoltageV) ? `${form.batteryPackVoltageV} V` : (hasVal(form.avgVoltage) ? `${form.avgVoltage} V` : "Not provided"))}</td>
              </tr>
              <tr>
                <td>Average charging current</td>
                <td>${escapeHtml(hasVal(form.avgChargingCurrentA) ? `${form.avgChargingCurrentA} A` : (hasVal(form.avgCurrent) ? `${form.avgCurrent} A` : "Not provided"))}</td>
              </tr>
            </table>


            <h2>Personalised recommendations</h2>

            ${recommendationHtml}


            <div class="note">
              This forecast is intended to support day-to-day battery
              care. For maintenance, warranty, or safety decisions,
              confirm the battery condition with your vehicle
              manufacturer or a qualified EV service centre.
            </div>

          </body>
        </html>
      `;


    if (Platform.OS === "web") {

      // =================================================
      // WEB: POLISHED, DEPENDENCY-FREE PDF DOWNLOAD
      // =================================================
      // No jsPDF / pdf-lib / html2canvas.
      // The PDF is generated directly so Expo Web remains
      // stable and the report downloads without a print dialog.
      // =================================================

      type PdfColor = [
        number,
        number,
        number
      ];

      const PAGE_WIDTH = 595;
      const PAGE_HEIGHT = 842;

      const MARGIN = 42;
      const CONTENT_WIDTH =
        PAGE_WIDTH - MARGIN * 2;

      const PURPLE: PdfColor = [
        0.325,
        0.29,
        0.718,
      ];

      const PURPLE_DARK: PdfColor = [
        0.20,
        0.17,
        0.50,
      ];

      const PURPLE_LIGHT: PdfColor = [
        0.94,
        0.93,
        0.99,
      ];

      const TEXT: PdfColor = [
        0.12,
        0.12,
        0.15,
      ];

      const MUTED: PdfColor = [
        0.40,
        0.40,
        0.45,
      ];

      const BORDER: PdfColor = [
        0.88,
        0.88,
        0.91,
      ];

      const SOFT_BG: PdfColor = [
        0.975,
        0.975,
        0.985,
      ];

      const GREEN: PdfColor = [
        0.06,
        0.43,
        0.34,
      ];

      const GREEN_LIGHT: PdfColor = [
        0.90,
        0.97,
        0.94,
      ];

      const AMBER: PdfColor = [
        0.72,
        0.42,
        0.09,
      ];

      const AMBER_LIGHT: PdfColor = [
        0.99,
        0.95,
        0.86,
      ];

      const RED: PdfColor = [
        0.64,
        0.18,
        0.18,
      ];

      const RED_LIGHT: PdfColor = [
        0.99,
        0.92,
        0.92,
      ];


      const pages: string[][] = [];

      let commands: string[] = [];

      let y =
        PAGE_HEIGHT -
        MARGIN;


      const rgbFill = (
        color: PdfColor
      ) =>
        `${color[0]} ${color[1]} ${color[2]} rg`;


      const rgbStroke = (
        color: PdfColor
      ) =>
        `${color[0]} ${color[1]} ${color[2]} RG`;


      const sanitizePdfText = (
        value: unknown
      ): string => {

        return String(
          value ?? ""
        )
          .replace(/[^\x20-\x7E]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      };


      const escapePdfText = (
        value: string
      ): string => {

        return sanitizePdfText(
          value
        )
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)");
      };


      const textCommand = (
        value: string,
        x: number,
        yPos: number,
        size = 10,
        bold = false,
        color: PdfColor = TEXT
      ): string => {

        const font =
          bold
            ? "/F2"
            : "/F1";

        return [
          "BT",
          rgbFill(color),
          `${font} ${size} Tf`,
          `1 0 0 1 ${x.toFixed(
            2
          )} ${yPos.toFixed(
            2
          )} Tm`,
          `(${escapePdfText(
            value
          )}) Tj`,
          "ET",
        ].join("\n");
      };


      const lineCommand = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: PdfColor = BORDER,
        width = 0.7
      ): string => {

        return [
          rgbStroke(color),
          `${width} w`,
          `${x1.toFixed(
            2
          )} ${y1.toFixed(
            2
          )} m`,
          `${x2.toFixed(
            2
          )} ${y2.toFixed(
            2
          )} l`,
          "S",
        ].join("\n");
      };


      const rectCommand = (
        x: number,
        yPos: number,
        width: number,
        height: number,
        fillColor?: PdfColor,
        strokeColor?: PdfColor,
        strokeWidth = 0.7
      ): string => {

        const parts: string[] = [];

        if (fillColor) {
          parts.push(
            rgbFill(
              fillColor
            )
          );
        }

        if (strokeColor) {
          parts.push(
            rgbStroke(
              strokeColor
            )
          );

          parts.push(
            `${strokeWidth} w`
          );
        }

        parts.push(
          `${x.toFixed(
            2
          )} ${yPos.toFixed(
            2
          )} ${width.toFixed(
            2
          )} ${height.toFixed(
            2
          )} re`
        );

        if (
          fillColor &&
          strokeColor
        ) {
          parts.push("B");
        } else if (fillColor) {
          parts.push("f");
        } else {
          parts.push("S");
        }

        return parts.join(
          "\n"
        );
      };


      const startNewPage = () => {

        if (
          commands.length >
          0
        ) {
          pages.push(
            commands
          );
        }

        commands = [];

        y =
          PAGE_HEIGHT -
          MARGIN;
      };


      const ensureSpace = (
        requiredHeight: number
      ) => {

        if (
          y -
          requiredHeight <
          MARGIN + 28
        ) {
          startNewPage();
        }
      };


      const wrapText = (
        value: string,
        size: number,
        maxWidth: number
      ): string[] => {

        const clean =
          sanitizePdfText(
            value
          );

        if (!clean) {
          return [""];
        }

        const maxChars =
          Math.max(
            12,
            Math.floor(
              maxWidth /
              (size * 0.52)
            )
          );

        const words =
          clean.split(" ");

        const lines: string[] = [];

        let current = "";

        for (
          const word
          of words
        ) {

          const candidate =
            current
              ? `${current} ${word}`
              : word;

          if (
            candidate.length <=
            maxChars
          ) {
            current = candidate;
          } else {
            if (current) {
              lines.push(
                current
              );
            }

            current = word;
          }
        }

        if (current) {
          lines.push(
            current
          );
        }

        return lines;
      };


      const valueWidthApprox = (
        value: string,
        size: number
      ) =>
        Math.min(
          CONTENT_WIDTH,
          sanitizePdfText(
            value
          ).length *
          size *
          0.50
        );


      const addPageHeader = (
        title = "EV Battery Health Report"
      ) => {

        commands.push(
          rectCommand(
            0,
            PAGE_HEIGHT - 106,
            PAGE_WIDTH,
            106,
            PURPLE_DARK
          )
        );

        commands.push(
          textCommand(
            "INTELLIGENT EV DECISION SUPPORT",
            MARGIN,
            PAGE_HEIGHT - 35,
            8,
            true,
            [
              0.84,
              0.82,
              0.96,
            ]
          )
        );

        commands.push(
          textCommand(
            title,
            MARGIN,
            PAGE_HEIGHT - 61,
            22,
            true,
            [
              1,
              1,
              1,
            ]
          )
        );

        commands.push(
          textCommand(
            "Adaptive battery health prediction and personalised battery-care guidance",
            MARGIN,
            PAGE_HEIGHT - 80,
            9,
            false,
            [
              0.90,
              0.89,
              0.98,
            ]
          )
        );

        commands.push(
          textCommand(
            sanitizePdfText(
              generatedAt
            ),
            MARGIN,
            PAGE_HEIGHT - 95,
            7.5,
            false,
            [
              0.82,
              0.81,
              0.93,
            ]
          )
        );

        y =
          PAGE_HEIGHT -
          130;
      };


      const addSectionTitle = (
        title: string,
        subtitle?: string
      ) => {

        ensureSpace(
          subtitle
            ? 42
            : 31
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - 1,
            4,
            17,
            PURPLE
          )
        );

        commands.push(
          textCommand(
            title,
            MARGIN + 12,
            y + 2,
            13,
            true,
            TEXT
          )
        );

        y -= 17;

        if (subtitle) {
          const subtitleLines =
            wrapText(
              subtitle,
              8.2,
              CONTENT_WIDTH - 12
            );

          for (
            const line
            of subtitleLines
          ) {

            commands.push(
              textCommand(
                line,
                MARGIN + 12,
                y,
                8.2,
                false,
                MUTED
              )
            );

            y -= 11;
          }
        }

        y -= 7;
      };


      const addSummaryCard = (
        x: number,
        width: number,
        label: string,
        value: string,
        accent: PdfColor,
        background: PdfColor
      ) => {

        const cardHeight = 62;

        commands.push(
          rectCommand(
            x,
            y - cardHeight,
            width,
            cardHeight,
            background,
            BORDER,
            0.5
          )
        );

        commands.push(
          rectCommand(
            x,
            y - cardHeight,
            4,
            cardHeight,
            accent
          )
        );

        commands.push(
          textCommand(
            label.toUpperCase(),
            x + 12,
            y - 19,
            7.5,
            true,
            MUTED
          )
        );

        const valueLines =
          wrapText(
            value,
            14,
            width - 24
          );

        let valueY =
          y - 41;

        for (
          const line
          of valueLines.slice(
            0,
            2
          )
        ) {
          commands.push(
            textCommand(
              line,
              x + 12,
              valueY,
              14,
              true,
              accent
            )
          );

          valueY -= 16;
        }
      };


      const addInfoRow = (
        label: string,
        value: string,
        valueColor: PdfColor = TEXT
      ) => {

        const valueLines =
          wrapText(
            value,
            9.4,
            255
          );

        const rowHeight =
          Math.max(
            25,
            valueLines.length *
            12 +
            8
          );

        ensureSpace(
          rowHeight
        );

        commands.push(
          textCommand(
            label,
            MARGIN + 10,
            y,
            9.2,
            false,
            MUTED
          )
        );

        let valueY = y;

        for (
          const line
          of valueLines
        ) {

          const approx =
            valueWidthApprox(
              line,
              9.4
            );

          commands.push(
            textCommand(
              line,
              PAGE_WIDTH -
              MARGIN -
              10 -
              approx,
              valueY,
              9.4,
              true,
              valueColor
            )
          );

          valueY -= 12;
        }

        y -=
          rowHeight -
          4;

        commands.push(
          lineCommand(
            MARGIN + 10,
            y,
            PAGE_WIDTH -
            MARGIN -
            10,
            y,
            [
              0.93,
              0.93,
              0.95,
            ],
            0.5
          )
        );

        y -= 8;
      };


      const addForecastCard = (
        x: number,
        width: number,
        horizon: string,
        sohValue: number | null,
        degradationValue:
          | number
          | null
          | undefined
      ) => {

        const cardHeight = 88;

        const sohText =
          sohValue === null
            ? "Pending"
            : `${sohValue.toFixed(
              1
            )}%`;

        const degradationText =
          formatSohChange(
            degradationValue
          );

        const barValue =
          sohValue === null
            ? 0
            : Math.max(
              0,
              Math.min(
                100,
                sohValue
              )
            );

        const healthAccent: PdfColor =
          sohValue === null
            ? PURPLE
            : sohValue >= 90
              ? GREEN
              : sohValue >= 80
                ? AMBER
                : RED;

        commands.push(
          rectCommand(
            x,
            y - cardHeight,
            width,
            cardHeight,
            [
              1,
              1,
              1,
            ],
            BORDER,
            0.6
          )
        );

        commands.push(
          textCommand(
            horizon,
            x + 12,
            y - 20,
            8,
            true,
            MUTED
          )
        );

        commands.push(
          textCommand(
            sohText,
            x + 12,
            y - 43,
            18,
            true,
            healthAccent
          )
        );

        commands.push(
          textCommand(
            `SOH change: ${degradationText}`,
            x + 12,
            y - 59,
            7.5,
            false,
            MUTED
          )
        );

        const barX =
          x + 12;

        const barY =
          y - 75;

        const barWidth =
          width - 24;

        commands.push(
          rectCommand(
            barX,
            barY,
            barWidth,
            5,
            [
              0.93,
              0.93,
              0.95,
            ]
          )
        );

        if (
          barValue >
          0
        ) {
          commands.push(
            rectCommand(
              barX,
              barY,
              barWidth *
              (barValue / 100),
              5,
              healthAccent
            )
          );
        }
      };


      const getRecommendationPalette = (
        priority: Recommendation["priority"]
      ) => {

        if (
          priority ===
          "High"
        ) {
          return {
            accent: RED,
            background:
              RED_LIGHT,
          };
        }

        if (
          priority ===
          "Medium"
        ) {
          return {
            accent:
              AMBER,
            background:
              AMBER_LIGHT,
          };
        }

        return {
          accent:
            GREEN,
          background:
            GREEN_LIGHT,
        };
      };


      const addRecommendation = (
        item: Recommendation,
        index: number
      ) => {

        const palette =
          getRecommendationPalette(
            item.priority
          );

        const title =
          `${index + 1}. ${sanitizePdfText(
            item.title
          )}`;

        const titleLines =
          wrapText(
            title,
            10.5,
            CONTENT_WIDTH - 108
          );

        const messageLines =
          wrapText(
            item.message,
            8.7,
            CONTENT_WIDTH - 34
          );

        const boxHeight =
          26 +
          titleLines.length *
          13 +
          messageLines.length *
          11 +
          12;

        ensureSpace(
          boxHeight + 10
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - boxHeight,
            CONTENT_WIDTH,
            boxHeight,
            palette.background,
            BORDER,
            0.5
          )
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - boxHeight,
            5,
            boxHeight,
            palette.accent
          )
        );

        const badgeWidth = 55;

        commands.push(
          rectCommand(
            PAGE_WIDTH -
            MARGIN -
            badgeWidth -
            10,
            y - 23,
            badgeWidth,
            16,
            palette.accent
          )
        );

        commands.push(
          textCommand(
            item.priority.toUpperCase(),
            PAGE_WIDTH -
            MARGIN -
            badgeWidth -
            10 +
            10,
            y - 18,
            7,
            true,
            [
              1,
              1,
              1,
            ]
          )
        );

        let innerY =
          y - 19;

        for (
          const line
          of titleLines
        ) {

          commands.push(
            textCommand(
              line,
              MARGIN + 14,
              innerY,
              10.5,
              true,
              TEXT
            )
          );

          innerY -= 13;
        }

        innerY -= 7;

        for (
          const line
          of messageLines
        ) {

          commands.push(
            textCommand(
              line,
              MARGIN + 14,
              innerY,
              8.7,
              false,
              [
                0.25,
                0.25,
                0.29,
              ]
            )
          );

          innerY -= 11;
        }

        y -=
          boxHeight +
          10;
      };


      // =================================================
      // PAGE 1
      // =================================================

      addPageHeader();


      // -------------------------------------------------
      // OVERVIEW CARDS
      // -------------------------------------------------

      const currentHealth =
        prediction.health_status ||
        healthLabel(
          currentSOH
        );

      const riskText =
        prediction.risk_level
          ? `${prediction.risk_level} risk`
          : "Not available";

      const twelveMonthSOH =
        toNumber(
          prediction.soh_12m
        );

      const currentAccent: PdfColor =
        currentSOH === null
          ? PURPLE
          : currentSOH >= 90
            ? GREEN
            : currentSOH >= 80
              ? AMBER
              : RED;

      const currentBg: PdfColor =
        currentSOH === null
          ? PURPLE_LIGHT
          : currentSOH >= 90
            ? GREEN_LIGHT
            : currentSOH >= 80
              ? AMBER_LIGHT
              : RED_LIGHT;

      const cardGap = 10;

      const cardWidth =
        (CONTENT_WIDTH -
          cardGap * 2) /
        3;

      addSummaryCard(
        MARGIN,
        cardWidth,
        "Current SOH",
        currentSOH === null
          ? "Unknown"
          : `${currentSOH.toFixed(
            1
          )}%`,
        currentAccent,
        currentBg
      );

      addSummaryCard(
        MARGIN +
        cardWidth +
        cardGap,
        cardWidth,
        "Current health",
        currentHealth,
        currentAccent,
        currentBg
      );

      const riskLower =
        String(
          prediction.risk_level ||
          ""
        ).toLowerCase();

      const riskAccent: PdfColor =
        riskLower.includes(
          "high"
        )
          ? RED
          : riskLower.includes(
            "medium"
          ) ||
            riskLower.includes(
              "moderate"
            )
            ? AMBER
            : riskLower.includes(
              "low"
            )
              ? GREEN
              : PURPLE;

      const riskBg: PdfColor =
        riskAccent === RED
          ? RED_LIGHT
          : riskAccent === AMBER
            ? AMBER_LIGHT
            : riskAccent === GREEN
              ? GREEN_LIGHT
              : PURPLE_LIGHT;

      addSummaryCard(
        MARGIN +
        (cardWidth +
          cardGap) *
        2,
        cardWidth,
        "12-month outlook",
        riskText,
        riskAccent,
        riskBg
      );

      y -= 82;

      addSectionTitle(
        "Vehicle & battery profile",
        "Key values submitted for this battery-health assessment."
      );

      commands.push(
        rectCommand(
          MARGIN,
          y - 120,
          CONTENT_WIDTH,
          120,
          SOFT_BG,
          BORDER,
          0.5
        )
      );

      const profileStartY = y - 16;

      let leftY =
        profileStartY;

      let rightY =
        profileStartY;

      const halfWidth =
        CONTENT_WIDTH /
        2 -
        20;

      const drawProfileItem = (
        x: number,
        currentY: number,
        label: string,
        value: string
      ) => {

        commands.push(
          textCommand(
            label.toUpperCase(),
            x,
            currentY,
            7,
            true,
            MUTED
          )
        );

        const lines =
          wrapText(
            value,
            9.5,
            halfWidth
          );

        let textY =
          currentY - 14;

        for (
          const line
          of lines.slice(
            0,
            2
          )
        ) {
          commands.push(
            textCommand(
              line,
              x,
              textY,
              9.5,
              true,
              TEXT
            )
          );

          textY -= 12;
        }

        return (
          currentY - 48
        );
      };


      leftY =
        drawProfileItem(
          MARGIN + 14,
          leftY,
          "Vehicle",
          hasVal(form.vehicleModel)
            ? form.vehicleModel!
            : "Not provided"
        );

      leftY =
        drawProfileItem(
          MARGIN + 14,
          leftY,
          "Battery age",
          hasVal(form.batteryAgeYears)
            ? `${form.batteryAgeYears} years`
            : hasVal(form.batteryAgeMonths)
              ? `${form.batteryAgeMonths} months`
              : "Not provided"
        );


      rightY =
        drawProfileItem(
          MARGIN +
          CONTENT_WIDTH /
          2 +
          8,
          rightY,
          "Battery pack voltage",
          hasVal(form.batteryPackVoltageV)
            ? `${form.batteryPackVoltageV} V`
            : hasVal(form.avgVoltage)
              ? `${form.avgVoltage} V`
              : "Not provided"
        );

      rightY =
        drawProfileItem(
          MARGIN +
          CONTENT_WIDTH /
          2 +
          8,
          rightY,
          "Battery temperature",
          hasVal(form.batteryTemperatureC)
            ? `${form.batteryTemperatureC} C`
            : hasVal(form.avgTemperature)
              ? `${form.avgTemperature} C`
              : "Not provided"
        );

      y -= 138;


      // -------------------------------------------------
      // FORECAST
      // -------------------------------------------------

      addSectionTitle(
        "SOH forecast",
        "Machine-learning forecast of future battery State of Health."
      );

      const forecastGap = 10;

      const forecastWidth =
        (CONTENT_WIDTH -
          forecastGap * 2) /
        3;

      addForecastCard(
        MARGIN,
        forecastWidth,
        "AFTER 3 MONTHS",
        toNumber(
          prediction.soh_3m
        ),
        prediction.degradation_3m
      );

      addForecastCard(
        MARGIN +
        forecastWidth +
        forecastGap,
        forecastWidth,
        "AFTER 6 MONTHS",
        toNumber(
          prediction.soh_6m
        ),
        prediction.degradation_6m
      );

      addForecastCard(
        MARGIN +
        (forecastWidth +
          forecastGap) *
        2,
        forecastWidth,
        "AFTER 12 MONTHS",
        twelveMonthSOH,
        prediction.degradation_12m
      );

      y -= 108;


      // -------------------------------------------------
      // -------------------------------------------------
      // TECHNICAL INPUTS
      // -------------------------------------------------

      addSectionTitle(
        "Prediction inputs",
        "Operational values supplied to the forecasting workflow."
      );

      const predictionInputRows = [
        [
          "Average charging current",
          hasVal(form.avgChargingCurrentA)
            ? `${form.avgChargingCurrentA} A`
            : hasVal(form.avgCurrent)
              ? `${form.avgCurrent} A`
              : "Not provided",
        ],
        [
          "Routine SOC charge window",
          hasVal(form.weeklyAvgSocStartPct) && hasVal(form.weeklyAvgSocEndPct)
            ? `${form.weeklyAvgSocStartPct}% - ${form.weeklyAvgSocEndPct}%`
            : hasVal(form.avgSocChange)
              ? `Change: ${form.avgSocChange}%`
              : "Not provided",
        ],
        [
          "Average charging duration",
          hasVal(form.weeklyAvgChargeDurationMin)
            ? `${form.weeklyAvgChargeDurationMin} min`
            : hasVal(form.avgChargeDuration)
              ? `${form.avgChargeDuration} min`
              : "Not provided",
        ],
        [
          "Weekly charging sessions",
          hasVal(form.weeklyChargeSessions)
            ? `${form.weeklyChargeSessions} sessions/week`
            : hasVal(form.chargingSessions)
              ? `${form.chargingSessions} sessions/week`
              : "Not provided",
        ],
        [
          "Weekly energy consumption",
          hasVal(form.weeklyEnergyConsumptionKwhPer100km)
            ? `${form.weeklyEnergyConsumptionKwhPer100km} kWh/100km`
            : "Not provided",
        ],
      ] as const;

      const predBoxHeight = 16 + predictionInputRows.length * 29;

      commands.push(
        rectCommand(
          MARGIN,
          y - predBoxHeight,
          CONTENT_WIDTH,
          predBoxHeight,
          [
            1,
            1,
            1,
          ],
          BORDER,
          0.5
        )
      );

      y -= 16;

      predictionInputRows.forEach((item) => {
        addInfoRow(item[0], item[1]);
      });

      y -= 7;


      ensureSpace(
        320
      );


      addSectionTitle(
        "Usage & charging profile",
        "Behavioural information used to tailor the battery-care recommendations."
      );

      const usageRows = [
        [
          "Vehicle model",
          hasVal(form.vehicleModel)
            ? form.vehicleModel!
            : "Not provided",
        ],
        [
          "Driving mode",
          hasVal(form.drivingMode)
            ? form.drivingMode!
            : hasVal(form.drivingStyle)
              ? form.drivingStyle!
              : "Not provided",
        ],
        [
          "Charging habit",
          hasVal(form.chargingHabit)
            ? form.chargingHabit!
            : "Not provided",
        ],
        [
          "Total odometer",
          hasVal(form.odometerKm)
            ? `${Number(form.odometerKm).toLocaleString()} km`
            : "Not provided",
        ],
        [
          "Battery nominal capacity",
          hasVal(form.batteryNominalCapacityKwh)
            ? `${form.batteryNominalCapacityKwh} kWh`
            : "Not provided",
        ],
        [
          "Nominal system voltage",
          hasVal(form.batteryNominalVoltageV)
            ? `${form.batteryNominalVoltageV} V`
            : "Not provided",
        ],
        [
          "Weekly driving distance",
          hasVal(form.weeklyDrivingDistanceKm)
            ? `${form.weeklyDrivingDistanceKm} km/week`
            : "Not provided",
        ],
        [
          "Weekly charging sessions",
          hasVal(form.weeklyChargeSessions)
            ? `${form.weeklyChargeSessions} sessions/week`
            : hasVal(form.chargingSessions)
              ? `${form.chargingSessions} sessions/week`
              : "Not provided",
        ],
        [
          "DC fast charging sessions",
          hasVal(form.dcFastChargingSessions)
            ? `${form.dcFastChargingSessions} sessions/week`
            : "Not provided",
        ],
        [
          "Fast charging fraction",
          hasVal(form.weeklyFastChargeFraction)
            ? `${form.weeklyFastChargeFraction}%`
            : "Not provided",
        ],
      ] as const;

      const usageBoxHeight = 16 + usageRows.length * 29;

      commands.push(
        rectCommand(
          MARGIN,
          y - usageBoxHeight,
          CONTENT_WIDTH,
          usageBoxHeight,
          SOFT_BG,
          BORDER,
          0.5
        )
      );

      y -= 16;

      usageRows.forEach(
        (
          item
        ) => {
          addInfoRow(
            item[0],
            item[1]
          );
        }
      );

      y -= 10;


      addSectionTitle(
        "Personalised recommendations",
        "Recommended actions based on current battery health, forecast results and submitted charging behaviour."
      );

      if (
        recommendations.length >
        0
      ) {

        recommendations.forEach(
          (
            item,
            index
          ) => {

            addRecommendation(
              item,
              index
            );
          }
        );

      } else {

        ensureSpace(65);

        commands.push(
          rectCommand(
            MARGIN,
            y - 54,
            CONTENT_WIDTH,
            54,
            GREEN_LIGHT,
            BORDER,
            0.5
          )
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - 54,
            5,
            54,
            GREEN
          )
        );

        commands.push(
          textCommand(
            "No additional battery-care alert",
            MARGIN + 14,
            y - 21,
            10,
            true,
            GREEN
          )
        );

        commands.push(
          textCommand(
            "Continue following the charging and driving practices recorded in this analysis.",
            MARGIN + 14,
            y - 38,
            8.5,
            false,
            TEXT
          )
        );

        y -= 68;
      }


      // -------------------------------------------------
      // DISCLAIMER
      // -------------------------------------------------

      ensureSpace(92);

      const disclaimer =
        "This forecast is a research decision-support estimate. It does not replace a manufacturer BMS diagnostic or professional EV service-centre inspection. For maintenance, warranty or safety decisions, confirm the battery condition with the vehicle manufacturer or a qualified EV technician.";

      const disclaimerLines =
        wrapText(
          disclaimer,
          8,
          CONTENT_WIDTH - 42
        );

      const noteHeight =
        34 +
        disclaimerLines.length *
        10;

      commands.push(
        rectCommand(
          MARGIN,
          y - noteHeight,
          CONTENT_WIDTH,
          noteHeight,
          PURPLE_LIGHT,
          [
            0.83,
            0.81,
            0.94,
          ],
          0.6
        )
      );

      commands.push(
        textCommand(
          "IMPORTANT",
          MARGIN + 14,
          y - 20,
          7,
          true,
          PURPLE
        )
      );

      let disclaimerY =
        y - 37;

      for (
        const line
        of disclaimerLines
      ) {

        commands.push(
          textCommand(
            line,
            MARGIN + 14,
            disclaimerY,
            8,
            false,
            TEXT
          )
        );

        disclaimerY -= 10;
      }

      y -=
        noteHeight +
        12;


      // Save the final active page.
      if (
        commands.length >
        0
      ) {
        pages.push(
          commands
        );
      }


      // -------------------------------------------------
      // PAGE DECORATION / FOOTER
      // -------------------------------------------------

      pages.forEach(
        (
          pageCommands,
          pageIndex
        ) => {

          // Small top brand marker on continuation pages.
          if (
            pageIndex >
            0
          ) {
            pageCommands.unshift(
              rectCommand(
                0,
                PAGE_HEIGHT - 14,
                PAGE_WIDTH,
                14,
                PURPLE_DARK
              )
            );
          }

          pageCommands.push(
            lineCommand(
              MARGIN,
              33,
              PAGE_WIDTH -
              MARGIN,
              33,
              [
                0.86,
                0.85,
                0.92,
              ],
              0.5
            )
          );

          pageCommands.push(
            textCommand(
              "EV Battery Health Decision Support System",
              MARGIN,
              19,
              7.3,
              true,
              PURPLE_DARK
            )
          );

          const pageText =
            `Page ${pageIndex + 1} of ${pages.length}`;

          const pageTextWidth =
            valueWidthApprox(
              pageText,
              7.3
            );

          pageCommands.push(
            textCommand(
              pageText,
              PAGE_WIDTH -
              MARGIN -
              pageTextWidth,
              19,
              7.3,
              false,
              MUTED
            )
          );
        }
      );


      // =================================================
      // BUILD VALID PDF
      // =================================================

      const encoder =
        new TextEncoder();


      const byteLength = (
        value: string
      ) =>
        encoder.encode(
          value
        ).length;


      const objectBodies:
        Record<
          number,
          string
        > = {};


      const pageObjectNumbers:
        number[] = [];


      const contentObjectNumbers:
        number[] = [];


      let nextObject = 5;


      pages.forEach(
        () => {

          pageObjectNumbers.push(
            nextObject++
          );

          contentObjectNumbers.push(
            nextObject++
          );
        }
      );


      objectBodies[1] =
        "<< /Type /Catalog /Pages 2 0 R >>";


      objectBodies[3] =
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";


      objectBodies[4] =
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";


      const kids =
        pageObjectNumbers
          .map(
            (
              objectNumber
            ) =>
              `${objectNumber} 0 R`
          )
          .join(" ");


      objectBodies[2] =
        `<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`;


      pages.forEach(
        (
          pageCommands,
          index
        ) => {

          const pageObject =
            pageObjectNumbers[
            index
            ];

          const contentObject =
            contentObjectNumbers[
            index
            ];

          const stream =
            pageCommands.join(
              "\n"
            );


          objectBodies[
            pageObject
          ] =
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`;


          objectBodies[
            contentObject
          ] =
            `<< /Length ${byteLength(
              stream
            )} >>\nstream\n${stream}\nendstream`;
        }
      );


      const totalObjects =
        nextObject - 1;


      let pdf =
        "%PDF-1.4\n";


      const offsets:
        number[] =
        new Array(
          totalObjects + 1
        ).fill(0);


      for (
        let objectNumber = 1;
        objectNumber <=
        totalObjects;
        objectNumber++
      ) {

        offsets[
          objectNumber
        ] =
          byteLength(
            pdf
          );

        pdf +=
          `${objectNumber} 0 obj\n${objectBodies[
          objectNumber
          ]}\nendobj\n`;
      }


      const xrefOffset =
        byteLength(
          pdf
        );


      pdf +=
        `xref\n0 ${totalObjects + 1}\n`;


      pdf +=
        "0000000000 65535 f \n";


      for (
        let objectNumber = 1;
        objectNumber <=
        totalObjects;
        objectNumber++
      ) {

        pdf +=
          `${String(
            offsets[
            objectNumber
            ]
          ).padStart(
            10,
            "0"
          )} 00000 n \n`;
      }


      pdf +=
        `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;


      // -------------------------------------------------
      // DIRECT DOWNLOAD
      // -------------------------------------------------

      const blob =
        new Blob(
          [
            encoder.encode(
              pdf
            ),
          ],
          {
            type:
              "application/pdf",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const anchor =
        document.createElement(
          "a"
        );


      const safeDate =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );


      anchor.href =
        url;

      anchor.download =
        `EV_Battery_Health_Report_${safeDate}.pdf`;


      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );


      setTimeout(
        () => {

          URL.revokeObjectURL(
            url
          );

        },
        1000
      );


      return;
    }


    const { uri } =
      await Print.printToFileAsync({
        html,
      });


    const sharingAvailable =
      await Sharing.isAvailableAsync();


    if (sharingAvailable) {

      await Sharing.shareAsync(
        uri,
        {
          mimeType: "application/pdf",
          dialogTitle: "Share battery health report",
        }
      );

    } else {

      Alert.alert(
        "Report created",
        `The PDF report was created successfully.\n${uri}`
      );
    }


  } catch (error) {

    console.error(
      "Report generation error:",
      error
    );

    Alert.alert(
      "Report error",
      "Unable to create the PDF report. Please try again."
    );

  } finally {

    setGenerating?.(false);
  }
}

export default generateBatteryReport;
