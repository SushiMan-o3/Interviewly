import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInterview } from '../api/interviews'

export default function CreateInterviewPage() {
  const navigate = useNavigate()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [interviewType, setInterviewType] = useState('behavioral')
  const [difficulty, setDifficulty] = useState('medium')
  const [plannedDuration, setPlannedDuration] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const interview = await createInterview({
        company,
        role,
        interview_type: interviewType,
        difficulty,
        planned_duration: plannedDuration,
      })
      navigate(`/interviews/${interview.id}`)
    } catch (err) {
      setError('Could not create interview. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Create Interview</h1>
      <form className="card form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="company">Company</label>
        <input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Acme Corp"
          required
        />

        <label htmlFor="role">Role</label>
        <input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Software Engineer"
          required
        />

        <label htmlFor="interview_type">Interview type</label>
        <select
          id="interview_type"
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value)}
        >
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
          <option value="system_design">System Design</option>
          <option value="case_study">Case Study</option>
        </select>

        <label htmlFor="difficulty">Difficulty</label>
        <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <label htmlFor="planned_duration">Planned duration (minutes)</label>
        <input
          id="planned_duration"
          type="number"
          min={5}
          max={120}
          value={plannedDuration}
          onChange={(e) => setPlannedDuration(Number(e.target.value))}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create interview'}
        </button>
      </form>
    </div>
  )
}
