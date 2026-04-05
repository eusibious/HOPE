function ChartCard({ title, detail, children }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
      <div className="mt-6">{children}</div>
    </article>
  )
}

export default ChartCard
