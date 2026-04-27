import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";

const formatDate = (value) => {
  if (!value) return "—";

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateMiddle = (value, start = 10, end = 8) => {
  if (!value) return "—";
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const maskIdNumber = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

const getStatusLabel = (beneficiary) => {
  if (beneficiary.claimed === true || beneficiary.status === "claimed") {
    return "Claimed";
  }

  if (beneficiary.onChainRegistered) {
    return "Registered On-Chain";
  }

  return "Draft";
};

const StatusBadge = ({ beneficiary }) => {
  const label = getStatusLabel(beneficiary);

  const styles = {
    Draft: "bg-blue-50 text-blue-700 border-blue-200",
    "Registered On-Chain": "bg-amber-50 text-amber-700 border-amber-200",
    Claimed: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[label] || "bg-slate-50 text-slate-700 border-slate-200"}`}
    >
      {label}
    </span>
  );
};

function PartnerBeneficiaries() {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !campaignAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const campaignSnap = await getDocs(
          query(collection(db, "campaigns"), where("campaignAddress", "==", campaignAddress))
        );

        if (campaignSnap.empty) {
          setError("Campaign not found.");
          setCampaign(null);
          setBeneficiaries([]);
          return;
        }

        const campaignDoc = {
          id: campaignSnap.docs[0].id,
          ...campaignSnap.docs[0].data(),
        };

        if (campaignDoc.partnerUid !== user.uid) {
          setError("You do not own this campaign.");
          setCampaign(null);
          setBeneficiaries([]);
          return;
        }

        setCampaign(campaignDoc);

        const beneficiarySnap = await getDocs(
          collection(db, "campaigns", campaignDoc.id, "beneficiaries")
        );

        const rows = beneficiarySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        rows.sort((a, b) => {
          const aSec = a.createdAt?.seconds || 0;
          const bSec = b.createdAt?.seconds || 0;
          return bSec - aSec;
        });

        setBeneficiaries(rows);
      } catch (err) {
        console.error("Failed to load beneficiaries:", err);
        setError(err?.message || "Failed to load beneficiaries.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, campaignAddress]);

  const summary = useMemo(() => {
    const total = beneficiaries.length;
    const draft = beneficiaries.filter((b) => !b.onChainRegistered && !(b.claimed === true || b.status === "claimed")).length;
    const registeredOnChain = beneficiaries.filter((b) => b.onChainRegistered && !(b.claimed === true || b.status === "claimed")).length;
    const claimed = beneficiaries.filter((b) => b.claimed === true || b.status === "claimed").length;

    return { total, draft, registeredOnChain, claimed };
  }, [beneficiaries]);

  const handleCopy = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(""), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return <div className="p-6 max-w-7xl mx-auto">Loading beneficiary records...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold text-slate-900">Beneficiary Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign?.title || "Campaign"} {campaign?.location ? `— ${campaign.location}` : ""}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono break-all">{campaignAddress}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!campaign?.beneficiariesLocked && (
            <Link
              to={`/partner/campaigns/${campaignAddress}/beneficiaries/register`}
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Register Beneficiary
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Records</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{summary.draft}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered On-Chain</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{summary.registeredOnChain}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claimed</p>
              <p className="mt-2 text-2xl font-bold text-green-700">{summary.claimed}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Beneficiary Records</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Firestore operational records for this campaign.
                </p>
              </div>
            </div>

            {beneficiaries.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-700">No beneficiaries registered yet.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Start by registering beneficiaries for this campaign.
                </p>
                {!campaign?.beneficiariesLocked && (
                  <Link
                    to={`/partner/campaigns/${campaignAddress}/beneficiaries/register`}
                    className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Go to Register Page
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Beneficiary
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Identity
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      {/* <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Claim
                      </th> */}
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Record Trail
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {beneficiaries.map((b) => (
                      <tr key={b.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {b.photoUrls?.selfie ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(b.photoUrls.selfie)}
                                className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={b.photoUrls.selfie}
                                  alt={b.fullName || "Beneficiary"}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </button>
                            ) : (
                              <div className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-100" />
                            )}

                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {b.fullName || "—"}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Age: {b.age ?? "—"} • Gender: {b.gender || "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          <div>{b.idType || "—"}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {maskIdNumber(b.idNumber)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <StatusBadge beneficiary={b} />
                            <span className="text-xs text-slate-500">
                              On-chain: {b.onChainRegistered ? "Yes" : "No"}
                            </span>
                            {b.registrationTxHash && (
                              <span className="text-[11px] font-mono text-slate-400 break-all">
                                Tx: {truncateMiddle(b.registrationTxHash, 12, 8)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* <td className="px-5 py-4">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="font-mono text-xs text-slate-700 break-all">
                                {truncateMiddle(b.claimHash, 12, 10)}
                              </span>
                              {b.claimHash && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(b.claimHash)}
                                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                >
                                  {copiedValue === b.claimHash ? "Copied" : "Copy"}
                                </button>
                              )}
                            </div>

                            <div className="text-sm text-slate-700">
                              Code: {b.claimCode || "—"}
                            </div>

                            {b.qrPayload && (
                              <div className="text-[11px] text-slate-400 break-all">
                                QR: {truncateMiddle(b.qrPayload, 18, 12)}
                              </div>
                            )}
                          </div>
                        </td> */}

                        <td className="px-5 py-4 text-sm text-slate-700">
                          <div className="space-y-1">
                            <div className="text-xs text-slate-500">
                              Beneficiary CID:
                            </div>
                            <div className="font-mono text-xs break-all">
                              {b.beneficiaryCID ? truncateMiddle(b.beneficiaryCID, 12, 8) : "—"}
                              <button
                              type="button"
                              onClick={() => handleCopy(b.beneficiaryCID)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              {copiedValue === b.beneficiaryCID ? "Copied" : "Copy"}
                            </button>
                            </div>
                            

                            <div className="mt-2 text-xs text-slate-500">
                              Manifest CID:
                            </div>
                            <div className="font-mono text-xs break-all">
                              {b.finalManifestCID
                                ? truncateMiddle(b.finalManifestCID, 12, 8)
                                : b.manifestCID
                                ? truncateMiddle(b.manifestCID, 12, 8)
                                : "—"}
                              <button
                              type="button"
                              onClick={() => handleCopy(b.manifestCID)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              {copiedValue === b.manifestCID ? "Copied" : "Copy"}
                            </button>
                            </div>
                            
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {formatDate(b.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(campaign?.finalBatchManifestCID || campaign?.latestBeneficiaryManifestCID) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Latest Manifest</h2>
              <p className="mt-2 text-xs font-mono text-slate-600 break-all">
                {campaign.finalBatchManifestCID || campaign.latestBeneficiaryManifestCID}
              </p>
              <a
                href={`https://ipfs.io/ipfs/${campaign.finalBatchManifestCID || campaign.latestBeneficiaryManifestCID}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline"
              >
                Open on IPFS
              </a>
            </div>
          )}
        </>
      )}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow"
            >
              ×
            </button>

            <img
              src={selectedPhoto}
              alt="Beneficiary"
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerBeneficiaries;