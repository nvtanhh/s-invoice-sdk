import { noopLogger } from '../../src/config'

describe('Config', () => {
  describe('noopLogger', () => {
    it('should have debug method that does nothing', () => {
      expect(() => noopLogger.debug('msg')).not.toThrow()
      expect(() => noopLogger.debug('msg', { meta: 'data' })).not.toThrow()
    })

    it('should have info method that does nothing', () => {
      expect(() => noopLogger.info('msg')).not.toThrow()
      expect(() => noopLogger.info('msg', { meta: 'data' })).not.toThrow()
    })

    it('should have warn method that does nothing', () => {
      expect(() => noopLogger.warn('msg')).not.toThrow()
      expect(() => noopLogger.warn('msg', { meta: 'data' })).not.toThrow()
    })

    it('should have error method that does nothing', () => {
      expect(() => noopLogger.error('msg')).not.toThrow()
      expect(() => noopLogger.error('msg', { meta: 'data' })).not.toThrow()
    })

    it('should implement Logger interface', () => {
      expect(noopLogger).toHaveProperty('debug')
      expect(noopLogger).toHaveProperty('info')
      expect(noopLogger).toHaveProperty('warn')
      expect(noopLogger).toHaveProperty('error')
      expect(typeof noopLogger.debug).toBe('function')
      expect(typeof noopLogger.info).toBe('function')
      expect(typeof noopLogger.warn).toBe('function')
      expect(typeof noopLogger.error).toBe('function')
    })
  })
})
