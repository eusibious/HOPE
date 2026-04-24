import { useRef } from "react";

/**
 * ClaimReceiptPDF Component
 *
 * Displays and allows printing/downloading a beneficiary claim receipt.
 * Receipt includes: campaign details, beneficiary info, amount, date, partner wallet, and tx hash.
 *
 * Props:
 *   - receipt: object with campaignAddress, campaignTitle, partnerName, partnerWallet,
 *             beneficiaryName, beneficiaryIdType, amount, amountFormatted, releaseDate, claimCode, txHash
 */
function ClaimReceiptPDF({ receipt }) {
  const receiptRef = useRef(null);

  if (!receipt) return null;

  const downloadReceipt = () => {
    if (!receiptRef.current) return;

    const element = receiptRef.current;
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>HOPE Beneficiary Claim Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1a202c;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 2px solid #1a202c;
              padding: 30px;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1a202c;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2d3748;
            }
            .subtitle {
              font-size: 12px;
              color: #4a5568;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              color: #1a202c;
              margin-bottom: 8px;
              border-bottom: 1px dashed #cbd5e0;
              padding-bottom: 5px;
            }
            .field {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 6px;
              word-wrap: break-word;
            }
            .field-label {
              font-weight: bold;
              color: #2d3748;
              min-width: 120px;
            }
            .field-value {
              text-align: right;
              color: #4a5568;
              word-break: break-all;
              max-width: 200px;
            }
            .amount-box {
              background: #f7fafc;
              border: 1px solid #cbd5e0;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
              border-radius: 4px;
            }
            .amount-value {
              font-size: 28px;
              font-weight: bold;
              color: #2d3748;
              font-family: Arial, sans-serif;
            }
            .amount-currency {
              font-size: 14px;
              color: #4a5568;
              font-family: Arial, sans-serif;
            }
            .divider {
              border-top: 2px dashed #cbd5e0;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #718096;
              margin-top: 20px;
              border-top: 1px solid #cbd5e0;
              padding-top: 15px;
            }
            .footer-note {
              margin-top: 10px;
              font-size: 9px;
              line-height: 1.4;
            }
            .qr-placeholder {
              text-align: center;
              margin: 15px 0;
              padding: 15px;
              background: #edf2f7;
              border: 1px dashed #cbd5e0;
            }
            .qr-placeholder-text {
              font-size: 10px;
              color: #4a5568;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .receipt {
                border: none;
                max-width: 100%;
              }
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
                <span class="field-value" style="font-size: 9px;">${receipt.campaignAddress}</span>
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
                <span class="field-value">${receipt.beneficiaryIdType.toUpperCase()}</span>
              </div>
              <div class="field">
                <span class="field-label">Claim Code:</span>
                <span class="field-value" style="font-weight: bold;">${receipt.claimCode}</span>
              </div>
            </div>

            <div class="amount-box">
              <div class="amount-currency">Amount Released</div>
              <div class="amount-value">\$${receipt.amountFormatted}</div>
              <div style="font-size: 9px; color: #718096; margin-top: 5px;">USDC Stablecoin</div>
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">Partner Information</div>
              <div class="field">
                <span class="field-label">Organization:</span>
                <span class="field-value">${receipt.partnerName}</span>
              </div>
              <div class="field">
                <span class="field-label">Wallet:</span>
                <span class="field-value" style="font-size: 8px;">${receipt.partnerWallet}</span>
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
                <span class="field-value" style="font-size: 8px;">${receipt.txHash}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="footer">
              <p style="margin: 0; font-weight: bold;">Official Receipt</p>
              <div class="footer-note">
                <p style="margin: 5px 0;">This receipt confirms that the beneficiary was verified and funds were released to the partner organization.</p>
                <p style="margin: 5px 0;">Partner is obligated to provide goods or cash of equivalent amount to the beneficiary.</p>
                <p style="margin: 5px 0;">Powered by HOPE - Blockchain-based Disaster Relief</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
          <div className="text-xs text-slate-600">Beneficiary Claim Receipt</div>
        </div>

        {/* Campaign Section */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Campaign Information
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Campaign:</span>
            <span>{receipt.campaignTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Address:</span>
            <span className="break-all text-xs">{receipt.campaignAddress}</span>
          </div>
        </div>

        {/* Beneficiary Section */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Beneficiary Details
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Name:</span>
            <span>{receipt.beneficiaryName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">ID Type:</span>
            <span>{receipt.beneficiaryIdType.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Claim Code:</span>
            <span className="font-bold">{receipt.claimCode}</span>
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
          <div className="font-semibold uppercase text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Partner Information
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Organization:</span>
            <span>{receipt.partnerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Wallet:</span>
            <span className="break-all text-xs">{receipt.partnerWallet}</span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold uppercase text-slate-900 border-b border-dashed border-slate-400 pb-1">
            Transaction Details
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Released On:</span>
            <span>{receipt.releaseDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">TX Hash:</span>
            <span className="break-all text-xs">{receipt.txHash}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-4"></div>

        {/* Footer */}
        <div className="text-center border-t border-slate-300 pt-3 text-xs text-slate-600 space-y-1">
          <p className="font-bold">Official Receipt</p>
          <p className="text-xs">
            This receipt confirms verification and fund release to partner organization.
          </p>
          <p className="text-xs">
            Partner is obligated to provide goods or cash of equivalent amount.
          </p>
          <p className="text-xs mt-2 font-semibold">HOPE - Blockchain-based Disaster Relief</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={downloadReceipt}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-2m-4-4V9m0 0H9m3 0h3"
            />
          </svg>
          Print
        </button>

        <button
          onClick={() => window.location.href = "javascript:window.print()"}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
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
