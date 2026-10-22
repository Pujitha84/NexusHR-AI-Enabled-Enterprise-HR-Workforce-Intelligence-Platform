import './Payroll.css'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

type PayrollRecord = {
  id: number
  employeeId: number
  payPeriod: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  paymentDate: string | null
}

type EmployeeOption = {
  id: number
  firstName: string
  lastName: string
  status?: string
}

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function currentPeriod() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function makeEmptyForm() {
  return {
    employeeId: '',
    payPeriod: currentPeriod(),
    basicSalary: '',
    allowances: '0',
    deductions: '0',
    paymentDate: '',
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [form, setForm] = useState(makeEmptyForm)
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [payrollResponse, employeeResponse] = await Promise.all([
        fetch('/api/payroll', { credentials: 'same-origin' }),
        fetch('/api/employees', { credentials: 'same-origin' }),
      ])
      if (!payrollResponse.ok) {
        throw new Error(`Could not load payroll (${payrollResponse.status}).`)
      }
      if (!employeeResponse.ok) {
        throw new Error(`Could not load employees (${employeeResponse.status}).`)
      }
      setRecords(await payrollResponse.json())
      setEmployees(await employeeResponse.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payroll.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function updateField(field: keyof ReturnType<typeof makeEmptyForm>, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function employeeName(id: number) {
    const match = employees.find((employee) => employee.id === id)
    return match ? `${match.firstName} ${match.lastName}` : `Employee #${id}`
  }

  const netPreview =
    (Number(form.basicSalary) || 0) +
    (Number(form.allowances) || 0) -
    (Number(form.deductions) || 0)

  const periods = useMemo(
    () => Array.from(new Set(records.map((record) => record.payPeriod))),
    [records],
  )

  const visibleRecords = useMemo(
    () =>
      periodFilter === 'ALL'
        ? records
        : records.filter((record) => record.payPeriod === periodFilter),
    [records, periodFilter],
  )

  const totalNet = visibleRecords.reduce(
    (sum, record) => sum + Number(record.netSalary),
    0,
  )

  async function addPayroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const employeeId = Number(form.employeeId)
    const basicSalary = Number(form.basicSalary)
    const allowances = Number(form.allowances || 0)
    const deductions = Number(form.deductions || 0)

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      setError('Select an employee.')
      return
    }
    if (!form.payPeriod.trim()) {
      setError('Enter a pay period, for example October 2026.')
      return
    }
    if (!Number.isFinite(basicSalary) || basicSalary <= 0) {
      setError('Enter a basic salary greater than zero.')
      return
    }
    if (allowances < 0 || deductions < 0) {
      setError('Allowances and deductions cannot be negative.')
      return
    }
    if (netPreview < 0) {
      setError('Deductions cannot be more than basic salary plus allowances.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          payPeriod: form.payPeriod.trim(),
          basicSalary,
          allowances,
          deductions,
          paymentDate: form.paymentDate || null,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not save this payroll record.')
      }
      setForm(makeEmptyForm())
      setNotice('Payroll record saved.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payroll.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRecord(id: number) {
    if (!window.confirm('Delete this payroll record?')) return
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Could not delete this record.')
      setNotice('Payroll record deleted.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete record.')
    }
  }

  function printPayslip(record: PayrollRecord) {
    const name = escapeHtml(employeeName(record.employeeId))
    const period = escapeHtml(record.payPeriod)
    const paid = record.paymentDate ? escapeHtml(record.paymentDate) : 'Not set'
    const win = window.open('', '_blank', 'width=720,height=820')
    if (!win) {
      setError('Allow pop-ups for this site to open the payslip.')
      return
    }
    win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Payslip - ${name} - ${period}</title>
<style>
  body { font-family: Arial, sans-serif; color: #20213a; padding: 32px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  p.sub { margin: 0 0 24px; color: #666a85; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  td { padding: 10px 8px; border-bottom: 1px solid #e1e3f0; }
  td:last-child { text-align: right; }
  tr.total td { font-weight: bold; font-size: 18px; border-top: 2px solid #20213a; }
</style></head><body>
<h1>NexusHR Payslip</h1>
<p class="sub">${period}</p>
<table>
  <tr><td>Employee</td><td>${name} (ID ${record.employeeId})</td></tr>
  <tr><td>Payment date</td><td>${paid}</td></tr>
  <tr><td>Basic salary</td><td>${money.format(Number(record.basicSalary))}</td></tr>
  <tr><td>Allowances</td><td>${money.format(Number(record.allowances))}</td></tr>
  <tr><td>Deductions</td><td>- ${money.format(Number(record.deductions))}</td></tr>
  <tr class="total"><td>Net salary</td><td>${money.format(Number(record.netSalary))}</td></tr>
</table>
<p class="sub" style="margin-top:32px">This is a system-generated payslip.</p>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <section className="pay-page">
      <div className="pay-heading">
        <h2>Payroll</h2>
        <p>Create payroll records, review totals and print payslips.</p>
      </div>

      {error && <p role="alert" className="pay-error">{error}</p>}
      {notice && <p role="status" className="pay-notice">{notice}</p>}

      <div className="pay-stats">
        <div className="pay-stat">
          <span>Records shown</span>
          <strong>{visibleRecords.length}</strong>
        </div>
        <div className="pay-stat">
          <span>Total net payroll</span>
          <strong>{money.format(totalNet)}</strong>
        </div>
      </div>

      <form className="pay-form" onSubmit={addPayroll}>
        <div className="pay-field">
          <label htmlFor="pay-employee">Employee</label>
          <select
            id="pay-employee"
            value={form.employeeId}
            onChange={(e) => updateField('employeeId', e.target.value)}
          >
            <option value="">Select employee</option>
            {employees
              .filter((employee) => employee.status !== 'OFFBOARDED')
              .map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} (ID {employee.id})
              </option>
            ))}
          </select>
        </div>
        <div className="pay-field">
          <label htmlFor="pay-period">Pay period</label>
          <input
            id="pay-period"
            value={form.payPeriod}
            onChange={(e) => updateField('payPeriod', e.target.value)}
          />
        </div>
        <div className="pay-field">
          <label htmlFor="pay-date">Payment date</label>
          <input
            id="pay-date"
            type="date"
            value={form.paymentDate}
            onChange={(e) => updateField('paymentDate', e.target.value)}
          />
        </div>
        <div className="pay-field">
          <label htmlFor="pay-basic">Basic salary</label>
          <input
            id="pay-basic"
            type="number"
            min="0"
            step="0.01"
            value={form.basicSalary}
            onChange={(e) => updateField('basicSalary', e.target.value)}
          />
        </div>
        <div className="pay-field">
          <label htmlFor="pay-allowances">Allowances</label>
          <input
            id="pay-allowances"
            type="number"
            min="0"
            step="0.01"
            value={form.allowances}
            onChange={(e) => updateField('allowances', e.target.value)}
          />
        </div>
        <div className="pay-field">
          <label htmlFor="pay-deductions">Deductions</label>
          <input
            id="pay-deductions"
            type="number"
            min="0"
            step="0.01"
            value={form.deductions}
            onChange={(e) => updateField('deductions', e.target.value)}
          />
        </div>
        <div className="pay-net">
          Net salary preview: <strong>{money.format(netPreview)}</strong>
        </div>
        <button className="pay-button" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save payroll'}
        </button>
      </form>

      <div className="pay-list-head">
        <h3>Payroll records</h3>
        <label className="pay-filter">
          Period
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="ALL">All periods</option>
            {periods.map((period) => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading payroll...</p>
      ) : visibleRecords.length === 0 ? (
        <p>No payroll records yet. Add the first one above.</p>
      ) : (
        <div className="pay-table-wrap">
          <table className="pay-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  <td>{employeeName(record.employeeId)}</td>
                  <td>{record.payPeriod}</td>
                  <td>{money.format(Number(record.basicSalary))}</td>
                  <td>{money.format(Number(record.allowances))}</td>
                  <td>{money.format(Number(record.deductions))}</td>
                  <td><strong>{money.format(Number(record.netSalary))}</strong></td>
                  <td className="pay-actions">
                    <button type="button" onClick={() => printPayslip(record)}>
                      Payslip
                    </button>
                    <button
                      type="button"
                      className="pay-delete"
                      onClick={() => removeRecord(record.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}