import { useState } from 'react'

function AmountSelector({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')
  const presetAmounts = [50, 100, 250, 500, 1000, 2500]

  const handleInputChange = (e) => {
    const rawValue = e.target.value
    
    // Allow empty input
    if (rawValue === '') {
      setInputValue('')
      onChange(0)
      return
    }

    // Remove leading zeros but keep decimal points
    const cleanValue = rawValue.replace(/^0+(?=\d)/, '')
    
    // Only allow valid number formats
    if (/^\d*\.?\d*$/.test(cleanValue)) {
      setInputValue(cleanValue)
      const numericValue = parseFloat(cleanValue) || 0
      onChange(numericValue)
    }
  }

  const handlePresetClick = (amount) => {
    setInputValue(amount.toString())
    onChange(amount)
  }

  // Update input value when value prop changes (from preset buttons)
  if (value?.toString() !== inputValue && !document.activeElement?.type === 'number') {
    setInputValue(value?.toString() || '')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Donation amount (USD)
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="0.00"
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

    </div>
  )
}

export default AmountSelector