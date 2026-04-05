function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            About HOPE
          </h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                What is HOPE?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
              HOPE is a blockchain-enabled digital platform designed to improve transparency, accountability, and efficiency in humanitarian aid distribution and crowdfunding campaigns. The platform connects donors, non-governmental organizations (NGOs), and beneficiaries through a secure and transparent system where charitable campaigns can be created, monitored, and funded.              
              </p> 
            </div>
              <img src="src/assets/HOPE.png" alt="HOPE" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
The mission of HOPE is to empower transparent and trustworthy humanitarian support systems by utilizing blockchain technology and secure digital platforms. The platform seeks to eliminate inefficiencies and misuse in traditional donation systems by ensuring that every contribution is traceable, verifiable, and directed toward genuine beneficiaries. Through collaboration with NGOs and community organizations, HOPE strives to create a reliable digital infrastructure that promotes responsible charity and maximizes the impact of every donation.            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Vision
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our vision is to create a world where transparency and accountability are at the core of all humanitarian efforts. We aim to leverage the power of blockchain technology to build a more trusted and efficient system for charitable giving, ensuring that every donation makes a meaningful impact.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About