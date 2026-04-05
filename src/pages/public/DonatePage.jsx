import { useState } from 'react'
import { Button } from '../../components/ui'
import AmountSelector from '../../components/forms/AmountSelector'
import { GasEstimate, SecurityNotice, CampaignSummary } from '../../components/common'

function DonatePage() {
  const [amount, setAmount] = useState(100)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [transactionError, setTransactionError] = useState('')

  
  const campaign = {
    title: 'Horn of Africa Drought Response',
    location: 'Ethiopia · Kenya · Somalia',
    ngo: 'International Humanitarian Alliance',
    image: 'https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=300&h=300&fit=crop',
    raised: '$0',
    target: '$0',
    progress: 0,
  }

  const impactPreview = [
    { label: 'Meals funded', value: Math.max(1, Math.round(amount / 4)) },
    { label: 'Clean water days', value: Math.max(1, Math.round(amount / 3)) },
    { label: 'Emergency kits', value: Math.max(1, Math.round(amount / 25)) },
  ]

  const recentSupporters = [
    { name: 'A. Rivera', amount: 120 },
    { name: 'S. Kumar', amount: 75 },
    { name: 'Anonymous', amount: 200 },
  ]

  const shortWalletAddress =
    walletAddress && walletAddress.length > 12
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : walletAddress

  const handleWalletConnect = async () => {
    setConnectionError('')
    setTransactionError('')
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      setConnectionError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        setWalletConnected(true)
        setWalletAddress(accounts[0])
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      if (error.code === 4001) {
        setConnectionError('Connection rejected by user.')
      } else {
        setConnectionError('Failed to connect to MetaMask. Please try again.')
      }
    }
  }

  const handleWalletDisconnect = async () => {
    try {
     
      if (window.ethereum && window.ethereum.request) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{
            eth_accounts: {}
          }]
        })
      }
    } catch (error) {
      
      console.log('Permission revocation not supported:', error)
    }
    
    // Clear local state
    setWalletConnected(false)
    setWalletAddress('')
    setConnectionError('')
    setTransactionError('')
    
    // Provide user feedback
    alert('Wallet disconnected from HOPE platform. To fully revoke access, please also disconnect from MetaMask settings.')
  }

  const handleDonate = async () => {
    setIsProcessing(true)
    setTransactionError('')

    try {
      
      const ethAmount = (amount / 3000).toFixed(6) 
      const valueInWei = (parseFloat(ethAmount) * Math.pow(10, 18)).toString(16) 

     
      const recipientAddress = '0xe06dcD763CB6681Ab75704E4Edf69f912Aee7D84' // Dummy address

      const transactionParameters = {
        to: recipientAddress,
        from: walletAddress,
        value: '0x' + valueInWei,
        gas: '0x5208', 
      }

      // Send transaction through MetaMask
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })

      console.log('Transaction hash:', txHash)
      alert(`Donation successful! Transaction hash: ${txHash}\nAmount: ${ethAmount} ETH (~$${amount})`)
      
    } catch (error) {
      console.error('Transaction error:', error)
      if (error.code === 4001) {
        setTransactionError('Transaction was rejected by user.')
      } else if (error.code === -32603) {
        setTransactionError('Insufficient funds for transaction.')
      } else {
        setTransactionError('Transaction failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative overflow-hidden py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative">
        <section className="mb-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Make a donation
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Support verified humanitarian aid
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-100 sm:text-base">
            Your contribution goes directly to beneficiaries with full transparency and on-chain verification.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {impactPreview.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-cyan-100">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Donation details</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Secure checkout
                </span>
              </div>

              <div className="mt-6">
                <AmountSelector value={amount} onChange={setAmount} />
              </div>

              <div className="mt-6">
                <GasEstimate amount={amount} />
              </div>

              <div className="mt-8 space-y-4">
                {!walletConnected ? (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      onClick={handleWalletConnect}
                      className="w-full py-3 text-base"
                    >
                      Connect MetaMask wallet
                    </Button>
                    {connectionError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-red-800">Connection Error</span>
                        </div>
                        <p className="mt-1 text-sm text-red-700">{connectionError}</p>
                        {connectionError.includes('not installed') && (
                          <a
                            href="https://metamask.io/download/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-red-800 underline hover:text-red-900"
                          >
                            Download MetaMask
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          MetaMask connected: {shortWalletAddress}
                        </span>
                      </div>
                      <button
                        onClick={handleWalletDisconnect}
                        className="text-xs text-slate-600 underline hover:text-slate-800"
                        title="Disconnect wallet"
                      >
                        Disconnect
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleDonate}
                      disabled={isProcessing || amount <= 0}
                      className="w-full py-3 text-base"
                    >
                      {isProcessing ? 'Processing transaction...' : `Donate $${amount}`}
                    </Button>
                    {transactionError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-red-800">Transaction Error</span>
                        </div>
                        <p className="mt-1 text-sm text-red-700">{transactionError}</p>
                      </div>
                    )}
                  </div>
                )}

                <Button variant="ghost" className="w-full">
                  View transaction history
                </Button>
              </div>
            </section>

            <SecurityNotice />
          </div>

          <aside className="space-y-6">
            <CampaignSummary campaign={campaign} />

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Impact estimate</h3>
              <div className="mt-4 space-y-3">
                {impactPreview.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Recent supporters</h3>
              <div className="mt-4 space-y-3">
                {recentSupporters.map((supporter) => (
                  <div key={supporter.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{supporter.name}</span>
                    <span className="text-sm font-semibold text-slate-900">${supporter.amount}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default DonatePage