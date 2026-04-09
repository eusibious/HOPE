import { useState } from 'react'
import { Button, TextInput, StatusIndicator } from '../../components/ui'
import FormField from '../../components/forms/FormField'
import { InstructionCard } from '../../components/common'

function ClaimAid() {
  const [proofHash, setProofHash] = useState('')
  const [eligibilityStatus, setEligibilityStatus] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const instructions = [
    'Find your proof code from the aid worker or official document you received',
    'Enter the code exactly as written in the box below',
    'Click "Check Eligibility" to verify your status',
    'If eligible, click "Claim Aid" to receive your assistance'
  ]

  const handleCheckEligibility = () => {
    if (!proofHash.trim()) return
    
    setIsChecking(true)
    setEligibilityStatus('checking')
    
    // Simulate API call
    setTimeout(() => {
      setIsChecking(false)
      // Simple check - for demo purposes
      if (proofHash.length >= 8) {
        setEligibilityStatus('eligible')
      } else {
        setEligibilityStatus('not_eligible')
      }
    }, 2000)
  }

  const handleClaimAid = () => {
    setIsClaiming(true)
    
    // Simulate claim process
    setTimeout(() => {
      setIsClaiming(false)
      setClaimed(true)
    }, 3000)
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="rounded-3xl border border-[#059669] bg-white p-8 shadow-sm text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#059669] flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Aid claimed successfully!</h1>
            <p className="mt-4 text-base text-slate-600">
              Your claim has been processed. You will receive your assistance within 2-3 business days.
            </p>
            <p className="mt-6 text-sm text-slate-500">
              Reference ID: {proofHash.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            Claim your aid
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Use your proof code to check eligibility and claim assistance
          </p>
        </div>

        <div className="space-y-8">
          <InstructionCard 
            title="How to claim your aid"
            steps={instructions}
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-6">
              <FormField
                label="Enter your proof code"
                helperText="This code was provided by your aid worker or in your official document"
              >
                <TextInput
                  placeholder="Enter code here (e.g. ABC123DEF)"
                  value={proofHash}
                  onChange={(e) => setProofHash(e.target.value.toUpperCase())}
                  className="text-lg font-mono"
                />
              </FormField>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCheckEligibility}
                  disabled={!proofHash.trim() || isChecking}
                  className="flex-1 py-3 text-base"
                >
                  {isChecking ? 'Checking...' : 'Check eligibility'}
                </Button>
              </div>

              {eligibilityStatus && (
                <StatusIndicator
                  status={eligibilityStatus}
                  message={
                    eligibilityStatus === 'eligible' 
                      ? 'You can now claim your assistance below'
                      : eligibilityStatus === 'checking'
                      ? 'Please wait while we verify your information'
                      : 'Please contact your aid worker for assistance'
                  }
                />
              )}

              {eligibilityStatus === 'eligible' && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Ready to claim
                  </h3>
                  <Button
                    variant="primary"
                    onClick={handleClaimAid}
                    disabled={isClaiming}
                    className="w-full py-4 text-lg font-semibold"
                  >
                    {isClaiming ? 'Processing claim...' : 'Claim my aid now'}
                  </Button>
                  <p className="mt-3 text-center text-sm text-slate-500">
                    Your claim will be processed immediately
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-base font-semibold text-amber-800">Need help?</h3>
                <p className="mt-2 text-sm text-amber-700">
                  If you don't have a proof code or are having trouble, please visit your local aid distribution center or contact the support phone number provided to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaimAid