function CampaignStats({ campaign, progress, raised, beneficiaries }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{campaign}</h3>
          <p className="mt-2 text-sm text-slate-600">{raised}</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{progress}% funded</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0EA5E9] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">{beneficiaries} beneficiaries</p>
    </article>
  )
}

export default CampaignStats
