import type { Employee, EmployeeInput } from '../types/employee'

const DEFAULT_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

function baseUrl(): string {
  return DEFAULT_BASE.replace(/\/$/, '')
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

function apiError(res: Response, body: string): Error {
  return new Error(
    `Request failed (${res.status} ${res.statusText})${body ? `: ${body}` : ''}`,
  )
}

/** Supports plain arrays or common wrappers: { data }, { employees }, { items } */
function unwrapEmployeeList(payload: unknown): Employee[] {
  if (Array.isArray(payload)) return payload as Employee[]
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    for (const key of ['data', 'employees', 'items', 'results'] as const) {
      const v = o[key]
      if (Array.isArray(v)) return v as Employee[]
    }
  }
  return []
}

function unwrapEmployee(payload: unknown): Employee {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: Employee }).data
  }
  return payload as Employee
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${baseUrl()}/employees`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    const err = await res.text()
    throw apiError(res, err)
  }
  const json = await parseJson<unknown>(res)
  return unwrapEmployeeList(json)
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const res = await fetch(`${baseUrl()}/employees/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    const err = await res.text()
    throw apiError(res, err)
  }
  const json = await parseJson<unknown>(res)
  return unwrapEmployee(json)
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<Employee> {
  const res = await fetch(`${baseUrl()}/employees`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.text()
    throw apiError(res, err)
  }
  const json = await parseJson<unknown>(res)
  return unwrapEmployee(json)
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>,
): Promise<Employee> {
  const res = await fetch(`${baseUrl()}/employees/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.text()
    throw apiError(res, err)
  }
  const json = await parseJson<unknown>(res)
  return unwrapEmployee(json)
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/employees/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok && res.status !== 204) {
    const err = await res.text()
    throw apiError(res, err)
  }
}
