function TransactionRow({ date, campaign, amount, status, type }) {
  const statusStyles = {
    completed: 'bg-[#059669]/10 text-[#059669]',
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  }

  const typeStyles = {
    outbound: 'text-slate-900 font-semibold',
    inbound: 'text-[#059669] font-semibold',
  }

  return (
    <tr className="border-b border-slate-200 transition-all hover:bg-slate-50">
      <td className="px-6 py-4 text-sm text-slate-600">{date}</td>
      <td className="px-6 py-4 text-sm font-medium text-slate-900">{campaign}</td>
      <td className={`px-6 py-4 text-sm ${typeStyles[type]}`}>
        {type === 'inbound' ? '+' : '-'}{amount}
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
    </tr>
  )
}

export default TransactionRow
