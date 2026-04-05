import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { StatCard } from '../../components/common'

const PartnerCard = ({ name, description }) => (
  <article className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 text-center group">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:from-blue-100 group-hover:to-slate-200 transition-all duration-300">
      <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{name}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </article>
)

const SupporterCard = ({ name, description }) => (
  <article className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 text-center group">
    <div className="w-16 h-16 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:from-cyan-100 group-hover:to-blue-100 transition-all duration-300">
      <div className="w-8 h-8 bg-cyan-600 rounded-lg"></div>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{name}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </article>
)

function Home() {
  const partners = []

  const supporters = []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl mb-6">
            Transforming Disaster Relief Through Blockchain
          </h1>
          <p className="text-lg leading-8 text-slate-600 lg:text-xl max-w-3xl mx-auto mb-8">
            We connect donors directly to disaster-affected communities using blockchain technology — ensuring every contribution is tracked, verified, and delivered with full transparency and zero leakage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Link to="/donate">
              <Button variant="primary" className="px-8 py-3 text-lg">
                Donate Now
              </Button>
            </Link> */}
            <Link to="/campaigns">
              <Button variant="ghost" className="px-8 py-3 text-lg">
                Explore Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-slate-900 mb-6 lg:text-4xl">
                Revolutionary Platform for Aid Distribution
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Traditional aid systems suffer from opacity, delays, and inefficiency. Our platform uses smart contracts and distributed ledger technology to route funds directly to verified beneficiaries — cutting administrative overhead, eliminating fraud, and giving donors real-time visibility into exactly where their money goes.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-700 text-lg">Transparent fund tracking and allocation on an immutable public ledger</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-700 text-lg">Real-time impact measurement with on-chain proof of delivery</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-700 text-lg">Secure blockchain technology protecting donors, NGOs, and beneficiaries alike</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold leading-tight text-slate-900 mb-4 lg:text-4xl">Platform Analytics</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Track our impact and growth as we transform disaster relief through innovation
            </p>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard 
              label="Total Campaigns Hosted" 
              value="0" 
              detail="Campaigns currently active on platform" 
              variant="info"
            />
            <StatCard 
              label="Partners Collaborated" 
              value="0" 
              detail="Verified humanitarian organizations" 
              variant="success"
            />
            <StatCard 
              label="Beneficiaries Onboarded" 
              value="0" 
              detail="People reached through our network" 
              variant="default"
            />
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold leading-tight text-slate-900 mb-4 lg:text-4xl">Our Partners</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Working together with organizations committed to making a difference
            </p>
          </div>
          {partners.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((partner, index) => (
                <PartnerCard key={index} name={partner.name} description={partner.description} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-dashed rounded"></div>
              </div>
              <p className="text-slate-500 text-lg">Partnership opportunities coming soon</p>
              <p className="text-slate-400 text-sm mt-2">We're actively building partnerships with humanitarian organizations</p>
            </div>
          )}
        </div>
      </section>

      {/* Supporters Section */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold leading-tight text-slate-900 mb-4 lg:text-4xl">Our Supporters</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Backed by individuals and organizations who believe in our mission
            </p>
          </div>
          {supporters.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {supporters.map((supporter, index) => (
                <SupporterCard key={index} name={supporter.name} description={supporter.description} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-dashed rounded"></div>
              </div>
              <p className="text-slate-500 text-lg">Supporter network growing soon</p>
              <p className="text-slate-400 text-sm mt-2">Building relationships with foundations and impact investors</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home