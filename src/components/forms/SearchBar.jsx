function SearchBar({ placeholder = 'Search campaigns...', onChange, value = '', variant = 'dark' }) {
  const inputClassName =
    variant === 'light'
      ? 'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'
      : 'w-full rounded-lg border border-[#1E2D42] bg-[#111827] px-4 py-3 text-[#E8EDF5] placeholder-[#6B8CAE] transition-all focus:border-[#4FC3A1] focus:outline-none focus:ring-2 focus:ring-[#4FC3A1]/20'

  const iconClassName =
    variant === 'light'
      ? 'absolute right-3 top-3.5 h-5 w-5 text-slate-400'
      : 'absolute right-3 top-3.5 h-5 w-5 text-[#6B8CAE]'

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className={inputClassName}
      />
      <svg
        className={iconClassName}
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
