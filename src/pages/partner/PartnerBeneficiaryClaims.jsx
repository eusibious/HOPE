import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import HOPECampaignABI from "../../abi/HOPECampaign.json";
import ClaimReceiptPDF from "../../components/partner/ClaimReceiptPDF";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const maskId = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

function PartnerBeneficiaryClaims() {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Campaign and chain state
  const [campaign, setCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [chainDetails, setChainDetails] = useState(null);

  // QR scanning and verification
  const [qrInput, setQrInput] = useState("");
  const [scannedBeneficiary, setScannedBeneficiary] = useState(null);
  const [verifyingQR, setVerifyingQR] = useState(false);

  // Verification state
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationPhotosReviewed, setVerificationPhotosReviewed] = useState(false);

  // Blockchain interaction
  const [approvingClaim, setApprovingClaim] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState("");

  // Success state
  const [claimReceipt, setClaimReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Load campaign data on mount
  useEffect(() => {
    const boot = async () => {
      if (!user?.uid || !campaignAddress) {
        setPageLoading(false);
        return;
      }

      try {
        // Get campaign from Firestore
        const campaignSnapshot = await db
          .collection("campaigns")
          .where("campaignAddress", "==", campaignAddress)
          .limit(1)
          .get();

        if (campaignSnapshot.empty) {
          setError("Campaign not found.");
          setPageLoading(false);
          return;
        }

        const campaignDoc = {
          id: campaignSnapshot.docs[0].id,
          ...campaignSnapshot.docs[0].data(),
        };

        setCampaign(campaignDoc);

        // Get on-chain details
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider);
          const details = await contract.getCampaignDetails();

          setChainDetails({
            partner: details._partner,
            isActive: details._isActive,
            beneficiariesLocked: details._beneficiariesLocked,
            raisedAmount: Number(details._raisedAmount),
            beneficiaryCount: Number(details._beneficiaryCount),
            claimedCount: Number(details._claimedCount),
            title: details._title,
            location: details._location,
          });
        }

        // Fetch campaign stats from backend
        if (backendUrl) {
          const idToken = await user.getIdToken();
          const statsResponse = await fetch(
            `${backendUrl}/api/claims/campaign/${campaignAddress}`,
            {
              headers: { Authorization: `Bearer ${idToken}` },
            }
          );

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setCampaignStats(statsData.campaign);
          }
        }
      } catch (err) {
        console.error("Failed to load claims page:", err);
        setError(err?.message || "Failed to load campaign.");
      } finally {
        setPageLoading(false);
      }
    };

    boot();

    return () => stopCamera();
  }, [user?.uid, campaignAddress]);

  // Start camera for QR scanning
  const startCamera = async () => {
    clearMessages();
    try {
      setCameraLoading(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      setError(err?.message || "Failed to access camera.");
    } finally {
      setCameraLoading(false);
    }
  };

  // Handle QR input change (manual entry fallback)
  const handleQRInputChange = (e) => {
    setQrInput(e.target.value);
    clearMessages();
  };

  // Verify QR with backend
  const verifyQRCode = async () => {
    clearMessages();

    if (!qrInput.trim()) {
      setError("Please enter or scan a QR code.");
      return;
    }

    // Extract claim hash from QR payload (format: HOPE|campaignAddr|claimHash|claimCode)
    let claimHash = qrInput.trim();

    if (qrInput.includes("|")) {
      const parts = qrInput.split("|");
      if (parts.length === 4) {
        claimHash = parts[2]; // claimHash is the 3rd part
      }
    }

    if (!claimHash.startsWith("0x")) {
      setError("Invalid QR code or claim hash format.");
      return;
    }

    try {
      setVerifyingQR(true);
      const idToken = await user.getIdToken();

      const response = await fetch(`${backendUrl}/api/claims/verify-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress,
          claimHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "QR verification failed.");
      }

      setScannedBeneficiary({
        ...data.beneficiary,
        campaignInfo: data.campaign,
      });

      setQrInput("");
      stopCamera();
      setSuccess("Beneficiary verified. Please review the details below.");
    } catch (err) {
      console.error("QR verification failed:", err);
      setError(err?.message || "QR verification failed.");
    } finally {
      setVerifyingQR(false);
    }
  };

  // Approve claim on blockchain
  const handleApproveClaim = async () => {
    clearMessages();

    if (!verificationComplete) {
      setError("Please complete verification before approving.");
      return;
    }

    if (!verificationPhotosReviewed) {
      setError("Please confirm you have reviewed all photos.");
      return;
    }

    if (!scannedBeneficiary) {
      setError("No beneficiary to claim.");
      return;
    }

    try {
      setApprovingClaim(true);

      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, signer);

      // Call claimFunds(claimHash) on blockchain
      const tx = await contract.claimFunds(scannedBeneficiary.claimHash);
      const receipt = await tx.wait();

      const txHash = receipt.hash;
      setClaimTxHash(txHash);
      setSuccess("Claim approved on blockchain! Processing receipt...");

      // Send claim to backend for Firestore update and receipt generation
      const idToken = await user.getIdToken();
      const claimResponse = await fetch(`${backendUrl}/api/claims/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress,
          claimHash: scannedBeneficiary.claimHash,
          txHash,
        }),
      });

      const claimData = await claimResponse.json();

      if (!claimResponse.ok) {
        throw new Error(claimData.message || claimData.error || "Claim processing failed.");
      }

      setClaimReceipt(claimData.receipt);
      setShowReceipt(true);
      setSuccess("Claim completed successfully!");

      // Reset form
      setTimeout(() => {
        setScannedBeneficiary(null);
        setVerificationComplete(false);
        setVerificationPhotosReviewed(false);
        setVerificationNotes("");
      }, 2000);
    } catch (err) {
      console.error("Claim approval failed:", err);
      setError(err?.message || "Claim approval failed.");
    } finally {
      setApprovingClaim(false);
    }
  };

  const handleCancel = () => {
    setScannedBeneficiary(null);
    setVerificationComplete(false);
    setVerificationPhotosReviewed(false);
    setVerificationNotes("");
    clearMessages();
  };

  if (pageLoading) {
    return <div className="p-6 max-w-6xl mx-auto">Loading claims page...</div>;
  }

  if (error && !campaign) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beneficiary Claims</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign?.title || chainDetails?.title || "—"}
            {campaign?.location || chainDetails?.location
              ? ` — ${campaign?.location || chainDetails?.location}`
              : ""}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono break-all">{campaignAddress}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Scanner Section */}
          {!scannedBeneficiary && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Scan Beneficiary QR Code</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Use your phone camera to scan the beneficiary's QR code, or enter it manually.
                </p>
              </div>

              {/* Camera Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Camera Scanner</h3>
                  {!cameraOpen && (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cameraLoading}
                      className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {cameraLoading ? "Opening..." : "Open Camera"}
                    </button>
                  )}
                </div>

                {cameraOpen && (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-80 rounded-xl bg-black object-cover"
                    />
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm w-full"
                    >
                      Close Camera
                    </button>
                    <p className="text-xs text-slate-500 text-center">
                      Point camera at QR code. Scanning will auto-detect.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Entry */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Manual Entry</h3>
                <input
                  type="text"
                  placeholder="Paste QR payload or claim hash..."
                  value={qrInput}
                  onChange={handleQRInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                />
                <button
                  onClick={verifyQRCode}
                  disabled={verifyingQR || !qrInput.trim()}
                  className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {verifyingQR ? "Verifying..." : "Verify QR Code"}
                </button>
              </div>
            </div>
          )}

          {/* Beneficiary Details Section */}
          {scannedBeneficiary && (
            <>
              {/* Beneficiary Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Beneficiary Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {scannedBeneficiary.fullName}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {scannedBeneficiary.age} years
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="text-sm font-medium text-slate-900 mt-1 capitalize">
                      {scannedBeneficiary.gender}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">ID Type</p>
                    <p className="text-sm font-medium text-slate-900 mt-1 uppercase">
                      {scannedBeneficiary.idType}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 md:col-span-2">
                    <p className="text-xs text-slate-500">ID Number</p>
                    <p className="text-sm font-medium text-slate-900 mt-1 font-mono">
                      {maskId(scannedBeneficiary.idNumber)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-slate-600 mb-3">Claim Details</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <p>
                      <span className="text-slate-600">Claim Code:</span>
                      <code className="ml-2 font-mono bg-slate-100 px-2 py-1 rounded">
                        {scannedBeneficiary.claimCode}
                      </code>
                    </p>
                    <p className="text-slate-500 break-all">
                      <span className="text-slate-600">Claim Hash:</span>
                      <code className="ml-2 font-mono text-xs">{scannedBeneficiary.claimHash}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo Review */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Photo Verification</h2>
                <p className="text-sm text-slate-500">
                  Review all three photos to verify beneficiary identity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={scannedBeneficiary.photoUrls.selfie}
                      alt="Beneficiary selfie"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-xs text-slate-600 p-2 bg-slate-50 text-center">Selfie</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={scannedBeneficiary.photoUrls.idFront}
                      alt="ID front"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-xs text-slate-600 p-2 bg-slate-50 text-center">ID Front</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={scannedBeneficiary.photoUrls.idBack}
                      alt="ID back"
                      className="w-full h-48 object-cover"
                    />
                    <p className="text-xs text-slate-600 p-2 bg-slate-50 text-center">ID Back</p>
                  </div>
                </div>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={verificationPhotosReviewed}
                    onChange={(e) => setVerificationPhotosReviewed(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    I have reviewed all photos and confirmed this is the correct beneficiary.
                  </span>
                </label>
              </div>

              {/* Verification Notes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">Verification Notes</h2>

                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Optional: Add any verification notes (e.g., 'Verified against Aadhaar in person')"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
                  rows="3"
                />

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={verificationComplete}
                    onChange={(e) => setVerificationComplete(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    I verify that the information above is correct and the beneficiary is eligible to claim.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleApproveClaim}
                  disabled={
                    approvingClaim ||
                    !verificationComplete ||
                    !verificationPhotosReviewed
                  }
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {approvingClaim ? "Processing..." : "Approve & Release Funds"}
                </button>
              </div>
            </>
          )}

          {/* Receipt Display */}
          {showReceipt && claimReceipt && (
            <ClaimReceiptPDF receipt={claimReceipt} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Campaign Summary</h2>

            {campaignStats ? (
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium">Total Raised:</span>
                  <span className="ml-2 text-slate-900">${campaignStats.raisedAmountFormatted}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Per Beneficiary:</span>
                  <span className="ml-2 text-slate-900">${campaignStats.sharePerBeneficiaryFormatted}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Total Beneficiaries:</span>
                  <span className="ml-2 text-slate-900">{campaignStats.beneficiaryCount}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Already Claimed:</span>
                  <span className="ml-2 text-slate-900">{campaignStats.claimedCount}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Pending:</span>
                  <span className="ml-2 text-slate-900">{campaignStats.pendingCount}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading stats...</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Campaign Status</h2>

            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-medium">Active:</span>
                <span className={`ml-2 ${chainDetails?.isActive ? "text-green-700" : "text-red-700"}`}>
                  {chainDetails?.isActive ? "Yes" : "No"}
                </span>
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Locked:</span>
                <span className={`ml-2 ${chainDetails?.beneficiariesLocked ? "text-green-700" : "text-amber-700"}`}>
                  {chainDetails?.beneficiariesLocked ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-blue-900">Tips</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Verify all photos match the beneficiary in front of you</li>
              <li>• Check ID number masked with full ID document</li>
              <li>• Add notes about verification method used</li>
              <li>• Provide receipt after approval</li>
              <li>• One claim per beneficiary only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerBeneficiaryClaims;
