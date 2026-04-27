function Pagination({ currentPage = 1, totalPages = 5, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-[#1E2D42] bg-[#111827] px-3 py-2 text-sm font-semibold text-[#6B8CAE] transition-all hover:border-[#2D4A6F] hover:text-[#E8EDF5] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            currentPage === page
              ? 'bg-[#4FC3A1] text-[#0A0F1E] shadow-sm'
              : 'border border-[#1E2D42] bg-[#111827] text-[#6B8CAE] hover:border-[#2D4A6F] hover:text-[#E8EDF5] hover:shadow-sm'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-[#1E2D42] bg-[#111827] px-3 py-2 text-sm font-semibold text-[#6B8CAE] transition-all hover:border-[#2D4A6F] hover:text-[#E8EDF5] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
