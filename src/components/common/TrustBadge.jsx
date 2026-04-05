function TrustBadge({ label, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

export default TrustBadge
