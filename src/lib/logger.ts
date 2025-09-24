// Universal logger that works in both Node.js and browser environments
export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  child?: (bindings: Record<string, unknown>) => Logger
}

const fallbackLogger: Logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
}

const loadServerLogger = (): Logger => {
  try {
    const moduleExports = require('./logger.server') as { logger: Logger }
    return moduleExports.logger ?? fallbackLogger
  } catch (error) {
    console.warn('Falling back to console logger (server logger unavailable):', error)
    return fallbackLogger
  }
}

const loadClientLogger = (): Logger => {
  try {
    const moduleExports = require('./logger.client') as { logger: Logger }
    return moduleExports.logger ?? fallbackLogger
  } catch (error) {
    console.warn('Falling back to console logger (client logger unavailable):', error)
    return fallbackLogger
  }
}

const initLogger = (): Logger => (typeof window === 'undefined' ? loadServerLogger() : loadClientLogger())

export const logger: Logger = initLogger()
