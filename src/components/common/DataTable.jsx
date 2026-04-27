function DataTable({ 
  title, 
  description, 
  columns, 
  data, 
  loading = false,
  emptyState = { title: 'No data found', description: 'No items match your current filters.' },
  actions
}) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex-between">
            <div>
              <div className="h-5 w-32 loading-skeleton rounded"></div>
              <div className="mt-1 h-4 w-48 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="loading-spinner-large mx-auto"></div>
          <p className="mt-4 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="data-table">
      <div className="card-header">
        <div className="flex-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="text-sm text-slate-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-body">{emptyState.title}</p>
          <p className="text-sm mt-1">{emptyState.description}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="data-table-header">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className={`px-4 py-3 font-semibold text-slate-900 ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100">
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`px-4 py-4 text-slate-700 ${
                        column.align === 'center' ? 'text-center' : 
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DataTable