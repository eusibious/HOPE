import { Button } from '../ui'

function PreviewModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl w-[90%] max-w-3xl max-h-[90%] overflow-hidden shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
