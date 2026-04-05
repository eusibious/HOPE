function GasEstimate({ amount }) {
  const estimatedGas = amount > 0 ? Math.max(0.012, amount * 0.000024) : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Network fee estimate</span>
        <span className="text-sm font-semibold text-slate-900">
          ${estimatedGas.toFixed(3)} ETH
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-slate-600">Processing time</span>
        <span className="text-sm font-semibold text-slate-900">~2-3 minutes</span>
      </div>
    </div>
  )
}

export default GasEstimate