import path from 'path'
import pino from 'pino'

const boolFromEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const resolveLogFile = () => {
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs')
  const logFile = process.env.LOG_FILE || 'app.log'
  return path.isAbsolute(logFile) ? logFile : path.join(logDir, logFile)
}

const resolveLevel = () => {
  const level = process.env.LOG_LEVEL
  if (level) return level
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const createStreams = (level: string) => {
  const pretty = boolFromEnv(process.env.LOG_PRETTY, process.env.NODE_ENV !== 'production')
  const toFile = boolFromEnv(process.env.LOG_TO_FILE, true)

  const streams: pino.StreamEntry[] = []

  if (pretty) {
    console.warn('LOG_PRETTY=true is not supported in the server runtime; falling back to JSON logs.')
  }

  streams.push({ stream: pino.destination(1), level })

  if (toFile) {
    try {
      const fileDestination = pino.destination({ dest: resolveLogFile(), mkdir: true })
      streams.push({ stream: fileDestination, level })
    } catch (error) {
      console.warn('Failed to initialize file logger – continuing with stdout only:', error)
    }
  }

  return streams
}

const createServerLogger = () => {
  const level = resolveLevel()
  const streams = createStreams(level)
  const targets = streams.length > 1 ? pino.multistream(streams) : streams[0]?.stream ?? pino.destination(1)

  return pino(
    {
      level,
      base: { service: 'oscillo' },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label }
        },
      },
    },
    targets,
  )
}

declare global {
  var __OSCILLO_SERVER_LOGGER__: pino.Logger | undefined
}

const getLogger = () => {
  if (!globalThis.__OSCILLO_SERVER_LOGGER__) {
    globalThis.__OSCILLO_SERVER_LOGGER__ = createServerLogger()
  }
  return globalThis.__OSCILLO_SERVER_LOGGER__
}

export const logger = getLogger()

export type ServerLogger = typeof logger

export const createChildLogger = (bindings: Record<string, unknown>) => logger.child(bindings)
