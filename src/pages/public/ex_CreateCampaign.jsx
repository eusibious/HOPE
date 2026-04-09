import { useState } from 'react'
import { Button, TextInput, TextArea, Select } from '../../components/ui'
import FormField from '../../components/forms/FormField'
import FileUpload from '../../components/forms/FileUpload'

function CreateCampaign() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    region: '',
    fundingGoal: '',
    deadline: '',
    category: '',
    organization: '',
    contactEmail: ''
  })

  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const regions = [
    { value: 'africa', label: 'Africa' },
    { value: 'asia', label: 'Asia' },
    { value: 'middle-east', label: 'Middle East' },
    { value: 'europe', label: 'Europe' },
    { value: 'americas', label: 'Americas' },
    { value: 'oceania', label: 'Oceania' }
  ]

  const categories = [
    { value: 'emergency-relief', label: 'Emergency Relief' },
    { value: 'food-security', label: 'Food Security' },
    { value: 'water-sanitation', label: 'Water & Sanitation' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'shelter', label: 'Shelter & Housing' },
    { value: 'livelihood', label: 'Livelihood Support' },
    { value: 'protection', label: 'Protection Services' }
  ]

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.region) {
      newErrors.region = 'Please select a region'
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }
    if (!formData.fundingGoal || isNaN(Number(formData.fundingGoal)) || Number(formData.fundingGoal) <= 0) {
      newErrors.fundingGoal = 'Please enter a valid funding goal'
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    }
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization name is required'
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }
    if (files.length === 0) {
      newErrors.files = 'Please upload at least one verification document'
    }

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      alert('Campaign submitted for review! You will receive confirmation within 24 hours.')
    }, 2000)
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          NGO Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Create new campaign
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Submit your humanitarian initiative for review and approval by the HOPE network.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Campaign information</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <FormField
                  label="Campaign title"
                  error={errors.title}
                  required
                  helperText="Clear, descriptive name for your initiative"
                >
                  <TextInput
                    placeholder="e.g. Horn of Africa Drought Response"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    error={errors.title}
                  />
                </FormField>

                <FormField
                  label="Category"
                  error={errors.category}
                  required
                  helperText="Primary focus area of your campaign"
                >
                  <Select
                    options={categories}
                    value={formData.category}
                    onChange={handleInputChange('category')}
                    error={errors.category}
                    placeholder="Select campaign category"
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label="Description"
                    error={errors.description}
                    required
                    helperText="Detailed explanation of the humanitarian need and planned response"
                  >
                    <TextArea
                      placeholder="Describe the situation, target beneficiaries, planned activities, and expected outcomes..."
                      value={formData.description}
                      onChange={handleInputChange('description')}
                      error={errors.description}
                      rows={6}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Region"
                  error={errors.region}
                  required
                  helperText="Geographic area where aid will be delivered"
                >
                  <Select
                    options={regions}
                    value={formData.region}
                    onChange={handleInputChange('region')}
                    error={errors.region}
                    placeholder="Select target region"
                  />
                </FormField>

                <FormField
                  label="Funding goal (USD)"
                  error={errors.fundingGoal}
                  required
                  helperText="Total amount needed to achieve campaign objectives"
                >
                  <TextInput
                    placeholder="50000"
                    value={formData.fundingGoal}
                    onChange={handleInputChange('fundingGoal')}
                    error={errors.fundingGoal}
                    type="number"
                    min="1000"
                  />
                </FormField>

                <FormField
                  label="Campaign deadline"
                  error={errors.deadline}
                  required
                  helperText="Target date for completing fund raising"
                >
                  <TextInput
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange('deadline')}
                    error={errors.deadline}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Organization details</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <FormField
                  label="Organization name"
                  error={errors.organization}
                  required
                  helperText="Registered name of your NGO or humanitarian organization"
                >
                  <TextInput
                    placeholder="International Humanitarian Alliance"
                    value={formData.organization}
                    onChange={handleInputChange('organization')}
                    error={errors.organization}
                  />
                </FormField>

                <FormField
                  label="Contact email"
                  error={errors.contactEmail}
                  required
                  helperText="Primary contact for campaign communications"
                >
                  <TextInput
                    type="email"
                    placeholder="contact@organization.org"
                    value={formData.contactEmail}
                    onChange={handleInputChange('contactEmail')}
                    error={errors.contactEmail}
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Verification documents</h2>
              <p className="mt-2 text-sm text-slate-600">
                Upload official documents to verify your organization's status and the legitimacy of this campaign.
              </p>
              <div className="mt-6">
                <FormField
                  label="Supporting documents"
                  error={errors.files}
                  required
                  helperText="Registration certificates, needs assessments, partnership agreements, etc."
                >
                  <FileUpload
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple
                    onChange={setFiles}
                    error={errors.files}
                  />
                </FormField>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Uploaded files
                    </p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800">Review process</h3>
                    <ul className="mt-3 space-y-1 text-sm text-amber-700">
                      <li>• Campaign submissions are reviewed within 24-48 hours</li>
                      <li>• Verification includes document authentication and organization vetting</li>
                      <li>• Approved campaigns receive NGO verification badge and public listing</li>
                      <li>• We may request additional documentation during review</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="px-8 py-3 text-base"
                >
                  {isSubmitting ? 'Submitting for review...' : 'Submit campaign for approval'}
                </Button>
                <Button variant="ghost" className="px-8 py-3 text-base">
                  Save as draft
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
    
  )
}

export default CreateCampaign