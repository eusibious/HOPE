import { useEffect, useRef } from "react";

const colors = {
  bgPrimary: "#0A0F1E",
  bgSecondary: "#111827",
  bgSurface: "#1E2D42",
  textPrimary: "#E8EDF5",
  textMuted: "#6B8CAE",
  accent: "#4FC3A1",
  accentDim: "rgba(79,195,161,0.15)",
};

const stats = [
  { value: "100%", label: "On-chain Traceability" },
  { value: "0", label: "Middlemen" },
  { value: "Real-time", label: "Fund Visibility" },
  { value: "Multi-NGO", label: "Partner Network" },
];

const pillars = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#4FC3A1" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Verifiable by Design",
    desc: "Every donation is recorded on the blockchain — immutable, public, and auditable by anyone at any time. No trust required; the chain proves it.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#4FC3A1" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Beneficiary-First",
    desc: "Registered beneficiaries are verified by partner NGOs. Aid reaches people — not bureaucracy. QR-based claims ensure the right person gets the right support.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#4FC3A1" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Efficient Crowdfunding",
    desc: "Campaigns are created, managed, and closed entirely on-chain. Partners control disbursement; donors see exactly where their funds go.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#4FC3A1" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Real-Time Accountability",
    desc: "Campaign stats, donation history, and beneficiary registrations are visible live. Partners and donors operate on shared ground truth.",
  },
];

const howItWorks = [
  {
    step: "01",
    actor: "Partner NGO",
    action: "Creates a campaign",
    detail: "Sets a funding goal, category, and timeline. Campaign is deployed as a smart contract on Polygon.",
  },
  {
    step: "02",
    actor: "Donor",
    action: "Contributes funds",
    detail: "Sends USDC directly to the smart contract. Transaction is recorded on-chain instantly.",
  },
  {
    step: "03",
    actor: "NGO",
    action: "Registers beneficiaries",
    detail: "Verified individuals are added on-chain with identity documents stored on IPFS.",
  },
  {
    step: "04",
    actor: "Beneficiary",
    action: "Claims aid via QR",
    detail: "Scans their unique QR code at a distribution point. Smart contract verifies eligibility and releases funds.",
  },
];

function About() {
  const accentStyle = { color: colors.accent };
  const mutedStyle = { color: colors.textMuted };
  const primaryTextStyle = { color: colors.textPrimary };

  return (
    <div style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontFamily: "'Segoe UI', system-ui, sans-serif" }} className="min-h-screen">

      {/* ── Hero ── */}
      <section style={{ backgroundColor: colors.bgPrimary, borderBottom: `1px solid ${colors.bgSurface}` }} className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span
            style={{ backgroundColor: colors.accentDim, color: colors.accent, border: `1px solid ${colors.accent}`, fontSize: "0.75rem", letterSpacing: "0.15em" }}
            className="inline-block px-4 py-1 rounded-full uppercase font-semibold mb-6"
          >
            Blockchain-Powered Aid
          </span>
          <h1 style={{ color: colors.textPrimary, lineHeight: 1.15 }} className="text-5xl md:text-7xl font-bold mb-6">
            Relief that's{" "}
            <span style={accentStyle}>verifiable,</span>
            <br />
            not just promised.
          </h1>
          <p style={{ color: colors.textMuted, maxWidth: "600px" }} className="mx-auto text-lg leading-relaxed">
            HOPE replaces faith-based charity with proof-based giving. Every rupee, every recipient, every transaction — permanently on-chain.
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.bgSurface}`, borderBottom: `1px solid ${colors.bgSurface}` }} className="py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ color: colors.accent }} className="text-3xl font-bold mb-1">{s.value}</div>
              <div style={{ color: colors.textMuted }} className="text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What is HOPE ── */}
      <section style={{ backgroundColor: colors.bgPrimary }} className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 style={{ color: colors.textPrimary }} className="text-4xl font-bold mb-6">What is HOPE?</h2>
            <p style={{ color: colors.textMuted, lineHeight: 1.8 }} className="text-base mb-4">
              HOPE is a blockchain-enabled humanitarian aid platform built on Polygon. It connects donors, NGO partners, and verified beneficiaries through smart contracts — removing the opacity and inefficiency that plague traditional charity.
            </p>
            <p style={{ color: colors.textMuted, lineHeight: 1.8 }} className="text-base mb-6">
              Campaigns are created and funded on-chain. Beneficiaries are registered with verifiable identity documents stored on IPFS. Aid is claimed via QR codes — no cash leakage, no unverified recipients.
            </p>
            <div style={{ borderLeft: `3px solid ${colors.accent}`, paddingLeft: "1rem" }}>
              <p style={{ color: colors.textPrimary, fontStyle: "italic" }} className="text-base">
                "Transparency isn't a feature. It's the foundation."
              </p>
            </div>
          </div>

          {/* Visual placeholder / decorative block */}
          <div style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.bgSurface}`, borderRadius: "1rem", minHeight: "300px" }} className="flex items-center justify-center p-8">
            <div className="text-center">
              <div style={{ backgroundColor: colors.accentDim, borderRadius: "50%", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke={colors.accent} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <p style={{ color: colors.accent }} className="font-semibold text-lg mb-1">Built on Polygon</p>
              <p style={{ color: colors.textMuted }} className="text-sm">Fast, low-cost, EVM-compatible</p>
              <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                {["USDC", "IPFS", "Pinata", "MetaMask", "Firebase"].map(tag => (
                  <span key={tag} style={{ backgroundColor: colors.accentDim, color: colors.accent, border: `1px solid rgba(79,195,161,0.3)`, borderRadius: "999px", padding: "4px 12px", fontSize: "0.75rem" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Four Pillars ── */}
      <section style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.bgSurface}` }} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 style={{ color: colors.textPrimary }} className="text-4xl font-bold text-center mb-4">How We Do It Differently</h2>
          <p style={{ color: colors.textMuted }} className="text-center mb-14 max-w-xl mx-auto">Every design decision was made to remove trust as a requirement — not add it as a feature.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((p) => (
              <div key={p.title} style={{ backgroundColor: colors.bgPrimary, border: `1px solid ${colors.bgSurface}`, borderRadius: "0.75rem" }} className="p-6">
                <div style={{ backgroundColor: colors.accentDim, width: "52px", height: "52px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  {p.icon}
                </div>
                <h3 style={{ color: colors.textPrimary }} className="text-lg font-semibold mb-2">{p.title}</h3>
                <p style={{ color: colors.textMuted, lineHeight: 1.7 }} className="text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ backgroundColor: colors.bgPrimary, borderTop: `1px solid ${colors.bgSurface}` }} className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ color: colors.textPrimary }} className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p style={{ color: colors.textMuted }} className="text-center mb-14">From campaign creation to aid disbursement — fully on-chain.</p>
          <div className="space-y-6">
            {howItWorks.map((item, i) => (
              <div key={item.step} style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.bgSurface}`, borderRadius: "0.75rem", display: "flex", gap: "20px", padding: "20px 24px", alignItems: "flex-start" }}>
                <div style={{ color: colors.accent, fontSize: "1.5rem", fontWeight: "800", minWidth: "48px", lineHeight: 1 }}>{item.step}</div>
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ backgroundColor: colors.accentDim, color: colors.accent, fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.actor}</span>
                    <span style={{ color: colors.textPrimary, fontWeight: "600" }}>{item.action}</span>
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: "0.9rem", lineHeight: 1.6 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.bgSurface}` }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              label: "Mission",
              text: "To eliminate inefficiency and misuse in humanitarian aid by making every contribution traceable, verifiable, and directed only to genuine beneficiaries — through blockchain infrastructure and accountable NGO partnerships.",
            },
            {
              label: "Vision",
              text: "A world where donors give without doubt, NGOs operate without suspicion, and beneficiaries receive without bureaucracy. Blockchain-enforced transparency as the default — not the exception.",
            },
          ].map((item) => (
            <div key={item.label} style={{ backgroundColor: colors.bgPrimary, border: `1px solid ${colors.bgSurface}`, borderRadius: "0.75rem", padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "4px", height: "28px", backgroundColor: colors.accent, borderRadius: "2px" }} />
                <h3 style={{ color: colors.accent, fontWeight: "700", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>Our {item.label}</h3>
              </div>
              <p style={{ color: colors.textMuted, lineHeight: 1.8, fontSize: "0.95rem" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default About;