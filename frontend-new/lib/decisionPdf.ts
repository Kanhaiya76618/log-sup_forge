/**
 * Client-side PDF Report Generator for FlowForge
 * Generates and downloads a clean, beautifully formatted Decision & Scenario Audit PDF.
 */

import { AnalysisResult } from '@/lib/types'

export interface DecisionPdfOptions {
  result: AnalysisResult
  decisionStatus: 'accepted' | 'paused' | 'abandoned'
  abandonmentReason?: string
  abandonmentReasonText?: string
  alternativeRoute?: string
  operatorName?: string
  operatorEmail?: string
  operatorRole?: string
  decisionId?: string
}

export function generateAndDownloadDecisionPdf(options: DecisionPdfOptions) {
  const {
    result,
    decisionStatus,
    abandonmentReason,
    abandonmentReasonText,
    alternativeRoute,
    operatorName = 'Alex Mercer',
    operatorEmail = 'alex.mercer@flowforge.internal',
    operatorRole = 'Operations VP',
    decisionId = `DEC-${Date.now().toString(36).toUpperCase()}`
  } = options

  const statusColor = 
    decisionStatus === 'accepted' ? '#34C759' :
    decisionStatus === 'paused' ? '#FF9F0A' : '#FF3B30'

  const statusTitle =
    decisionStatus === 'accepted' ? 'APPROVED & DISPATCHED' :
    decisionStatus === 'paused' ? 'EXECUTION PAUSED / ON HOLD' : 'PROPOSAL ABANDONED / SKIPPED'

  const route = result.recommendedRoute
  const scenario = result.scenarioInput
  const timestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' })

  // Construct printable HTML document
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FlowForge Decision Report - ${decisionId}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { color: #1d1d1f; background: #ffffff; line-height: 1.45; font-size: 11px; margin: 0; padding: 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087ef5; padding-bottom: 12px; margin-bottom: 15px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #1d1d1f; }
    .brand span { color: #087ef5; }
    .subtitle { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; color: #86868b; text-transform: uppercase; margin-top: 2px; }
    .doc-meta { text-align: right; font-size: 10px; color: #6e6e73; }
    .doc-meta strong { color: #1d1d1f; }
    
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #fff; background: ${statusColor}; }
    .decision-banner { background: #f5f5f7; border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
    .decision-banner h2 { margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: #1d1d1f; }
    .decision-banner p { margin: 0; font-size: 11px; color: #48484a; }

    .grid-2 { display: flex; gap: 14px; margin-bottom: 14px; }
    .card { flex: 1; border: 1px solid #d2d2d7; border-radius: 8px; padding: 12px; background: #fafafc; }
    .card h3 { margin: 0 0 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6e6e73; border-bottom: 1px solid #e5e5ea; padding-bottom: 4px; }
    
    .meta-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10.5px; }
    .meta-label { color: #86868b; }
    .meta-val { font-weight: 600; color: #1d1d1f; }

    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px 0; font-size: 10.5px; }
    th { background: #087ef5; color: #ffffff; text-align: left; padding: 6px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e5ea; }
    tr:nth-child(even) { background: #fbfbfd; }

    .highlight-box { background: #f0f7ff; border: 1px solid #cce3fe; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
    .highlight-box strong { color: #087ef5; }

    .footer { margin-top: 25px; border-top: 1px solid #e5e5ea; padding-top: 8px; font-size: 9px; color: #86868b; display: flex; justify-content: space-between; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">FLOW<span>FORGE</span></div>
      <div class="subtitle">Maritime Disruption OS &bull; Decision Audit Report</div>
    </div>
    <div class="doc-meta">
      <div>Report Ref: <strong>${decisionId}</strong></div>
      <div>Generated: <strong>${timestamp}</strong></div>
      <div>Scenario: <strong>${result.id}</strong></div>
    </div>
  </div>

  <div class="decision-banner">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <h2>Operator Decision: ${statusTitle}</h2>
      <span class="badge">${decisionStatus}</span>
    </div>
    <p>
      Logged by <strong>${operatorName}</strong> (${operatorRole} &bull; ${operatorEmail}).
      ${abandonmentReason ? `<br/><strong>Reason for Action:</strong> ${abandonmentReason.replace(/_/g, ' ').toUpperCase()} — <i>${abandonmentReasonText || 'No custom notes specified.'}</i>` : ''}
      ${alternativeRoute ? `<br/><strong>Alternative Route Directed:</strong> ${alternativeRoute}` : ''}
    </p>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3>1. Shipment & Vessel Profile</h3>
      <div class="meta-row"><span class="meta-label">Shipment Reference:</span><span class="meta-val">${scenario.shipmentId || result.id}</span></div>
      <div class="meta-row"><span class="meta-label">Assigned Vessel:</span><span class="meta-val">${scenario.vesselName}</span></div>
      <div class="meta-row"><span class="meta-label">Trade Corridor:</span><span class="meta-val">${result.affectedCorridor}</span></div>
      <div class="meta-row"><span class="meta-label">Origin &rarr; Destination:</span><span class="meta-val">${scenario.origin} &rarr; ${scenario.destination}</span></div>
      <div class="meta-row"><span class="meta-label">Transshipment Hub:</span><span class="meta-val">${scenario.transshipmentHub || 'Direct Corridor'}</span></div>
      <div class="meta-row"><span class="meta-label">Nominal Transit Time:</span><span class="meta-val">${scenario.scheduledTransitHours} Hours</span></div>
    </div>

    <div class="card">
      <h3>2. Weather & Incident Telemetry</h3>
      <div class="meta-row"><span class="meta-label">Disruption Category:</span><span class="meta-val">${scenario.disruption.type.replace(/_/g, ' ').toUpperCase()}</span></div>
      <div class="meta-row"><span class="meta-label">Disruption Severity:</span><span class="meta-val">${scenario.disruption.severity}% (Risk: ${result.riskLevel.toUpperCase()})</span></div>
      <div class="meta-row"><span class="meta-label">Affected Area / Chokepoint:</span><span class="meta-val">${scenario.disruption.affectedNode}</span></div>
      <div class="meta-row"><span class="meta-label">Wave Swell Amplitude:</span><span class="meta-val">${scenario.disruption.waveHeightMeters || 3.4} meters</span></div>
      <div class="meta-row"><span class="meta-label">Wind Gust Velocity:</span><span class="meta-val">${scenario.disruption.windSpeedKmh || 58} km/h</span></div>
      <div class="meta-row"><span class="meta-label">Unmitigated Slip:</span><span class="meta-val">+${scenario.disruption.predictedDelayHours || 52.8}h (+${result.predictedDelayDays}d)</span></div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px;">
    <h3>3. Multi-Objective Route Alternatives (OR-Tools Solver)</h3>
    <table>
      <thead>
        <tr>
          <th>Plan Option</th>
          <th>Corridor Strategy</th>
          <th>Voyage ETA Slip</th>
          <th>Financial Exposure</th>
          <th>Net Mitigated Savings</th>
          <th>SLA Confidence</th>
        </tr>
      </thead>
      <tbody>
        ${result.routeComparison.map(r => `
          <tr style="${r.recommended ? 'font-weight: bold; background: #eef6ff;' : ''}">
            <td>${r.name} ${r.recommended ? '<span style="color:#087ef5;">(AI Optimal)</span>' : ''}</td>
            <td>${r.pathSummary}</td>
            <td>+${r.delayVsSlaHours}h</td>
            <td>$${r.totalFinancialExposureUsd.toLocaleString()}</td>
            <td style="color:#34c759;">+$${r.savingsVsDoNothingUsd.toLocaleString()}</td>
            <td>${r.confidenceScore}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="highlight-box">
    <strong>Decision Impact & Adaptive Preference Learning:</strong><br/>
    This action was recorded in the FlowForge Decision Memory database. Future multi-objective routing optimization weights (Risk, ETA, Cost) have been dynamically adjusted for profile <strong>GLOBAL</strong> based on the human operator's choice.
  </div>

  <div class="footer">
    <span>FlowForge Autonomous Maritime Logistics Operating System</span>
    <span>CONFIDENTIAL &bull; FOR AUTHORIZED OPERATOR USE ONLY</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>
  `

  // Open iframe or print window to generate PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    // Give browser time to render styling before print dialog
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
