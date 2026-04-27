import { PageContainer } from '../../components/common'

function HowItWorks() {
  return (
    <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen">
      <PageContainer>
        <div className="py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-[#E8EDF5] mb-4">How It Works</h1>
            <p className="text-[#6B8CAE] text-lg mb-12">
              Understand the HOPE platform workflow and how your donations create impact.
            </p>
            
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "NGO Creates Campaign",
                  description: "Verified organizations post disaster relief needs on the HOPE platform. Each campaign specifies the aid required, target beneficiaries, and delivery milestones."
                },
                {
                  step: "02",
                  title: "Donors Contribute",
                  description: "Donors browse campaigns and contribute funds. Smart contracts hold donations in escrow until specific milestones are achieved, ensuring funds are released only when conditions are met."
                },
                {
                  step: "03",
                  title: "Aid is Delivered",
                  description: "Verified partners deliver aid directly to beneficiaries. Each delivery is recorded on-chain with proof-of-delivery tokens, creating an immutable record."
                },
                {
                  step: "04",
                  title: "Impact Reported",
                  description: "Donors receive real-time on-chain proof of impact. Every transaction, delivery, and outcome is transparent and permanently recorded on the blockchain."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#111827] border border-[#1E2D42] rounded-lg p-8">
                  <div className="text-4xl font-bold text-[#2D4A6F] mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold text-[#E8EDF5] mb-3">{item.title}</h3>
                  <p className="text-[#6B8CAE] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

export default HowItWorks
