import './Insights.css'
import { useCallback, useEffect, useMemo, useState } from 'react'

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

type Risk = {
  employeeId: number
  employeeName: string
  department: string | null
  jobTitle: string | null
  riskScore: number
  riskLevel: RiskLevel
  reasons: string[]
  recommendation: string
}

type Overview = {
  totalEmployees: number
  presentToday: number
  pendingLeaves: number
  openOpsRecords: number
}

type Filter = 'ALL' | RiskLevel

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const LEVEL_LABEL: Record<RiskLevel, string> = {
  HIGH: 'High risk',
  MEDIUM: 'Medium risk',
  LOW: 'Low risk',
}

export default function Insights() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewResponse, riskResponse] = await Promise.all([
        fetch('/api/insights/overview', { credentials: 'same-origin' }),
        fetch('/api/insights/attrition', { credentials: 'same-origin' }),
      ])
      if (!overviewResponse.ok) {
        throw new Error(`Could not load insights (${overviewResponse.status}).`)
      }
      if (!riskResponse.ok) {
        throw new Error(`Could not load risk scores (${riskResponse.status}).`)
      }
      setOverview(await overviewResponse.json())
      setRisks(await riskResponse.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load insights.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(
    () => ({
      HIGH: risks.filter((risk) => risk.riskLevel === 'HIGH').length,
      MEDIUM: risks.filter((risk) => risk.riskLevel === 'MEDIUM').length,
      LOW: risks.filter((risk) => risk.riskLevel === 'LOW').length,
    }),
    [risks],
  )

  const visible =
    filter === 'ALL' ? risks : risks.filter((risk) => risk.riskLevel === filter)

  return (
    <section className="ins-page">
      <div className="ins-heading">
        <div>
          <h2>AI workforce insights</h2>
          <p>
            Attrition risk for every active employee, scored from performance,
            attendance, leave and tenure.
          </p>
        </div>
        <button
          type="button"
          className="ins-refresh"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p role="alert" className="ins-error">{error}</p>}

      <div className="ins-cards">
        <div className="ins-card">
          <span>Present today</span>
          <strong>{overview ? overview.presentToday : '-'}</strong>
          <small>
            of {overview ? overview.totalEmployees : '-'} employees
          </small>
        </div>
        <div className="ins-card ins-card-high">
          <span>High risk</span>
          <strong>{counts.HIGH}</strong>
          <small>Needs attention this week</small>
        </div>
        <div className="ins-card ins-card-medium">
          <span>Medium risk</span>
          <strong>{counts.MEDIUM}</strong>
          <small>Check in with the manager</small>
        </div>
        <div className="ins-card ins-card-low">
          <span>Low risk</span>
          <strong>{counts.LOW}</strong>
          <small>No action needed</small>
        </div>
      </div>

      <details className="ins-how">
        <summary>How the risk score works</summary>
        <p>
          This is a rule-based model. Each signal adds points, the total is
          capped at 100, and every score shows the reasons behind it.
        </p>
        <ul>
          <li>Serving notice: +60</li>
          <li>Average of the latest 3 ratings below 2.5: +30 (below 3.0: +15)</li>
          <li>3 or more absences in 30 days: +25 (1 or 2: +10)</li>
          <li>More than 10 approved leave days in 90 days: +20 (more than 5: +10)</li>
          <li>Joined in the last 90 days: +10</li>
        </ul>
        <p>60 and above is High, 30 to 59 is Medium, below 30 is Low.</p>
      </details>

      <div className="ins-filters" role="group" aria-label="Filter by risk level">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`ins-filter ${filter === item.value ? 'active' : ''}`}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Calculating risk scores...</p>
      ) : visible.length === 0 ? (
        <p>
          {risks.length === 0
            ? 'No active employees yet. Add employees to see insights.'
            : 'No employees in this group.'}
        </p>
      ) : (
        <div className="ins-table-wrap">
          <table className="ins-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Risk</th>
                <th>Why</th>
                <th>Suggested action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((risk) => (
                <tr key={risk.employeeId}>
                  <td>
                    <strong>{risk.employeeName}</strong>
                    <span className="ins-sub">
                      {[risk.jobTitle, risk.department]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </td>
                  <td>
                    <div
                      className="ins-meter"
                      role="img"
                      aria-label={`Risk score ${risk.riskScore} out of 100`}
                    >
                      <span
                        className={`ins-meter-fill ins-fill-${risk.riskLevel.toLowerCase()}`}
                        style={{ width: `${risk.riskScore}%` }}
                      />
                    </div>
                    <span
                      className={`ins-pill ins-pill-${risk.riskLevel.toLowerCase()}`}
                    >
                      {LEVEL_LABEL[risk.riskLevel]} · {risk.riskScore}
                    </span>
                  </td>
                  <td>
                    <ul className="ins-reasons">
                      {risk.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="ins-action">{risk.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}