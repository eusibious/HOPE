import PartnerTopbar from './PartnerTopbar'
import PartnerSidebar from './PartnerSidebar'

function PartnerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <PartnerSidebar />
      <div className="flex flex-1 flex-col lg:ml-64">
        <PartnerTopbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default PartnerLayout