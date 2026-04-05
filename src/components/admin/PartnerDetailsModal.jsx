import Modal from '../ui/Modal'
import StatusBadge from '../ui/StatusBadge'

function PartnerDetailsModal({ isOpen, onClose, partner, onApprove, onReject }) {
  if (!partner) return null

  // Ensure partner has required fields with fallbacks
  const partnerData = {
    organizationName: partner.organizationName || 'N/A',
    contactName: partner.contactName || 'N/A',
    email: partner.email || 'N/A',
    phone: partner.phone || 'N/A',
    description: partner.description || 'No description provided',
    walletAddress: partner.walletAddress || 'N/A',
    status: partner.status || 'unknown',
    submittedDate: partner.submittedDate || 'N/A',
    reviewedAt: partner.reviewedAt || null,
    reviewedBy: partner.reviewedBy || null,
    accountCreated: partner.accountCreated || false,
    accountCreatedAt: partner.accountCreatedAt || null,
    accountCreationError: partner.accountCreationError || null,
    firebaseUid: partner.firebaseUid || null,
    id: partner.id || 'N/A'
  }

  const handleApprove = () => {
    onApprove?.(partnerData.id)
    onClose()
  }

  const handleReject = () => {
    onReject?.(partnerData.id)
    onClose()
  }

  const formatTimestamp = (value) => {
  if (!value) return 'N/A'
  // Firestore Timestamp object
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  // Already a string (old records saved as ISO string)
  if (typeof value === 'string') return value
  return 'N/A'
}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partner Request Details" size="lg">
      <div className="space-y-6">
        {/* Organization Info */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Organization Information</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Organization Name</label>
                <p className="mt-1 text-sm font-medium text-slate-900">{partnerData.organizationName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Person</label>
                <p className="mt-1 text-sm text-slate-700">{partnerData.contactName}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Email</label>
                <p className="mt-1 text-sm text-slate-700">{partnerData.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</label>
                <p className="mt-1 text-sm text-slate-700">{partnerData.phone}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Organization Description</label>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed">{partnerData.description}</p>
            </div>
          </div>
        </div>

      

        {/* Request Status */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Application Status</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Current Status</label>
                <div className="mt-1">
                  <StatusBadge status={partnerData.status} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted Date</label>
                <p className="mt-1 text-sm text-slate-700">{formatTimestamp(partnerData.submittedDate)}</p>
              </div>
            </div>
            {partnerData.reviewedAt && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Reviewed Date</label>
                  <p className="mt-1 text-sm text-slate-700">{formatTimestamp(partnerData.reviewedAt)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Reviewed By</label>
                  <p className="mt-1 text-sm text-slate-700">{partnerData.reviewedBy}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Status - Only show for approved partners */}
        {partnerData.status === 'approved' && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Account Status</h4>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Account Created</label>
                  <div className="mt-1">
                    {partnerData.accountCreated ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        ⏳ Processing
                      </span>
                    )}
                  </div>
                </div>
                {partnerData.accountCreatedAt && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Account Created At</label>
                    <p className="mt-1 text-sm text-slate-700">{formatTimestamp(partnerData.accountCreatedAt)}</p>
                  </div>
                )}
              </div>
              {partnerData.firebaseUid && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Firebase UID</label>
                  <p className="mt-1 text-sm font-mono text-slate-700">{partnerData.firebaseUid}</p>
                </div>
              )}
              {partnerData.accountCreationError && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Account Creation Error</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{partnerData.accountCreationError}</p>
                    <p className="text-xs text-red-600 mt-1">Contact system administrator if this error persists.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Information */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">System Information</h4>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Partner ID</label>
                <p className="mt-1 text-sm font-mono text-slate-700">{partnerData.id}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Type</label>
                <p className="mt-1 text-sm text-slate-700">Humanitarian Partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
          <div className="flex-1 flex gap-3">
            {partnerData.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Approve Partner
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Reject Request
                </button>
              </>
            )}
            {partner.status === 'reviewing' && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Approve Partner
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Reject Request
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PartnerDetailsModal