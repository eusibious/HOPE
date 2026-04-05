function CampaignSummary({ campaign }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className="h-16 w-16 flex-shrink-0 rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: `url('${campaign.image}')`,
            backgroundColor: '#1E3A8A',
          }}
        />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{campaign.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{campaign.location}</p>
          <p className="mt-2 text-xs text-slate-500">{campaign.ngo}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-900">{campaign.progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0EA5E9] transition-all"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900">{campaign.raised}</span>
          <span className="text-slate-600">of {campaign.target}</span>
        </div>
      </div>
    </div>
  )
}

export default CampaignSummary