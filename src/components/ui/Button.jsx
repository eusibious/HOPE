function Button({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    ghost: 'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500',
    accent: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  return (
    <Component 
      className={`px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]} ${className}`} 
      {...props} 
    />
  )
}

export default Button
