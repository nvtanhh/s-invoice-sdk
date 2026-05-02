import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import qs from 'qs'
import { TokenManager } from './token-manager.js'
import { mapError } from './errors.js'
import { type ClientConfig, type Logger, noopLogger } from '../config.js'
import { PATH_AUTH_LOGIN } from './paths.js'

// Extend config type to track retry
interface RetryConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

export class HttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly tokenManager: TokenManager
  private readonly authPath: string
  private readonly log: Logger

  constructor(cfg: ClientConfig) {
    this.log = cfg.logger ?? noopLogger
    this.authPath = cfg.authPath ?? PATH_AUTH_LOGIN

    this.axiosInstance = axios.create({
      baseURL: cfg.baseUrl,
      timeout: cfg.timeoutMs ?? 30_000
    })

    this.tokenManager = new TokenManager(
      this.axiosInstance,
      {
        username: cfg.username,
        password: cfg.password,
        tokenSkewMs: cfg.tokenSkewMs ?? 30_000,
        authPath: this.authPath
      },
      this.log
    )

    // Inject Bearer except on the auth endpoint itself
    this.axiosInstance.interceptors.request.use(async (req) => {
      if (req.url === this.authPath) return req
      const tok = await this.tokenManager.getToken()
      req.headers.set('Authorization', `Bearer ${tok}`)
      return req
    })

    // 401 → invalidate cache + retry once
    this.axiosInstance.interceptors.response.use(undefined, async (err: AxiosError) => {
      const reqCfg = err.config as RetryConfig | undefined
      if (err.response?.status === 401 && reqCfg && !reqCfg._retried) {
        reqCfg._retried = true
        this.tokenManager.invalidate()
        this.log.warn('401 retry after token refresh', { url: reqCfg.url })
        return this.axiosInstance.request(reqCfg)
      }
      throw err
    })
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    try {
      const res = await this.axiosInstance.post<T>(path, body, {
        headers: { 'Content-Type': 'application/json' }
      })
      return res.data
    } catch (e) {
      throw mapError(e)
    }
  }

  async postForm<T>(path: string, fields: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.axiosInstance.post<T>(path, qs.stringify(fields), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      return res.data
    } catch (e) {
      throw mapError(e)
    }
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.axiosInstance.get<T>(path, { params })
      return res.data
    } catch (e) {
      throw mapError(e)
    }
  }
}
