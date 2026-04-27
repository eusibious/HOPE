import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { StatCard } from '../../components/common'

const FeatureCard = ({ title, description, iconColor }) => (
  <article className="bg-[#111827] rounded-xl border border-[#1E2D42] p-8 transition-all duration-300">
    <div className={`w-12 h-12 ${iconColor} rounded-lg mb-6 flex items-center justify-center`}>
      <div className="w-6 h-6 bg-white/20 rounded" />
    </div>
    <h3 className="text-xl font-bold text-[#E8EDF5] mb-4">{title}</h3>
    <p className="text-[#6B8CAE] leading-relaxed">{description}</p>
  </article>
)

function Home() {
  return (
    <div className="w-screen bg-[#0A0F1E] font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden w-full">
        {/* Background Decorative Element */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#1E2D42] rounded-full blur-[120px] opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-3 h-3 bg-[#6B8CAE] rounded-full" />
            <span className="text-xs font-semibold tracking-widest text-[#6B8CAE] uppercase">
              HOPE — HUMANITARIAN ON-CHAIN PLATFORM
            </span>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full bg-[rgba(79,195,161,0.15)] border border-[#4FC3A1]/20 mb-8">
            <span className="text-[#4FC3A1] text-sm font-medium tracking-wide">BLOCKCHAIN-POWERED AID</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-[#E8EDF5] lg:text-7xl mb-8 max-w-4xl leading-[1.1]">
            Disaster relief, tracked on-chain. <br />
            Every rupee, every mile.
          </h1>
          
          <p className="text-xl leading-relaxed text-[#6B8CAE] max-w-2xl mb-12">
            Smart contracts connect donors directly to verified beneficiaries — with zero 
            overhead, full transparency, and real-time proof of delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link to="/campaigns">
              <Button className="bg-[#4FC3A1] hover:bg-[#3db08f] text-[#0A0F1E] font-bold px-10 py-4 rounded-lg transition-all">
                Explore Campaigns
              </Button>
            </Link>
            <Link to="/partner-register">
              <Button variant="outline" className="border-[#1E2D42] text-[#E8EDF5] hover:bg-[#1E2D42] px-10 py-4 rounded-lg">
                Partner with us
              </Button>
            </Link>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111827] border border-[#1E2D42] p-8 rounded-xl text-center">
              <div className="text-4xl font-bold text-[#E8EDF5] mb-2">0</div>
              <div className="text-[#6B8CAE] text-sm uppercase tracking-wider">Campaigns live</div>
            </div>
            <div className="bg-[#111827] border border-[#1E2D42] p-8 rounded-xl text-center">
              <div className="text-4xl font-bold text-[#E8EDF5] mb-2">0</div>
              <div className="text-[#6B8CAE] text-sm uppercase tracking-wider">Partners onboarded</div>
            </div>
            <div className="bg-[#111827] border border-[#1E2D42] p-8 rounded-xl text-center">
              <div className="text-4xl font-bold text-[#E8EDF5] mb-2">0</div>
              <div className="text-[#6B8CAE] text-sm uppercase tracking-wider">Beneficiaries reached</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Why Hope Section */}
      <section className="py-24 bg-[#111827]/50 border-y border-[#1E2D42] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#6B8CAE] text-xs font-bold tracking-[0.2em] uppercase">Why Hope</span>
            <h2 className="text-4xl font-bold text-[#E8EDF5] mt-4">Aid that works the way it should</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Immutable ledger" 
              description="Every transaction recorded permanently — no edits, no erasures." 
              iconColor="bg-blue-500"
            />
            <FeatureCard 
              title="Direct delivery" 
              description="Smart contracts bypass middlemen and route funds straight to people in need." 
              iconColor="bg-[#4FC3A1]"
            />
            <FeatureCard 
              title="Proof of impact" 
              description="On-chain delivery proofs so donors see real outcomes, not just promises." 
              iconColor="bg-purple-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#0A0F1E] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-1 bg-[#4FC3A1]" />
            <span className="text-[#6B8CAE] text-xs font-bold tracking-[0.2em] uppercase">How It Works</span>
          </div>

          <div className="grid md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "NGO creates campaign", desc: "Verified organizations post disaster relief needs" },
              { step: "02", title: "Donors contribute", desc: "Funds locked in smart contracts until milestones are met" },
              { step: "03", title: "Aid is delivered", desc: "Beneficiaries receive direct transfers on verified delivery" },
              { step: "04", title: "Impact reported", desc: "On-chain proof shared with donors in real-time" }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-[#2D4A6F] mb-8">{item.step}</div>
                <h4 className="text-lg font-bold text-[#E8EDF5] mb-3">{item.title}</h4>
                <p className="text-[#6B8CAE] text-sm leading-relaxed">{item.desc}</p>
                {idx !== 3 && (
                  <div className="hidden lg:block absolute top-12 right-[-24px] w-px h-32 bg-[#1E2D42]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Footer Strip */}
      <section className="bg-[#E8EDF5] py-8 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[#0A0F1E] font-medium text-lg">
            Ready to make a difference? Partner with HOPE today.
          </p>
          <Link to="/partner-register">
            <Button className="bg-[#1E2D42] text-white px-8 py-3 rounded-md flex items-center gap-2">
              Get started →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home