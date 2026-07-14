import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteInterview, getInterviews } from '../api/interviews'
import type { InterviewSummary } from '../types'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { token } = useAuth()
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getInterviews(0, 6)
      .then((data) => {
        if (!cancelled) setInterviews(data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Could not load interviews.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const handleDelete = async (id: number) => {
    try {
      await deleteInterview(id)
      setInterviews((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const completedCount = interviews.filter((i) => i.completed).length

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/interviews/new" className="button">
          + New Interview
        </Link>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{interviews.length}</span>
          <span className="stat-label">Recent interviews</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{completedCount}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{interviews.length - completedCount}</span>
          <span className="stat-label">In progress / planned</span>
        </div>
      </div>

      <h2>Your interviews</h2>

      {loading && <p>Loading interviews...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && interviews.length === 0 && (
        <div className="empty-state">
          <p>You don't have any interviews yet.</p>
          <Link to="/interviews/new" className="button">
            Create your first interview
          </Link>
        </div>
      )}

      <div className="interview-grid">
        {interviews.map((interview) => (
          <div className="interview-card" key={interview.id}>
            <div className="interview-card-header">
              <h3>
                {interview.role} @ {interview.company}
              </h3>
              <span className={`badge ${interview.completed ? 'badge-done' : 'badge-pending'}`}>
                {interview.completed ? 'Completed' : 'Not started'}
              </span>
            </div>
            <p className="interview-meta">
              {interview.interview_type} &middot; {interview.difficulty} &middot;{' '}
              {interview.planned_duration} min
            </p>
            <p className="interview-meta-date">
              Created {new Date(interview.created_at).toLocaleDateString()}
            </p>
            <div className="interview-card-actions">
              <Link to={`/interviews/${interview.id}`} className="button button-small">
                {interview.completed ? 'View' : 'Start'}
              </Link>
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => handleDelete(interview.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
