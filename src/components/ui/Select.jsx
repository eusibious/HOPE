function Select({ options, value, onChange, error, placeholder, className = '', ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 appearance-none bg-white ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default Select