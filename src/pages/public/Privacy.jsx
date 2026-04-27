import { PageContainer } from '../../components/common'

function Privacy() {
  return (
    <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen">
      <PageContainer>
        <div className="py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-[#E8EDF5] mb-4">Privacy Policy</h1>
            <p className="text-[#6B8CAE] text-sm mb-8">Last updated: April 25, 2026</p>
            
            <div className="space-y-8 text-[#6B8CAE]">
              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">1. Introduction</h2>
                <p className="leading-relaxed">
                  The HOPE platform ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">2. Information We Collect</h2>
                <p className="leading-relaxed mb-3">
                  We may collect information about you in a variety of ways. The information we may collect on the platform includes:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Your wallet address and transaction history</li>
                  <li>Email address and contact information</li>
                  <li>Campaign participation data</li>
                  <li>Device and browser information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">3. Use of Your Information</h2>
                <p className="leading-relaxed">
                  Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3">
                  <li>Process your transactions and send related information</li>
                  <li>Facilitate campaign management and fund distribution</li>
                  <li>Provide customer support</li>
                  <li>Improve our platform and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">4. Security</h2>
                <p className="leading-relaxed">
                  We use blockchain technology and encryption to protect your data. However, no method of transmission over the internet or electronic storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">5. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have questions or comments about this Privacy Policy, please contact us at: nengminzatingku@gmail.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

export default Privacy
