import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import HOPECampaignABI from "../../abi/HOPECampaign.json";

const emptyBeneficiary = {
  fullName: "",
  phone: "",
  governmentId: "",
  aidAmount: "",
};

const readableError = (error) => {
  if (error?.code === 4001) return "Transaction rejected by user.";
  if (error?.info?.error?.message) return error.info.error.message;
  if (error?.reason) return error.reason;
  if (error?.shortMessage) return error.shortMessage;
  if (error?.message) return error.message;
  return "Operation failed.";
};

function PartnerBeneficiaryRegister() {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [chainDetails, setChainDetails] = useState(null);

  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const [beneficiaries, setBeneficiaries] = useState([{ ...emptyBeneficiary }]);

  const [pageLoading, setPageLoading] = useState(true);
  const [prepareLoading, setPrepareLoading] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [prepareError, setPrepareError] = useState("");
  const [chainError, setChainError] = useState("");
  const [commitError, setCommitError] = useState("");
  const [success, setSuccess] = useState("");

  const [lastRegistration, setLastRegistration] = useState(null);

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
          setValidationError("Campaign not found.");
          return;
        }

        const campaignDoc = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };

        if (campaignDoc.partnerUid !== user.uid) {
          setValidationError("You do not own this campaign.");
          return;
        }

        setCampaign(campaignDoc);

        if (!window.ethereum) {
          setWalletError("MetaMask is required.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        }

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
      } catch (error) {
        console.error("Failed to load register page:", error);
        setValidationError(error?.message || "Failed to load campaign.");
      } finally {
        setPageLoading(false);
      }
    };

    boot();
  }, [user?.uid, campaignAddress]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletConnected(false);
        setWalletAddress("");
      } else {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }

      setWalletError("");
      setChainError("");
      setCommitError("");
      setSuccess("");
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const walletMatchesPartner = useMemo(() => {
    if (!walletAddress || !chainDetails?.partner) return false;
    return walletAddress.toLowerCase() === chainDetails.partner.toLowerCase();
  }, [walletAddress, chainDetails]);

  const actionsDisabled =
    !campaign ||
    !chainDetails ||
    !walletConnected ||
    !walletMatchesPartner ||
    !chainDetails.isActive ||
    chainDetails.beneficiariesLocked;

  const clearMessages = () => {
    setValidationError("");
    setWalletError("");
    setPrepareError("");
    setChainError("");
    setCommitError("");
    setSuccess("");
  };

  const connectWallet = async () => {
    clearMessages();

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts.length) {
        throw new Error("No MetaMask account connected.");
      }

      setWalletAddress(accounts[0]);
      setWalletConnected(true);
    } catch (error) {
      setWalletError(readableError(error));
    }
  };

  const updateBeneficiary = (index, field, value) => {
    setBeneficiaries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addRow = () => {
    setBeneficiaries((prev) => [...prev, { ...emptyBeneficiary }]);
  };

  const removeRow = (index) => {
    setBeneficiaries((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateRows = () => {
    setValidationError("");

    for (let i = 0; i < beneficiaries.length; i++) {
      const b = beneficiaries[i];

      if (!String(b.fullName || "").trim()) {
        setValidationError(`Row ${i + 1}: Full name is required.`);
        return false;
      }

      if (!String(b.phone || "").trim()) {
        setValidationError(`Row ${i + 1}: Phone is required.`);
        return false;
      }

      if (!String(b.governmentId || "").trim()) {
        setValidationError(`Row ${i + 1}: Government ID is required.`);
        return false;
      }

      const aidAmount = String(b.aidAmount || "").trim();
      if (aidAmount && !/^\d+(\.\d{1,2})?$/.test(aidAmount)) {
        setValidationError(
          `Row ${i + 1}: Aid amount must be a valid number with up to 2 decimals.`
        );
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    clearMessages();
    setLastRegistration(null);

    if (!validateRows()) return;

    if (!walletConnected) {
      setWalletError("Please connect MetaMask.");
      return;
    }

    if (!walletMatchesPartner) {
      setWalletError("Connected wallet does not match the on-chain campaign partner.");
      return;
    }

    if (!chainDetails?.isActive) {
      setValidationError("Campaign is not active on-chain.");
      return;
    }

    if (chainDetails?.beneficiariesLocked) {
      setValidationError("Beneficiaries are already locked on-chain.");
      return;
    }

    let prepared;

    try {
      setPrepareLoading(true);

      const idToken = await user.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/beneficiaries/prepare-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            campaignAddress,
            beneficiaries,
          }),
        }
      );

      prepared = await response.json();

      if (!response.ok) {
        throw new Error(prepared.message || prepared.error || "Prepare failed.");
      }
    } catch (error) {
      setPrepareError(error.message || "Prepare failed.");
      return;
    } finally {
      setPrepareLoading(false);
    }

    let txHash = "";

    try {
      setChainLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, signer);

      const tx = await contract.registerBeneficiaries(
        prepared.claimHashes,
        prepared.manifestCID,
        prepared.count
      );

      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch (error) {
      setChainError(readableError(error));
      return;
    } finally {
      setChainLoading(false);
    }

    try {
      setCommitLoading(true);

      const idToken = await user.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/beneficiaries/commit-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            campaignAddress,
            registrationBatchId: prepared.registrationBatchId,
            txHash,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Commit failed.");
      }

      setSuccess("Beneficiaries registered successfully.");
      setLastRegistration({
        manifestCID: result.manifestCID,
        txHash: result.txHash,
        count: result.count,
      });

      setBeneficiaries([{ ...emptyBeneficiary }]);

      setChainDetails((prev) =>
        prev
          ? {
              ...prev,
              beneficiaryCount: prev.beneficiaryCount + result.count,
            }
          : prev
      );
    } catch (error) {
      setCommitError(
        `${error.message || "Commit failed."} If the wallet transaction succeeded, treat this as a reconciliation case.`
      );
    } finally {
      setCommitLoading(false);
    }
  };

  const handleLock = async () => {
    clearMessages();

    if (!walletConnected) {
      setWalletError("Please connect MetaMask.");
      return;
    }

    if (!walletMatchesPartner) {
      setWalletError("Connected wallet does not match the on-chain campaign partner.");
      return;
    }

    if (!chainDetails?.isActive) {
      setValidationError("Campaign is not active on-chain.");
      return;
    }

    if (chainDetails?.beneficiariesLocked) {
      setValidationError("Beneficiaries are already locked.");
      return;
    }

    let txHash = "";

    try {
      setLockLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, signer);

      const tx = await contract.lockBeneficiaries();
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch (error) {
      setChainError(readableError(error));
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/beneficiaries/commit-lock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            campaignAddress,
            txHash,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Lock commit failed.");
      }

      setSuccess("Beneficiaries locked successfully.");

      setChainDetails((prev) =>
        prev
          ? {
              ...prev,
              beneficiariesLocked: true,
            }
          : prev
      );
    } catch (error) {
      setCommitError(
        `${error.message || "Lock commit failed."} If the wallet transaction succeeded, this needs reconciliation.`
      );
    } finally {
      setLockLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="p-6 max-w-6xl mx-auto">Loading beneficiary registration...</div>;
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
          <h1 className="text-2xl font-bold text-slate-900">Register Beneficiaries</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign?.title || chainDetails?.title || "—"}{" "}
            {campaign?.location || chainDetails?.location
              ? `— ${campaign?.location || chainDetails?.location}`
              : ""}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono break-all">
            {campaignAddress}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/partner/campaigns/${campaignAddress}/beneficiaries`}
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Registered Beneficiaries
          </Link>

          {!walletConnected && (
            <button
              onClick={connectWallet}
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {(validationError || walletError || prepareError || chainError || commitError) && (
        <div className="space-y-2">
          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {validationError}
            </div>
          )}
          {walletError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {walletError}
            </div>
          )}
          {prepareError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {prepareError}
            </div>
          )}
          {chainError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {chainError}
            </div>
          )}
          {commitError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {commitError}
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Campaign Verification</h2>
            <p className="text-sm text-slate-500 mt-1">
              Wallet ownership and on-chain state are checked before registration is allowed.
            </p>
          </div>

          {walletConnected ? (
            <div className="text-sm text-slate-600">
              Wallet: <span className="font-mono break-all">{walletAddress}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Wallet not connected</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p>
              <span className="font-medium">On-chain Partner:</span>{" "}
              <span className="font-mono break-all">{chainDetails?.partner || "—"}</span>
            </p>
            <p>
              <span className="font-medium">Wallet Match:</span>{" "}
              {walletMatchesPartner ? "Yes" : "No"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p>
              <span className="font-medium">Campaign Active:</span>{" "}
              {chainDetails?.isActive ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-medium">Beneficiaries Locked:</span>{" "}
              {chainDetails?.beneficiariesLocked ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-medium">Registered Count:</span>{" "}
              {chainDetails?.beneficiaryCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Beneficiary Entries</h2>
            <p className="text-xs text-slate-500 mt-1">
              Private identity data stays in Firestore. Public IPFS manifest stays sanitized.
            </p>
          </div>

          <button
            onClick={addRow}
            type="button"
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
            disabled={chainDetails?.beneficiariesLocked}
          >
            Add Row
          </button>
        </div>

        <div className="p-5 space-y-4">
          {beneficiaries.map((beneficiary, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-slate-200 rounded-xl p-4"
            >
              <input
                type="text"
                placeholder="Full name"
                value={beneficiary.fullName}
                onChange={(e) => updateBeneficiary(index, "fullName", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Phone"
                value={beneficiary.phone}
                onChange={(e) => updateBeneficiary(index, "phone", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Government ID"
                value={beneficiary.governmentId}
                onChange={(e) => updateBeneficiary(index, "governmentId", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Aid amount (optional)"
                value={beneficiary.aidAmount}
                onChange={(e) => updateBeneficiary(index, "aidAmount", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded-lg border border-red-200 text-red-700 px-3 py-2 disabled:opacity-60"
                disabled={beneficiaries.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRegister}
          disabled={actionsDisabled || prepareLoading || chainLoading || commitLoading}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-60"
        >
          {prepareLoading
            ? "Preparing..."
            : chainLoading
            ? "Waiting for wallet tx..."
            : commitLoading
            ? "Committing..."
            : "Register Beneficiaries"}
        </button>

        <button
          onClick={handleLock}
          disabled={actionsDisabled || lockLoading}
          className="px-5 py-3 rounded-xl border border-amber-300 text-amber-800 font-medium disabled:opacity-60"
        >
          {lockLoading ? "Locking..." : "Lock Beneficiaries"}
        </button>
      </div>

      {lastRegistration && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Last Registration Result</h2>
          <p>
            <span className="font-medium">Manifest CID:</span> {lastRegistration.manifestCID}
          </p>
          <p>
            <span className="font-medium">Transaction Hash:</span> {lastRegistration.txHash}
          </p>
          <p>
            <span className="font-medium">Count:</span> {lastRegistration.count}
          </p>
        </div>
      )}

      {chainDetails?.beneficiariesLocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Beneficiaries are already locked for this campaign. Registration actions are disabled.
        </div>
      )}
    </div>
  );
}

export default PartnerBeneficiaryRegister;