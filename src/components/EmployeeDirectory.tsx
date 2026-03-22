import { useEffect, useMemo, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from '../api/employeeApi'
import { queryKeys } from '../queryKeys'
import type { Employee, EmployeeInput } from '../types/employee'
import './EmployeeDirectory.css'

const emptyForm: EmployeeInput = {
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  jobTitle: '',
  phone: '',
}

function employeeToForm(e: Employee): EmployeeInput {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    department: e.department,
    jobTitle: e.jobTitle,
    phone: e.phone ?? '',
  }
}

export function EmployeeDirectory() {
  const queryClient = useQueryClient()
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EmployeeInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees,
    queryFn: fetchEmployees,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees })
      closePanel()
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeInput> }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees })
      closePanel()
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees })
      setDeleteTarget(null)
    },
  })

  const saving = createMutation.isPending || updateMutation.isPending

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setPanelOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id)
    setForm(employeeToForm(emp))
    setFormError(null)
    setPanelOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError('First name, last name, and email are required.')
      return
    }
    const payload: EmployeeInput = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      jobTitle: form.jobTitle.trim(),
      phone: form.phone?.trim() || '',
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  useEffect(() => {
    if (!panelOpen && !deleteTarget) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (deleteTarget) setDeleteTarget(null)
        else closePanel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen, deleteTarget])

  const sorted = useMemo(() => {
    const list = employeesQuery.data ?? []
    return [...list].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      ),
    )
  }, [employeesQuery.data])

  return (
    <div className="ed">
      <header className="ed__header">
        <div className="ed__brand">
          <span className="ed__logo" aria-hidden="true" />
          <div>
            <h1 className="ed__title">Employee directory</h1>
            <p className="ed__subtitle">
              PostgreSQL-backed service · React Query on the client
            </p>
          </div>
        </div>
        <button type="button" className="ed__btn ed__btn--primary" onClick={openCreate}>
          <span className="ed__btn-icon" aria-hidden="true">+</span>
          Add employee
        </button>
      </header>

      {employeesQuery.isError && (
        <div className="ed__banner ed__banner--error" role="alert">
          <strong>Could not load employees.</strong>{' '}
          {(employeesQuery.error as Error).message}
        </div>
      )}

      <section className="ed__card" aria-busy={employeesQuery.isLoading}>
        {employeesQuery.isLoading ? (
          <div className="ed__skeleton-wrap" aria-label="Loading employees">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ed__skeleton-row" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="ed__empty">
            <p>No employees yet. Create one to get started.</p>
            <button
              type="button"
              className="ed__btn ed__btn--primary"
              onClick={openCreate}
            >
              Add your first employee
            </button>
          </div>
        ) : (
          <div className="ed__table-wrap">
            <table className="ed__table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Department</th>
                  <th scope="col">Role</th>
                  <th scope="col" className="ed__th-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span className="ed__name">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </td>
                    <td>
                      <a className="ed__link" href={`mailto:${emp.email}`}>
                        {emp.email}
                      </a>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.jobTitle}</td>
                    <td className="ed__actions">
                      <button
                        type="button"
                        className="ed__btn ed__btn--ghost ed__btn--sm"
                        onClick={() => openEdit(emp)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ed__btn ed__btn--danger ed__btn--sm"
                        onClick={() => setDeleteTarget(emp)}
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

      {panelOpen && (
        <div
          className="ed__overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePanel()
          }}
        >
          <div
            className="ed__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ed-panel-title"
          >
            <div className="ed__panel-head">
              <h2 id="ed-panel-title" className="ed__panel-title">
                {editingId ? 'Edit employee' : 'New employee'}
              </h2>
              <button
                type="button"
                className="ed__icon-btn"
                onClick={closePanel}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="ed__form" onSubmit={handleSubmit}>
              {formError && (
                <div className="ed__banner ed__banner--error ed__banner--compact">
                  {formError}
                </div>
              )}
              <div className="ed__grid">
                <label className="ed__field">
                  <span>First name</span>
                  <input
                    name="firstName"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="ed__field">
                  <span>Last name</span>
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="ed__field ed__field--full">
                  <span>Work email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="ed__field">
                  <span>Department</span>
                  <input
                    name="department"
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                  />
                </label>
                <label className="ed__field">
                  <span>Job title</span>
                  <input
                    name="jobTitle"
                    autoComplete="organization-title"
                    value={form.jobTitle}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jobTitle: e.target.value }))
                    }
                  />
                </label>
                <label className="ed__field ed__field--full">
                  <span>Phone (optional)</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="ed__panel-actions">
                <button
                  type="button"
                  className="ed__btn ed__btn--ghost"
                  onClick={closePanel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ed__btn ed__btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="ed__overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null)
          }}
        >
          <div className="ed__confirm" role="alertdialog" aria-modal="true">
            <h3 className="ed__confirm-title">Remove employee?</h3>
            <p className="ed__confirm-text">
              This will delete{' '}
              <strong>
                {deleteTarget.firstName} {deleteTarget.lastName}
              </strong>{' '}
              from the directory. This action cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="ed__confirm-error">
                {(deleteMutation.error as Error).message}
              </p>
            )}
            <div className="ed__panel-actions ed__panel-actions--end">
              <button
                type="button"
                className="ed__btn ed__btn--ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ed__btn ed__btn--danger"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="ed__footer">
        <span>
          API base:{' '}
          <code className="ed__code">
            {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'}
          </code>
        </span>
      </footer>
    </div>
  )
}
