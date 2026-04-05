function StatCard({ label, value, detail, trend, icon, variant = 'default' }) {
  const variants = {
    default: 'border-slate-200 bg-white',
    success: 'border-green-200 bg-gradient-to-br from-green-50/50 to-white',
    warning: 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-white',
    info: 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white',
    danger: 'border-red-200 bg-gradient-to-br from-red-50/50 to-white'
  }

  return (
    <article className={`rounded-xl border ${variants[variant]} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-3 sm:text-3xl">{value}</p>
          <p className="text-sm text-slate-600 mt-2">{detail}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.type === 'up' ? 'text-green-600' :
              trend.type === 'down' ? 'text-red-600' :
              'text-slate-500'
            }`}>
              {trend.type === 'up' && (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {trend.type === 'down' && (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="ml-4 p-2 bg-slate-100 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </article>
  )
}

export default StatCard
