import SearchBar from './SearchBar'
import Select from '../ui/Select'

function FilterBar({ 
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  showResults = false,
  resultsCount = 0,
  totalCount = 0
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Filters</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Search
          </label>
          <SearchBar
            placeholder={searchPlaceholder} 
            onChange={onSearchChange}
            value={searchValue}
          />
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <div key={index}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {filter.label}
            </label>
            <Select
              options={filter.options}
              value={filter.value}
              onChange={filter.onChange}
              placeholder={filter.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Results Counter */}
      {showResults && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold">{resultsCount}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> results
          </div>
          {resultsCount !== totalCount && (
            <div className="text-xs text-slate-500">
              Filters applied
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBar