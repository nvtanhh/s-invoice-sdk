export interface ClientConfig {
  /**
   * Host root, NOT including the service prefix. Examples:
   *   'https://vinvoice.viettel.vn/api'
   *   'https://api-vinvoice.viettel.vn'
   * The SDK appends /services/einvoiceapplication/api/... to this base.
   */
  baseUrl: string
  taxCode: string      // supplier tax code (path param of createInvoice)
  username: string
  password: string
  /** Buffer subtracted from token TTL before refresh. Default 30_000 ms. */
  tokenSkewMs?: number
  /** Axios timeout. Default 30_000 ms. */
  timeoutMs?: number
  /** Override auth path. Default '/auth/login'. */
  authPath?: string
  /** Custom logger. Defaults to noopLogger. */
  logger?: Logger
}

export interface Logger {
  debug: (msg: string, meta?: unknown) => void
  info:  (msg: string, meta?: unknown) => void
  warn:  (msg: string, meta?: unknown) => void
  error: (msg: string, meta?: unknown) => void
}

export const noopLogger: Logger = {
  debug: () => {},
  info:  () => {},
  warn:  () => {},
  error: () => {}
}
