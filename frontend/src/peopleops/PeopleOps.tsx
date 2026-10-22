import './PeopleOps.css';
import { useCallback, useEffect, useState, type FormEvent } from 'react'


type OpsRecord = {
  id: number
  category: string
  employeeId: number | null
  title: string
  details: string | null
  amount: number | null
  status: string
  recordDate: string
}

const categories = [
  'ONBOARDING',
  'PAYROLL',
  'PERFORMANCE',
  'NOTIFICATION',
  'INSIGHT',
]

const emptyForm = {
  category: 'ONBOARDING',
  employeeId: '',
  title: '',
  details: '',
  amount: '',
  status: 'OPEN',
  recordDate: new Date().toISOString().slice(0, 10),
}

export default function PeopleOps() {
  const [records, setRecords] = useState<OpsRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const query =
        filter === 'ALL' ? '' : `?category=${encodeURIComponent(filter)}`
      const response = await fetch(`/api/ops${query}`)

      if (!response.ok) {
        throw new Error(`Could not load HR records (${response.status}).`)
      }

      const data: OpsRecord[] = await response.json()
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load records.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  function updateField(
    field: keyof typeof emptyForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const payload = {
      category: form.category,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      title: form.title.trim(),
      details: form.details.trim() || null,
      amount: form.amount === '' ? null : Number(form.amount),
      status: form.status,
      recordDate: form.recordDate,
    }

    if (
      payload.employeeId !== null &&
      (!Number.isInteger(payload.employeeId) || payload.employeeId <= 0)
    ) {
      setError('Enter a valid positive employee ID.')
      setSaving(false)
      return
    }

    if (payload.amount !== null && (!Number.isFinite(payload.amount) || payload.amount < 0)) {
      setError('Amount must be a valid non-negative number.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Could not save this record.')
      }

      setForm({ ...emptyForm, category: form.category })
      setNotice('Record saved successfully.')
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save record.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(record: OpsRecord, status: string) {
    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/ops/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...record, status }),
      })

      if (!response.ok) {
        throw new Error('Could not update this record.')
      }

      setNotice('Record updated.')
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  async function deleteRecord(record: OpsRecord) {
    if (!window.confirm(`Delete "${record.title}"?`)) return

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/ops/${record.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Could not delete this record.')

      setNotice('Record deleted.')
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  function exportCsv() {
    const columns: (keyof OpsRecord)[] = [
      'id',
      'category',
      'employeeId',
      'title',
      'details',
      'amount',
      'status',
      'recordDate',
    ]

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [
      columns.join(','),
      ...records.map((record) =>
        columns.map((column) => escapeCsv(record[column])).join(','),
      ),
    ].join('\r\n')

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'nexushr-people-ops.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
        <section className="people-ops-page">
        <div className="peopleops-heading">
        <button type="button" onClick={exportCsv} disabled={!records.length}>
          Export CSV
        </button>
      </div>

      {error && <p role="alert" className="peopleops-error">{error}</p>}
      {notice && <p role="status" className="peopleops-notice">{notice}</p>}

      <form className="peopleops-form" onSubmit={addRecord}>
        <h3>Create HR record</h3>

        <label>
          Category
          <select
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          Employee ID (optional)
          <input
            type="number"
            min="1"
            value={form.employeeId}
            onChange={(event) => updateField('employeeId', event.target.value)}
            placeholder="e.g. 1"
          />
        </label>

        <label>
          Title
          <input
            required
            maxLength={140}
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Enter a short title"
          />
        </label>

        <label>
          Details
          <textarea
            maxLength={4000}
            value={form.details}
            onChange={(event) => updateField('details', event.target.value)}
            placeholder="Additional information"
            rows={3}
          />
        </label>

        <label>
          Amount (optional)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            placeholder="0.00"
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>

        <label>
          Record date
          <input
            type="date"
            required
            value={form.recordDate}
            onChange={(event) => updateField('recordDate', event.target.value)}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save record'}
        </button>
      </form>

      <div className="peopleops-list-heading">
        <h3>HR records</h3>
        <label>
          Filter
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading records…</p>
      ) : records.length === 0 ? (
        <p>No records yet. Create your first HR record above.</p>
      ) : (
        <div className="peopleops-records">
          {records.map((record) => (
            <article className="peopleops-record" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <p>{record.category} · {record.recordDate}</p>
                {record.employeeId !== null && <p>Employee ID: {record.employeeId}</p>}
                {record.details && <p>{record.details}</p>}
                {record.amount !== null && (
                  <p>Amount: ₹{Number(record.amount).toLocaleString('en-IN')}</p>
                )}
              </div>
              <div className="peopleops-record-actions">
                <span>{record.status}</span>
                <select
                  aria-label={`Update status for ${record.title}`}
                  value={record.status}
                  onChange={(event) => void changeStatus(record, event.target.value)}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                </select>
                <button type="button" onClick={() => void deleteRecord(record)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
