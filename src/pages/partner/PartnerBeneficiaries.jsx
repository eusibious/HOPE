import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
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

const truncateMiddle = (value, start = 8, end = 6) => {
  if (!value || value.length <= start + end) return value || "—";
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const maskGovernmentId = (value) => {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

const maskPhone = (value) => {
  if (!value) return "—";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length <= 4) return digits || value;
  return `${"*".repeat(Math.max(digits.length - 4, 1))}${digits.slice(-4)}`;
};

const StatusBadge = ({ status = "registered" }) => {
  const map = {
    registered: "bg-blue-50 text-blue-700 border-blue-200",
    claimed: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        map[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status}
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
  const [copiedHash, setCopiedHash] = useState("");

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

        let beneficiarySnap;
        try {
          beneficiarySnap = await getDocs(
            query(
              collection(db, "campaigns", campaignDoc.id, "beneficiaries"),
              orderBy("createdAt", "desc")
            )
          );
        } catch {
          beneficiarySnap = await getDocs(
            collection(db, "campaigns", campaignDoc.id, "beneficiaries")
          );
        }

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
    const claimed = beneficiaries.filter((b) => b.claimed === true || b.status === "claimed").length;
    const registered = total - claimed;

    return { total, claimed, registered };
  }, [beneficiaries]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(""), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return <div className="p-6 max-w-7xl mx-auto">Loading registered beneficiaries...</div>;
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
          <h1 className="text-2xl font-bold text-slate-900">Registered Beneficiaries</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign?.title || "Campaign"} {campaign?.location ? `— ${campaign.location}` : ""}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono break-all">
            {campaignAddress}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/partner/campaigns/${campaignAddress}/beneficiaries/register`}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Register Beneficiaries
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Records
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registered
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{summary.registered}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Claimed
              </p>
              <p className="mt-2 text-2xl font-bold text-green-700">{summary.claimed}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Beneficiary Records</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Stored in Firestore for this campaign.
                </p>
              </div>
            </div>

            {beneficiaries.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-700">No beneficiaries registered yet.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Start by registering beneficiaries for this campaign.
                </p>
                <Link
                  to={`/partner/campaigns/${campaignAddress}/beneficiaries/register`}
                  className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Go to Register Page
                </Link>
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
                        Phone
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Government ID
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Claim Hash
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Claim Code
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Registered At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {beneficiaries.map((b) => (
                      <tr key={b.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {b.fullName || "—"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Aid amount: {b.aidAmount || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {maskPhone(b.phone)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {maskGovernmentId(b.governmentId)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <StatusBadge status={b.status || (b.claimed ? "claimed" : "registered")} />
                            <span className="text-xs text-slate-500">
                              Claimed: {b.claimed ? "Yes" : "No"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-xs text-slate-700 break-all">
                              {truncateMiddle(b.claimHash, 10, 8)}
                            </span>
                            {b.claimHash && (
                              <button
                                type="button"
                                onClick={() => handleCopy(b.claimHash)}
                                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                {copiedHash === b.claimHash ? "Copied" : "Copy"}
                              </button>
                            )}
                          </div>
                          {b.registrationTxHash && (
                            <div className="mt-2 font-mono text-[11px] text-slate-400 break-all">
                              Tx: {truncateMiddle(b.registrationTxHash, 12, 8)}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {b.claimCode || "—"}
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

          {campaign?.beneficiaryManifestCID && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Latest Manifest</h2>
              <p className="mt-2 text-xs font-mono text-slate-600 break-all">
                {campaign.beneficiaryManifestCID}
              </p>
              <a
                href={`https://ipfs.io/ipfs/${campaign.beneficiaryManifestCID}`}
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
    </div>
  );
}

export default PartnerBeneficiaries;