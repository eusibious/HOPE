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
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Search
          </label>
          <SearchBar
            placeholder={searchPlaceholder} 
            onChange={onSearchChange}
            value={searchValue}
            variant="light"
          />
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <div key={index}>
            <label className="mb-1 block text-xs font-medium text-slate-500">
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
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div>
            {resultsCount} / {totalCount} results
          </div>
          {resultsCount !== totalCount && (
            <div>
              Filters applied
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBar