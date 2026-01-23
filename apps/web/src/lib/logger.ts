/**
 * Production-safe Logger
 *
 * يوفر نظام تسجيل آمن للإنتاج مع إمكانية التحكم في مستويات التسجيل
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  isDevelopment: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV,
      level: import.meta.env.DEV ? "debug" : "error",
      isDevelopment: import.meta.env.DEV,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug("[DEBUG]", ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info("[INFO]", ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn("[WARN]", ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error("[ERROR]", ...args);
    }
  }
}

export const logger = new Logger();
