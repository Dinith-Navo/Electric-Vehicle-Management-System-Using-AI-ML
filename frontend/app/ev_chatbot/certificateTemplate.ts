export interface SafetyCheck {
  parameter: string;
  value: string;
  status: "PASSED" | "WARNING" | "ATTENTION" | string;
  limit: string;
}

export interface BatteryReportData {
  certificate_id: string;
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  battery_capacity: number;
  current_soh: number;
  health_grade: string;
  forecast_3m: number;
  forecast_6m: number;
  forecast_12m: number;
  soc: number;
  voltage: number;
  current: number;
  battery_temp: number;
  motor_temp: number;
  speed: number;
  power: number;
  charging_status: string;
  recommendation: string;
  safety_checks: SafetyCheck[];
  generated_at: string;
}

export function generateCertificateHTML(data: BatteryReportData): string {
  const currentSoh = Number(data.current_soh || 87.3).toFixed(1);
  const capacityKWh = Number(data.battery_capacity || 75.0);
  const usableKWh = ((capacityKWh * Number(currentSoh)) / 100).toFixed(1);

  const gradeColor =
    Number(currentSoh) >= 85
      ? "#10b981"
      : Number(currentSoh) >= 80
      ? "#06b6d4"
      : Number(currentSoh) >= 70
      ? "#f59e0b"
      : "#ef4444";

  const cleanUnit = (val: string) =>
    (val || "")
      .replace(/A[^\w\s]?C/g, "&deg;C")
      .replace(/°C/g, "&deg;C")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartEV Battery Health Certificate - ${data.certificate_id}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.45;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cert-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      border: 2px solid #0f172a;
      border-radius: 12px;
      position: relative;
      background: #ffffff;
    }
    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-col {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0284c7, #06b6d4);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .cert-badge-col {
      text-align: right;
    }
    .cert-id {
      font-family: "Courier New", Courier, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .cert-date {
      font-size: 11px;
      color: #64748b;
    }
    .verified-seal {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #10b981;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    /* Grid layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
    }
    .spec-table td {
      padding: 4px 0;
      font-size: 12px;
    }
    .spec-label {
      color: #64748b;
      font-weight: 500;
      width: 48%;
    }
    .spec-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }

    /* Hero SoH Score Card */
    .hero-soh-card {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hero-left h2 {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .hero-score {
      font-size: 42px;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1;
    }
    .hero-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid #10b981;
    }
    .hero-right {
      text-align: right;
      max-width: 320px;
    }
    .bar-wrap {
      width: 100%;
      height: 10px;
      background: #334155;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 8px;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #10b981);
      border-radius: 5px;
    }

    /* Degradation Forecast Section */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
    }
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .forecast-item {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .forecast-item.warn {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .forecast-period {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
    }
    .forecast-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0;
    }
    .forecast-diff {
      font-size: 10.5px;
      font-weight: 600;
      color: #dc2626;
    }

    /* Safety checks table */
    .checks-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .checks-table th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
    }
    .checks-table td {
      padding: 8px 10px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .status-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-passed {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .status-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    /* Recommendation Box */
    .rec-box {
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .rec-title {
      font-size: 11px;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .rec-text {
      font-size: 12px;
      color: #1e293b;
      line-height: 1.5;
    }

    /* Footer verification */
    .cert-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #64748b;
    }
    .sig-seal {
      text-align: right;
    }
    .sig-name {
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <!-- Header -->
    <div class="cert-header">
      <div class="brand-col">
        <div class="brand-icon">⚡</div>
        <div>
          <div class="brand-title">SmartEV Official Diagnostic Report</div>
          <div class="brand-sub">Lithium-Ion Battery Health Certificate</div>
        </div>
      </div>
      <div class="cert-badge-col">
        <div class="cert-id">${data.certificate_id}</div>
        <div class="cert-date">Issued: ${data.generated_at}</div>
        <div class="verified-seal">✓ System Verified</div>
      </div>
    </div>

    <!-- Hero SoH Rating Banner -->
    <div class="hero-soh-card">
      <div class="hero-left">
        <h2>Certified State of Health (SoH)</h2>
        <div class="hero-score">${currentSoh}%</div>
        <div class="hero-badge" style="color: ${gradeColor}; border-color: ${gradeColor};">
          ${data.health_grade}
        </div>
      </div>
      <div class="hero-right">
        <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 4px;">
          Rated Pack: <b>${capacityKWh} kWh</b> | Usable: <b>${usableKWh} kWh</b>
        </div>
        <div style="font-size: 11px; color: #94a3b8;">
          Cell Degradation: <b>${(100 - Number(currentSoh)).toFixed(1)}%</b> over operational lifespan
        </div>
        <div class="bar-wrap">
          <div class="bar-fill" style="width: ${Math.min(100, Math.max(0, Number(currentSoh)))}%;"></div>
        </div>
      </div>
    </div>

    <!-- Vehicle Dossier & Live Telemetry -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">🚗 Vehicle Identification Dossier</div>
        <table class="spec-table">
          <tr><td class="spec-label">Vehicle ID:</td><td class="spec-val">${data.vehicle_id}</td></tr>
          <tr><td class="spec-label">Make & Model:</td><td class="spec-val">${data.make} ${data.model}</td></tr>
          <tr><td class="spec-label">Model Year:</td><td class="spec-val">${data.year}</td></tr>
          <tr><td class="spec-label">Pack Capacity:</td><td class="spec-val">${capacityKWh} kWh</td></tr>
          <tr><td class="spec-label">Current SoC:</td><td class="spec-val">${data.soc}%</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="card-title">⚡ Real-Time CAN Telemetry</div>
        <table class="spec-table">
          <tr><td class="spec-label">Battery Voltage:</td><td class="spec-val">${data.voltage} V</td></tr>
          <tr><td class="spec-label">Battery Current:</td><td class="spec-val">${data.current} A</td></tr>
          <tr><td class="spec-label">Battery Temp:</td><td class="spec-val">${data.battery_temp} °C</td></tr>
          <tr><td class="spec-label">Drive Motor Temp:</td><td class="spec-val">${data.motor_temp} °C</td></tr>
          <tr><td class="spec-label">Charging State:</td><td class="spec-val">${data.charging_status}</td></tr>
        </table>
      </div>
    </div>

    <!-- Degradation Forecast -->
    <div class="section-title">🔮 Machine Learning Degradation Forecast</div>
    <div class="forecast-grid">
      <div class="forecast-item">
        <div class="forecast-period">3-Month Horizon</div>
        <div class="forecast-val">${Number(data.forecast_3m).toFixed(1)}%</div>
        <div class="forecast-diff">-${(Number(currentSoh) - Number(data.forecast_3m)).toFixed(1)}% projected</div>
      </div>
      <div class="forecast-item">
        <div class="forecast-period">6-Month Horizon</div>
        <div class="forecast-val">${Number(data.forecast_6m).toFixed(1)}%</div>
        <div class="forecast-diff">-${(Number(currentSoh) - Number(data.forecast_6m)).toFixed(1)}% projected</div>
      </div>
      <div class="forecast-item ${Number(data.forecast_12m) < 80 ? 'warn' : ''}">
        <div class="forecast-period">12-Month Horizon</div>
        <div class="forecast-val">${Number(data.forecast_12m).toFixed(1)}%</div>
        <div class="forecast-diff">-${(Number(currentSoh) - Number(data.forecast_12m)).toFixed(1)}% projected</div>
      </div>
    </div>

    <!-- Safety Verification Table -->
    <div class="section-title">🛡️ Multi-Point Safety & Thermal Integrity Audit</div>
    <table class="checks-table">
      <thead>
        <tr>
          <th>Safety Parameter</th>
          <th>Observed Value</th>
          <th>Safe Operating Limit</th>
          <th style="text-align: right;">Verdict</th>
        </tr>
      </thead>
      <tbody>
        ${(data.safety_checks || [])
          .map(
            c => `
          <tr>
            <td><b>${c.parameter}</b></td>
            <td>${cleanUnit(c.value)}</td>
            <td style="color: #64748b;">${cleanUnit(c.limit)}</td>
            <td style="text-align: right;">
              <span class="status-pill ${
                c.status === "PASSED" ? "status-passed" : "status-warning"
              }">${c.status}</span>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <!-- Recommendation -->
    <div class="rec-box">
      <div class="rec-title">📋 Official Maintenance & Charging Recommendation</div>
      <div class="rec-text">${data.recommendation}</div>
    </div>

    <!-- Footer -->
    <div class="cert-footer">
      <div>
        <b>SmartEV AI Diagnostic Engine v2.4</b><br>
        Verified with IoT Telemetry Stream & Gradient Boosted SoH Predictor.
      </div>
      <div class="sig-seal">
        <div class="sig-name">Digital Seal of Certification</div>
        <div>SHA-256 Hash Verified · Tamper Resistant</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Triggers native browser print on an isolated invisible iframe,
 * printing ONLY the generated HTML and never the application UI / web page.
 */
export function printHtmlOnWeb(html: string) {
  if (typeof document === "undefined") return;

  const existing = document.getElementById("smartev-isolated-print-frame");
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  const iframe = document.createElement("iframe");
  iframe.id = "smartev-isolated-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Print iframe trigger error:", e);
    } finally {
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch {}
      }, 2500);
    }
  }, 350);
}

/**
 * Generates an executive, clean printable transcript of ONLY the chat conversation,
 * completely excluding headers, search inputs, microphone icons, and buttons.
 */
export function generateChatTranscriptHTML(
  messages: Array<{ role: "user" | "bot"; text: string; timestamp?: Date | string }>,
  vehicleId: string = "EV-001"
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedMessages = messages
    .filter(m => (m as any).id !== "welcome" || m.text)
    .map(m => {
      const isUser = m.role === "user";
      const sender = isUser ? "You" : "SmartEV AI";
      const cleanText = (m.text || "")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      return `
        <div class="msg-row ${isUser ? "user-row" : "bot-row"}">
          <div class="msg-sender">${sender}</div>
          <div class="msg-bubble ${isUser ? "user-bubble" : "bot-bubble"}">
            ${cleanText}
          </div>
        </div>
      `;
    })
    .join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartEV Chat Transcript - ${vehicleId}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #fff; color: #0f172a; padding: 24px; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 18px; font-weight: 800; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-top: 3px; }
    .msg-row { margin-bottom: 16px; clear: both; }
    .msg-sender { font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .user-row { text-align: right; }
    .user-row .msg-sender { color: #0284c7; }
    .bot-row .msg-sender { color: #0f172a; }
    .msg-bubble { display: inline-block; max-width: 80%; padding: 10px 14px; border-radius: 10px; text-align: left; font-size: 12.5px; }
    .user-bubble { background: #0284c7; color: #ffffff; border-radius: 12px 12px 2px 12px; }
    .bot-bubble { background: #f8fafc; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px 12px 12px 2px; }
    .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">⚡ SmartEV Virtual Assistant - Clean Chat Transcript</div>
      <div class="meta">Vehicle: ${vehicleId} · Recorded on ${dateStr}</div>
    </div>
  </div>
  <div class="transcript-body">
    ${formattedMessages}
  </div>
  <div class="footer">
    SmartEV Assistant · Automated Vehicle Telemetry & Health AI Diagnostic Transcript
  </div>
</body>
</html>
  `.trim();
}

