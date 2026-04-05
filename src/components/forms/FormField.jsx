function FormField({ label, error, helperText, required, children }) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="required"></span>}
      </label>
      {children}
      {error && (
        <p className="form-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="form-help">{helperText}</p>
      )}
    </div>
  )
}

export default FormField