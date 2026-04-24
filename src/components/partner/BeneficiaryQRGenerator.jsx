import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

function BeneficiaryQRGenerator({
  beneficiaryName,
  campaignAddress,
  campaignTitle,
  claimHash,
  claimCode,
  qrPayload,
}) {
  const qrRef = useRef(null);

  if (!qrPayload) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        No QR data available. Please complete beneficiary registration first.
      </div>
    );
  }

  const drawReceiptToCanvas = async () => {
    const qrCanvas = qrRef.current;
    if (!qrCanvas) {
      throw new Error("QR canvas not found.");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = 900;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // border card
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // title
    ctx.fillStyle = "#111827";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HOPE Beneficiary Claim", width / 2, 110);

    // subtitle
    ctx.fillStyle = "#4b5563";
    ctx.font = "24px sans-serif";
    ctx.fillText("Present this receipt during claim processing", width / 2, 155);

    // QR
    const qrSize = 360;
    const qrX = (width - qrSize) / 2;
    const qrY = 210;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // claim code label
    ctx.fillStyle = "#6b7280";
    ctx.font = "24px sans-serif";
    ctx.fillText("Claim Code", width / 2, 650);

    // claim code
    ctx.fillStyle = "#111827";
    ctx.font = "bold 54px monospace";
    ctx.fillText(claimCode || "—", width / 2, 720);

    // info block
    ctx.textAlign = "left";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Beneficiary Name:", 100, 820);

    ctx.font = "28px sans-serif";
    ctx.fillText(beneficiaryName || "—", 360, 820);

    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Campaign Name:", 100, 890);

    ctx.font = "28px sans-serif";
    wrapText(ctx, campaignTitle || "—", 360, 890, 430, 36);

    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Campaign Address:", 100, 1010);

    ctx.font = "24px monospace";
    wrapText(ctx, campaignAddress || "—", 100, 1055, 700, 34);

    // footer
    ctx.fillStyle = "#6b7280";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Keep this receipt safe. QR and claim code are both valid for verification.", width / 2, 1140);

    return canvas;
  };

  const handleDownloadQR = async () => {
    try {
      const receiptCanvas = await drawReceiptToCanvas();
      const link = document.createElement("a");
      link.href = receiptCanvas.toDataURL("image/png");
      link.download = `${sanitizeFileName(beneficiaryName || "beneficiary")}-${claimCode || "claim"}.png`;
      link.click();
    } catch (error) {
      console.error("QR download failed:", error);
      alert("Failed to download QR receipt.");
    }
  };

  const handlePrint = async () => {
    try {
      const receiptCanvas = await drawReceiptToCanvas();
      const dataUrl = receiptCanvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (!printWindow) {
        throw new Error("Unable to open print window.");
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>HOPE Beneficiary QR Receipt</title>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                background: white;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              @media print {
                html, body {
                  margin: 0;
                  padding: 0;
                }
                .wrapper {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <img src="${dataUrl}" alt="Beneficiary QR Receipt" />
            </div>
            <script>
              window.onload = function () {
                window.focus();
                window.print();
                window.onafterprint = function () {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("QR print failed:", error);
      alert("Failed to print QR receipt.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Beneficiary QR Code
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Print or download the QR receipt for beneficiary claim processing.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 py-6 px-4 bg-slate-50 rounded-xl">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <QRCodeCanvas
              ref={qrRef}
              value={qrPayload}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">Claim code (backup):</p>
            <code className="block text-2xl font-bold text-slate-900 tracking-widest">
              {claimCode}
            </code>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {beneficiaryName || "—"}
            </p>
            <p className="text-xs text-slate-500">
              {campaignTitle || "—"}
            </p>
            <p className="text-xs font-mono text-slate-400 break-all max-w-md">
              {campaignAddress || "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Print QR Code
          </button>
          <button
            onClick={handleDownloadQR}
            className="rounded-lg border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Download Image
          </button>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2 text-sm">
          <p className="font-medium text-blue-900">How to use this QR code:</p>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>• Print this receipt or save the image</li>
            <li>• Give it to the beneficiary</li>
            <li>• During claim, scan the QR code</li>
            <li>• If QR fails, use claim code: {claimCode}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, currentY);
}

function sanitizeFileName(value) {
  return String(value || "file")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

export default BeneficiaryQRGenerator;