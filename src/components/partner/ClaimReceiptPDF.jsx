import { useRef } from "react";

/**
 * ClaimReceiptPDF Component
 *
 * Displays and allows printing/downloading a beneficiary claim receipt.
 *
 * Props:
 *   - receipt: object with campaignAddress, campaignTitle, partnerOrganization, partnerWallet,
 *             beneficiaryName, beneficiaryIdType, beneficiaryIdNumber, amount, amountFormatted,
 *             releaseDate, claimCode, txHash
 */

// Masks all but last 4 characters of an ID number
const maskId = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

// Builds the isolated receipt HTML string used for both Print and Download
const buildReceiptHTML = (receipt) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>HOPE Beneficiary Claim Receipt</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Courier New', monospace;
          background: white;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 20px;
        }
        .receipt {
          width: 420px;
          border: 2px solid #1a202c;
          padding: 30px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1a202c;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .logo { font-size: 22px; font-weight: bold; color: #2d3748; }
        .subtitle { font-size: 11px; color: #4a5568; margin-top: 4px; letter-spacing: 0.05em; }
        .section { margin-bottom: 16px; }
        .section-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #1a202c;
          margin-bottom: 8px;
          border-bottom: 1px dashed #cbd5e0;
          padding-bottom: 4px;
        }
        .field {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
          margin-bottom: 5px;
          gap: 8px;
        }
        .field-label { font-weight: bold; color: #2d3748; white-space: nowrap; }
        .field-value { text-align: right; color: #4a5568; word-break: break-all; }
        .amount-box {
          background: #f7fafc;
          border: 1px solid #cbd5e0;
          padding: 14px;
          text-align: center;
          margin: 16px 0;
          border-radius: 4px;
        }
        .amount-label { font-size: 11px; color: #718096; }
        .amount-value { font-size: 28px; font-weight: bold; color: #2d3748; font-family: Arial, sans-serif; margin: 4px 0; }
        .amount-currency { font-size: 11px; color: #718096; font-family: Arial, sans-serif; }
        .divider { border-top: 2px dashed #cbd5e0; margin: 16px 0; }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #718096;
          border-top: 1px solid #cbd5e0;
          padding-top: 14px;
          margin-top: 4px;
          line-height: 1.6;
        }
        .footer-bold { font-weight: bold; color: #2d3748; margin-bottom: 6px; }
        @media print {
          body { padding: 0; align-items: flex-start; }
          .receipt { border: none; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">

        <div class="header">
          <div class="logo">🤝 HOPE</div>
          <div class="subtitle">Beneficiary Claim Receipt</div>
        </div>

        <div class="section">
          <div class="section-title">Campaign Information</div>
          <div class="field">
            <span class="field-label">Campaign:</span>
            <span class="field-value">${receipt.campaignTitle}</span>
          </div>
          <div class="field">
            <span class="field-label">Address:</span>
            <span class="field-value" style="font-size:9px;">${receipt.campaignAddress}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Beneficiary Details</div>
          <div class="field">
            <span class="field-label">Name:</span>
            <span class="field-value">${receipt.beneficiaryName}</span>
          </div>
          <div class="field">
            <span class="field-label">ID Type:</span>
            <span class="field-value">${receipt.beneficiaryIdType?.toUpperCase()}</span>
          </div>
          <div class="field">
            <span class="field-label">ID Number:</span>
            <span class="field-value">${maskId(receipt.beneficiaryIdNumber)}</span>
          </div>
          <div class="field">
            <span class="field-label">Claim Code:</span>
            <span class="field-value" style="font-weight:bold;">${receipt.claimCode}</span>
          </div>
        </div>

        <div class="amount-box">
          <div class="amount-label">Amount Released</div>
          <div class="amount-value">$${receipt.amountFormatted}</div>
          <div class="amount-currency">USDC Stablecoin</div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="section-title">Partner Information</div>
          <div class="field">
            <span class="field-label">Organization:</span>
            <span class="field-value">${receipt.organizationName || receipt.partnerName || "-"}</span>
          </div>
          <div class="field">
            <span class="field-label">Wallet:</span>
            <span class="field-value" style="font-size:9px;">${receipt.partnerWallet}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="field">
            <span class="field-label">Released On:</span>
            <span class="field-value">${receipt.releaseDate}</span>
          </div>
          <div class="field">
            <span class="field-label">TX Hash:</span>
            <span class="field-value" style="font-size:9px;">${receipt.txHash}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div class="footer-bold">Official Receipt</div>
          <p>This receipt confirms verification and fund release to partner organization.</p>
          <p>Partner is obligated to provide goods or cash of equivalent amount.</p>
          <p style="margin-top:8px; font-weight:bold;">HOPE — Blockchain-based Disaster Relief</p>
        </div>

      </div>
    </body>
  </html>
`;

function ClaimReceiptPDF({ receipt }) {
  const receiptRef = useRef(null);

  if (!receipt) return null;

  // Opens the receipt in an isolated window and triggers the browser's print dialog.
  // Because the new window contains only the receipt HTML, print captures only the receipt.
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=520,height=800");
    printWindow.document.write(buildReceiptHTML(receipt));
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close after print dialog is dismissed (works in most browsers)
      printWindow.onafterprint = () => printWindow.close();
    }, 300);
  };

  // Downloads the receipt as an HTML file the user can open and print offline.
  const handleDownload = () => {
    const html = buildReceiptHTML(receipt);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HOPE-Receipt-${receipt.claimCode || "claim"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Claim Receipt</h2>
        <p className="text-sm text-slate-500 mt-1">
          Print this receipt to provide to the beneficiary. Partner must distribute equivalent cash or goods.
        </p>
      </div>

      {/* Receipt Preview */}
      <div
        ref={receiptRef}
        className="bg-white border border-slate-300 rounded-lg p-8 space-y-4 font-mono text-sm"
        style={{ fontFamily: '"Courier New", monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <div className="text-2xl font-bold">🤝 HOPE</div>
          <div className="text-xs text-slate-600 tracking-wide">Beneficiary Claim Receipt</div>
        </div>

        {/* Campaign Section */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase tracking-wide text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Campaign Information
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Campaign:</span>
            <span className="text-right">{receipt.campaignTitle}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Address:</span>
            <span className="break-all text-right" style={{ fontSize: "9px" }}>{receipt.campaignAddress}</span>
          </div>
        </div>

        {/* Beneficiary Section */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase tracking-wide text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Beneficiary Details
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Name:</span>
            <span className="text-right">{receipt.beneficiaryName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">ID Type:</span>
            <span className="text-right">{receipt.beneficiaryIdType?.toUpperCase()}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">ID Number:</span>
            <span className="text-right font-mono">{maskId(receipt.beneficiaryIdNumber)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Claim Code:</span>
            <span className="font-bold text-right">{receipt.claimCode}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="bg-slate-50 border border-slate-300 rounded p-4 text-center my-4">
          <div className="text-xs text-slate-600">Amount Released</div>
          <div className="text-3xl font-bold text-slate-900 my-1">${receipt.amountFormatted}</div>
          <div className="text-xs text-slate-600">USDC Stablecoin</div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-4"></div>

        {/* Partner Section */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase tracking-wide text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Partner Information
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Organization:</span>
            <span className="text-right">{receipt.part}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Wallet:</span>
            <span className="break-all text-right" style={{ fontSize: "9px" }}>{receipt.partnerWallet}</span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase tracking-wide text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Transaction Details
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">Released On:</span>
            <span className="text-right">{receipt.releaseDate}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold whitespace-nowrap">TX Hash:</span>
            <span className="break-all text-right" style={{ fontSize: "9px" }}>{receipt.txHash}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-4"></div>

        {/* Footer */}
        <div className="text-center border-t border-slate-300 pt-3 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900">Official Receipt</p>
          <p>This receipt confirms verification and fund release to partner organization.</p>
          <p>Partner is obligated to provide goods or cash of equivalent amount.</p>
          <p className="mt-2 font-semibold text-slate-800">HOPE — Blockchain-based Disaster Relief</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}

export default ClaimReceiptPDF;