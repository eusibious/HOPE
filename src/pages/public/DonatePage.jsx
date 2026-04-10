import {useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import AmountSelector from '../../components/forms/AmountSelector'
import { GasEstimate, SecurityNotice, CampaignSummary } from '../../components/common'
import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import HOPECampaignABI from '../../abi/HOPECampaign.json'
import ERC20ABI from '../../abi/ERC20.json'

function DonatePage() {
  const { address } = useParams()

  const [amount, setAmount] = useState(100)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [transactionError, setTransactionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [networkName, setNetworkName] = useState('')
  

  
  const shortWalletAddress =
    walletAddress && walletAddress.length > 12
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : walletAddress

  const getReadableError = (error) => {
    if (error?.code === 4001) return 'Transaction rejected by user.'
    if (error?.info?.error?.message) return error.info.error.message
    if (error?.reason) return error.reason
    if (error?.shortMessage) return error.shortMessage
    if (error?.message) return error.message
    return 'Transaction failed. Please try again.'
  }

  const ensureHardhatNetwork = async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    // Hardhat local default chainId = 31337 = 0x7a69
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

    if (!window.ethereum) return

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

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
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
      if (window.ethereum && window.ethereum.request) {
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

    if (!amount || Number(amount) <= 0) {
      setTransactionError('Please enter a valid donation amount.')
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

      // USDC uses 6 decimals
      const amountInUnits = ethers.parseUnits(amount.toString(), 6)

      console.log("Connected wallet:", walletAddress)
      console.log("Campaign address:", address)
      console.log("USDC address:", usdcAddress)


      const usdcBalance = await usdcContract.balanceOf(walletAddress)

      console.log("USDC balance raw:", usdcBalance.toString())
      console.log("USDC balance formatted:", ethers.formatUnits(usdcBalance, 6))

      if (usdcBalance < amountInUnits) {
        throw new Error(`Insufficient USDC balance. You need ${amount} USDC in your wallet.`)
      }

      const currentAllowance = await usdcContract.allowance(walletAddress, address)

      if (currentAllowance < amountInUnits) {
        const approveTx = await usdcContract.approve(address, amountInUnits)
        await approveTx.wait()
      }

      const donateTx = await campaignContract.donate(amountInUnits)
      await donateTx.wait()

      setSuccessMessage(`Donation successful! Donated $${amount} USDC`)
    } catch (error) {
      console.error('Donation error:', error)
      setTransactionError(getReadableError(error))
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

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Campaign address:</span>{' '}
                  <span className="break-all">{address || 'Not found'}</span>
                </p>
                <p className="mt-1">
                  <span className="font-semibold">USDC token:</span>{' '}
                  <span className="break-all">{import.meta.env.VITE_USDC_ADDRESS}</span>
                </p>
                {networkName && (
                  <p className="mt-1">
                    <span className="font-semibold">Network:</span> {networkName}
                  </p>
                )}
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
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
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
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-red-800">Transaction Error</span>
                        </div>
                        <p className="mt-1 text-sm text-red-700 break-words">{transactionError}</p>
                      </div>
                    )}

                    {successMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-emerald-800">Success</span>
                        </div>
                        <p className="mt-1 text-sm text-emerald-700">{successMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <SecurityNotice />
          </div>

        </div>
      </div>
    </div>
  )
}

export default DonatePage
