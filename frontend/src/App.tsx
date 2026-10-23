import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import LeaveManagement from './LeaveManagement'
import PeopleOps from './peopleops/PeopleOps'
import PerformanceReviews from './performance/Performance'
import PayrollPage from './payroll/Payroll'
import './lifecycle.css'
import './theme.css'
import Onboarding from './onboarding/Onboarding'

type EmployeeStatus = 'ACTIVE' | 'ON_NOTICE' | 'OFFBOARDED'

type Employee = {
  id: number
  firstName: string
  lastName: string
  email: string
  department: string
  jobTitle: string
  status?: EmployeeStatus
  joiningDate?: string | null
  offboardingDate?: string | null
}

type EmployeeForm = {
  firstName: string
  lastName: string
  email: string
  department: string
  jobTitle: string
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'ON_LEAVE'

type AttendanceRecord = {
  id?: number
  employeeId: number
  attendanceDate: string
  status: AttendanceStatus
  checkIn: string | null
  checkOut: string | null
}

type InsightsOverview = {
  totalEmployees: number
  presentToday: number
  pendingLeaves: number
  openOpsRecords: number
}

const emptyForm: EmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  department: 'Engineering',
  jobTitle: '',
}

const departments = [
  'Engineering',
  'Human Resources',
  'Design',
  'Finance',
  'Marketing',
  'Operations',
  'Sales',
]

const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10)
}


type WorkspaceSettings = {
  organizationName: string
  administratorName: string
  administratorEmail: string
  emailNotifications: boolean
  weeklyDigest: boolean
  compactTables: boolean
}

const defaultWorkspaceSettings: WorkspaceSettings = {
  organizationName: 'NexusHR Workspace',
  administratorName: 'HR Administrator',
  administratorEmail: '',
  emailNotifications: true,
  weeklyDigest: false,
  compactTables: false,
}

type WorkforceAnalyticsProps = {
  employees: Employee[]
  attendance: AttendanceRecord[]
  date: string
  employeesLoading: boolean
  attendanceLoading: boolean
  attendanceError: string
  onDateChange: (date: string) => void
  onRefresh: () => void
}

function WorkforceAnalytics({
  employees,
  attendance,
  date,
  employeesLoading,
  attendanceLoading,
  attendanceError,
  onDateChange,
  onRefresh,
}: WorkforceAnalyticsProps) {
  const departmentRows = useMemo(() => {
    const counts = employees.reduce<Record<string, number>>((result, employee) => {
      const department = employee.department?.trim() || 'Unassigned'
      result[department] = (result[department] ?? 0) + 1
      return result
    }, {})

    return Object.entries(counts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count || a.department.localeCompare(b.department))
  }, [employees])

  const attendanceStats = useMemo(() => {
    const present = attendance.filter((record) => record.status === 'PRESENT').length
    const absent = attendance.filter((record) => record.status === 'ABSENT').length
    const onLeave = attendance.filter((record) => record.status === 'ON_LEAVE').length
    const recordedEmployeeIds = new Set(attendance.map((record) => record.employeeId))

    return {
      present,
      absent,
      onLeave,
      recorded: recordedEmployeeIds.size,
      notRecorded: Math.max(employees.length - recordedEmployeeIds.size, 0),
    }
  }, [attendance, employees.length])

  const maxDepartmentCount = Math.max(...departmentRows.map((row) => row.count), 1)

  const attendanceRows = [
    { label: 'Present', count: attendanceStats.present, className: 'present' },
    { label: 'Absent', count: attendanceStats.absent, className: 'absent' },
    { label: 'On leave', count: attendanceStats.onLeave, className: 'on-leave' },
    { label: 'Not recorded', count: attendanceStats.notRecorded, className: 'not-recorded' },
  ]

  return (
    <section id="analytics-page">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">WORKFORCE INTELLIGENCE</p>
          <h1>Workforce analytics</h1>
          <p className="subtitle">
            Understand team composition and daily attendance from your workspace data.
          </p>
        </div>
        <button className="secondary-button refresh-button" onClick={onRefresh} disabled={attendanceLoading}>
          {attendanceLoading ? 'Refreshing...' : '↻ Refresh data'}
        </button>
      </div>

      {attendanceError && (
        <div className="message error-message" role="alert">
          ⚠ {attendanceError}
        </div>
      )}

      <div className="stats-grid analytics-summary-grid">
        <article className="stat-card">
          <div className="stat-top"><span>Total employees</span><span className="stat-icon purple">♙</span></div>
          <div className="stat-number">{employeesLoading ? '—' : employees.length}</div>
          <p className="stat-foot">People registered in the directory</p>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Departments</span><span className="stat-icon blue">▦</span></div>
          <div className="stat-number">{employeesLoading ? '—' : departmentRows.length}</div>
          <p className="stat-foot">Distinct departments represented</p>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Present</span><span className="stat-icon green">✓</span></div>
          <div className="stat-number">{attendanceLoading ? '—' : attendanceStats.present}</div>
          <p className="stat-foot">Saved records for {date}</p>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>Attendance recorded</span><span className="stat-icon orange">◷</span></div>
          <div className="stat-number">{attendanceLoading ? '—' : attendanceStats.recorded}</div>
          <p className="stat-foot">Of {employees.length} employees on the selected date</p>
        </article>
      </div>

      <div className="analytics-grid">
        <section className="directory-card analytics-panel">
          <div className="directory-header analytics-panel-header">
            <div>
              <h2>Department distribution</h2>
              <p>Employee count by department.</p>
            </div>
            <span className="analytics-total">{employees.length} total</span>
          </div>
          {employeesLoading ? (
            <p className="analytics-empty">Loading employee data...</p>
          ) : departmentRows.length === 0 ? (
            <p className="analytics-empty">Add employees to see department analytics.</p>
          ) : (
            <div className="analytics-bars">
              {departmentRows.map((row) => (
                <div className="analytics-bar-row" key={row.department}>
                  <div className="analytics-bar-label"><span>{row.department}</span><strong>{row.count}</strong></div>
                  <div className="analytics-bar-track" aria-label={`${row.department}: ${row.count} employees`}>
                    <div className="analytics-bar-fill department-fill" style={{ width: `${(row.count / maxDepartmentCount) * 100}%` }} />
                    </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="directory-card analytics-panel">
          <div className="directory-header analytics-panel-header">
            <div>
              <h2>Attendance snapshot</h2>
              <p>Saved attendance for your selected day.</p>
            </div>
            <label className="analytics-date-label">
              Date
              <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
            </label>
          </div>
          {attendanceLoading ? (
            <p className="analytics-empty">Loading attendance data...</p>
          ) : employees.length === 0 ? (
            <p className="analytics-empty">Add employees before viewing attendance analytics.</p>
          ) : (
            <div className="analytics-bars">
              {attendanceRows.map((row) => {
                const count = row.count
                const percent = employees.length ? Math.min((count / employees.length) * 100, 100) : 0
                return (
                  <div className="analytics-bar-row" key={row.className}>
                    <div className="analytics-bar-label"><span>{row.label}</span><strong>{count}</strong></div>
                    <div className="analytics-bar-track" aria-label={`${row.label}: ${count} employees`}>
                      <div className={`analytics-bar-fill ${row.className}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
              <p className="analytics-footnote">Counts reflect records saved through Attendance Management for {date}.</p>
            </div>
          )}
        </section>
      </div>

      <div className="analytics-data-note">
        <span className="live-label"><span /> Workspace data</span>
        <p>These insights are calculated from employee and attendance records in your current database; no sample figures are added.</p>
      </div>
    </section>
  )
}

function WorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    try {
      const stored = window.localStorage.getItem('nexushr-workspace-settings')
      return stored
        ? { ...defaultWorkspaceSettings, ...(JSON.parse(stored) as Partial<WorkspaceSettings>) }
        : defaultWorkspaceSettings
    } catch {
      return defaultWorkspaceSettings
    }
  })
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  function updateSetting<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      window.localStorage.setItem('nexushr-workspace-settings', JSON.stringify(settings))
      setMessageIsError(false)
      setMessage('Settings saved in this browser.')
    } catch {
      setMessageIsError(true)
      setMessage('Settings could not be saved. Check your browser storage settings.')
    }
  }

  function resetSettings() {
    setSettings(defaultWorkspaceSettings)
    setMessageIsError(false)
    setMessage('Defaults restored. Click Save settings to store them.')
  }

  return (
    <section id="settings-page">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">WORKSPACE PREFERENCES</p>
          <h1>Settings</h1>
          <p className="subtitle">Manage the workspace label, administrator details and local display preferences.</p>
        </div>
      </div>

      {message && (
        <div className={`message ${messageIsError ? 'error-message' : 'success-message'}`} role={messageIsError ? 'alert' : 'status'}>
          {messageIsError ? '⚠' : '✓'} {message}
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      <form className="directory-card settings-card" onSubmit={saveSettings}>
        <div className="directory-header settings-card-header">
          <div>
            <h2>Workspace profile</h2>
            <p>These profile preferences are saved in this browser.</p>
          </div>
          <span className="stat-icon purple">⚙</span>
        </div>

        <div className="settings-fields">
          <label>
            Workspace name
            <input value={settings.organizationName} required maxLength={80} onChange={(event) => updateSetting('organizationName', event.target.value)} placeholder="NexusHR Workspace" />
          </label>
          <label>
            Administrator name
            <input value={settings.administratorName} required maxLength={80} onChange={(event) => updateSetting('administratorName', event.target.value)} placeholder="HR Administrator" />
          </label>
          <label className="settings-wide-field">
            Administrator email
            <input type="email" value={settings.administratorEmail} onChange={(event) => updateSetting('administratorEmail', event.target.value)} placeholder="admin@company.com" />
          </label>
        </div>

        <div className="settings-divider" />
        <div className="settings-section-title">
          <h2>Preferences</h2>
          <p>Choose how this browser should display and remember workspace preferences.</p>
        </div>
        <div className="settings-preferences">
          <label className="settings-preference-row">
            <span><strong>Email notification preference</strong><small>Store your preference to receive email-related alerts.</small></span>
            <input type="checkbox" checked={settings.emailNotifications} onChange={(event) => updateSetting('emailNotifications', event.target.checked)} />
          </label>
          <label className="settings-preference-row">
            <span><strong>Weekly workforce digest</strong><small>Save a preference for a weekly workforce summary.</small></span>
            <input type="checkbox" checked={settings.weeklyDigest} onChange={(event) => updateSetting('weeklyDigest', event.target.checked)} />
          </label>
          <label className="settings-preference-row">
            <span><strong>Compact tables</strong><small>Remember your preference for denser table layouts.</small></span>
            <input type="checkbox" checked={settings.compactTables} onChange={(event) => updateSetting('compactTables', event.target.checked)} />
          </label>
        </div>

        <div className="settings-disclaimer">
          <strong>Note:</strong> These are browser-saved preferences only. Email delivery and organization-wide settings are not connected to a notification service or backend configuration yet.
          </div>
        <div className="settings-actions">
          <button type="button" className="secondary-button" onClick={resetSettings}>Restore defaults</button>
          <button type="submit" className="primary-button">Save settings</button>
        </div>
      </form>
    </section>
  )
}

function App() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activePage, setActivePage] = useState<
  'overview' | 'attendance' | 'leave' | 'analytics' | 'settings' | 'peopleops' | 'performance' | 'payroll' | 'onboarding'
>('overview')

  const [attendanceDate, setAttendanceDate] = useState(today())
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceSaving, setAttendanceSaving] = useState<number | null>(null)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceNotice, setAttendanceNotice] = useState('')
  const [insights, setInsights] = useState<InsightsOverview | null>(null)

useEffect(() => {
  async function loadInsights() {
    try {
      const response = await fetch('/api/insights/overview')
      if (!response.ok) throw new Error('Could not load insights')
      const data: InsightsOverview = await response.json()
      setInsights(data)
    } catch (err) {
      console.error('Insights loading failed:', err)
    }
  }

  void loadInsights()
}, [])

  async function loadEmployees() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Could not load employees.')

      const data: Employee[] = await response.json()
      setEmployees(data)
    } catch {
      setError(
        'Unable to connect to the backend. Make sure Spring Boot is running on port 8080.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadAttendance(date = attendanceDate) {
    setAttendanceLoading(true)
    setAttendanceError('')
    setAttendanceNotice('')

    try {
      const response = await fetch(
        `/api/attendance?date=${encodeURIComponent(date)}`,
      )

      if (!response.ok) {
        throw new Error('Could not load attendance records.')
      }

      const data: AttendanceRecord[] = await response.json()
      setAttendance(data)
    } catch {
      setAttendanceError(
        'Could not load attendance. Check that the backend is running and the Attendance API is available.',
      )
    } finally {
      setAttendanceLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [])

  useEffect(() => {
    if (activePage === 'attendance' || activePage === 'analytics') {
      void loadAttendance(attendanceDate)
    }
  }, [activePage, attendanceDate])

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase().trim()

    return employees.filter((employee) =>
      [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.department,
        employee.jobTitle,
      ].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [employees, search])

  function openAddForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function openEditForm(employee: Employee) {
    setEditingId(employee.id)
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department,
      jobTitle: employee.jobTitle,
    })
    setError('')
    setNotice('')
    setShowForm(true)

    document.getElementById('employee-form-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/employees/${editingId}`
        : '/api/employees'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(
          message ||
            (isEditing
              ? 'Could not update employee.'
              : 'Could not create employee.'),
        )
      }

      const savedEmployee: Employee = await response.json()

      if (isEditing) {
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === savedEmployee.id ? savedEmployee : employee,
          ),
        )
        setNotice(
          `${savedEmployee.firstName} ${savedEmployee.lastName} was updated successfully.`,
        )
      } else {
        setEmployees((current) => [...current, savedEmployee])
        setNotice(
          `${savedEmployee.firstName} ${savedEmployee.lastName} was added successfully.`,
        )
      }

      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName}?`,
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Could not delete this employee.')

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id),
      )

      if (editingId === employee.id) closeForm()

      setNotice(`${employee.firstName} ${employee.lastName} was deleted.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function changeEmployeeStatus(
    employee: Employee,
    status: EmployeeStatus,
  ) {
    const action =
      status === 'OFFBOARDED'
        ? 'offboard'
        : status === 'ON_NOTICE'
          ? 'put on notice'
          : 'reactivate'

    const confirmed = window.confirm(
      `Do you want to ${action} ${employee.firstName} ${employee.lastName}?`,
    )
    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const response = await fetch(`/api/employees/${employee.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not update employment status.')
      }

      const updated: Employee = await response.json()
      setEmployees((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setNotice(
        `${updated.firstName} ${updated.lastName} is now ${status
          .replace('_', ' ')
          .toLowerCase()}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  function getAttendance(employeeId: number) {
    return attendance.find((record) => record.employeeId === employeeId)
  }

  async function saveAttendance(
    employeeId: number,
    status: AttendanceStatus,
    checkIn: string | null,
    checkOut: string | null,
  ) {
    setAttendanceSaving(employeeId)
    setAttendanceError('')
    setAttendanceNotice('')
    const record: AttendanceRecord = {
      employeeId,
      attendanceDate,
      status,
      checkIn,
      checkOut,
    }

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Could not save attendance.')
      }

      const saved: AttendanceRecord = await response.json()

      setAttendance((current) => [
        ...current.filter((item) => item.employeeId !== employeeId),
        saved,
      ])

      setAttendanceNotice(
        `Attendance saved for ${
          employees.find((item) => item.id === employeeId)?.firstName ??
          `employee ${employeeId}`
        }.`,
      )
    } catch (err) {
      setAttendanceError(
        err instanceof Error ? err.message : 'Could not save attendance.',
      )
    } finally {
      setAttendanceSaving(null)
    }
  }

  function updateAttendanceTime(
    employeeId: number,
    field: 'checkIn' | 'checkOut',
    value: string,
  ) {
    // Time changes are kept in the local form until Save is clicked.
    const existing = getAttendance(employeeId)
    const updated: AttendanceRecord = existing
      ? { ...existing, [field]: value || null }
      : {
          employeeId,
          attendanceDate,
          status: 'PRESENT',
          checkIn: field === 'checkIn' ? value || null : null,
          checkOut: field === 'checkOut' ? value || null : null,
        }

    setAttendance((current) => [
      ...current.filter((item) => item.employeeId !== employeeId),
      updated,
    ])
  }

  // Overview metrics are derived from the employee records returned by the API.
  // Trim and compare case-insensitively so values such as 'Engineering' and
  // ' engineering ' are counted as one department/title.
  const departmentCount = new Set(
    employees
      .map((employee) => employee.department?.trim().toLocaleLowerCase())
      .filter((department): department is string => Boolean(department)),
  ).size

  const jobTitleCount = new Set(
    employees
      .map((employee) => employee.jobTitle?.trim().toLocaleLowerCase())
      .filter((jobTitle): jobTitle is string => Boolean(jobTitle)),
  ).size

  const presentCount = attendance.filter(
    (record) => record.status === 'PRESENT',
  ).length

  const absentCount = attendance.filter(
    (record) => record.status === 'ABSENT',
  ).length

  const leaveCount = attendance.filter(
    (record) => record.status === 'ON_LEAVE',
  ).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={() => setActivePage('overview')}
        >
          <span className="brand-mark">N</span>
          <span>
            Nexus<span className="brand-light">HR</span>
          </span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          <a
            className={`nav-item ${activePage === 'peopleops' ? 'active' : ''}`}
            href="#peopleops"
            onClick={() => setActivePage('peopleops')}
          >
            <span>▣</span> People Ops
          </a>
          <a
            className="nav-item"
            href="#employees"
            onClick={() => setActivePage('overview')}
          >
            <span>♙</span> Employees
          </a>

          <a
            className={`nav-item ${activePage === 'attendance' ? 'active' : ''}`}
            href="#attendance"
            onClick={() => setActivePage('attendance')}
          >
            <span>◷</span> Attendance
          </a>
          <a
           className={`nav-item ${activePage === 'leave' ? 'active' : ''}`}
           href="#leave"
          onClick={() => setActivePage('leave')}
>
           <span>▣</span> Leave Management
</a>

          <a
            className={`nav-item ${activePage === 'onboarding' ? 'active' : ''}`}
            href="#onboarding"
            onClick={() => setActivePage('onboarding')}
          >
            <span>☑</span> Onboarding
          </a>

          <a
            className={`nav-item ${activePage === 'payroll' ? 'active' : ''}`}
            href="#payroll"
            onClick={() => setActivePage('payroll')}
          >
            <span>₹</span> Payroll
          </a>

          <a
            className={`nav-item ${activePage === 'performance' ? 'active' : ''}`}
            href="#performance"
            onClick={() => setActivePage('performance')}
          >
            <span>★</span> Performance
          </a>

          <a
            className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`}
            href="#analytics"
            onClick={() => setActivePage('analytics')}
          >
            <span>▥</span> Workforce analytics
          </a>

          <a
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            href="#settings"
            onClick={() => setActivePage('settings')}
          >
            <span>⚙</span> Settings
          </a>
        </nav>

        
<div className="sidebar-bottom">
  <div
    className="help-card"
    role="button"
    tabIndex={0}
    onClick={() => setActivePage('analytics')}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActivePage('analytics');
      }
    }}
    style={{ cursor: 'pointer' }}
  >
    <span className="help-icon">✦</span>
    <strong>Nexus intelligence</strong>
    <p>Your workforce insights, all in one place.</p>
    <span className="coming-soon">EXPLORE INSIGHTS →</span>
  </div>
</div>


          <div className="profile">
            <div className="avatar profile-avatar">PR</div>
            <div className="profile-info">
              <strong>HR Administrator</strong>
              <span>NexusHR workspace</span>
            </div>
            <span className="profile-menu">•••</span>
          </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span>{' '}
            <strong>
              {activePage === 'attendance'
                ? 'Attendance'
                : activePage === 'leave'
                  ? 'Leave Management'
                  : activePage === 'analytics'
                    ? 'Workforce analytics'
                    : activePage === 'settings'
                      ? 'Settings'
                      : activePage === 'onboarding'
                        ? 'Onboarding'
                      : activePage === 'payroll'
                        ? 'Payroll'
                      : activePage === 'performance'
                        ? 'Performance'
                        : activePage === 'peopleops'
                          ? 'People Ops'
                          : 'Overview'}
            </strong>
          </div>

          <div className="topbar-right">

            <span className="system-status">
              <span /> System online
            </span>
            <div className="avatar top-avatar">HR</div>
          </div>
        </header>

        <section className="page-content">
          {activePage === 'overview' ? (
            <>
            <div className="welcome-row">
                <div>
                  <p className="eyebrow">YOUR WORKFORCE, CONNECTED</p>
                  <h1>Good to see you.</h1>
                  <p className="subtitle">
                    Here’s what’s happening across your organization today.
                  </p>
                </div>

                <button className="primary-button" onClick={openAddForm}>
                  <span>＋</span> Add employee
                </button>
              </div>

              {error && (
                <div className="message error-message" role="alert">
                  <span>⚠</span> {error}
                  <button onClick={() => setError('')} aria-label="Dismiss error">
                    ×
                  </button>
                </div>
              )}

              {notice && (
                <div className="message success-message" role="status">
                  <span>✓</span> {notice}
                  <button
                    onClick={() => setNotice('')}
                    aria-label="Dismiss message"
                  >
                    ×
                  </button>
                </div>
              )}

              {showForm && (
                <section className="form-card" id="employee-form-card">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {editingId !== null
                          ? 'Edit employee'
                          : 'Add a new employee'}
                      </h2>
                      <p>
                        {editingId !== null
                          ? 'Update the employee details below.'
                          : "Enter the employee's details below."}
                      </p>
                    </div>

                    <button
                      className="close-button"
                      onClick={closeForm}
                      aria-label="Close form"
                      type="button"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={saveEmployee} className="employee-form">
                    <label>
                      First name
                      <input
                        required
                        value={form.firstName}
                        onChange={(event) =>
                          setForm({ ...form, firstName: event.target.value })
                        }
                        placeholder="e.g. Asha"
                      />
                    </label>

                    <label>
                      Last name
                      <input
                        required
                        value={form.lastName}
                        onChange={(event) =>
                          setForm({ ...form, lastName: event.target.value })
                        }
                        placeholder="e.g. Rao"
                      />
                    </label>

                    <label>
                      Work email
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        placeholder="asha@company.com"
                      />
                    </label>

                    <label>
                      Department
                      <select
                        value={form.department}
                        onChange={(event) =>
                          setForm({ ...form, department: event.target.value })
                        }
                      >
                        {departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                        {form.department &&
                          !departments.includes(form.department) && (
                            <option value={form.department}>
                              {form.department}
                            </option>
                          )}
                      </select>
                    </label>

                    <label className="full-field">
                      Job title
                      <input
                        required
                        value={form.jobTitle}
                        onChange={(event) =>
                          setForm({ ...form, jobTitle: event.target.value })
                        }
                        placeholder="e.g. Software Engineer"
                      />
                    </label>

                    <div className="form-actions full-field">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={saving}
                      >
                        {saving
                          ? 'Saving...'
                          : editingId !== null
                            ? 'Save changes'
                            : 'Save employee'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total employees</span>
                    <span className="stat-icon purple">♙</span>
                  </div>
                  <div className="stat-number">
                    {loading ? '—' : employees.length}
                  </div>
                  <p className="stat-foot">
                    <span className="dot purple-dot" /> Registered in your
                    workspace
                  </p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Departments</span>
                    <span className="stat-icon blue">▦</span>
                  </div>
                  <div className="stat-number">
                    {loading ? '—' : departmentCount}
                  </div>
                  <p className="stat-foot">Across your organization</p>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Listed job titles</span>
                    <span className="stat-icon orange">✧</span>
                  </div>
                  <div className="stat-number">
                    {loading ? '—' : jobTitleCount}
                  </div>
                  <p className="stat-foot">Distinct roles in the directory</p>
                </article>

                <article className="stat-card">
  <div className="stat-top">
    <span>Pending leaves</span>
    <span className="stat-icon orange">◷</span>
  </div>
  <div className="stat-number">
    {insights ? insights.pendingLeaves : '—'}
  </div>
  <p className="stat-foot">Leave requests awaiting action</p>
</article>

<article className="stat-card">
  <div className="stat-top">
    <span>Open People Ops</span>
    <span className="stat-icon green">✓</span>
  </div>
  <div className="stat-number">
    {insights ? insights.openOpsRecords : '—'}
  </div>
  <p className="stat-foot">HR records still open</p>
</article>
              </div>

              <section className="directory-card" id="employees">
                <div className="directory-header">
                  <div>
                    <h2>Employee directory</h2>
                    <p>Manage and view the people in your organization.</p>
                  </div>

                  <button
                    className="secondary-button refresh-button"
                    onClick={() => void loadEmployees()}
                    disabled={loading}
                  >
                    ↻ Refresh
                  </button>
                </div>

                <div className="table-toolbar">
                  <div className="search-box">
                    <span>⌕</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, department, email..."
                      aria-label="Search employees"
                    />
                  </div>

                  <span className="results-count">
                    {filteredEmployees.length}{' '}
                    {filteredEmployees.length === 1 ? 'employee' : 'employees'}
                  </span>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>DEPARTMENT</th>
                        <th>JOB TITLE</th>
                        <th>STATUS</th>
                        <th>EMPLOYEE ID</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            Loading employee records...
                          </td>
                        </tr>
                      ) : filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            {search
                              ? 'No employees match your search.'
                              : 'No employees yet. Add your first employee to get started.'}
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <tr key={employee.id}>
                            <td>
                              <div className="employee-cell">
                                <div className="avatar employee-avatar">
                                  {employee.firstName.charAt(0)}
                                  {employee.lastName.charAt(0)}
                                </div>
                                <div className="employee-details">
                                  <strong>
                                    {employee.firstName} {employee.lastName}
                                  </strong>
                                  <span>{employee.email}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="department-pill">
                                {employee.department}
                              </span>
                            </td>

                            <td>{employee.jobTitle || '—'}</td>

                            <td>
                              <select
                                className={`status-select status-${(employee.status ?? 'ACTIVE').toLowerCase()}`}
                                value={employee.status ?? 'ACTIVE'}
                                aria-label={`Employment status for ${employee.firstName} ${employee.lastName}`}
                                onChange={(event) =>
                                  void changeEmployeeStatus(
                                    employee,
                                    event.target.value as EmployeeStatus,
                                  )
                                }
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="ON_NOTICE">On notice</option>
                                <option value="OFFBOARDED">Offboarded</option>
                              </select>
                              {employee.offboardingDate ? (
                                <small className="status-date">
                                  Left {employee.offboardingDate}
                                </small>
                              ) : employee.joiningDate ? (
                                <small className="status-date">
                                  Joined {employee.joiningDate}
                                </small>
                              ) : null}
                            </td>

                            <td>
                              <span className="employee-id">
                                EMP-{String(employee.id).padStart(4, '0')}
                              </span>
                            </td>

                            <td>
                              <div className="employee-actions">
                                <button
                                  className="edit-button"
                                  type="button"
                                  onClick={() => openEditForm(employee)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="delete-button"
                                  type="button"
                                  onClick={() => void deleteEmployee(employee)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Showing {filteredEmployees.length} of {employees.length}{' '}
                    records
                  </span>
                  <span className="live-label">
                    <span /> Live database data
                  </span>
                </div>
              </section>
            </>
          ) : activePage === 'attendance' ? (
            <section id="attendance">
              <div className="welcome-row">
                <div>
                   <p className="eyebrow">WORKFORCE OPERATIONS</p>
                  <h1>Attendance management</h1>
                  <p className="subtitle">
                    Record daily attendance and working times for your team.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => void loadAttendance()}
                  disabled={attendanceLoading}
                >
                  ↻ Refresh
                </button>
              </div>

              {attendanceError && (
                <div className="message error-message" role="alert">
                  ⚠ {attendanceError}
                  <button
                    onClick={() => setAttendanceError('')}
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}

              {attendanceNotice && (
                <div className="message success-message" role="status">
                  ✓ {attendanceNotice}
                  <button
                    onClick={() => setAttendanceNotice('')}
                    aria-label="Dismiss message"
                  >
                    ×
                  </button>
                </div>
              )}

              <section className="directory-card">
                <div className="directory-header">
                  <div>
                    <h2>Daily attendance</h2>
                    <p>Choose a date to view and update attendance.</p>
                  </div>
                  <label>
                    Attendance date
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(event) =>
                        setAttendanceDate(event.target.value)
                      }
                    />
                  </label>
                </div>

<div className="stats-grid">
                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Present</span>
                      <span className="stat-icon green">✓</span>
                    </div>
                    <div className="stat-number">{presentCount}</div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Absent</span>
                      <span className="stat-icon orange">−</span>
                    </div>
                    <div className="stat-number">{absentCount}</div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>On leave</span>
                      <span className="stat-icon blue">↗</span>
                    </div>
                    <div className="stat-number">{leaveCount}</div>
                  </article>

                  <article className="stat-card">
                    <div className="stat-top">
                      <span>Total employees</span>
                      <span className="stat-icon purple">♙</span>
                    </div>
                    <div className="stat-number">{employees.length}</div>
                  </article>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>STATUS</th>
                        <th>CHECK IN</th>
                        <th>CHECK OUT</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {attendanceLoading ? (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            Loading attendance...
                          </td>
                        </tr>
                      ) : employees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            Add employees in the Employees section before
                            marking attendance.
                          </td>
                        </tr>
                      ) : (
                        employees
                          .filter((employee) => employee.status !== 'OFFBOARDED')
                          .map((employee) => {
                          const record = getAttendance(employee.id)
                          const status = record?.status ?? 'PRESENT'

                          return (
                            <tr key={employee.id}>
                              <td>
                                <div className="employee-cell">
                                  <div className="avatar employee-avatar">
                                    {employee.firstName.charAt(0)}
                                    {employee.lastName.charAt(0)}
                                  </div>
                                  <div className="employee-details">
                                    <strong>
                                      {employee.firstName} {employee.lastName}
                                    </strong>
                                    <span>{employee.department}</span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <select
                                  value={status}
                                  aria-label={`Attendance status for ${employee.firstName} ${employee.lastName}`}
                                  onChange={(event) => {
                                    const nextStatus = event.target
                                      .value as AttendanceStatus
                                    void saveAttendance(
                                      employee.id,
                                      nextStatus,
                                      record?.checkIn ?? null,
                                      record?.checkOut ?? null,
                                    )
                                  }}
                                >
                                  <option value="PRESENT">Present</option>
                                  <option value="ABSENT">Absent</option>
                                  <option value="ON_LEAVE">On Leave</option>
                                </select>
                              </td>

                              <td>
                                <input
                                  type="time"
                                  aria-label={`Check-in time for ${employee.firstName}`}
                                  value={record?.checkIn?.slice(0, 5) ?? ''}
                                  disabled={status !== 'PRESENT'}
                                  onChange={(event) =>
                                    updateAttendanceTime(
                                      employee.id,
                                      'checkIn',
                                      event.target.value
                                        ? `${event.target.value}:00`
                                        : '',
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  type="time"
                                  aria-label={`Check-out time for ${employee.firstName}`}
                                  value={record?.checkOut?.slice(0, 5) ?? ''}
                                  disabled={status !== 'PRESENT'}
                                  onChange={(event) =>
                                    updateAttendanceTime(
                                      employee.id,
                                      'checkOut',
                                      event.target.value
                                        ? `${event.target.value}:00`
                                        : '',
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <button
                                  className="primary-button"
                                  type="button"
                                  disabled={attendanceSaving === employee.id}
                                  onClick={() =>
                                    void saveAttendance(
                                      employee.id,
                                      status,
                                      record?.checkIn ?? null,
                                      record?.checkOut ?? null,
                                    )
                                  }
                                >
                                  {attendanceSaving === employee.id
                                    ? 'Saving...'
                                    : 'Save'}
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    {attendance.length} saved attendance records for{' '}
                    {attendanceDate}
                  </span>
                  <span className="live-label">
                    <span /> Database attendance
                  </span>
                </div>
              </section>
            </section>
          ) : activePage === 'analytics' ? (
            <WorkforceAnalytics
              employees={employees}
              attendance={attendance}
              date={attendanceDate}
              employeesLoading={loading}
              attendanceLoading={attendanceLoading}
              attendanceError={attendanceError}
              onDateChange={setAttendanceDate}
              onRefresh={() => void loadAttendance(attendanceDate)}
            />
         ) : activePage === 'settings' ? (
  <WorkspaceSettings />
) : activePage === 'leave' ? (
  <LeaveManagement />
) : activePage === 'peopleops' ? (
  <PeopleOps />
) : activePage === 'performance' ? (
  <PerformanceReviews />
) : activePage === 'onboarding' ? (
  <Onboarding />
) : activePage === 'payroll' ? (
  <PayrollPage />
) : null}

          
          <footer className="page-footer">
            <span>© 2026 NexusHR · Workforce intelligence platform</span>
            <span>Built for better people operations ✦</span>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App