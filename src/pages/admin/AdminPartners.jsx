import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import PartnerDetailsModal from '../../components/admin/PartnerDetailsModal';
import AdminSearchBar from '../../components/admin/AdminSearchBar';
import Select from '../../components/ui/Select';

const AdminPartners = () => {
  const {
    partners,
    loading,
    error,
    approvePartner,
    rejectPartner,
    partnerFilters,
    updatePartnerFilters,
  } = useAdmin();
  const [selectedPartner, setSelectedPartner] = useState(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleSearchChange = (event) => {
    updatePartnerFilters({ search: event.target.value });
  };

  const filteredPartners = partners.filter((partner) => {
    const statusMatch = !partnerFilters.status || partner.status === partnerFilters.status;
    const search = (partnerFilters.search || '').trim().toLowerCase();
    const organizationName = (partner.organizationName || '').toLowerCase();
    const email = (partner.email || '').toLowerCase();
    const searchMatch = !search || organizationName.includes(search) || email.includes(search);

    return statusMatch && searchMatch;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Partner Management</h1>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search for partners
            </label>
            <AdminSearchBar
              placeholder="Search for partners..."
              value={partnerFilters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filter by status
            </label>
            <Select
              options={statusFilters}
              value={partnerFilters.status}
              onChange={(event) => updatePartnerFilters({ status: event.target.value })}
              placeholder="All statuses"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-2 py-3 font-semibold text-slate-900">Organization Name</th>
                <th className="px-2 py-3 font-semibold text-slate-900">Contact Email</th>
                <th className="px-2 py-3 font-semibold text-slate-900">Status</th>
                <th className="px-2 py-3 text-right font-semibold text-slate-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-slate-500">
                    Loading partners...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-slate-500">
                    No partners found.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="border-b border-slate-100">
                    <td className="px-2 py-4 text-slate-900">{partner.organizationName || 'N/A'}</td>
                    <td className="px-2 py-4 text-slate-700">{partner.email || 'N/A'}</td>
                    <td className="px-2 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 capitalize">
                        {partner.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPartner(partner)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {selectedPartner && (
        <PartnerDetailsModal
          isOpen={!!selectedPartner}
          onClose={() => setSelectedPartner(null)}
          partner={selectedPartner}
          onApprove={approvePartner}
          onReject={rejectPartner}
        />
      )}
    </div>
  );
};

export default AdminPartners;

