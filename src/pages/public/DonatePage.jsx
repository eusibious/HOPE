import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui'
import {  SecurityNotice } from '../../components/common'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import HOPECampaignABI from '../../abi/HOPECampaign.json'
import ERC20ABI from '../../abi/ERC20.json'

function DonatePage() {
  const { address } = useParams()

  const [inputAmount, setInputAmount] = useState(100)
  const [selectedCurrency, setSelectedCurrency] = useState('USD')

  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [transactionError, setTransactionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [networkName, setNetworkName] = useState('')

  const [usdToInrRate, setUsdToInrRate] = useState(null)
  const [rateLoading, setRateLoading] = useState(true)
  const [rateError, setRateError] = useState('')

  const shortWalletAddress =
    walletAddress && walletAddress.length > 12
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : walletAddress

  const usdAmount = useMemo(() => {
    const value = Number(inputAmount || 0)
    if (!value || value <= 0) return 0

    if (selectedCurrency === 'USD') return value
    if (!usdToInrRate) return 0

    return value / usdToInrRate
  }, [inputAmount, selectedCurrency, usdToInrRate])

  const inrAmount = useMemo(() => {
    const value = Number(inputAmount || 0)
    if (!value || value <= 0) return 0

    if (selectedCurrency === 'INR') return value
    if (!usdToInrRate) return 0

    return value * usdToInrRate
  }, [inputAmount, selectedCurrency, usdToInrRate])

  const usdcAmount = usdAmount

  const formattedUsdAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(usdAmount || 0)

  const formattedInrAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(inrAmount || 0)

  const getReadableError = (error) => {
    if (error?.code === 4001) return 'Transaction rejected by user.'
    if (error?.info?.error?.message) return error.info.error.message
    if (error?.reason) return error.reason
    if (error?.shortMessage) return error.shortMessage
    if (error?.message) return error.message
    return 'Transaction failed. Please try again.'
  }

  const fetchUsdToInrRate = async () => {
    try {
      setRateError('')
      setRateLoading(true)

      const response = await fetch(
        'https://api.frankfurter.dev/v2/rates?base=USD&quotes=INR'
      )

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate')
      }

      const data = await response.json()
      const rate = data?.[0]?.rate

      if (!rate || Number(rate) <= 0) {
        throw new Error('Invalid INR exchange rate received')
      }

      setUsdToInrRate(Number(rate))
    } catch (error) {
      console.error('Exchange rate fetch failed:', error)
      setRateError('Unable to load live conversion right now.')
      setUsdToInrRate(null)
    } finally {
      setRateLoading(false)
    }
  }

  const ensureHardhatNetwork = async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    if (chainId !== '0x7a69') {
      throw new Error('Please switch MetaMask to the local Hardhat network (Chain ID 31337).')
    }

    setNetworkName('Hardhat Local')
  }

  const checkExistingConnection = async () => {
    if (!window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setWalletConnected(true)
        setWalletAddress(accounts[0])
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error)
    }
  }

  useEffect(() => {
    checkExistingConnection()
    fetchUsdToInrRate()

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletConnected(false)
        setWalletAddress('')
      } else {
        setWalletConnected(true)
        setWalletAddress(accounts[0])
      }
      setConnectionError('')
      setTransactionError('')
      setSuccessMessage('')
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    const rateInterval = setInterval(fetchUsdToInrRate, 300000)

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      clearInterval(rateInterval)
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleWalletConnect = async () => {
    setConnectionError('')
    setTransactionError('')
    setSuccessMessage('')

    if (typeof window.ethereum === 'undefined') {
      setConnectionError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        setWalletConnected(true)
        setWalletAddress(accounts[0])
        await ensureHardhatNetwork()
      } else {
        setConnectionError('No MetaMask account found.')
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      setConnectionError(getReadableError(error))
    }
  }

  const handleWalletDisconnect = async () => {
    try {
      if (window.ethereum?.request) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      }
    } catch (error) {
      console.log('Permission revocation not supported:', error)
    }

    setWalletConnected(false)
    setWalletAddress('')
    setConnectionError('')
    setTransactionError('')
    setSuccessMessage('')
    setNetworkName('')

    alert(
      'Wallet disconnected from HOPE platform. To fully revoke access, please also disconnect from MetaMask settings.'
    )
  }

  const handleDonate = async () => {
    setTransactionError('')
    setConnectionError('')
    setSuccessMessage('')

    if (!window.ethereum) {
      setTransactionError('MetaMask is not installed.')
      return
    }

    if (!walletConnected || !walletAddress) {
      setTransactionError('Please connect your wallet first.')
      return
    }

    if (!address || !ethers.isAddress(address)) {
      setTransactionError('Invalid or missing campaign address in the URL.')
      return
    }

    if (!inputAmount || Number(inputAmount) <= 0) {
      setTransactionError('Please enter a valid donation amount.')
      return
    }

    if (!usdcAmount || usdcAmount <= 0) {
      setTransactionError('Unable to calculate donation amount in USDC.')
      return
    }

    setIsProcessing(true)

    try {
      await ensureHardhatNetwork()

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const usdcAddress = import.meta.env.VITE_USDC_ADDRESS

      if (!usdcAddress || !ethers.isAddress(usdcAddress)) {
        throw new Error('Invalid VITE_USDC_ADDRESS in frontend environment variables.')
      }

      const usdcContract = new ethers.Contract(usdcAddress, ERC20ABI.abi, signer)
      const campaignContract = new ethers.Contract(address, HOPECampaignABI.abi, signer)

      const amountInUnits = ethers.parseUnits(usdcAmount.toFixed(6), 6)

      const usdcBalance = await usdcContract.balanceOf(walletAddress)

      if (usdcBalance < amountInUnits) {
        throw new Error(`Insufficient USDC balance. You need ${usdcAmount.toFixed(2)} USDC in your wallet.`)
      }

      const currentAllowance = await usdcContract.allowance(walletAddress, address)

      if (currentAllowance < amountInUnits) {
        const approveTx = await usdcContract.approve(address, amountInUnits)
        await approveTx.wait()
      }

      const donateTx = await campaignContract.donate(amountInUnits)
      await donateTx.wait()

      setSuccessMessage(
        `Donation successful. ${usdcAmount.toFixed(2)} USDC sent (${formattedUsdAmount} / ${formattedInrAmount}).`
      )
    } catch (error) {
      console.error('Donation error:', error)
      setTransactionError(getReadableError(error))
    } finally {
      setIsProcessing(false)
    }
  }

  const CurrencyToggle = ({ value, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
      }`}
    >
      {value}
    </button>
  )

  const SummaryRow = ({ label, value, strong = false }) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-right ${strong ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )

  return (
    <div className="relative overflow-hidden py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-6 text-white shadow-xl sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Make a donation
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Support verified humanitarian aid
            </h1>
            <p className="mt-3 text-sm text-slate-100 sm:text-base">
              Donate with full transparency. Enter your amount in INR or USD, see the live conversion, and complete the transaction on-chain in USDC.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
                Live FX conversion
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
                USDC settlement
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
                Wallet-secured checkout
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Donation details</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose your display currency and review the live conversion before paying.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Secure checkout
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign address</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-700">{address || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">USDC token</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-700">{import.meta.env.VITE_USDC_ADDRESS}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement currency</p>
                    <p className="mt-1 font-medium text-slate-800">USDC</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network</p>
                    <p className="mt-1 font-medium text-slate-800">{networkName || 'Connect wallet to verify'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Display currency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <CurrencyToggle
                      value="USD"
                      active={selectedCurrency === 'USD'}
                      onClick={() => setSelectedCurrency('USD')}
                    />
                    <CurrencyToggle
                      value="INR"
                      active={selectedCurrency === 'INR'}
                      onClick={() => setSelectedCurrency('INR')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Enter amount ({selectedCurrency})
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      {selectedCurrency === 'USD' ? '$' : '₹'}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-4 text-lg font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter amount in ${selectedCurrency}`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    The contract will still receive the final amount in USDC.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Live conversion preview</h3>

                  <div className="space-y-1">
                    <SummaryRow
                      label="You enter"
                      value={selectedCurrency === 'USD' ? formattedUsdAmount : formattedInrAmount}
                      strong
                    />
                    <SummaryRow
                      label="Equivalent value"
                      value={selectedCurrency === 'USD' ? formattedInrAmount : formattedUsdAmount}
                    />
                    <SummaryRow
                      label="Charged on-chain"
                      value={`${usdcAmount.toFixed(2)} USDC`}
                      strong
                    />
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    {rateLoading ? (
                      <p className="text-sm text-slate-500">Loading live exchange rate...</p>
                    ) : rateError ? (
                      <p className="text-sm text-red-600">{rateError}</p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Live rate used: <span className="font-medium text-slate-700">1 USD ≈ ₹{usdToInrRate?.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              
            </section>

            <SecurityNotice />
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-slate-900">Payment summary</h2>
              <p className="text-sm text-slate-500 mt-1">
                Review before you approve the transaction in MetaMask.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <SummaryRow
                  label="Display amount"
                  value={selectedCurrency === 'USD' ? formattedUsdAmount : formattedInrAmount}
                  strong
                />
                <SummaryRow
                  label="Converted value"
                  value={selectedCurrency === 'USD' ? formattedInrAmount : formattedUsdAmount}
                />
                <SummaryRow
                  label="Settlement token"
                  value={`${usdcAmount.toFixed(2)} USDC`}
                  strong
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Wallet status
                </p>

                {!walletConnected ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-medium text-amber-800">Wallet not connected</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Connect MetaMask to continue with the donation.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleWalletConnect}
                      className="w-full py-3 text-base"
                    >
                      Connect MetaMask wallet
                    </Button>

                    {connectionError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-800">Connection Error</p>
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
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">Wallet connected</p>
                      <p className="mt-1 text-sm text-slate-700">{shortWalletAddress}</p>
                    </div>

                    <button
                      onClick={handleWalletDisconnect}
                      className="w-full text-xs text-slate-600 underline hover:text-slate-800"
                      title="Disconnect wallet"
                    >
                      Disconnect wallet
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <Button
                  variant="primary"
                  onClick={handleDonate}
                  disabled={isProcessing || Number(inputAmount) <= 0 || !usdcAmount}
                  className="w-full py-3 text-base"
                >
                  {isProcessing
                    ? 'Processing transaction...'
                    : selectedCurrency === 'USD'
                    ? `Donate ${formattedUsdAmount}`
                    : `Donate ${formattedInrAmount}`}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  You will confirm the final transaction in MetaMask.
                </p>
              </div>

              {transactionError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-800">Transaction Error</p>
                  <p className="mt-1 text-sm text-red-700 break-words">{transactionError}</p>
                </div>
              )}

              {successMessage && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-800">Success</p>
                  <p className="mt-1 text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default DonatePage