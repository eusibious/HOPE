function StatusIndicator({ status, message }) {
  const styles = {
    checking: {
      bg: 'bg-[#0EA5E9]/10',
      border: 'border-[#0EA5E9]',
      text: 'text-[#0EA5E9]',
      icon: (
        <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    eligible: {
      bg: 'bg-[#059669]/10',
      border: 'border-[#059669]',
      text: 'text-[#059669]',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    not_eligible: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  }

  const style = styles[status] || styles.checking

  return (
    <div className={`rounded-2xl border p-6 ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-4">
        <div className={style.text}>
          {style.icon}
        </div>
        <div>
          <p className={`text-base font-semibold ${style.text}`}>
            {status === 'checking' && 'Checking eligibility...'}
            {status === 'eligible' && 'You are eligible for aid'}
            {status === 'not_eligible' && 'Not eligible at this time'}
          </p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default StatusIndicator