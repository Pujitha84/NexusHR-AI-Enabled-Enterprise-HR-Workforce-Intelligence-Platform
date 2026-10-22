import './Performance.css'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

type Review = {
  id: number
  employeeId: number
  reviewPeriod: string
  rating: number
  goals: string | null
  comments: string | null
  createdAt: string
}

const emptyForm = {
  employeeId: '',
  reviewPeriod: '',
  rating: '3',
  goals: '',
  comments: '',
}

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/performance', {
        credentials: 'same-origin',
      })
      if (!response.ok) {
        throw new Error(`Could not load reviews (${response.status}).`)
      }
      setReviews(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function addReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const employeeId = Number(form.employeeId)
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      setError('Enter a valid employee ID.')
      return
    }
    if (!form.reviewPeriod.trim()) {
      setError('Enter a review period, for example Q3 2026.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          reviewPeriod: form.reviewPeriod.trim(),
          rating: Number(form.rating),
          goals: form.goals.trim() || null,
          comments: form.comments.trim() || null,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not save this review.')
      }
      setForm(emptyForm)
      setNotice('Review saved.')
      await loadReviews()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review.')
    } finally {
      setSaving(false)
    }
  }

  async function removeReview(id: number) {
    if (!window.confirm('Delete this review?')) return
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/performance/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Could not delete this review.')
      setNotice('Review deleted.')
      await loadReviews()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete review.')
    }
  }

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '-'

  return (
    <section className="perf-page">
      <div className="perf-heading">
        <h2>Performance reviews</h2>
        <p>Record ratings, goals and feedback for each employee.</p>
      </div>

      {error && <p role="alert" className="perf-error">{error}</p>}
      {notice && <p role="status" className="perf-notice">{notice}</p>}

      <div className="perf-stats">
        <div className="perf-stat">
          <span>Total reviews</span>
          <strong>{reviews.length}</strong>
        </div>
        <div className="perf-stat">
          <span>Average rating</span>
          <strong>{average}</strong>
        </div>
      </div>

      <form className="perf-form" onSubmit={addReview}>
        <div className="perf-field">
          <label htmlFor="perf-employee">Employee ID</label>
          <input
            id="perf-employee"
            type="number"
            min="1"
            value={form.employeeId}
            onChange={(e) => updateField('employeeId', e.target.value)}
          />
        </div>
        <div className="perf-field">
          <label htmlFor="perf-period">Review period</label>
          <input
            id="perf-period"
            placeholder="Q3 2026"
            value={form.reviewPeriod}
            onChange={(e) => updateField('reviewPeriod', e.target.value)}
          />
        </div>
        <div className="perf-field">
          <label htmlFor="perf-rating">Rating</label>
          <select
            id="perf-rating"
            value={form.rating}
            onChange={(e) => updateField('rating', e.target.value)}
          >
            <option value="1">1 - Needs improvement</option>
            <option value="2">2 - Below expectations</option>
            <option value="3">3 - Meets expectations</option>
            <option value="4">4 - Exceeds expectations</option>
            <option value="5">5 - Outstanding</option>
          </select>
        </div>
        <div className="perf-field perf-wide">
          <label htmlFor="perf-goals">Goals</label>
          <textarea
            id="perf-goals"
            value={form.goals}
            onChange={(e) => updateField('goals', e.target.value)}
          />
        </div>
        <div className="perf-field perf-wide">
          <label htmlFor="perf-comments">Comments</label>
          <textarea
            id="perf-comments"
            value={form.comments}
            onChange={(e) => updateField('comments', e.target.value)}
          />
        </div>
        <button className="perf-button" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save review'}
        </button>
      </form>

      <h3 className="perf-list-title">All reviews</h3>
      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet. Add the first one above.</p>
      ) : (
        <div className="perf-list">
          {reviews.map((review) => (
            <article className="perf-card" key={review.id}>
              <div className="perf-card-top">
                <strong>Employee #{review.employeeId}</strong>
                <span>{review.reviewPeriod}</span>
              </div>
              <div
                className="perf-stars"
                aria-label={`Rating ${review.rating} out of 5`}
              >
                {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
              </div>
              {review.goals && <p><b>Goals:</b> {review.goals}</p>}
              {review.comments && <p><b>Comments:</b> {review.comments}</p>}
              <button
                className="perf-delete"
                type="button"
                onClick={() => removeReview(review.id)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}