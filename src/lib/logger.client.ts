type BrowserLogger = {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

export const logger: BrowserLogger = {
  info: (...args: unknown[]) => console.info('[oscillo]', ...args),
  warn: (...args: unknown[]) => console.warn('[oscillo]', ...args),
  error: (...args: unknown[]) => console.error('[oscillo]', ...args),
  debug: (...args: unknown[]) => console.debug('[oscillo]', ...args),
}
