import { Effect } from 'effect';
import { Harmonix, HarmonixCommand, HarmonixOptions } from '../typedefinitions/harmonixtypes';
import { Message, TextableChannel, Constants } from 'eris';
import { logError } from '../code-utils/centralloggingfactory';
import { ApplicationCommandOptions, CommandInteraction } from 'eris';

export function defineCommand<T extends Record<string, any> = Record<string, any>>(
    config: {
      name: string;
      description: string;
      aliases?: string[];
      usage?: string;
      category?: string;
      slashCommand?: boolean;
      type?: 1;
      options?: ApplicationCommandOptions[];
      permissions?: string[];
      ownerOnly?: boolean;
      intervalLimit?: { minute: number; hour: number; day: number };
    }
  ) {
    return class {
      static execute(harmonix: Harmonix, message: Message<TextableChannel> | CommandInteraction, args: string[] | T): Promise<void> {
        throw new Error('Execute method must be implemented');
      }
  
      static build(): HarmonixCommand {
        return {
          ...config,
          execute: async (harmonix: Harmonix, message: Message<TextableChannel> | CommandInteraction, args: string[] | Record<string, any>) => {
            return Effect.runPromise(
              Effect.tryPromise(async () => {
                if (config.ownerOnly && ('author' in message ? message.author.id : message.user?.id) !== harmonix.options.ownerId) {
                  throw new Error("This command can only be used by the bot owner.");
                }
  
                if (config.permissions && 'member' in message && message.member) {
                  const missingPermissions = config.permissions.filter(perm => !message.member!.permissions.has(BigInt(Constants.Permissions[perm as keyof typeof Constants.Permissions])));
                  if (missingPermissions.length > 0) {
                    throw new Error(`You're missing the following permissions: ${missingPermissions.join(", ")}`);
                  }
                }
  
                if (config.slashCommand) {
                  await this.execute(harmonix, message as CommandInteraction, args as T);
                } else {
                  await this.execute(harmonix, message as Message<TextableChannel>, args as string[]);
                }
              }).pipe(
                Effect.catchAll((error) => Effect.sync(() => {
                  logError(`Error executing command ${config.name}:`, error);
                  if ('channel' in message) {
                    harmonix.client.createMessage(message.channel.id, {
                      embed: {
                        color: 0xFF0000,
                        description: error.message
                      }
                    });
                  }
                }))
              )
            );
          }
        };
      }
    };
  }

export const defineEvent = (
  name: string,
  execute: (...args: any[]) => Promise<void>
) => {
  return {
    name,
    execute: async (...args: any[]) => {
      return Effect.runPromise(
        Effect.tryPromise(async () => {
          await execute(...args);
        }).pipe(
          Effect.catchAll((error) => Effect.sync(() => {
            logError(`Error executing event ${name}:`, error);
          }))
        )
      );
    }
  };
};

export const definePrecondition = (
  name: string,
  check: (harmonix: Harmonix, message: Message<TextableChannel> | any) => Promise<boolean>
) => {
  return {
    name,
    check: async (harmonix: Harmonix, message: Message<TextableChannel> | any) => {
      return Effect.runPromise(
        Effect.tryPromise(async () => {
          return await check(harmonix, message);
        }).pipe(
          Effect.catchAll((error) => Effect.sync(() => {
            logError(`Error in precondition ${name}:`, error);
            return false;
          }))
        )
      );
    }
  };
};

export const defineHarmonixConfig = (config: HarmonixOptions) => {
  return config;
};

// Utility function to create slash command options
export const createSlashCommandOption = (
  type: Constants['ApplicationCommandOptionTypes'],
  name: string,
  description: string,
  required: boolean = false,
  choices?: { name: string; value: string | number }[]
) => {
  return {
    type,
    name,
    description,
    required,
    choices
  };
}
