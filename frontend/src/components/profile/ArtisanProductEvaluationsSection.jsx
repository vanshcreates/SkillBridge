import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  getArtisanEvaluationsApi,
  getArtisanListingsApi,
  submitProductForEvaluationApi,
} from '../../services/artisan-api'

const CRAFT_CATEGORIES = [
  'Textiles & Handloom',
  'Phulkari & Embroidery',
  'Pottery & Ceramics',
  'Woodwork & Carving',
  'Jewelry & Beading',
  'Metal & Brass Craft',
  'Leather Craft',
  'Jute & Natural Fiber',
  'Painting & Folk Art',
  'Organic & Food Craft',
]

const ArtisanProductEvaluationsSection = () => {
  const [evaluations, setEvaluations] = useState([])
  const [existingListings, setExistingListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all | pending | evaluated | rejected

  // Submission Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submissionMode, setSubmissionMode] = useState('new') // 'new' | 'existing'
  const [selectedListingId, setSelectedListingId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CRAFT_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Detail Modal state (for viewing full evaluation breakdown)
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)

  // Fetch evaluated submissions & existing products on mount
  const loadEvaluations = async () => {
    setIsLoading(true)
    try {
      const [evalRes, listRes] = await Promise.all([
        getArtisanEvaluationsApi().catch(() => null),
        getArtisanListingsApi().catch(() => null),
      ])

      if (evalRes?.success && Array.isArray(evalRes.evaluations)) {
        setEvaluations(evalRes.evaluations)
      } else {
        setEvaluations([])
      }

      if (listRes?.success && Array.isArray(listRes.listings)) {
        setExistingListings(listRes.listings)
      } else if (Array.isArray(listRes)) {
        setExistingListings(listRes)
      }
    } catch (err) {
      console.warn('Error loading evaluations:', err)
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    loadEvaluations()
  }, [])

  // Handle image files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    if (validFiles.length + selectedFiles.length > 8) {
      setFormError('You can upload up to 8 images maximum.')
      return
    }

    setFormError('')
    const newSelected = [...selectedFiles, ...validFiles]
    setSelectedFiles(newSelected)

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file))
    setFilePreviews((prev) => [...prev, ...newPreviews])
  }

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setFilePreviews((prev) => {
      const urlToRevoke = prev[index]
      if (urlToRevoke?.startsWith('blob:')) URL.revokeObjectURL(urlToRevoke)
      return prev.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setTitle('')
    setCategory(CRAFT_CATEGORIES[0])
    setDescription('')
    setExpectedPrice('')
    setSelectedListingId('')
    filePreviews.forEach((url) => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    })
    setSelectedFiles([])
    setFilePreviews([])
    setFormError('')
    setFormSuccess('')
    setSubmissionMode('new')
  }

  const handleOpenModal = (preselectedListing = null) => {
    resetForm()
    if (preselectedListing) {
      setSubmissionMode('existing')
      setSelectedListingId(preselectedListing.id || preselectedListing._id)
      setTitle(preselectedListing.title || preselectedListing.name || '')
      setCategory(preselectedListing.category || CRAFT_CATEGORIES[0])
      setDescription(preselectedListing.description || '')
      setExpectedPrice(preselectedListing.price ? String(preselectedListing.price) : '')
      if (Array.isArray(preselectedListing.images) && preselectedListing.images.length > 0) {
        setFilePreviews(preselectedListing.images)
      } else if (preselectedListing.image) {
        setFilePreviews([preselectedListing.image])
      }
    }
    setIsModalOpen(true)
  }

  const handleExistingListingChange = (listingId) => {
    setSelectedListingId(listingId)
    const item = existingListings.find(
      (l) => (l.id || l._id) === listingId
    )
    if (item) {
      setTitle(item.title || item.name || '')
      setCategory(item.category || CRAFT_CATEGORIES[0])
      setDescription(item.description || '')
      setExpectedPrice(item.price ? String(item.price) : '')
      const imgs = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image ? [item.image] : []
      setFilePreviews(imgs)
      setSelectedFiles([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (submissionMode === 'new' && !title.trim()) {
      setFormError('Please enter the craft product name.')
      return
    }

    if (submissionMode === 'new' && filePreviews.length === 0 && selectedFiles.length === 0) {
      setFormError('Please upload at least one clear photograph of your product.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      if (submissionMode === 'existing' && selectedListingId) {
        formData.append('productId', selectedListingId)
      }
      formData.append('title', title.trim())
      formData.append('category', category)
      formData.append('description', description.trim())
      if (expectedPrice) {
        formData.append('expectedPrice', expectedPrice)
      }

      selectedFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await submitProductForEvaluationApi(formData)

      if (res?.success) {
        setFormSuccess('Product submitted successfully for expert evaluation!')
        setTimeout(() => {
          setIsModalOpen(false)
          resetForm()
          loadEvaluations()
        }, 1200)
      } else {
        throw new Error(res?.message || 'Failed to submit product for evaluation.')
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while submitting your craft.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter evaluations based on tab
  const filteredEvaluations = evaluations.filter((item) => {
    if (activeTab === 'pending') {
      return item.evaluationStatus === 'Pending Review' || item.evaluationStatus === 'Under Evaluation'
    }
    if (activeTab === 'evaluated') {
      return item.evaluationStatus === 'Evaluated'
    }
    if (activeTab === 'rejected') {
      return item.evaluationStatus === 'Rejected'
    }
    return true
  })

  const statsCounts = {
    total: evaluations.length,
    pending: evaluations.filter(
      (e) => e.evaluationStatus === 'Pending Review' || e.evaluationStatus === 'Under Evaluation'
    ).length,
    evaluated: evaluations.filter((e) => e.evaluationStatus === 'Evaluated').length,
    rejected: evaluations.filter((e) => e.evaluationStatus === 'Rejected').length,
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600" />
            Pending Review
          </span>
        )
      case 'Under Evaluation':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            <Eye className="h-3.5 w-3.5 animate-pulse text-indigo-600" />
            Under Evaluation
          </span>
        )
      case 'Evaluated':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Evaluated
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            Needs Revision
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">
            {status || 'Submitted'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border border-secondary/20 bg-gradient-to-br from-[#2D1B11] via-[#3E2416] to-[#5A331D] p-6 sm:p-8 text-white shadow-card">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10 blur-xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary">
              <Award className="h-3.5 w-3.5" />
              Professional Craft Appraisal
            </div>
            <h3 className="mt-2.5 font-serif text-2xl font-bold sm:text-3xl">
              Get Your Product Evaluated
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-white/80 leading-relaxed">
              Have your handmade creations evaluated by certified master craftspeople. Receive professional scores across Quality, Creativity, Craftsmanship, Finishing, and Market Potential to unlock top ranking visibility for industrialists!
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-secondary-hover hover:scale-102 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => handleOpenModal()}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Submit Product for Evaluation
            </button>
          </div>
        </div>

        {/* Stats Counter Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/15 pt-5">
          <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Total Submissions</p>
            <p className="mt-1 font-serif text-2xl font-bold text-white">{statsCounts.total}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200/80">Pending Review</p>
            <p className="mt-1 font-serif text-2xl font-bold text-amber-300">{statsCounts.pending}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-200/80">Expert Evaluated</p>
            <p className="mt-1 font-serif text-2xl font-bold text-emerald-300">{statsCounts.evaluated}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-rose-200/80">Feedback Provided</p>
            <p className="mt-1 font-serif text-2xl font-bold text-white/90">{statsCounts.rejected + statsCounts.evaluated}</p>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="inline-flex rounded-xl border border-border bg-surface-muted p-1">
          <button
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => setActiveTab('all')}
            type="button"
          >
            All Submissions ({statsCounts.total})
          </button>
          <button
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-surface text-amber-700 shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => setActiveTab('pending')}
            type="button"
          >
            Pending / In Review ({statsCounts.pending})
          </button>
          <button
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'evaluated'
                ? 'bg-surface text-emerald-700 shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => setActiveTab('evaluated')}
            type="button"
          >
            Evaluated ({statsCounts.evaluated})
          </button>
          <button
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'rejected'
                ? 'bg-surface text-rose-700 shadow-xs'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => setActiveTab('rejected')}
            type="button"
          >
            Needs Revision ({statsCounts.rejected})
          </button>
        </div>

        <button
          className="text-xs font-semibold text-secondary hover:text-secondary-hover underline cursor-pointer"
          onClick={loadEvaluations}
          type="button"
        >
          Refresh Status
        </button>
      </div>

      {/* Evaluations Content Area */}
      {isLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-surface p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <p className="text-sm font-medium text-text-muted">Loading your craft evaluations...</p>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Award className="h-8 w-8" />
          </div>
          <h4 className="mt-4 font-serif text-lg font-bold text-text-main">
            {activeTab === 'all'
              ? 'No Craft Submissions Yet'
              : `No ${activeTab} evaluations found`}
          </h4>
          <p className="mt-1 max-w-md text-xs text-text-secondary leading-relaxed">
            Submit photos of your handcraft creations to have verified industry experts evaluate your craftsmanship and provide actionable advice.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
            onClick={() => handleOpenModal()}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Product
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvaluations.map((item) => {
            const primaryImg = item.image || (item.images && item.images[0]) || ''
            const isEvaluated = item.evaluationStatus === 'Evaluated'
            const ratingScore = item.averageEvaluationRating || 0
            const crit = item.evaluationCriteriaAverages || {}

            return (
              <div
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-card transition-all hover:border-secondary/40 hover:shadow-card-hover"
                key={item.id || item._id}
              >
                {/* Image Stage */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                  {primaryImg ? (
                    <img
                      alt={item.title || item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={primaryImg}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                      <ImagePlus className="h-10 w-10 text-text-muted/40" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    {getStatusBadge(item.evaluationStatus)}
                  </div>

                  {item.images && item.images.length > 1 && (
                    <span className="absolute bottom-2.5 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                      {item.images.length} photos
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                      {item.category}
                    </span>
                    {item.price > 0 && (
                      <span className="font-serif text-sm font-bold text-text-main">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-1 font-serif text-lg font-bold text-text-main line-clamp-1">
                    {item.title || item.name}
                  </h4>

                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {item.description || 'No detailed description provided.'}
                  </p>

                  {/* Rating Score Breakdown (if evaluated) */}
                  {isEvaluated ? (
                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">
                          Expert Overall Score
                        </span>
                        <div className="inline-flex items-center gap-1 text-base font-extrabold text-emerald-700">
                          <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                          <span>{ratingScore.toFixed(1)}</span>
                          <span className="text-xs font-semibold text-emerald-800/70">/ 10</span>
                        </div>
                      </div>

                      {/* Criteria Mini Bars */}
                      <div className="mt-2.5 space-y-1.5 border-t border-emerald-500/15 pt-2 text-[11px]">
                        <div className="flex items-center justify-between text-text-secondary">
                          <span>Craftsmanship</span>
                          <span className="font-semibold">{crit.craftsmanship ? crit.craftsmanship.toFixed(1) : '-'}/10</span>
                        </div>
                        <div className="flex items-center justify-between text-text-secondary">
                          <span>Design & Finishing</span>
                          <span className="font-semibold">{crit.designFinishing ? crit.designFinishing.toFixed(1) : '-'}/10</span>
                        </div>
                        <div className="flex items-center justify-between text-text-secondary">
                          <span>Market Potential</span>
                          <span className="font-semibold">{crit.marketPotential ? crit.marketPotential.toFixed(1) : '-'}/10</span>
                        </div>
                      </div>
                    </div>
                  ) : item.evaluationStatus === 'Rejected' ? (
                    <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-50/60 p-3 text-xs text-rose-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        Expert Feedback Received
                      </div>
                      <p className="mt-1 line-clamp-2 text-rose-700 text-[11px]">
                        {item.latestExpertFeedback || 'Suggestions available for improving your craft pieces.'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-border bg-surface-muted/60 p-3 text-xs text-text-muted">
                      <p className="flex items-center gap-1.5 font-medium text-amber-700">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                        In queue for certified mastercraft review
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        Evaluations typically complete within 24 to 48 hours.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-border/70 flex items-center justify-between gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-background transition cursor-pointer"
                      onClick={() => setSelectedEvaluation(item)}
                      type="button"
                    >
                      <FileText className="h-3.5 w-3.5 text-secondary" />
                      View Full Report
                    </button>

                    {item.isExpertRanked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-accent/20 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3 text-secondary" />
                        Expert Ranked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: Submit Product for Evaluation
      ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl my-8">
            <button
              aria-label="Close modal"
              className="absolute right-4 top-4 rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-main transition cursor-pointer"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Award className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-serif text-xl font-bold text-text-main">
                  Submit Product for Expert Evaluation
                </h3>
                <p className="text-xs text-text-muted">
                  Receive professional scores and advice to improve market readiness.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {formSuccess}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {/* Submission Mode Toggle */}
              {existingListings.length > 0 && (
                <div className="flex rounded-xl border border-border bg-surface-muted p-1">
                  <button
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      submissionMode === 'new'
                        ? 'bg-surface text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                    onClick={() => {
                      resetForm()
                      setSubmissionMode('new')
                    }}
                    type="button"
                  >
                    Upload New Craft Item
                  </button>
                  <button
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      submissionMode === 'existing'
                        ? 'bg-surface text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                    onClick={() => {
                      setSubmissionMode('existing')
                    }}
                    type="button"
                  >
                    Select From My Shop Products
                  </button>
                </div>
              )}

              {/* If picking from existing shop */}
              {submissionMode === 'existing' && (
                <div>
                  <label className="block text-xs font-bold text-text-main">
                    Choose Existing Shop Product
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    onChange={(e) => handleExistingListingChange(e.target.value)}
                    value={selectedListingId}
                  >
                    <option value="">-- Choose a product to evaluate --</option>
                    {existingListings.map((l) => (
                      <option key={l.id || l._id} value={l.id || l._id}>
                        {l.title || l.name} (₹{l.price}) - {l.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-text-main">
                  Product Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Handcrafted Phulkari Silk Dupatta"
                  required
                  type="text"
                  value={title}
                />
              </div>

              {/* Category & Expected Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-main">
                    Craft Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    onChange={(e) => setCategory(e.target.value)}
                    value={category}
                  >
                    {CRAFT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main">
                    Expected Price (₹) <span className="text-text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    min="0"
                    onChange={(e) => setExpectedPrice(e.target.value)}
                    placeholder="e.g. 1500"
                    type="number"
                    value={expectedPrice}
                  />
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-text-main">
                  Product Description & Craft Details
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-text-main outline-none placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mention materials used, crafting time, tradition, or any special techniques..."
                  rows={3}
                  value={description}
                />
              </div>

              {/* Multiple Images Upload */}
              <div>
                <label className="block text-xs font-bold text-text-main">
                  Product Images <span className="text-rose-500">*</span> (Upload multiple views)
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">
                  High-quality photos of the front, back, stitching, and finishing help experts give accurate scores.
                </p>

                {/* Previews Grid */}
                {filePreviews.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-4 gap-2.5">
                    {filePreviews.map((url, idx) => (
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted" key={idx}>
                        <img alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" src={url} />
                        <button
                          aria-label="Remove image"
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-rose-600 transition"
                          onClick={() => handleRemoveImage(idx)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File input button */}
                <label className="mt-2.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/40 p-4 transition hover:border-secondary/60 hover:bg-surface-muted">
                  <UploadCloud className="h-7 w-7 text-secondary" />
                  <span className="mt-1.5 text-xs font-semibold text-text-main">
                    Click to browse and upload product images
                  </span>
                  <span className="text-[10px] text-text-muted">PNG, JPG, WEBP up to 8 images</span>
                  <input
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    type="file"
                  />
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text-secondary hover:bg-surface-muted transition"
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-hover disabled:opacity-50 transition cursor-pointer"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading & Submitting...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 text-secondary" />
                      Submit for Evaluation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Detailed Evaluation Report
      ======================================================== */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl my-8">
            <button
              aria-label="Close modal"
              className="absolute right-4 top-4 rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-main transition cursor-pointer"
              onClick={() => setSelectedEvaluation(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Award className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-text-main">
                    {selectedEvaluation.title || selectedEvaluation.name}
                  </h3>
                  {getStatusBadge(selectedEvaluation.evaluationStatus)}
                </div>
                <p className="text-xs text-text-muted">
                  Category: {selectedEvaluation.category} • Expected Price: ₹{selectedEvaluation.price}
                </p>
              </div>
            </div>

            {/* Images Gallery */}
            {selectedEvaluation.images && selectedEvaluation.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {selectedEvaluation.images.map((imgUrl, i) => (
                  <img
                    alt={`View ${i + 1}`}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover border border-border"
                    key={i}
                    src={imgUrl}
                  />
                ))}
              </div>
            )}

            {/* Criteria Breakdown */}
            {selectedEvaluation.evaluationStatus === 'Evaluated' ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-primary p-4 text-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Overall Craft Rating</p>
                    <p className="font-serif text-3xl font-bold">
                      {(selectedEvaluation.averageEvaluationRating || 0).toFixed(1)}{' '}
                      <span className="text-sm font-normal text-white/70">/ 10</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      {((selectedEvaluation.averageEvaluationRating || 0) / 2).toFixed(1)} Stars
                    </span>
                    <p className="mt-1 text-[11px] text-white/70">
                      Based on {selectedEvaluation.evaluationCount || 1} expert review(s)
                    </p>
                  </div>
                </div>

                {/* 5 Professional Criteria */}
                <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Detailed 5-Point Criterion Breakdown
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    {[
                      {
                        label: '1. Product Quality & Durability',
                        val: selectedEvaluation.evaluationCriteriaAverages?.productQuality || 0,
                      },
                      {
                        label: '2. Creativity & Originality',
                        val: selectedEvaluation.evaluationCriteriaAverages?.creativityOriginality || 0,
                      },
                      {
                        label: '3. Craftsmanship & Skill Technique',
                        val: selectedEvaluation.evaluationCriteriaAverages?.craftsmanship || 0,
                      },
                      {
                        label: '4. Design, Aesthetics & Finishing',
                        val: selectedEvaluation.evaluationCriteriaAverages?.designFinishing || 0,
                      },
                      {
                        label: '5. Market Potential & Commercial Appeal',
                        val: selectedEvaluation.evaluationCriteriaAverages?.marketPotential || 0,
                      },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-medium text-text-main mb-1">
                          <span>{label}</span>
                          <span className="font-bold text-primary">{val.toFixed(1)} / 10</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-secondary transition-all"
                            style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Written Feedback and Suggestions */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
                    <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-secondary" />
                      Expert Feedback
                    </p>
                    <p className="mt-1.5 text-xs text-text-secondary leading-relaxed italic">
                      "{selectedEvaluation.latestExpertFeedback || 'Solid craftsmanship and traditional value.'}"
                    </p>
                  </div>

                  {selectedEvaluation.latestExpertSuggestions && (
                    <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                      <p className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4" />
                        Suggestions for Improvement & Higher Valuation
                      </p>
                      <p className="mt-1.5 text-xs text-text-main leading-relaxed">
                        {selectedEvaluation.latestExpertSuggestions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedEvaluation.evaluationStatus === 'Rejected' ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900">
                  <p className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Revision Requested by Evaluator
                  </p>
                  <p className="mt-1.5 text-xs text-rose-800 leading-relaxed">
                    {selectedEvaluation.latestExpertFeedback || 'The evaluator suggested improvements before approving this craft piece.'}
                  </p>
                  {selectedEvaluation.latestExpertSuggestions && (
                    <div className="mt-3 border-t border-rose-200 pt-2 text-xs text-rose-900">
                      <span className="font-bold">Next Steps:</span> {selectedEvaluation.latestExpertSuggestions}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-border bg-surface-muted p-6 text-center text-text-muted">
                <Clock className="mx-auto h-8 w-8 text-amber-500 animate-pulse" />
                <p className="mt-2 text-sm font-bold text-text-main">Currently in Evaluation Queue</p>
                <p className="mt-1 text-xs text-text-muted">
                  Your piece is waiting for an expert to evaluate the craftsmanship. Check back soon!
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition"
                onClick={() => setSelectedEvaluation(null)}
                type="button"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArtisanProductEvaluationsSection

