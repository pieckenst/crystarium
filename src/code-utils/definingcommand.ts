import { Effect } from 'effect';
import { Harmonix, HarmonixCommand, HarmonixOptions, UniversalMessage, UniversalCommandInteraction, FeatureFlags, CustomApplicationCommandOptions } from '../typedefinitions/harmonixtypes';
import { logError, logDebug } from '../code-utils/centralloggingfactory';
import { getClientMethod } from './libraryHelper';
import * as Discord from 'discord.js';


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
    static execute(harmonix: Harmonix, message: UniversalMessage | UniversalCommandInteraction, args: string[] | T): Promise<void> {
      throw new Error('Execute method must be implemented');
    }

    static build(): HarmonixCommand {
      return {
        ...config,
        execute: async (harmonix: Harmonix, message: UniversalMessage | UniversalCommandInteraction, args: string[] | Record<string, any>): Promise<void> => {
          await Effect.runPromise(
            Effect.tryPromise(async () => {
              logDebug(`Executing command: ${config.name}`);

              const userId = 'author' in message ? message.author.id : message.user.id;

              logDebug(`User ID: ${userId}`);

              if (config.ownerOnly && userId !== harmonix.options.ownerId) {
                throw new Error("This command can only be used by the bot owner.");
              }

              if (config.permissions && message.member) {
                const hasPermission = await getClientMethod(harmonix.client, 'hasPermission')(message.member, config.permissions);
                if (!hasPermission) {
                  throw new Error(`You're missing the required permissions: ${config.permissions.join(", ")}`);
                }
              }

              let commandArgs: T = args as T;
              if ('options' in message && message.options) {
                commandArgs = message.options.reduce((acc: Record<string, unknown>, option: any) => {
                  if ('value' in option) {
                    return { ...acc, [option.name]: option.value };
                  }
                  return acc;
                }, {}) as T;
              }

              logDebug(`Command arguments: ${JSON.stringify(commandArgs)}`);

              await this.execute(harmonix, message, commandArgs);
            }).pipe(
              Effect.tapError((error) => Effect.sync(() => {
                logError(`An error has occurred in command ${config.name}`, error);
              })),
              Effect.catchAll((error) => Effect.sync(() => {
                logError(`Detailed error log follows:`, error);
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
                  return getClientMethod(harmonix.client, 'createMessage')(message.channel.id, {
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
                  return getClientMethod(harmonix.client, 'createMessage')(message.channel.id, {
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

export const defineHarmonixConfig = (config: HarmonixOptions) => {
  return config;
};

export const createSlashCommandOption = (
  harmonix: Harmonix,
  type: number,
  name: string,
  description: string,
  required: boolean = false,
  choices?: { name: string; value: string | number }[]
): CustomApplicationCommandOptions => {
  if (harmonix.options.featureFlags.useDiscordJS) {
    return {
      type: type as Discord.ApplicationCommandOptionType,
      name,
      description,
      required,
      choices: choices || undefined
    };
  } else {
    return {
      type,
      name,
      description,
      required,
      choices: choices || undefined
    };
  }
};