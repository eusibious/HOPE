function InstructionCard({ title, steps }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-sm font-semibold text-white">
              {index + 1}
            </div>
            <div className="pt-1">
              <p className="text-base text-slate-900">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InstructionCard