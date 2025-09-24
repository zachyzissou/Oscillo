const path = require('path')
const pino = require('pino')

function boolFromEnv(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function resolveLogFile() {
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs')
  const logFile = process.env.LOG_FILE || 'app.log'
  return path.isAbsolute(logFile) ? logFile : path.join(logDir, logFile)
}

function resolveLevel() {
  const fallback = process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  return process.env.LOG_LEVEL || fallback
}

function createStreams(level) {
  const pretty = boolFromEnv(process.env.LOG_PRETTY, process.env.NODE_ENV !== 'production')
  const toFile = boolFromEnv(process.env.LOG_TO_FILE, true)
  const streams = []

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

let singleton

function getLogger() {
  if (singleton) return singleton
  const level = resolveLevel()
  const streams = createStreams(level)
  const destinations = streams.length > 1 ? pino.multistream(streams) : streams[0]?.stream || pino.destination(1)

  singleton = pino(
    {
      level,
      base: { service: 'oscillo-jam-server' },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label }
        },
      },
    },
    destinations,
  )

  return singleton
}

module.exports = {
  logger: getLogger(),
}
