import './Onboarding.css'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

type Approval = {
  id: number
  step: string
  decision: string
  approver: string
  comment: string | null
  decidedAt: string
}

type Workflow = {
  id: number
  employeeId: number
  currentStep: string
  status: string
  createdAt: string
  completedAt: string | null
  approvals: Approval[]
}

type EmployeeOption = {
  id: number
  firstName: string
  lastName: string
  status?: string
}

type DocInfo = {
  id: number
  employeeId: number
  docType: string
  fileName: string
  contentType: string
  fileSize: number
  uploadedAt: string
}

const STEPS = [
  { key: 'DOCUMENT_CHECK', label: 'Document check' },
  { key: 'MANAGER_APPROVAL', label: 'Manager approval' },
  { key: 'HR_APPROVAL', label: 'HR approval' },
]

const DOC_TYPES = [
  { value: 'ID_PROOF', label: 'ID proof' },
  { value: 'OFFER_LETTER', label: 'Offer letter' },
  { value: 'EDUCATION', label: 'Education certificate' },
  { value: 'ADDRESS_PROOF', label: 'Address proof' },
  { value: 'OTHER', label: 'Other' },
]

const MAX_FILE_BYTES = 2 * 1024 * 1024

function stepLabel(key: string) {
  return STEPS.find((step) => step.key === key)?.label ?? key
}

function docTypeLabel(value: string) {
  return DOC_TYPES.find((type) => type.value === value)?.label ?? value
}

function statusLabel(status: string) {
  if (status === 'IN_PROGRESS') return 'In progress'
  if (status === 'COMPLETED') return 'Completed'
  if (status === 'REJECTED') return 'Rejected'
  return status
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${Math.round(bytes / 1024)} KB`
}

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}))
  return data.message || fallback
}

function stepState(workflow: Workflow, index: number) {
  if (workflow.status === 'COMPLETED') return 'done'
  const currentIndex = STEPS.findIndex(
    (step) => step.key === workflow.currentStep,
  )
  if (index < currentIndex) return 'done'
  if (index === currentIndex) {
    return workflow.status === 'REJECTED' ? 'rejected' : 'current'
  }
  return 'todo'
}

export default function Onboarding() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [documents, setDocuments] = useState<DocInfo[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [comment, setComment] = useState('')
  const [approverName, setApproverName] = useState('')
  const [docType, setDocType] = useState('ID_PROOF')
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [startEmployeeId, setStartEmployeeId] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [workflowResponse, employeeResponse] = await Promise.all([
        fetch('/api/workflows', { credentials: 'same-origin' }),
        fetch('/api/employees', { credentials: 'same-origin' }),
      ])
      if (!workflowResponse.ok) {
        throw new Error(
          await readError(
            workflowResponse,
            `Could not load workflows (${workflowResponse.status}).`,
          ),
        )
      }
      if (!employeeResponse.ok) {
        throw new Error(`Could not load employees (${employeeResponse.status}).`)
      }
      const loaded: Workflow[] = await workflowResponse.json()
      setWorkflows(loaded)
      setEmployees(await employeeResponse.json())
      setSelectedId((current) =>
        current ?? (loaded.length > 0 ? loaded[0].id : null),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load onboarding.')
    } finally {
      setLoading(false)
    }
  }, [])

  const selected = workflows.find((item) => item.id === selectedId) ?? null
  const selectedEmployeeId = selected?.employeeId ?? null

  const loadDocuments = useCallback(async (employeeId: number | null) => {
    if (employeeId === null) {
      setDocuments([])
      return
    }
    try {
      const response = await fetch(`/api/documents?employeeId=${employeeId}`, {
        credentials: 'same-origin',
      })
      if (!response.ok) {
        throw new Error(
          await readError(response, `Could not load documents (${response.status}).`),
        )
      }
      setDocuments(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load documents.')
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    void loadDocuments(selectedEmployeeId)
  }, [selectedEmployeeId, loadDocuments])

  function employeeName(id: number) {
    const match = employees.find((employee) => employee.id === id)
    return match ? `${match.firstName} ${match.lastName}` : `Employee #${id}`
  }

  const withoutWorkflow = employees.filter(
    (employee) =>
      employee.status !== 'OFFBOARDED' &&
      !workflows.some((workflow) => workflow.employeeId === employee.id),
  )

  function selectWorkflow(id: number) {
    setSelectedId(id)
    setComment('')
    setApproverName('')
    setError('')
    setNotice('')
  }

  async function startWorkflow() {
    if (!startEmployeeId) {
      setError('Select an employee to start onboarding.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/workflows/start/${startEmployeeId}`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not start onboarding.'))
      }
      const created: Workflow = await response.json()
      setStartEmployeeId('')
      setNotice('Onboarding workflow started.')
      await loadAll()
      setSelectedId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start onboarding.')
    } finally {
      setBusy(false)
    }
  }

  async function decide(decision: 'APPROVE' | 'REJECT') {
    if (!selected) return
    if (decision === 'REJECT' && !comment.trim()) {
      setError('Add a reason before rejecting.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/workflows/${selected.id}/decision`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment, approverName }),
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not save this decision.'))
      }
      setComment('')
      setApproverName('')
      setNotice(decision === 'APPROVE' ? 'Step approved.' : 'Step rejected.')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save decision.')
    } finally {
      setBusy(false)
    }
  }

  async function restart() {
    if (!selected) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/workflows/${selected.id}/restart`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not restart the workflow.'))
      }
      setNotice('Workflow restarted from the first step.')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restart workflow.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    if (!file) {
      setError('Choose a PDF, PNG or JPG file to upload.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File is too large. The maximum size is 2 MB.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const body = new FormData()
      body.append('employeeId', String(selected.employeeId))
      body.append('docType', docType)
      body.append('file', file)
      const response = await fetch('/api/documents', {
        method: 'POST',
        credentials: 'same-origin',
        body,
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not upload this file.'))
      }
      setFile(null)
      setFileKey((current) => current + 1)
      setNotice('Document uploaded.')
      await loadDocuments(selected.employeeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload file.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteDocument(doc: DocInfo) {
    if (!window.confirm(`Delete ${doc.fileName}?`)) return
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Could not delete this document.')
      setNotice('Document deleted.')
      await loadDocuments(doc.employeeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete document.')
    }
  }

  const isManagerStep = selected?.currentStep === 'MANAGER_APPROVAL'

  return (
    <section className="onb-page">
      <div className="onb-heading">
        <h2>Employee onboarding</h2>
        <p>
          Each new hire goes through three approval steps: document check,
          manager approval and HR approval.
        </p>
      </div>

      {error && <p role="alert" className="onb-error">{error}</p>}
      {notice && <p role="status" className="onb-notice">{notice}</p>}

      {withoutWorkflow.length > 0 && (
        <div className="onb-start">
          <label htmlFor="onb-start-employee">Start onboarding for</label>
          <select
            id="onb-start-employee"
            value={startEmployeeId}
            onChange={(e) => setStartEmployeeId(e.target.value)}
          >
            <option value="">Select employee</option>
            {withoutWorkflow.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} (ID {employee.id})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="onb-button"
            disabled={busy}
            onClick={() => void startWorkflow()}
          >
            Start workflow
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading onboarding workflows...</p>
      ) : workflows.length === 0 ? (
        <p>
          No onboarding workflows yet. Add an employee and a workflow starts
          automatically.
        </p>
      ) : (
        <div className="onb-layout">
          <ul className="onb-list" aria-label="Onboarding workflows">
            {workflows.map((workflow) => (
              <li key={workflow.id}>
                <button
                  type="button"
                  className={`onb-item ${workflow.id === selectedId ? 'selected' : ''}`}
                  onClick={() => selectWorkflow(workflow.id)}
                >
                  <span className="onb-item-name">
                    {employeeName(workflow.employeeId)}
                  </span>
                  <span
                    className={`onb-pill onb-pill-${workflow.status.toLowerCase()}`}
                  >
                    {statusLabel(workflow.status)}
                  </span>
                  <span className="onb-dots" aria-hidden="true">
                    {STEPS.map((step, index) => (
                      <span
                        key={step.key}
                        className={`onb-dot onb-dot-${stepState(workflow, index)}`}
                      />
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="onb-detail">
              <div className="onb-detail-head">
                <h3>{employeeName(selected.employeeId)}</h3>
                <span
                  className={`onb-pill onb-pill-${selected.status.toLowerCase()}`}
                >
                  {statusLabel(selected.status)}
                </span>
              </div>

              <ol className="onb-steps">
                {STEPS.map((step, index) => {
                  const state = stepState(selected, index)
                  return (
                    <li key={step.key} className={`onb-step onb-step-${state}`}>
                      <span className="onb-step-badge">
                        {state === 'done' ? '✓' : state === 'rejected' ? '✕' : index + 1}
                      </span>
                      <span>{step.label}</span>
                    </li>
                  )
                })}
              </ol>

              {selected.status === 'IN_PROGRESS' && (
                <div className="onb-card">
                  <h4>Decision: {stepLabel(selected.currentStep)}</h4>
                  {selected.currentStep === 'DOCUMENT_CHECK' && (
                    <p className="onb-hint">
                      Upload at least one document below before approving this
                      step.
                    </p>
                  )}
                  <div className="onb-field">
                    <label htmlFor="onb-approver">
                      {isManagerStep
                        ? "Manager's name (required)"
                        : 'Approver name (optional)'}
                    </label>
                    <input
                      id="onb-approver"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder={
                        isManagerStep ? 'e.g. Priya Sharma' : 'Defaults to your login'
                      }
                    />
                  </div>
                  <div className="onb-field">
                    <label htmlFor="onb-comment">
                      Comment (required when rejecting)
                    </label>
                    <textarea
                      id="onb-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div className="onb-actions">
                    <button
                      type="button"
                      className="onb-button"
                      disabled={busy}
                      onClick={() => void decide('APPROVE')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="onb-button onb-button-danger"
                      disabled={busy}
                      onClick={() => void decide('REJECT')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selected.status === 'REJECTED' && (
                <div className="onb-card onb-card-rejected">
                  <h4>Rejected at: {stepLabel(selected.currentStep)}</h4>
                  <p className="onb-hint">
                    Fix the issue, then restart to run the approvals again.
                  </p>
                  <button
                    type="button"
                    className="onb-button"
                    disabled={busy}
                    onClick={() => void restart()}
                  >
                    Restart workflow
                  </button>
                </div>
              )}

              {selected.status === 'COMPLETED' && selected.completedAt && (
                <div className="onb-card onb-card-done">
                  <h4>Onboarding completed</h4>
                  <p className="onb-hint">
                    All three steps were approved on{' '}
                    {formatDate(selected.completedAt)}.
                  </p>
                </div>
              )}

              <div className="onb-card">
                <h4>Approval history</h4>
                {selected.approvals.length === 0 ? (
                  <p className="onb-hint">No decisions recorded yet.</p>
                ) : (
                  <ul className="onb-history">
                    {selected.approvals.map((approval) => (
                      <li key={approval.id}>
                        <strong>{stepLabel(approval.step)}</strong>
                        <span
                          className={`onb-pill onb-pill-${approval.decision.toLowerCase()}`}
                        >
                          {approval.decision === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                        <span className="onb-meta">
                          by {approval.approver} on {formatDate(approval.decidedAt)}
                        </span>
                        {approval.comment && (
                          <span className="onb-comment">{approval.comment}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="onb-card">
                <h4>Documents</h4>
                <form className="onb-upload" onSubmit={uploadDocument}>
                  <div className="onb-field">
                    <label htmlFor="onb-doc-type">Document type</label>
                    <select
                      id="onb-doc-type"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      {DOC_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="onb-field">
                    <label htmlFor="onb-file">
                      File (PDF, PNG or JPG, max 2 MB)
                    </label>
                    <input
                      key={fileKey}
                      id="onb-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <button type="submit" className="onb-button" disabled={busy}>
                    Upload
                  </button>
                </form>

                {documents.length === 0 ? (
                  <p className="onb-hint">No documents uploaded yet.</p>
                ) : (
                  <ul className="onb-docs">
                    {documents.map((doc) => (
                      <li key={doc.id}>
                        <span className="onb-doc-main">
                          <strong>{doc.fileName}</strong>
                          <span className="onb-meta">
                            {docTypeLabel(doc.docType)} · {formatSize(doc.fileSize)}{' '}
                            · {formatDate(doc.uploadedAt)}
                          </span>
                        </span>
                        <span className="onb-doc-actions">
                          <a href={`/api/documents/${doc.id}/download`}>
                            Download
                          </a>
                          <button
                            type="button"
                            className="onb-link-danger"
                            onClick={() => void deleteDocument(doc)}
                          >
                            Delete
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}