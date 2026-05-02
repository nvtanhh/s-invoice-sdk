import axios, { type AxiosInstance } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { TokenManager } from '../../src/http/token-manager'
import { noopLogger } from '../../src/config'

describe('TokenManager', () => {
  let axiosInstance: AxiosInstance
  let mock: MockAdapter
  let tokenManager: TokenManager

  beforeEach(() => {
    axiosInstance = axios.create()
    mock = new MockAdapter(axiosInstance)
  })

  afterEach(() => {
    mock.reset()
  })

  it('should cache token until skew window', async () => {
    const expiresInSec = 300
    const authPath = '/auth/login'
    const accessToken = 'test-token-123'

    mock.onPost(authPath).reply(200, {
      access_token: accessToken,
      expires_in: expiresInSec
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    // First call should fetch
    const token1 = await tokenManager.getToken()
    expect(token1).toBe(accessToken)
    expect(mock.history.post).toHaveLength(1)

    // Second call should use cache (within skew window)
    const token2 = await tokenManager.getToken()
    expect(token2).toBe(accessToken)
    expect(mock.history.post).toHaveLength(1) // No additional request
  })

  it('should coalesce concurrent refreshes into one HTTP call', async () => {
    const expiresInSec = 300
    const authPath = '/auth/login'
    const accessToken = 'test-token-456'

    mock.onPost(authPath).reply(200, {
      access_token: accessToken,
      expires_in: expiresInSec
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    // Make 3 concurrent calls without any token state
    const results = await Promise.all([
      tokenManager.getToken(),
      tokenManager.getToken(),
      tokenManager.getToken()
    ])

    // All should return the same token
    expect(results).toEqual([accessToken, accessToken, accessToken])

    // But only one HTTP request should be made
    expect(mock.history.post).toHaveLength(1)
  })

  it('should refresh after expiry', async () => {
    const authPath = '/auth/login'
    const token1 = 'test-token-first'
    const token2 = 'test-token-second'

    // First call returns token that expires immediately
    mock.onPost(authPath).replyOnce(200, {
      access_token: token1,
      expires_in: 0 // Expires immediately
    })

    // Second call returns new token
    mock.onPost(authPath).replyOnce(200, {
      access_token: token2,
      expires_in: 300
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 0,
        authPath
      },
      noopLogger
    )

    // First call
    const firstToken = await tokenManager.getToken()
    expect(firstToken).toBe(token1)

    // Wait a tiny bit to ensure token is expired
    await new Promise(r => setTimeout(r, 10))

    // Second call should refresh since token expired
    const secondToken = await tokenManager.getToken()
    expect(secondToken).toBe(token2)

    // Should have made 2 requests
    expect(mock.history.post).toHaveLength(2)
  })

  it('should invalidate() force refresh on next call', async () => {
    const authPath = '/auth/login'
    const token1 = 'test-token-first'
    const token2 = 'test-token-second'

    mock.onPost(authPath).replyOnce(200, {
      access_token: token1,
      expires_in: 300
    })

    mock.onPost(authPath).replyOnce(200, {
      access_token: token2,
      expires_in: 300
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    // First call
    const firstToken = await tokenManager.getToken()
    expect(firstToken).toBe(token1)
    expect(mock.history.post).toHaveLength(1)

    // Second call uses cache
    const cachedToken = await tokenManager.getToken()
    expect(cachedToken).toBe(token1)
    expect(mock.history.post).toHaveLength(1)

    // Invalidate
    tokenManager.invalidate()

    // Third call should refresh despite cache being recent
    const newToken = await tokenManager.getToken()
    expect(newToken).toBe(token2)
    expect(mock.history.post).toHaveLength(2)
  })

  it('should handle token response with `token` field instead of `access_token`', async () => {
    const authPath = '/auth/login'
    const accessToken = 'fallback-token-789'

    mock.onPost(authPath).reply(200, {
      token: accessToken, // Use `token` instead of `access_token`
      expires_in: 300
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    const token = await tokenManager.getToken()
    expect(token).toBe(accessToken)
  })

  it('should throw if login response missing access_token', async () => {
    const authPath = '/auth/login'

    mock.onPost(authPath).reply(200, {
      // Missing both access_token and token
      expires_in: 300
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    await expect(tokenManager.getToken()).rejects.toThrow('Login response missing access_token')
  })

  it('should use custom token skew window', async () => {
    const authPath = '/auth/login'
    const accessToken = 'skew-test-token'
    const expiresInSec = 100
    const tokenSkewMs = 60000 // Large skew: 60 seconds

    mock.onPost(authPath).replyOnce(200, {
      access_token: accessToken,
      expires_in: expiresInSec
    })

    mock.onPost(authPath).replyOnce(200, {
      access_token: 'new-token',
      expires_in: expiresInSec
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'testuser',
        password: 'testpass',
        tokenSkewMs,
        authPath
      },
      noopLogger
    )

    // First call
    await tokenManager.getToken()
    expect(mock.history.post).toHaveLength(1)

    // Even immediately after, token should be considered expired due to large skew
    // expiresAt = now + 100*1000 = now + 100000
    // but check is: now < expiresAt - tokenSkewMs = now < expiresAt - 60000
    // so: now < now + 40000, which is true, so should still be cached
    const token2 = await tokenManager.getToken()
    expect(token2).toBe(accessToken)
    expect(mock.history.post).toHaveLength(1)
  })

  it('should send correct credentials in login request', async () => {
    const authPath = '/auth/login'
    const username = 'myuser'
    const password = 'mypass'

    mock.onPost(authPath).reply(200, {
      access_token: 'token',
      expires_in: 300
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username,
        password,
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    await tokenManager.getToken()

    expect(mock.history.post).toHaveLength(1)
    const request = mock.history.post[0]
    expect(request).toBeDefined()
    expect(JSON.parse(request!.data as string)).toEqual({
      username,
      password
    })
  })

  it('should use default expires_in of 300 seconds when missing', async () => {
    const authPath = '/auth/login'
    const accessToken = 'token-with-default-ttl'

    mock.onPost(authPath).reply(200, {
      access_token: accessToken
      // expires_in missing
    })

    tokenManager = new TokenManager(
      axiosInstance,
      {
        username: 'user',
        password: 'pass',
        tokenSkewMs: 30000,
        authPath
      },
      noopLogger
    )

    const token = await tokenManager.getToken()
    expect(token).toBe(accessToken)
    // Should successfully use default TTL of 300 seconds
  })
})
