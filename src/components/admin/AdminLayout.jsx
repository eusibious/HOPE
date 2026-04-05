import Topbar from '../common/Topbar'
import AdminSidebar from './AdminSidebar'

function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout