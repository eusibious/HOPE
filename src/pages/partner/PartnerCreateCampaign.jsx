import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Select, TextArea, TextInput } from '../../components/ui'
import { db } from "../../lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ethers } from "ethers";
import { getFactoryContract } from "../../utils/contract";
import HOPEFactory from "../../abi/HOPEFactory.json";



const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
// ─── Step Indicator ───────────────────────────────────────────────────────────
const steps = [
  { number: 1, label: 'Campaign Details' },
  { number: 2, label: 'Media & Documents' },
  { number: 3, label: 'Review & Submit' },
]

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, i) => (
      <div key={step.number} className="flex items-center">
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            current === step.number
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : current > step.number
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {current > step.number ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : step.number}
          </div>
          <p className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
            current === step.number ? 'text-blue-600'
            : current > step.number ? 'text-green-600'
            : 'text-slate-400'
          }`}>
            {step.label}
          </p>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-20 sm:w-28 h-0.5 mx-2 mb-5 transition-all ${
            current > step.number ? 'bg-green-400' : 'bg-slate-200'
          }`} />
        )}
      </div>
    ))}
  </div>
)

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ number, title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </span>
      {title}
    </h2>
    {children}
  </div>
)

// ─── Field Wrapper (adds label + error below TextInput which handles its own) ─
const Field = ({ label, required, error, hint, children, counter }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    <div className="flex items-center justify-between mt-1">
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {counter && <p className="text-xs text-slate-400 ml-auto">{counter}</p>}
    </div>
  </div>
)

// ─── Drop Zone ────────────────────────────────────────────────────────────────
const DropZone = ({ label, accept, hint, file, onFile, icon, error }) => {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`dropzone-${label}`).click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragging       ? 'border-blue-400 bg-blue-50'
          : file         ? 'border-green-300 bg-green-50'
          : error        ? 'border-red-300 bg-red-50'
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <input
          id={`dropzone-${label}`}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-green-700 truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null) }}
              className="ml-auto text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              {icon}
            </div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{hint}</p>
            <p className="text-xs text-blue-500 mt-2 font-medium">Click or drag & drop</p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Review Row ───────────────────────────────────────────────────────────────
const ReviewRow = ({ label, value, highlight }) => (
  <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0">
    <p className="text-sm text-slate-500 w-1/3 flex-shrink-0">{label}</p>
    <p className={`text-sm font-medium text-right flex-1 ${highlight ? 'text-blue-600 font-semibold' : 'text-slate-900'}`}>
      {value || <span className="text-slate-300 italic text-xs">Not provided</span>}
    </p>
  </div>
)

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'disaster-relief',       label: 'Disaster Relief' },
  { value: 'flood-relief',          label: 'Flood Relief' },
  { value: 'earthquake-relief',     label: 'Earthquake Relief' },
  { value: 'healthcare',            label: 'Healthcare' },
  { value: 'food-aid',              label: 'Food Aid' },
  { value: 'shelter',               label: 'Shelter' },
  { value: 'education',             label: 'Education' },
  { value: 'community-development', label: 'Community Development' },
  { value: 'other',                 label: 'Other' },
]

const URGENCY_LEVELS = [
  { value: 'low',      label: 'Low — Regular timeline' },
  { value: 'medium',   label: 'Medium — Important' },
  { value: 'high',     label: 'High — Urgent' },
  { value: 'critical', label: 'Critical — Emergency' },
]

const URGENCY_BADGE = {
  low:      'bg-slate-100 text-slate-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}
// ─── File Upload Functions (to be used in handleSubmit) ─────────────────────
const uploadToIPFS = async (file) => {
  console.log("Received in IPFS:", file);
  console.log("Type:", typeof file);
  console.log("Instance of File:", file instanceof File);
  try {
    // Convert file → base64
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (error) => reject(error);
      });

    const base64 = await toBase64(file);

    const response = await fetch("http://localhost:3001/api/upload-ipfs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: base64,
        fileName: file.name,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error("IPFS upload failed");
    }

    return data.cid;

  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw error;
  }
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  
  console.log("Uploading to:", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    return data.secure_url;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

//test upload functions


// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerCreateCampaign = () => {
  const { user, userData } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]               = useState(1)
  const [errors, setErrors]           = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title:            '',
    description:      '',
    goal:             '',
    category:         '',
    customCategory:   '',
    location:         '',
    deadline:         '',
    beneficiaryCount: '',
    urgency:          'medium',
    image:            null,
    documents:        [],
  })

  const orgName     = userData?.organizationName || user?.displayName || '—'
  const contactName = userData?.contactName      || '—'

  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const perBeneficiary =
    formData.goal && formData.beneficiaryCount && Number(formData.beneficiaryCount) > 0
      ? (Number(formData.goal) / Number(formData.beneficiaryCount)).toFixed(2)
      : null

  const testUploads = async () => {
    console.log("BUTTON CLICKED");

    console.log("Image:", formData.image);
    console.log("Docs:", formData.documents);

    try {
      if (!formData.image) {
        alert("Please select an image first");
        return;
      }

      if (!formData.documents) {
        alert("Please select a document first");
        return;
      }
      const file = formData.documents?.[0];
      console.log("Actual files:", file);
      console.log("Is file:", file instanceof File);

      // ✅ FIXED HERE
      const cid = await uploadToIPFS(file);
      console.log("✅ IPFS CID:", cid);

      const imageUrl = await uploadToCloudinary(formData.image);
      console.log("✅ Cloudinary URL:", imageUrl);

     

      alert("Uploads successful!");

    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Upload failed");
    }
  }
  
  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {}
    if (!formData.title.trim())                      e.title           = 'Campaign title is required'
    else if (formData.title.length > 100)             e.title           = 'Title must be under 100 characters'
    if (!formData.description.trim())                e.description     = 'Description is required'
    else if (formData.description.length < 50)       e.description     = 'Description must be at least 50 characters'
    if (!formData.goal)                              e.goal            = 'Funding goal is required'
    else if (Number(formData.goal) < 100)            e.goal            = 'Minimum goal is $100 USDC'
    if (!formData.category)                          e.category        = 'Please select a category'
    if (formData.category === 'other' && !formData.customCategory.trim()) e.customCategory = 'Please specify the category'
    if (!formData.location.trim())                   e.location        = 'Location is required'
    if (!formData.deadline)                          e.deadline        = 'Deadline is required'
    else if (new Date(formData.deadline) <= new Date()) e.deadline     = 'Deadline must be in the future'
    if (!formData.beneficiaryCount)                  e.beneficiaryCount = 'Number of beneficiaries is required'
    else if (Number(formData.beneficiaryCount) < 1)  e.beneficiaryCount = 'Must have at least 1 beneficiary'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!formData.image) e.image = 'Campaign image is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

 const handleSubmit = async () => {
  setIsSubmitting(true)

  try {
    console.log("🚀 Starting campaign creation...")
    if (!formData.image) throw new Error("Image is required")
    if (!formData.documents || formData.documents.length === 0) throw new Error("Document required")

    // =========================
    // 1. Upload Image
    // =========================
    const imageUrl = await uploadToCloudinary(formData.image)
    console.log("✅ Image uploaded:", imageUrl)

    // =========================
    // 2. Upload Docs to IPFS
    // =========================
    const cid = await uploadToIPFS(formData.documents[0])
    console.log("✅ IPFS CID:", cid)

    // =========================
    // 3. Connect MetaMask
    // =========================
    if (!window.ethereum) {
      throw new Error("MetaMask not found")
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()

    console.log("👤 User:", userAddress)

    // =========================
    // 4. Contract Instance
    // =========================
    const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS

    const contract = new ethers.Contract(
      factoryAddress,
      HOPEFactory.abi,
      signer
    )

  console.log("💰 Goal Amount:", formData.goal);
  const goal = formData.goal?.toString();

  if (!formData.goal) {
    alert("Please enter goal amount");
    return;
  }

  const parsedGoal = ethers.parseUnits(
    formData.goal.toString(),
    6
  );


    // =========================
    // 5. Prepare Params
    // =========================
    const params = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      documentCID: cid,
      goalAmount: parsedGoal,
      deadline: Math.floor(new Date(formData.deadline).getTime() / 1000)
    }

    console.log("📦 Params:", params)

    // =========================
    // 6. Call Smart Contract
    // =========================
    const tx = await contract.createCampaign(params)
    console.log("⏳ TX Sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("✅ TX Confirmed")

    // =========================
    // 7. Extract Campaign Info from Event
    // =========================
    let campaignAddress = null;
    let campaignId = null;

    // First, let's see all the logs for debugging
    console.log("📋 Total logs in receipt:", receipt.logs.length);

    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        console.log("📝 Parsed log event:", parsedLog.name, parsedLog.args);

        if (parsedLog.name === "CampaignCreated") {
          // Try different possible field names
          campaignAddress = parsedLog.args.campaignAddress || 
                           parsedLog.args.campaign || 
                           parsedLog.args[0]; // First indexed argument
          
          campaignId = parsedLog.args.campaignId || 
                      parsedLog.args.id ||
                      parsedLog.args[1]; // Second indexed argument
          
          console.log("✅ Found CampaignCreated event!");
          console.log("   - Campaign Address:", campaignAddress);
          console.log("   - Campaign ID:", campaignId?.toString());
          break;
        }
      } catch (err) {
        // Ignore logs that don't match our contract's ABI
      }
    }

    if (!campaignAddress && !campaignId) {
      // If still not found, try querying with filter
      console.log("⚠️ Event not in logs, trying filter query...");
      try {
        const filter = contract.filters.CampaignCreated();
        const events = await contract.queryFilter(
          filter,
          receipt.blockNumber,
          receipt.blockNumber
        );
        
        if (events.length > 0) {
          const event = events[0];
          campaignAddress = event.args.campaignAddress || 
                           event.args.campaign || 
                           event.args[0];
          campaignId = event.args.campaignId || 
                      event.args.id ||
                      event.args[1];
          console.log("✅ Found via filter query!");
          console.log("   - Campaign Address:", campaignAddress);
          console.log("   - Campaign ID:", campaignId?.toString());
        } else {
          throw new Error("CampaignCreated event not found in logs or query");
        }
      } catch (filterError) {
        console.error("Filter query failed:", filterError);
        throw new Error("CampaignCreated event not found");
      }
    }

    console.log("🎯 Final Campaign Address:", campaignAddress);
    if (campaignId) console.log("🎯 Final Campaign ID:", campaignId.toString());

    // =========================
    // 8. Save to Firestore
    // =========================
    const campaignData = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      imageUrl,
      documentCID: cid,
      goalAmount: parsedGoal,
      deadline: formData.deadline,
      campaignAddress,
      createdBy: userAddress,
      createdAt: serverTimestamp()
    };

    // Add campaignId if it exists
    if (campaignId) {
      campaignData.campaignId = campaignId.toString();
    }

    await addDoc(collection(db, "campaigns"), campaignData);

    console.log("🔥 Saved to Firestore")

    // =========================
    // 9. Redirect
    // =========================
    navigate("/partner", {
      state: { message: "Campaign created successfully!" }
    })

  } catch (err) {
    console.error("❌ Campaign creation failed:", err)

    alert(
      err.reason ||
      err.message ||
      "Something went wrong"
    )
  } finally {
    setIsSubmitting(false)
  }
}

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)

  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Campaign</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the details to launch your disaster relief campaign
        </p>

        {/* Temporary button to test uploads */}
        <button
          type="button"
          onClick={testUploads}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Upload
        </button>

      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Campaign Details ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">

          <Section number="1" title="Basic Information">
            {/* Title */}
            <Field
              label="Campaign Title"
              required
              error={errors.title}
              counter={`${formData.title.length}/100`}
            >
              <TextInput
                placeholder="Title...."
                value={formData.title}
                onChange={e => set('title', e.target.value)}
                maxLength={100}
                error={errors.title}
              />
            </Field>

            {/* Description */}
            <Field
              label="Campaign Description"
              required
              error={errors.description}
              counter={`${formData.description.length} chars (min 50)`}
            >
              <TextArea
                placeholder="Describe the disaster, who is affected, and how funds will be used to help them..."
                value={formData.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
                error={errors.description}
              />
            </Field>
          </Section>

          <Section number="2" title="Campaign Specifics">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Goal */}
              <Field label="Funding Goal (USDC)" required error={errors.goal} hint="Minimum $100 USDC">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none"></span>
                  <TextInput
                    type="number"
                    placeholder=""
                    value={formData.goal}
                    onChange={e => set('goal', e.target.value)}
                    min="100"
                    error={errors.goal}
                    className="pl-7"
                  />
                </div>
              </Field>

              {/* Category */}
              <Field label="Category" required error={errors.category}>
                <Select
                  value={formData.category}
                  onChange={e => { set('category', e.target.value); if (e.target.value !== 'other') set('customCategory', '') }}
                  options={CATEGORIES}
                  placeholder="Select a category"
                  error={errors.category}
                />
              </Field>

              {/* Custom Category — shown only when "Other" is selected */}
              {formData.category === 'other' && (
                <Field label="Specify Category" required error={errors.customCategory}>
                  <TextInput
                    placeholder="Custom Category"
                    value={formData.customCategory}
                    onChange={e => set('customCategory', e.target.value)}
                    error={errors.customCategory}
                  />
                </Field>
              )}

              {/* Location */}
              <Field label="Location" required error={errors.location}>
                <TextInput
                  placeholder="Area of impact"
                  value={formData.location}
                  onChange={e => set('location', e.target.value)}
                  error={errors.location}
                />
              </Field>

              {/* Deadline */}
              <Field label="Campaign Deadline" required error={errors.deadline}>
                <TextInput
                  type="date"
                  value={formData.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  min={minDateStr}
                  error={errors.deadline}
                />
              </Field>

              {/* Beneficiaries */}
              <Field
                label="Number of Beneficiaries"
                required
                error={errors.beneficiaryCount}
                hint={perBeneficiary ? `≈ $${perBeneficiary} USDC per person` : undefined}
              >
                <TextInput
                  type="number"
                  placeholder="Expected number"
                  value={formData.beneficiaryCount}
                  onChange={e => set('beneficiaryCount', e.target.value)}
                  min="1"
                  error={errors.beneficiaryCount}
                />
                {perBeneficiary && !errors.beneficiaryCount && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ≈ ${perBeneficiary} USDC per beneficiary
                  </p>
                )}
              </Field>

              {/* Urgency */}
              <Field label="Urgency Level" required error={errors.urgency}>
                <Select
                  value={formData.urgency}
                  onChange={e => set('urgency', e.target.value)}
                  options={URGENCY_LEVELS}
                  error={errors.urgency}
                />
                {formData.urgency && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_BADGE[formData.urgency]}`}>
                    {URGENCY_LEVELS.find(u => u.value === formData.urgency)?.label}
                  </span>
                )}
              </Field>

            </div>
          </Section>

          {/* Submitting as */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Submitting as</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{orgName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{orgName}</p>
                <p className="text-xs text-slate-500">{contactName}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Step 2: Media & Documents ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">

          <Section number="1" title="Campaign Image *">
            <p className="text-xs text-slate-500 -mt-3">
              This will be displayed on the public campaigns page. Use a clear, impactful photo.
            </p>
            <DropZone
              label="Upload Campaign Image"
              accept="image/*"
              hint="JPG, PNG or WebP — max 5MB"
              file={formData.image}
              onFile={f => { set('image', f); if (errors.image) setErrors(p => ({ ...p, image: '' })) }}
              error={errors.image}
              icon={
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            {formData.image && (
              <div className="rounded-xl overflow-hidden border border-slate-200 h-48 mt-2">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </Section>

          <Section number="2" title={<span>Supporting Documents </span>}>
            <p className="text-xs text-slate-500 -mt-3">
              Documents are stored on IPFS — a decentralised tamper-proof system. The hash is recorded on-chain as proof.
            </p>
            <DropZone
              label="Upload Supporting Document"
              accept=".pdf,.doc,.docx"
              hint="PDF, DOC or DOCX — max 10MB"
              file={formData.documents || null}
              onFile={f => set('documents', f ? [f] : [])}
              icon={
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            {/* IPFS badge */}
            <div className="flex items-start gap-3 bg-slate-800 rounded-xl p-4 mt-2">
              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Stored on IPFS via Pinata</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  The IPFS hash will be recorded on the Polygon blockchain as immutable proof of your documentation.
                </p>
              </div>
            </div>
          </Section>

        </div>
      )}

      {/* ── Step 3: Review & Submit ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Campaign Summary</h2>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit details →
              </button>
            </div>

            {formData.image && (
              <div className="h-44 overflow-hidden">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Campaign"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="px-6 py-2">
              <ReviewRow label="Title"            value={formData.title} />
              <ReviewRow label="Category"         value={formData.category === 'other' && formData.customCategory ? formData.customCategory : CATEGORIES.find(c => c.value === formData.category)?.label} />
              <ReviewRow label="Location"         value={formData.location} />
              <ReviewRow label="Deadline"         value={formData.deadline ? new Date(formData.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} />
              <ReviewRow label="Funding Goal"     value={formData.goal ? `$${Number(formData.goal).toLocaleString()} USDC` : ''} highlight />
              <ReviewRow label="Beneficiaries"    value={formData.beneficiaryCount ? `${Number(formData.beneficiaryCount).toLocaleString()} people` : ''} />
              <ReviewRow label="Per Beneficiary"  value={perBeneficiary ? `$${perBeneficiary} USDC` : ''} highlight />
              <ReviewRow label="Urgency"          value={URGENCY_LEVELS.find(u => u.value === formData.urgency)?.label} />
              <ReviewRow label="Organisation"     value={orgName} />
              <ReviewRow label="Documents"        value={formData.documents.length > 0 ? `${formData.documents.length} file(s) — will upload to IPFS` : 'None'} />
            </div>
          </div>

          {/* Description preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Description</h3>
              <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit →</button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{formData.description}</p>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-800">What happens after you submit?</p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1.5">
                  {[
                    'Campaign image is uploaded to Cloudinary',
                    'Supporting documents are uploaded to IPFS via Pinata',
                    'Campaign details are saved and sent for admin review',
                    'Once approved, a smart contract is deployed on Polygon',
                    'Your campaign goes live and accepts USDC donations',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Navigation Buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={step === 1 ? () => navigate('/partner') : handleBack}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {step === 1 ? 'Cancel' : 'Back'}
          </span>
        </Button>

        {step < 3 ? (
          <Button variant="primary" onClick={handleNext}>
            <span className="flex items-center gap-2">
              Next Step
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit for Review
              </span>
            )}
          </Button>
        )}
      </div>

    </div>
  )
}

export default PartnerCreateCampaign