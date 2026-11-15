import { riceScore } from '../../utils/commerce'
import React, { useEffect, useState } from 'react'
import {
  GitPullRequest,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react'
import {
  fetchRoadmapTasks,
  createRoadmapTask,
  updateRoadmapTask,
  deleteRoadmapTask,
} from '../../services/api'
import type { RoadmapTask } from '../../types'

const COLUMNS = [
  { key: 'BACKLOG', label: 'Backlog', bg: 'bg-cream-200' },
  { key: 'PLANNED', label: 'Planned (Q3)', bg: 'bg-blue-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-amber-100' },
  { key: 'QA', label: 'Testing / QA', bg: 'bg-purple-100' },
  { key: 'COMPLETED', label: 'Completed', bg: 'bg-emerald-100' },
]

export const RoadmapPage: React.FC = () => {
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // New Task form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('Storefront PM')
  const [priority, setPriority] = useState('HIGH')
  const [reach, setReach] = useState(8000)
  const [impact, setImpact] = useState(2.0)
  const [confidence, setConfidence] = useState(80)
  const [effort, setEffort] = useState(4.0)

  const computedRice = effort > 0 ? riceScore(reach, impact, confidence, effort) : 0

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchRoadmapTasks()
      setTasks(data)
    } catch (err) {
      console.error('Failed to load roadmap tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRoadmapTask({
        title,
        description,
        owner,
        priority,
        status: 'BACKLOG',
        reach: Number(reach),
        impact: Number(impact),
        confidence: Number(confidence),
        effort: Number(effort),
      })
      setModalOpen(false)
      setTitle('')
      setDescription('')
      load()
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const handleMoveStatus = async (task: RoadmapTask, newStatus: string) => {
    try {
      await updateRoadmapTask(task.id, { status: newStatus })
      load()
    } catch (err) {
      console.error('Failed to move task:', err)
    }
  }

  const handleDelete = async (taskId: number) => {
    try {
      await deleteRoadmapTask(taskId)
      load()
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Product Roadmap & RICE Prioritisation
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Data-driven feature ranking calculated via <code>(Reach × Impact × Confidence) / Effort</code>.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Roadmap Initiative</span>
        </button>
      </div>

      {/* Visual Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div
              key={col.key}
              className="bg-white rounded-2xl border border-cream-300 p-4 space-y-4 shadow-sm min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="w-5 h-5 rounded-full bg-cream-200 text-charcoal-700 text-[11px] font-bold flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-cream-50 hover:bg-white rounded-xl border border-cream-200 hover:border-brand/40 shadow-sm transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-charcoal-900 line-clamp-2">
                        {t.title}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-charcoal-400 hover:text-red-500 p-0.5 shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-charcoal-500 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-cream-200 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-brand text-white font-mono font-bold">
                        RICE: {t.rice_score}
                      </span>
                      <span className="text-charcoal-500 font-medium">{t.owner}</span>
                    </div>

                    {/* Quick Move column dropdown */}
                    <div className="pt-1">
                      <select
                        value={t.status}
                        onChange={(e) => handleMoveStatus(t, e.target.value)}
                        className="w-full text-[10px] bg-white border border-cream-300 rounded p-1 text-charcoal-600 font-medium"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            Move to: {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-charcoal-400 text-[11px] italic">
                    No items in this stage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <h3 className="text-sm font-bold text-charcoal-900 font-editorial">
                Create Prioritised Product Initiative
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label htmlFor="roadmap-field-1" className="block font-semibold text-charcoal-700 mb-1">Initiative Title</label>
                <input id="roadmap-field-1"
                  type="text"
                  required
                  placeholder="e.g. Dynamic Outfit Bundle Builder"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>

              <div>
                <label htmlFor="roadmap-field-2" className="block font-semibold text-charcoal-700 mb-1">Description</label>
                <textarea id="roadmap-field-2"
                  rows={2}
                  placeholder="Problem statement & expected commercial uplift..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="roadmap-field-3" className="block font-semibold text-charcoal-700 mb-1">Owner</label>
                  <input id="roadmap-field-3"
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                  />
                </div>
                <div>
                  <label htmlFor="roadmap-field-4" className="block font-semibold text-charcoal-700 mb-1">Priority</label>
                  <select id="roadmap-field-4"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* RICE Sliders */}
              <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-charcoal-800">
                  <span>RICE Score Preview:</span>
                  <span className="font-mono text-brand text-base font-extrabold">{computedRice}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="roadmap-field-5" className="text-[11px] text-charcoal-500 block">Reach (Users / Qtr)</label>
                    <input id="roadmap-field-5"
                      type="number"
                      value={reach}
                      onChange={(e) => setReach(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-cream-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="roadmap-field-6" className="text-[11px] text-charcoal-500 block">Impact (0.25 to 3.0)</label>
                    <input id="roadmap-field-6"
                      type="number"
                      step="0.25"
                      value={impact}
                      onChange={(e) => setImpact(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-cream-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="roadmap-field-7" className="text-[11px] text-charcoal-500 block">Confidence (50 - 100%)</label>
                    <input id="roadmap-field-7"
                      type="number"
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-cream-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="roadmap-field-8" className="text-[11px] text-charcoal-500 block">Effort (Person-Weeks)</label>
                    <input id="roadmap-field-8"
                      type="number"
                      step="0.5"
                      value={effort}
                      onChange={(e) => setEffort(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-cream-300 rounded text-xs"
                    />
                  </div>
                </div>
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
                  Save to Backlog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
