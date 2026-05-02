import axios from 'axios'

export class ViettelApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly httpStatus?: number,
    public readonly raw?: unknown
  ) {
    super(message)
    this.name = 'ViettelApiError'
  }
}

export class ViettelAuthError extends ViettelApiError {
  constructor(errorCode: string, message: string, httpStatus?: number, raw?: unknown) {
    super(errorCode, message, httpStatus, raw)
    this.name = 'ViettelAuthError'
  }
}

export class ViettelNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ViettelNetworkError'
  }
}

export class ViettelValidationError extends Error {
  constructor(public readonly issues: { path: string; message: string }[]) {
    super(`Validation failed: ${issues.map(i => `${i.path}: ${i.message}`).join('; ')}`)
    this.name = 'ViettelValidationError'
  }
}

export function mapError(e: unknown): never {
  if (axios.isAxiosError(e)) {
    if (e.response) {
      const data = e.response.data as { errorCode?: string; description?: string } | undefined
      const code = data?.errorCode ?? String(e.response.status)
      const msg = data?.description ?? e.message
      if (e.response.status === 401 || e.response.status === 403) {
        throw new ViettelAuthError(code, msg, e.response.status, e.response.data)
      }
      throw new ViettelApiError(code, msg, e.response.status, e.response.data)
    }
    throw new ViettelNetworkError(e.message)
  }
  throw e
}
