import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 w-full mt-auto">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-2">
          {/* Left Column */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">HOPE</h3>
            <p className="text-slate-300 leading-relaxed">
              A blockchain-powered relief platform ensuring secure, transparent, and corruption-free distribution of humanitarian aid.
            </p>
          </div>
          
          {/* Right Column */}
          <div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
              <div className="space-y-2">
                <p className="text-slate-300">
                  <span className="font-medium">Email:</span> nengminzatingku@gmail.com
                </p>
                <p className="text-slate-300">
                  <span className="font-medium">Phone:</span> +91 1111111111
                </p>
              </div>
            </div>
            
            <div>
              {/* <div className="mb-4">
                <Link
                  to="/donate"
                  className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  Donate Now
                </Link>
              </div> */}
              <div className="space-y-2">
                <Link 
                  to="/admin/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Admin Login 
                </Link>
                <Link 
                  to="/partner/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Partner Login 
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
