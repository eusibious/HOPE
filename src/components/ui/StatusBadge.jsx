function StatusBadge({ status, variant = 'default' }) {
  const variants = {
    default: {
      active: 'bg-emerald-100 text-emerald-800',
      blocked: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      reviewing: 'bg-blue-100 text-blue-800',
    },
    dot: {
      active: 'bg-emerald-600',
      blocked: 'bg-red-600',
      completed: 'bg-blue-600',
      pending: 'bg-amber-500',
      approved: 'bg-emerald-600',
      rejected: 'bg-red-600',
      reviewing: 'bg-blue-600',
    }
  }

  if (variant === 'dot') {
    return (
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${variants.dot[status]}`} />
        <span className="text-sm capitalize">{status}</span>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants.default[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default StatusBadge