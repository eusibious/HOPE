import { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import HOPECampaignABI from "../../abi/HOPECampaign.json";
import BeneficiaryQRGenerator from "../../components/partner/BeneficiaryQRGenerator";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const initialForm = {
  fullName: "",
  age: "",
  gender: "",
  idType: "",
  idNumber: "",
};

const maskId = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

function PartnerBeneficiaryRegister() {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [campaign, setCampaign] = useState(null);
  const [chainDetails, setChainDetails] = useState(null);

  const [form, setForm] = useState(initialForm);
  
  // Photo state: track which type being captured (selfie, id-front, id-back)
  const [photoCaptures, setPhotoCaptures] = useState({
    selfie: { blob: null, preview: "", cloudinaryUrl: "" },
    idFront: { blob: null, preview: "", cloudinaryUrl: "" },
    idBack: { blob: null, preview: "", cloudinaryUrl: "" },
  });
  const [currentPhotoType, setCurrentPhotoType] = useState(null); // 'selfie' | 'id-front' | 'id-back'

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftBeneficiaries, setDraftBeneficiaries] = useState([]);
  const [lastDraftResult, setLastDraftResult] = useState(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const resetCapturedPhoto = (photoType) => {
    const capture = photoCaptures[photoType];
    if (capture?.preview) {
      URL.revokeObjectURL(capture.preview);
    }
    setPhotoCaptures((prev) => ({
      ...prev,
      [photoType]: { blob: null, preview: "", cloudinaryUrl: "" },
    }));
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchBeneficiaries = async () => {
    if (!user || !campaignAddress || !backendUrl) return;

    try {
      setRefreshingList(true);
      const idToken = await user.getIdToken();

      const response = await fetch(`${backendUrl}/api/beneficiaries/${campaignAddress}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to load beneficiaries.");
      }

      setDraftBeneficiaries(Array.isArray(data.beneficiaries) ? data.beneficiaries : []);
    } catch (err) {
      console.error("Failed to fetch beneficiaries:", err);
    } finally {
      setRefreshingList(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      if (!user?.uid || !campaignAddress) {
        setPageLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, "campaigns"), where("campaignAddress", "==", campaignAddress))
        );

        if (snapshot.empty) {
          setError("Campaign not found.");
          setPageLoading(false);
          return;
        }

        const campaignDoc = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };

        if (campaignDoc.partnerUid !== user.uid) {
          setError("You do not own this campaign.");
          setPageLoading(false);
          return;
        }

        setCampaign(campaignDoc);

        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider);
          const details = await contract.getCampaignDetails();

          setChainDetails({
            partner: details._partner,
            isActive: details._isActive,
            beneficiariesLocked: details._beneficiariesLocked,
            beneficiaryCount: Number(details._beneficiaryCount),
            claimedCount: Number(details._claimedCount),
            title: details._title,
            location: details._location,
          });
        }

        await fetchBeneficiaries();
      } catch (err) {
        console.error("Failed to load register page:", err);
        setError(err?.message || "Failed to load campaign.");
      } finally {
        setPageLoading(false);
      }
    };

    boot();

    return () => stopCamera();
  }, [user?.uid, campaignAddress]);

  useEffect(() => {
    if (!cameraOpen || !streamRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    video.srcObject = streamRef.current;

    const onReady = () => video.play().catch(() => {});
    video.addEventListener("loadedmetadata", onReady);

    return () => {
      video.removeEventListener("loadedmetadata", onReady);
    };
  }, [cameraOpen]);

  const startCamera = async (photoType) => {
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
      setCurrentPhotoType(photoType);
      setCameraOpen(true);
    } catch (err) {
      setError(err?.message || "Failed to access camera.");
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error("Camera is not ready.");
      }

      const video = videoRef.current;

      if (video.readyState < 2) {
        throw new Error("Video stream not ready yet. Please wait a moment.");
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
      });

      if (!blob) throw new Error("Failed to capture photo.");

      const preview = URL.createObjectURL(blob);
      setPhotoCaptures((prev) => ({
        ...prev,
        [currentPhotoType]: { blob, preview, cloudinaryUrl: "" },
      }));
      stopCamera();
    } catch (err) {
      setError(err?.message || "Failed to capture photo.");
    }
  };

  const uploadToCloudinary = async (blob, fileName) => {
    if (!cloudName) {
      throw new Error("VITE_CLOUDINARY_CLOUD_NAME is not set.");
    }

    if (!uploadPreset) {
      throw new Error("VITE_CLOUDINARY_UPLOAD_PRESET is not set.");
    }

    const file = new File([blob], fileName, { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: { message: "Unexpected Cloudinary response." } };

    if (!response.ok) {
      throw new Error(data?.error?.message || "Cloudinary upload failed.");
    }

    if (!data?.secure_url) {
      throw new Error("Cloudinary upload succeeded but no URL was returned.");
    }

    return data.secure_url;
  };

  const validateForm = () => {
    if (!campaign) {
      setError("Campaign not found.");
      return false;
    }

    if (!chainDetails?.isActive) {
      setError("Campaign is not active on-chain.");
      return false;
    }

    if (chainDetails?.beneficiariesLocked) {
      setError("Beneficiary registration is already closed.");
      return false;
    }

    if (!String(form.fullName || "").trim()) {
      setError("Full name is required.");
      return false;
    }

    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      setError("Age must be a whole number between 0 and 120.");
      return false;
    }

    if (!["male", "female", "other"].includes(String(form.gender || "").trim().toLowerCase())) {
      setError("Select a valid gender.");
      return false;
    }

    if (!String(form.idType || "").trim()) {
      setError("ID type is required.");
      return false;
    }

    if (!String(form.idNumber || "").trim()) {
      setError("ID number is required.");
      return false;
    }

    // Validate all three photos are captured
    if (!photoCaptures.selfie.blob && !photoCaptures.selfie.cloudinaryUrl) {
      setError("Beneficiary selfie photo is required.");
      return false;
    }

    if (!photoCaptures.idFront.blob && !photoCaptures.idFront.cloudinaryUrl) {
      setError("ID front photo is required.");
      return false;
    }

    if (!photoCaptures.idBack.blob && !photoCaptures.idBack.cloudinaryUrl) {
      setError("ID back photo is required.");
      return false;
    }

    return true;
  };

  const handleDraftRegister = async () => {
    clearMessages();
    setLastDraftResult(null);

    if (!validateForm()) return;

    if (!backendUrl) {
      setError("VITE_BACKEND_URL is not configured.");
      return;
    }

    try {
      setSubmitting(true);
      setPhotoUploading(true);

      // Upload photos that haven't been uploaded yet
      const photoUrls = { ...photoCaptures };

      if (photoCaptures.selfie.blob && !photoCaptures.selfie.cloudinaryUrl) {
        photoUrls.selfie.cloudinaryUrl = await uploadToCloudinary(
          photoCaptures.selfie.blob,
          `${campaignAddress}-${Date.now()}-selfie.jpg`
        );
      }

      if (photoCaptures.idFront.blob && !photoCaptures.idFront.cloudinaryUrl) {
        photoUrls.idFront.cloudinaryUrl = await uploadToCloudinary(
          photoCaptures.idFront.blob,
          `${campaignAddress}-${Date.now()}-id-front.jpg`
        );
      }

      if (photoCaptures.idBack.blob && !photoCaptures.idBack.cloudinaryUrl) {
        photoUrls.idBack.cloudinaryUrl = await uploadToCloudinary(
          photoCaptures.idBack.blob,
          `${campaignAddress}-${Date.now()}-id-back.jpg`
        );
      }

      setPhotoCaptures(photoUrls);
      setPhotoUploading(false);

      const idToken = await user.getIdToken();

      const response = await fetch(`${backendUrl}/api/beneficiaries/register-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress,
          fullName: form.fullName.trim(),
          age: Number(form.age),
          gender: form.gender.trim().toLowerCase(),
          idType: form.idType.trim().toLowerCase(),
          idNumber: form.idNumber.trim(),
          photoUrls: {
            selfie: photoUrls.selfie.cloudinaryUrl,
            idFront: photoUrls.idFront.cloudinaryUrl,
            idBack: photoUrls.idBack.cloudinaryUrl,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Draft registration failed.");
      }

      setSuccess("Beneficiary draft registered successfully.");
      setLastDraftResult({
        ...data,
        beneficiaryName: form.fullName.trim(),
      });
      setForm(initialForm);
      setPhotoCaptures({
        selfie: { blob: null, preview: "", cloudinaryUrl: "" },
        idFront: { blob: null, preview: "", cloudinaryUrl: "" },
        idBack: { blob: null, preview: "", cloudinaryUrl: "" },
      });
      await fetchBeneficiaries();
    } catch (err) {
      console.error("Draft registration failed:", err);
      setError(err?.message || "Draft registration failed.");
    } finally {
      setPhotoUploading(false);
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return <div className="p-6 max-w-6xl mx-auto">Loading beneficiary registration...</div>;
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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register Beneficiary</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign?.title || chainDetails?.title || "—"}
            {campaign?.location || chainDetails?.location
              ? ` — ${campaign?.location || chainDetails?.location}`
              : ""}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono break-all">{campaignAddress}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/partner/campaigns/${campaignAddress}/beneficiaries`}
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Registered Beneficiaries
          </Link>
        </div>
      </div>

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
        <div className="lg:col-span-2 space-y-6">
          {/* Beneficiary Information Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Beneficiary Information</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter beneficiary details and capture required photos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                type="number"
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select
                value={form.idType}
                onChange={(e) => setForm((prev) => ({ ...prev, idType: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="">Select ID type</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="voter-id">Voter ID</option>
                <option value="ration-card">Ration Card</option>
                <option value="passport">Passport</option>
                <option value="driving-license">Driving License</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                placeholder="ID number"
                value={form.idNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
              />
            </div>
          </div>

          {/* Photo Capture Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Photo Documentation</h2>
              <p className="text-sm text-slate-500 mt-1">
                Capture 3 photos: beneficiary selfie and ID front/back. Photos are uploaded to Cloudinary.
              </p>
            </div>

            {/* Selfie Photo */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Beneficiary Selfie</h3>
                  <p className="text-xs text-slate-500 mt-1">Live photo of beneficiary's face</p>
                </div>

                <div className="flex gap-2">
                  {!cameraOpen && currentPhotoType !== "selfie" && (
                    <button
                      type="button"
                      onClick={() => startCamera("selfie")}
                      disabled={cameraLoading}
                      className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {cameraLoading ? "Opening..." : "Capture"}
                    </button>
                  )}

                  {photoCaptures.selfie.preview && (
                    <button
                      type="button"
                      onClick={() => resetCapturedPhoto("selfie")}
                      className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-sm"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>

              {cameraOpen && currentPhotoType === "selfie" && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-80 rounded-xl bg-black object-cover"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {photoCaptures.selfie.preview && (
                <div className="space-y-2">
                  <img
                    src={photoCaptures.selfie.preview}
                    alt="Captured selfie"
                    className="w-full max-h-80 rounded-xl object-cover border border-slate-200"
                  />
                  <p className="text-xs text-slate-500">Photo captured and ready for upload.</p>
                </div>
              )}

              {photoCaptures.selfie.cloudinaryUrl && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                  ✓ Selfie uploaded
                </div>
              )}
            </div>

            {/* ID Front Photo */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ID Front</h3>
                  <p className="text-xs text-slate-500 mt-1">Front side of ID document</p>
                </div>

                <div className="flex gap-2">
                  {!cameraOpen && currentPhotoType !== "idFront" && (
                    <button
                      type="button"
                      onClick={() => startCamera("idFront")}
                      disabled={cameraLoading}
                      className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {cameraLoading ? "Opening..." : "Capture"}
                    </button>
                  )}

                  {photoCaptures.idFront.preview && (
                    <button
                      type="button"
                      onClick={() => resetCapturedPhoto("idFront")}
                      className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-sm"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>

              {cameraOpen && currentPhotoType === "idFront" && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-80 rounded-xl bg-black object-cover"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {photoCaptures.idFront.preview && (
                <div className="space-y-2">
                  <img
                    src={photoCaptures.idFront.preview}
                    alt="Captured ID front"
                    className="w-full max-h-80 rounded-xl object-cover border border-slate-200"
                  />
                  <p className="text-xs text-slate-500">Photo captured and ready for upload.</p>
                </div>
              )}

              {photoCaptures.idFront.cloudinaryUrl && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                  ✓ ID front uploaded
                </div>
              )}
            </div>

            {/* ID Back Photo */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ID Back</h3>
                  <p className="text-xs text-slate-500 mt-1">Back side of ID document</p>
                </div>

                <div className="flex gap-2">
                  {!cameraOpen && currentPhotoType !== "idBack" && (
                    <button
                      type="button"
                      onClick={() => startCamera("idBack")}
                      disabled={cameraLoading}
                      className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                      {cameraLoading ? "Opening..." : "Capture"}
                    </button>
                  )}

                  {photoCaptures.idBack.preview && (
                    <button
                      type="button"
                      onClick={() => resetCapturedPhoto("idBack")}
                      className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-sm"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>

              {cameraOpen && currentPhotoType === "idBack" && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-80 rounded-xl bg-black object-cover"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {photoCaptures.idBack.preview && (
                <div className="space-y-2">
                  <img
                    src={photoCaptures.idBack.preview}
                    alt="Captured ID back"
                    className="w-full max-h-80 rounded-xl object-cover border border-slate-200"
                  />
                  <p className="text-xs text-slate-500">Photo captured and ready for upload.</p>
                </div>
              )}

              {photoCaptures.idBack.cloudinaryUrl && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                  ✓ ID back uploaded
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <button
              onClick={handleDraftRegister}
              disabled={
                submitting ||
                photoUploading ||
                chainDetails?.beneficiariesLocked
              }
              className="w-full rounded-xl bg-blue-600 text-white px-5 py-3 font-medium disabled:opacity-60"
            >
              {photoUploading
                ? "Uploading photos..."
                : submitting
                ? "Registering beneficiary..."
                : "Register Beneficiary"}
            </button>
          </div>

          {/* Last Draft Result */}
          {lastDraftResult && (
          <BeneficiaryQRGenerator
            beneficiaryName={lastDraftResult?.beneficiaryName}
            campaignAddress={campaignAddress}
            campaignTitle={campaign?.title || chainDetails?.title}
            claimHash={lastDraftResult.claimHash}
            claimCode={lastDraftResult.claimCode}
            qrPayload={lastDraftResult.qrPayload}
          />
        )}
        </div>

        {/* Right Sidebar: Campaign State & Recent Beneficiaries */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Campaign State</h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-medium">Campaign active:</span> {chainDetails?.isActive ? "Yes" : "No"}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Beneficiaries locked:</span> {chainDetails?.beneficiariesLocked ? "Yes" : "No"}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">On-chain beneficiary count:</span> {chainDetails?.beneficiaryCount ?? 0}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Draft records:</span> {draftBeneficiaries.length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Beneficiaries</h2>
              <button
                type="button"
                onClick={fetchBeneficiaries}
                disabled={refreshingList}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                {refreshingList ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {draftBeneficiaries.length === 0 ? (
              <p className="text-sm text-slate-500">No beneficiaries registered yet.</p>
            ) : (
              <div className="space-y-3">
                {draftBeneficiaries.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-1">
                    <p className="text-sm font-medium text-slate-900">{item.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {item.age} yrs • {item.gender} • {item.idType}
                    </p>
                    <p className="text-xs text-slate-500">ID: {maskId(item.idNumber)}</p>
                    <p className="text-xs text-slate-500 break-all">Claim: {item.claimHash}</p>
                    <p className="text-xs text-slate-500 break-all">Code: {item.claimCode || "—"}</p>
                    <p className="text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          item.onChainRegistered
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.onChainRegistered ? "Registered on-chain" : "Draft"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-900">Next Steps</h2>
            <p className="mt-2 text-sm text-slate-500">
              After all beneficiaries are registered, the partner requests admin approval to lock and submit to blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerBeneficiaryRegister;