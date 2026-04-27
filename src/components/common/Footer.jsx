import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-[#0A0F1E] text-[#6B8CAE] w-full border-t border-[#1E2D42]">
      {/* Main Footer Content */}
      <div className="w-full px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-12 md:grid-cols-4">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-[#4FC3A1] rounded" />
              <h3 className="text-2xl font-bold text-[#E8EDF5]">HOPE</h3>
            </div>
            <p className="text-[#6B8CAE] text-sm leading-relaxed mb-6">
              A blockchain-powered relief platform ensuring secure, transparent, and corruption-free distribution of humanitarian aid.
            </p>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-[#1E2D42] rounded-lg flex items-center justify-center hover:bg-[#2D4A6F] transition-colors cursor-pointer" />
              <div className="w-10 h-10 bg-[#1E2D42] rounded-lg flex items-center justify-center hover:bg-[#2D4A6F] transition-colors cursor-pointer" />
              <div className="w-10 h-10 bg-[#1E2D42] rounded-lg flex items-center justify-center hover:bg-[#2D4A6F] transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Navigate Column */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] text-[#4FC3A1] uppercase mb-6">Navigate</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Home</Link></li>
              <li><Link to="/campaigns" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Campaigns</Link></li>
              <li><Link to="/about" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">About Us</Link></li>
              <li><Link to="/blog" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Blog</Link></li>
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] text-[#4FC3A1] uppercase mb-6">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/partner-register" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Partner with us</Link></li>
              <li><Link to="/admin/login" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Admin login</Link></li>
              <li><Link to="/partner/login" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Partner login</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] text-[#4FC3A1] uppercase mb-6">Contact</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold tracking-[0.1em] text-[#6B8CAE] uppercase mb-1">Email</p>
                <p className="text-[#6B8CAE] text-sm">nengminzatingku@gmail.com</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.1em] text-[#6B8CAE] uppercase mb-1">Phone</p>
                <p className="text-[#6B8CAE] text-sm">+91 1111111111</p>
              </div>
              <Link 
                to="/partner-register"
                className="inline-block border-2 border-[#4FC3A1] text-[#4FC3A1] px-6 py-3 rounded-lg hover:bg-[#4FC3A1] hover:text-[#0A0F1E] transition-all text-sm font-semibold mt-2"
              >
                Become a partner →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-[#1E2D42] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#6B8CAE] text-sm">
            © 2026 HOPE. All rights reserved. Built on public blockchain infrastructure.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Privacy policy</Link>
            <Link to="/terms" className="text-[#6B8CAE] hover:text-[#4FC3A1] transition-colors text-sm">Terms of use</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
