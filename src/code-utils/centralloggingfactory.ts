import consola from 'consola';
import { colors } from 'consola/utils';
import { Effect, Console } from 'effect';

enum LogLevel {
    INFO,
    SUCCESS,
    WARN,
    ERROR,
    DEBUG
}

interface LogOptions {
    level: LogLevel;
    message: string | any;
    command?: string;
    error?: Error;
    context?: string;
    data?: any;
}

const centralLogger = ({ level, message, command, error, context, data }: LogOptions) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        const commandInfo = command ? `[${command}] ` : '';
        const contextInfo = context ? `[${context}] ` : '';

        let formattedMessage: string;
        if (typeof message === 'object') {
            formattedMessage = JSON.stringify(message, null, 2);
        } else {
            formattedMessage = String(message);
        }

        switch (level) {
            case LogLevel.INFO:
                consola.info(colors.blue(`${contextInfo}${commandInfo}${formattedMessage}`));
                break;
            case LogLevel.SUCCESS:
                consola.success(colors.green(`${contextInfo}${commandInfo}${formattedMessage}`));
                break;
            case LogLevel.WARN:
                consola.warn(colors.yellow(`${contextInfo}${commandInfo}${formattedMessage}`));
                break;
            case LogLevel.ERROR:
                consola.error(colors.red(`${contextInfo}${commandInfo}${formattedMessage}`));
                if (error) {
                    consola.error(colors.red(`Error details: ${error.message}`));
                    if (error.stack) {
                        consola.error(colors.red(`Stack trace: ${error.stack}`));
                    }
                }
                break;
            case LogLevel.DEBUG:
                consola.debug(colors.magenta(`${contextInfo}${commandInfo}${formattedMessage}`));
                if (data) {
                    consola.debug(colors.magenta('Debug data:'), JSON.stringify(data, null, 2));
                }
                break;
        }
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in centralLogger: ${error.message}`));
            if (error instanceof Error && error.stack) {
                consola.error(colors.red(`Stack trace: ${error.stack}`));
            }
        }))
    ));
};

const logInfo = (message: string | any[], context?: string) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        
        return centralLogger({ level: LogLevel.INFO, message, context });
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in logInfo: ${error.message}`));
        }))
    ));
};

const logSuccess = (message: string | any[], context?: string) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        
        return centralLogger({ level: LogLevel.SUCCESS, message, context });
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in logSuccess: ${error.message}`));
        }))
    ));
};

const logWarn = (message: string | any[], context?: string) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        
        return centralLogger({ level: LogLevel.WARN, message, context });
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in logWarn: ${error.message}`));
        }))
    ));
};

const logError = (message: string | any[], error?: Error, context?: string) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        
        return centralLogger({ level: LogLevel.ERROR, message, error, context });
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in logError: ${error.message}`));
        }))
    ));
};

const logDebug = (message: string | any[], data?: any, context?: string) => {
    return Effect.runPromise(Effect.tryPromise(async () => {
        
        return centralLogger({ level: LogLevel.DEBUG, message, data, context });
    }).pipe(
        Effect.catchAll((error) => Effect.sync(() => {
            consola.error(colors.red(`Error in logDebug: ${error.message}`));
        }))
    ));
};

export { LogLevel, LogOptions, centralLogger, logInfo, logSuccess, logWarn, logError, logDebug };