function CampaignCard({ title, location, raised, target }) {
  return (
    <article className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{location}</p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Active
        </span>
      </div>
      <div className="mt-5">
        <div className="flex-between text-caption">
          <span>Raised</span>
          <span>Target</span>
        </div>
        <div className="flex-between text-sm font-semibold mt-2">
          <span>{raised}</span>
          <span>{target}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 w-3/4" />
        </div>
      </div>
      <button className="w-full px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500 mt-5">
        View campaign
      </button>
    </article>
  )
}

export default CampaignCard
