
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getCurrentUser, type AuthUser } from './auth'

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type LeaveRequest = {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
}

type Employee = {
  id: number
  firstName: string
  lastName: string
}

type LeaveForm = {
  startDate: string
  endDate: string
  reason: string
}

const emptyForm: LeaveForm = {
  startDate: '',
  endDate: '',
  reason: '',
}

function todayString() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export default function LeaveManagement() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<LeaveForm>(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const role = user?.role.trim().toUpperCase()
  const isHR = role === 'HR'
  const isEmployee = role === 'EMPLOYEE'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      setUser(currentUser)

      const requestsResponse = await fetch('/api/leaves', {
        credentials: 'same-origin',
      })

      if (!requestsResponse.ok) {
        throw new Error(
          requestsResponse.status === 401 ||
            requestsResponse.status === 403
            ? 'You are not authorized to view these leave requests.'
            : 'Could not load leave requests. Check that the backend is running.',
        )
      }

      const requestData: LeaveRequest[] =
        await requestsResponse.json()

      setRequests(requestData)

      if (currentUser.role.trim().toUpperCase() === 'HR') {
        const employeeResponse = await fetch('/api/employees', {
          credentials: 'same-origin',
        })

        if (!employeeResponse.ok) {
          throw new Error('Could not load the employee directory.')
        }

        const employeeData: Employee[] =
          await employeeResponse.json()

        setEmployees(employeeData)
      } else {
        setEmployees([])
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load leave management data.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user || !isEmployee) {
      setError('Only employees can apply for leave here.')
      return
    }

    const employeeId = Number(user.employeeId)

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      setError(
        'Your account is not linked to an employee record. Please contact HR.',
      )
      return
    }

    if (
      !form.startDate ||
      !form.endDate ||
      form.startDate < todayString() ||
      form.endDate < form.startDate ||
      form.reason.trim().length < 3
    ) {
      setError('Please enter valid leave dates and a reason of at least 3 characters.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim(),
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Could not submit the leave request.')
      }

      setForm(emptyForm)
      setShowForm(false)
      setNotice('Your leave request was submitted successfully.')
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit the leave request.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function decideRequest(
    id: number,
    status: 'APPROVED' | 'REJECTED',
  ) {
    if (!isHR) {
      setError('Only HR can approve or reject leave requests.')
      return
    }

    setBusyId(id)
    setError('')
    setNotice('')

    try {
      const response = await fetch(
        `/api/leaves/${id}/decision?status=${status}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
        },
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Could not update the leave request.')
      }

      const updated: LeaveRequest = await response.json()

      setRequests(current =>
        current.map(request =>
          request.id === id ? updated : request,
        ),
      )

      setNotice(`Leave request ${status.toLowerCase()} successfully.`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update the leave request.',
      )
    } finally {
      setBusyId(null)
    }
  }

  function employeeName(employeeId: number) {
    const employee = employees.find(item => item.id === employeeId)

    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : `Employee #${employeeId}`
  }

  const pendingCount = requests.filter(
    item => item.status === 'PENDING',
  ).length

  if (!loading && !user && !error) {
    return (
      <section className="page-content">
        <p className="message error-message">
          Please sign in to access Leave Management.
        </p>
      </section>
    )
  }

  return (
    <section className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">WORKFORCE OPERATIONS</p>
          <h1>Leave Management</h1>
          <p className="subtitle">
            {isHR
              ? 'Review employee leave requests and record HR decisions.'
              : isEmployee
                ? 'Apply for leave and track the status of your requests.'
                : 'Manage leave requests.'}
          </p>
        </div>

        <div className="leave-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadData()}
            disabled={loading || saving || busyId !== null}
          >
            ↻ Refresh
          </button>

          {isEmployee && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setShowForm(current => !current)
                setError('')
                setNotice('')
              }}
              disabled={saving}
            >
              {showForm ? 'Cancel' : '+ Apply for Leave'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="message error-message" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="message success-message" role="status">
          {notice}
        </div>
      )}

      {showForm && isEmployee && (
        <section className="directory-card form-card">
          <div className="directory-header">
            <div>
              <h2>New leave request</h2>
              <p>
                Submit your requested dates and reason. HR will review
                your request.
              </p>
            </div>
          </div>

          <form className="employee-form" onSubmit={submitRequest}>
            <label>
              Start date
              <input
                required
                type="date"
                min={todayString()}
                value={form.startDate}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    startDate: event.target.value,
                    endDate:
                      current.endDate &&
                      current.endDate < event.target.value
                        ? ''
                        : current.endDate,
                  }))
                }
              />
            </label>

            <label>
              End date
              <input
                required
                type="date"
                min={form.startDate || todayString()}
                value={form.endDate}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="full-field">
              Reason for leave
              <textarea
                required
                minLength={3}
                maxLength={500}
                rows={3}
                value={form.reason}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Enter your reason for requesting leave"
              />
            </label>

            <div className="form-actions full-field">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm)
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving ||
                  !form.startDate ||
                  !form.endDate ||
                  form.endDate < form.startDate ||
                  !form.reason.trim()
                }
              >
                {saving ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span>{isHR ? 'Total requests' : 'My requests'}</span>
          </div>
          <div className="stat-number">{requests.length}</div>
        </article>

        <article className="stat-card">
          <div className="stat-top"><span>Pending review</span></div>
          <div className="stat-number">{pendingCount}</div>
        </article>

        <article className="stat-card">
          <div className="stat-top"><span>Approved</span></div>
          <div className="stat-number">
            {requests.filter(item => item.status === 'APPROVED').length}
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top"><span>Rejected</span></div>
          <div className="stat-number">
            {requests.filter(item => item.status === 'REJECTED').length}
          </div>
        </article>
      </div>

      <section className="directory-card">
        <div className="directory-header">
          <div>
            <h2>{isHR ? 'Employee leave requests' : 'My leave requests'}</h2>
            <p>
              {isHR
                ? 'Review employee leave dates and reasons before making a decision.'
                : 'Track the status of your submitted leave requests.'}
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Start date</th>
                <th>End date</th>
                <th>Reason</th>
                <th>Status</th>
                {isHR && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isHR ? 6 : 4} className="empty-state">
                    Loading leave requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={isHR ? 6 : 4} className="empty-state">
                    {isHR
                      ? 'No employee leave requests found.'
                      : 'You have not submitted any leave requests yet.'}
                  </td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id}>
                    {isHR && (
                      <td>{employeeName(request.employeeId)}</td>
                    )}
                    <td>{request.startDate}</td>
                    <td>{request.endDate}</td>
                    <td>{request.reason}</td>
                    <td>
                      <span className="status-badge">
                        {request.status}
                      </span>
                    </td>

                    {isHR && (
                      <td>
                        {request.status === 'PENDING' ? (
                          <div className="leave-actions">
                            <button
                              type="button"
                              className="primary-button"
                              disabled={busyId === request.id}
                              onClick={() =>
                                void decideRequest(request.id, 'APPROVED')
                              }
                            >
                              {busyId === request.id
                                ? 'Saving...'
                                : 'Approve'}
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              disabled={busyId === request.id}
                              onClick={() =>
                                void decideRequest(request.id, 'REJECTED')
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          'Decision recorded'
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
