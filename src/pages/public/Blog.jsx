import { PageContainer } from '../../components/common'

function Blog() {
  return (
    <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen">
      <PageContainer>
        <div className="py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-[#E8EDF5] mb-4">Blog</h1>
            <p className="text-[#6B8CAE] text-lg">
              Latest updates and insights about blockchain-powered humanitarian aid.
            </p>
            
            <div className="mt-12 grid gap-8">
              <article className="bg-[#111827] border border-[#1E2D42] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-[#E8EDF5] mb-2">Coming Soon</h2>
                <p className="text-[#6B8CAE]">Blog posts will be published here soon.</p>
              </article>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

export default Blog
