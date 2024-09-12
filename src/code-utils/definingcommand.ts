import { Effect } from 'effect';
import { Harmonix, HarmonixCommand, HarmonixOptions } from '../typedefinitions/harmonixtypes';
import { Message, TextableChannel, Constants } from 'eris';
import { logError } from '../code-utils/centralloggingfactory';
import { ApplicationCommandOptions, CommandInteraction } from 'eris';
import { CustomApplicationCommandOptions } from '../typedefinitions/harmonixtypes';

export function defineCommand<T extends Record<string, any> = Record<string, any>>(
    config: {
      name: string;
      description: string;
      aliases?: string[];
      usage?: string;
      category?: string;
      slashCommand?: boolean;
      type?: 1;
      options?: CustomApplicationCommandOptions[];
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
          execute: async (harmonix: Harmonix, message: Message<TextableChannel> | CommandInteraction, args: string[] | Record<string, any>): Promise<void> => {
            await Effect.runPromise(
              Effect.tryPromise(async () => {
                const userId = 'author' in message ? message.author.id : message.member?.id || message.user?.id;
                if (harmonix.options.debug) {
                  console.log(`Debug: User ID for command execution: ${userId}`);
                }
                
                if (config.ownerOnly && userId !== harmonix.options.ownerId) {
                  throw new Error("This command can only be used by the bot owner.");
                }

                if (config.permissions && 'member' in message && message.member) {
                  const missingPermissions = config.permissions.filter(perm => !message.member!.permissions.has(BigInt(Constants.Permissions[perm as keyof typeof Constants.Permissions])));
                  if (missingPermissions.length > 0) {
                    throw new Error(`You're missing the following permissions: ${missingPermissions.join(", ")}`);
                  }
                }

                // Handle slash command options
                let commandArgs: T = args as T;
                if (message instanceof CommandInteraction && message.data.options) {
                  commandArgs = message.data.options.reduce((acc, option) => {
                    if ('value' in option) {
                      return { ...acc, [option.name]: option.value };
                    }
                    return acc;
                  }, {} as Record<string, unknown>) as T;
                }

                if (config.slashCommand) {
                  await this.execute(harmonix, message as CommandInteraction, commandArgs);
                } else {
                  await this.execute(harmonix, message as Message<TextableChannel>, commandArgs);
                }
              }).pipe(                Effect.tapError((error) => Effect.sync(() => {
                  console.error(`An error has occured in command ${config.name}`);
                  
                })),
                Effect.catchAll((error) => Effect.sync(() => {
                  console.error(`Detailed error log follows : \n`, error);
                  console.error('Stack trace:', error.stack);

                  let errorMessage: string;
                  let stackTrace: string;
                  if (error instanceof Error) {
                    errorMessage = error.message;
                    stackTrace = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
                    if ('cause' in error && error.cause instanceof Error) {
                      errorMessage = error.cause.message;
                      stackTrace = error.cause.stack ? error.cause.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
                    }
                  } else {
                    errorMessage = String(error);
                    stackTrace = 'No stack trace available';
                  }

                  console.error(`Error in command ${config.name}:`, errorMessage);

                  if (config.slashCommand && 'createMessage' in message) {
                    return (message as CommandInteraction).createMessage({
                      embeds: [{
                        color: 0xFF0000,
                        title: "Oops!",
                        description: "An unexpected error has occurred!",
                        fields: [
                          { name: "Command", value: config.name },
                          { name: "Error Details", value: `\`\`\`${errorMessage}\`\`\`` },
                          { name: "Stack Trace", value: `\`\`\`${stackTrace}\`\`\`` }
                        ]
                      }],
                      flags: 64
                    });
                  } else if ('channel' in message) {
                    return harmonix.client.createMessage((message as Message<TextableChannel>).channel.id, {
                      embed: {
                        color: 0xFF0000,
                        title: "Oops!",
                        description: "An unexpected error has occurred!",
                        fields: [
                          { name: "Command", value: config.name },
                          { name: "Error Details", value: `\`\`\`${errorMessage}\`\`\`` },
                          { name: "Stack Trace", value: `\`\`\`${stackTrace}\`\`\`` }
                        ]
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
export const createSlashCommandOption = (
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  name: string,
  description: string,
  required: boolean = false,
  choices?: { name: string; value: string | number }[] 
): CustomApplicationCommandOptions => {
  return {
    type,
    name,
    description,
    required,
    choices: choices || undefined
  };
}