export const queryKeys = {
  employees: ['employees'] as const,
  employee: (id: string) => ['employees', id] as const,
}
