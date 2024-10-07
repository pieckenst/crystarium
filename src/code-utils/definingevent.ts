import { Effect } from "effect";
import { Harmonix, HarmonixEvent } from "../typedefinitions/harmonixtypes";
import { logInfo, logError } from "./centralloggingfactory";
import { Client, ClientEvents } from "eris";

type EventExecute<T extends keyof ClientEvents> = (
  harmonix: Harmonix,
  ...args: ClientEvents[T]
) => Promise<void>;

export function defineEvent<T extends keyof ClientEvents>(config: {
  name: T;
  description?: string;
}) {
  return class {
    static execute: EventExecute<T> = async () => {
      throw new Error("Execute method must be implemented");
    };

    static build(): HarmonixEvent {
      return {
        name: String(config.name),
        execute: async (harmonix: Harmonix, ...args: any[]) => {
          return Effect.runPromise(
            Effect.tryPromise(async () => {
              logInfo(`Executing event ${String(config.name)}`, "event");
              await this.execute(harmonix, ...(args as ClientEvents[T]));
            }).pipe(
              Effect.tapError((error) =>
                Effect.sync(() => {
                  logError(
                    `Error executing event ${String(config.name)}:`,
                    error,
                  );
                }),
              ),
            ),
          );
        },
      };
    }
  };
}
