function SimpleChart({ type = 'bar', data }) {
  if (type === 'bar') {
    return (
      <div className="flex items-end gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-[#0EA5E9] transition-all hover:bg-[#0284C7]"
              style={{ height: `${item.value}px` }}
            />
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'line') {
    return (
      <svg className="w-full" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
        <polyline
          points={data
            .map((item, idx) => `${(idx / (data.length - 1)) * 400},${120 - item.value * 1.2}`)
            .join(' ')}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="2"
        />
        <polyline
          points={data
            .map((item, idx) => `${(idx / (data.length - 1)) * 400},${120}`)
            .join(' ')}
          fill="url(#gradient)"
          fillOpacity="0.1"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return null
}

export default SimpleChart
