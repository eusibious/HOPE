function AdminCampaignRow({ campaignName, partner, status, amountRaised, createdDate }) {
  const statusStyles = {
    active: 'bg-[#059669]/10 text-[#059669]',
    pending: 'bg-amber-100 text-amber-700',
    blocked: 'bg-red-100 text-red-700',
    completed: 'bg-slate-100 text-slate-600',
  }

  return (
    <tr className="border-b border-slate-200 transition-all hover:bg-slate-50">
      <td className="px-6 py-4 text-sm font-medium text-slate-900">{campaignName}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{partner}</td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{amountRaised}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{createdDate}</td>
    </tr>
  )
}

export default AdminCampaignRow