export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  scope: string
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

export interface Logger {
  info(scope: string, message: string, context?: Record<string, unknown>): void
  warn(scope: string, message: string, context?: Record<string, unknown>): void
  error(scope: string, message: string, context?: Record<string, unknown>): void
}

class BaseLogger {
  protected createEntry(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      scope,
      message,
      context,
      timestamp: new Date().toISOString()
    }
  }
}

export class ConsoleLogger extends BaseLogger implements Logger {
  info(scope: string, message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('info', scope, message, context)
    console.log(`[${entry.timestamp}] [INFO] [${scope}] ${message}`, context ?? {})
  }

  warn(scope: string, message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', scope, message, context)
    console.warn(`[${entry.timestamp}] [WARN] [${scope}] ${message}`, context ?? {})
  }

  error(scope: string, message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('error', scope, message, context)
    console.error(`[${entry.timestamp}] [ERROR] [${scope}] ${message}`, context ?? {})
  }
}

export class MemoryLogger extends BaseLogger implements Logger {
  public readonly entries: LogEntry[] = []

  info(scope: string, message: string, context?: Record<string, unknown>): void {
    this.entries.push(this.createEntry('info', scope, message, context))
  }

  warn(scope: string, message: string, context?: Record<string, unknown>): void {
    this.entries.push(this.createEntry('warn', scope, message, context))
  }

  error(scope: string, message: string, context?: Record<string, unknown>): void {
    this.entries.push(this.createEntry('error', scope, message, context))
  }
}

export const createDefaultLogger = (): Logger => new ConsoleLogger()
