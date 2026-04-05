function FileUpload({ accept, multiple, onChange, error }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    onChange(files)
  }

  return (
    <div className={`relative rounded-lg border-2 border-dashed p-6 transition-all ${
      error 
        ? 'border-red-300 bg-red-50' 
        : 'border-slate-300 bg-slate-50 hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5'
    }`}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div className="text-center">
        <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          Upload verification documents
        </p>
        <p className="mt-1 text-xs text-slate-500">
          PNG, JPG, PDF up to 10MB each
        </p>
      </div>
    </div>
  )
}

export default FileUpload