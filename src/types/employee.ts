export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  jobTitle: string
  phone?: string | null
  createdAt?: string
  updatedAt?: string
}

export type EmployeeInput = Omit<
  Employee,
  'id' | 'createdAt' | 'updatedAt'
>
