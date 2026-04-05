import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui'

function ActionDropdown({ actions, triggerLabel = 'Actions', size = 'sm' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Calculate dropdown position when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 176 // w-44 = 176px
      const dropdownHeight = 120 // Estimated height for 3 actions
      
      // Calculate horizontal position
      let leftPosition = rect.left
      if (leftPosition + dropdownWidth > window.innerWidth) {
        leftPosition = rect.right - dropdownWidth
      }
      
      // Calculate vertical position
      let topPosition = rect.bottom + 8
      if (topPosition + dropdownHeight > window.innerHeight) {
        topPosition = rect.top - dropdownHeight - 8
      }
      
      setDropdownPosition({
        top: Math.max(8, topPosition), // Ensure it's not above viewport
        left: Math.max(8, Math.min(leftPosition, window.innerWidth - dropdownWidth - 8))
      })
    }
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        className={sizeClasses[size]}
        onClick={handleToggle}
      >
        {triggerLabel}
        <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </Button>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed z-50 w-44 rounded-lg border border-slate-200 bg-white shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <div className="py-1">
              {actions.map((action, index) => {
                const colorClasses = {
                  primary: 'text-[#1E3A8A] hover:bg-[#1E3A8A]/5',
                  success: 'text-[#059669] hover:bg-[#059669]/5',
                  danger: 'text-red-600 hover:bg-red-50',
                  warning: 'text-amber-600 hover:bg-amber-50',
                  default: 'text-slate-700 hover:bg-slate-50',
                }

                return (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick()
                      setIsOpen(false)
                    }}
                    disabled={action.disabled}
                    className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                      action.disabled 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : colorClasses[action.variant] || colorClasses.default
                    }`}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </button>
                )
              })}
            </div>
        </div>
      )}
    </div>
  )
}

export default ActionDropdown