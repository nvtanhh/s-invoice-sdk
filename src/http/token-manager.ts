import type { AxiosInstance } from 'axios'
import type { Logger } from '../config.js'

interface TokenState {
  accessToken: string
  expiresAt: number  // epoch ms
}

interface TokenManagerConfig {
  username: string
  password: string
  tokenSkewMs: number
  authPath: string
}

export class TokenManager {
  private state: TokenState | null = null
  private inflight: Promise<TokenState> | null = null

  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly cfg: TokenManagerConfig,
    private readonly log: Logger
  ) {}

  async getToken(): Promise<string> {
    if (this.state && Date.now() < this.state.expiresAt - this.cfg.tokenSkewMs) {
      return this.state.accessToken
    }
    if (!this.inflight) {
      this.inflight = this.refresh().finally(() => { this.inflight = null })
    }
    const next = await this.inflight
    return next.accessToken
  }

  invalidate(): void {
    this.state = null
    this.log.debug('token invalidated')
  }

  private async refresh(): Promise<TokenState> {
    this.log.debug('token refresh', { authPath: this.cfg.authPath })
    const res = await this.axiosInstance.post<{ access_token?: string; token?: string; expires_in?: number }>(
      this.cfg.authPath,
      { username: this.cfg.username, password: this.cfg.password }
    )
    const accessToken = res.data.access_token ?? res.data.token
    if (!accessToken) throw new Error('Login response missing access_token')
    const expiresInSec = res.data.expires_in ?? 300
    this.state = { accessToken, expiresAt: Date.now() + expiresInSec * 1000 }
    this.log.info('token refreshed', { expiresInSec })
    return this.state
  }
}
