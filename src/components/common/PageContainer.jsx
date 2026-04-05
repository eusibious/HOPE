function PageContainer({ 
  title, 
  subtitle, 
  breadcrumb,
  actions,
  children,
  maxWidth = '7xl' 
}) {
  const maxWidthClasses = {
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  }

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 py-6 sm:px-6`}>
      {/* Header Section */}
      {(title || subtitle || breadcrumb || actions) && (
        <div className="mb-8">
          {breadcrumb && (
            <div className="mb-4">
              {breadcrumb}
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {subtitle && (
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {subtitle}
                </p>
              )}
              {title && (
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {title}
                </h1>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}

export default PageContainer