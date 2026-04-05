function TextInput({ label, placeholder, value, onChange, error, className = '', ...props }) {
  const hasCustomErrorStyling = className.includes('border-blue-') || className.includes('border-red-');
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          block w-full px-3 py-2 border border-slate-300 rounded-lg 
          placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:border-blue-500 transition-colors
          ${error && !hasCustomErrorStyling ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
          ${className}
        `}
        {...props}
      />
      {error && !hasCustomErrorStyling && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {error && hasCustomErrorStyling && className.includes('border-blue-') && (
        <p className="text-sm text-blue-600">{error}</p>
      )}
      {error && hasCustomErrorStyling && className.includes('border-red-') && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default TextInput