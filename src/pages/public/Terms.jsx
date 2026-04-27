import { PageContainer } from '../../components/common'

function Terms() {
  return (
    <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen">
      <PageContainer>
        <div className="py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-[#E8EDF5] mb-4">Terms of Use</h1>
            <p className="text-[#6B8CAE] text-sm mb-8">Last updated: April 25, 2026</p>
            
            <div className="space-y-8 text-[#6B8CAE]">
              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">1. Agreement to Terms</h2>
                <p className="leading-relaxed">
                  By accessing and using the HOPE platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">2. Use License</h2>
                <p className="leading-relaxed mb-3">
                  Permission is granted to temporarily download one copy of the materials (information or software) on HOPE for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">3. Disclaimer</h2>
                <p className="leading-relaxed">
                  The materials on HOPE's platform are provided on an 'as is' basis. HOPE makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">4. Limitations</h2>
                <p className="leading-relaxed">
                  In no event shall HOPE or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HOPE's platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">5. Accuracy of Materials</h2>
                <p className="leading-relaxed">
                  The materials appearing on HOPE's platform could include technical, typographical, or photographic errors. HOPE does not warrant that any of the materials on the platform are accurate, complete, or current. HOPE may make changes to the materials contained on its platform at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">6. Links</h2>
                <p className="leading-relaxed">
                  HOPE has not reviewed all of the sites linked to its platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by HOPE of the site. Use of any such linked website is at the user's own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">7. Modifications</h2>
                <p className="leading-relaxed">
                  HOPE may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-3">8. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions about these Terms of Use, please contact us at: nengminzatingku@gmail.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

export default Terms
