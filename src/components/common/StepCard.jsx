function StepCard({ step, title, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-sm font-semibold text-[#1E3A8A]">
          {step}
        </span>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-slate-600">{description}</p>
    </article>
  )
}

export default StepCard
