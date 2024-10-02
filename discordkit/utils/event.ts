import { Effect } from 'effect';
import { Harmonix } from '../types/harmonixtypes';
import { logInfo, logError } from './centralloggingfactory';
import { Client, ClientEvents } from 'eris';

type EventExecute<T extends keyof ClientEvents | string> =
  T extends keyof ClientEvents
    ? (harmonix: Harmonix, ...args: ClientEvents[T]) => Promise<void>
    : (harmonix: Harmonix, ...args: any[]) => Promise<void>;

export function defineEvent<T extends keyof ClientEvents | string>(
  config: {
    name: T;
    description?: string;
    once?: boolean;
  }
) {
  return class {
    static execute: EventExecute<T>;

    static build() {
      return {
        name: String(config.name),
        once: config.once || false,
        execute: async (harmonix: Harmonix, ...args: unknown[]): Promise<void> => {
          return Effect.runPromise(
            Effect.tryPromise(async () => {
              logInfo(`Executing event ${String(config.name)}`, 'event');
              await this.execute(harmonix, ...(args as any));
            }).pipe(
              Effect.tapError((error) => Effect.sync(() => {
                logError(`Error executing event ${String(config.name)}:`, error);
              }))
            )
          );
        }
      };
    }
  };
}
