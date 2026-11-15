import React, { useEffect, useState } from 'react'
import { MessageSquare, Plus, Star, ArrowRight, CheckCircle2, X, Sparkles } from 'lucide-react'
import { fetchFeedback, createFeedback, updateFeedback, createRoadmapTask } from '../../services/api'
import type { Feedback } from '../../types'

export const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form
  const [comment, setComment] = useState('')
  const [source, setSource] = useState('Storefront Review')
  const [feedbackType, setFeedbackType] = useState('FIT_ISSUE')
  const [rating, setRating] = useState(4.0)
  const [priority, setPriority] = useState('HIGH')

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchFeedback()
      setFeedbacks(data)
    } catch (err) {
      console.error('Failed to load feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createFeedback({
        comment,
        source,
        feedback_type: feedbackType,
        rating: Number(rating),
        priority,
      })
      setModalOpen(false)
      setComment('')
      load()
    } catch (err) {
      console.error('Failed to create feedback:', err)
    }
  }

  const handleConvertToRoadmap = async (fb: Feedback) => {
    try {
      // 1. Create task in roadmap
      await createRoadmapTask({
        title: `Feedback: ${fb.feedback_type} Resolution`,
        description: `Origin: ${fb.source} - "${fb.comment}"`,
        owner: 'Storefront PM',
        priority: fb.priority,
        status: 'BACKLOG',
        reach: 4000,
        impact: 2.0,
        confidence: 80,
        effort: 3.0,
      })

      // 2. Mark feedback converted
      await updateFeedback(fb.id, { status: 'CONVERTED_TO_ROADMAP' })
      load()
      alert('Feedback converted into a RICE roadmap task!')
    } catch (err) {
      console.error('Failed to convert feedback:', err)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Aggregating customer and stakeholder reviews...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Customer Feedback & Product Voice
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Omnichannel customer sentiment analysis and direct conversion into prioritised engineering roadmap tickets.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stakeholder Review</span>
        </button>
      </div>

      {/* Feedbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {feedbacks.map((fb) => (
          <div
            key={fb.id}
            className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-500 text-[11px] uppercase tracking-wider">
                {fb.source} · {fb.feedback_type}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{fb.rating}</span>
              </div>
            </div>

            <p className="text-xs text-charcoal-800 leading-relaxed font-medium">
              "{fb.comment}"
            </p>

            <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    fb.sentiment === 'POSITIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : fb.sentiment === 'NEGATIVE'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-cream-200 text-charcoal-700'
                  }`}
                >
                  {fb.sentiment}
                </span>
                <span className="text-[11px] text-charcoal-400">
                  Priority: {fb.priority}
                </span>
              </div>

              {fb.status === 'CONVERTED_TO_ROADMAP' ? (
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Converted to Roadmap
                </span>
              ) : (
                <button
                  onClick={() => handleConvertToRoadmap(fb)}
                  className="px-3 py-1 bg-cream-100 hover:bg-brand hover:text-white text-charcoal-700 text-[11px] font-semibold rounded-lg border border-cream-300 transition-colors flex items-center gap-1"
                >
                  <span>Convert to Roadmap Task</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <h3 className="text-sm font-bold text-charcoal-900 font-editorial">
                Record Stakeholder or Shopper Review
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Feedback Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                >
                  <option value="Storefront Review">Storefront Review</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Internal Tester">Internal Tester</option>
                  <option value="Buyer / Merchandiser">Buyer / Merchandiser</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Feedback Classification</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                >
                  <option value="FIT_ISSUE">Size & Fit Issue</option>
                  <option value="RECOMMENDATION">Discovery / Recommendation Quality</option>
                  <option value="PRICING">Pricing & Value</option>
                  <option value="QUALITY">Fabric & Construction Quality</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Review Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                >
                  <option value="5">5 Stars - Exceptional</option>
                  <option value="4">4 Stars - Satisfactory</option>
                  <option value="3">3 Stars - Neutral / Mixed</option>
                  <option value="2">2 Stars - Friction Identified</option>
                  <option value="1">1 Star - Critical Defect</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Detailed Comment</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Shopper feedback notes..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 text-charcoal-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white font-semibold rounded-xl shadow"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
