export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  [key: string]: unknown;
}

export interface Logger {
  child: (context: LogContext | string) => Logger;
  correlationId?: string;
  debug: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
}

export interface CreateLoggerOptions {
  context?: LogContext;
  correlationId?: string;
  sink?: (entry: {
    context?: Record<string, unknown>;
    correlationId?: string;
    level: LogLevel;
    message: string;
  }) => void;
}

const defaultSink = (entry: {
  context?: Record<string, unknown>;
  correlationId?: string;
  level: LogLevel;
  message: string;
}) => {
  const payload = {
    ...entry.context,
    correlationId: entry.correlationId,
    level: entry.level,
    message: entry.message,
  };
  if (entry.level === "error") {
    console.error(payload);
  } else if (entry.level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
};

export function createLogger(options?: string | CreateLoggerOptions): Logger {
  const opts: CreateLoggerOptions =
    typeof options === "string" ? { correlationId: options } : (options ?? {});
  const correlationId = opts.correlationId ?? opts.context?.correlationId;
  const baseContext = opts.context ?? {};
  const sink = opts.sink ?? defaultSink;

  const emit = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ) => {
    sink({
      context: { ...baseContext, ...context },
      correlationId,
      level,
      message,
    });
  };

  const logger: Logger = {
    child(context) {
      const childContext =
        typeof context === "string" ? { correlationId: context } : context;
      return createLogger({
        context: { ...baseContext, ...childContext },
        correlationId: childContext.correlationId ?? correlationId,
        sink,
      });
    },
    correlationId,
    debug(message, context) {
      emit("debug", message, context);
    },
    error(message, context) {
      emit("error", message, context);
    },
    info(message, context) {
      emit("info", message, context);
    },
    warn(message, context) {
      emit("warn", message, context);
    },
  };
  return logger;
}

export const createCorrelatedLogger = createLogger;
export type LoggerSink = CreateLoggerOptions["sink"];
