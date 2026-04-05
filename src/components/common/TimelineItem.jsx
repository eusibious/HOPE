function TimelineItem({ date, title, description, status = 'completed' }) {
  const statusColor = {
    completed: 'bg-[#059669]',
    pending: 'bg-amber-400',
    current: 'bg-[#0EA5E9]',
  }

  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className={`h-4 w-4 rounded-full ${statusColor[status]} border-4 border-white shadow-sm`} />
      </div>
      <div className="pb-8 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{date}</p>
        <h4 className="mt-2 text-sm font-semibold text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export default TimelineItem
