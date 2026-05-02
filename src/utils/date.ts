/**
 * Convert a Date or epoch ms number to epoch ms.
 */
export function toEpochMs(value: Date | number): number {
  return value instanceof Date ? value.getTime() : value
}

/**
 * Convert a Date to 'dd/MM/yyyy' string — ONLY for GetInvoiceInput.fromDate/toDate.
 */
export function toDmy(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/**
 * Parse a 'dd/MM/yyyy' string to a Date.
 */
export function fromDmy(dmy: string): Date {
  const [dd, mm, yyyy] = dmy.split('/')
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
}
