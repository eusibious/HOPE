function SearchBar({ placeholder = 'Search campaigns...', onChange, value = '' }) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 transition-all focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/10"
      />
      <svg
        className="absolute right-3 top-3 h-4 w-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
}

export default SearchBar
