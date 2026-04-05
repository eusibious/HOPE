import { useState } from 'react'

function FilterPanel({ filters, onFilterChange }) {
  const [expanded, setExpanded] = useState(false)

  const filterCategories = [
    {
      key: 'status',
      label: 'Status',
      options: ['Active', 'Planned', 'Closed'],
    },
    {
      key: 'fundingLevel',
      label: 'Funding Level',
      options: ['0-50%', '50-75%', '75-100%', '100%+'],
    },
    {
      key: 'region',
      label: 'Region',
      options: ['Africa', 'Asia', 'Middle East', 'Americas', 'Europe'],
    },
  ]

  const handleFilterChange = (categoryKey, option, checked) => {
    if (!onFilterChange) return
    
    onFilterChange(prevFilters => ({
      ...prevFilters,
      [categoryKey]: checked 
        ? [...prevFilters[categoryKey], option]
        : prevFilters[categoryKey].filter(item => item !== option)
    }))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
      >
        Filters
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {expanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 p-4">
          <div className="space-y-4">
            {filterCategories.map((filter) => (
              <div key={filter.key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {filter.label}
                </p>
              <div className="mt-2 space-y-2">
                {filter.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters?.[filter.key]?.includes(option) || false}
                      onChange={(e) => handleFilterChange(filter.key, option, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
