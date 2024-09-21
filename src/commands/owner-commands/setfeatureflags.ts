import { defineCommand } from '../../code-utils/definingcommand';
import { Harmonix } from '../../typedefinitions/harmonixtypes';
import { CommandInteraction, Message, TextableChannel } from 'eris';
import { Effect } from 'effect';

export default class extends defineCommand({
  name: "setfeatureflags",
  description: "Set feature flags for the bot",
  category: "owner",
  usage: "setfeatureflags <flag> <value>",
  ownerOnly: true,
}) {
    static async execute(harmonix: Harmonix, interaction: CommandInteraction | Message<TextableChannel>, args: string[]) {
        const [flag, value] = args;
      
        return Effect.runPromise(
          Effect.tryPromise(async () => {
            if (!flag || !value) {
              throw new Error("Please provide both a flag and a value.");
            }
      
            if (!harmonix.options.featureFlags) {
              harmonix.options.featureFlags = {
                disabledCommands: [],
                betaCommands: [],
                useDatabase: 'none'
              };
            }
      
            switch (flag) {
              case "disableCommand":
                harmonix.options.featureFlags.disabledCommands.push(value);
                break;
              case "enableCommand":
                harmonix.options.featureFlags.disabledCommands = harmonix.options.featureFlags.disabledCommands.filter(cmd => cmd !== value);
                break;
              case "setBetaCommand":
                harmonix.options.featureFlags.betaCommands.push(value);
                break;
              case "unsetBetaCommand":
                harmonix.options.featureFlags.betaCommands = harmonix.options.featureFlags.betaCommands.filter(cmd => cmd !== value);
                break;
              case "setDatabase":
                harmonix.options.featureFlags.useDatabase = value as 'sqlite' | 'postgres' | 'none';
                break;
              default:
                throw new Error("Invalid feature flag.");
            }
      
            // Save to database if enabled
            if (harmonix.options.database) {
              await harmonix.options.database('featureFlags').insert(harmonix.options.featureFlags);
            }
      
            return "Feature flag updated successfully.";
          })
        ).then(
      message => {
        if (interaction instanceof CommandInteraction) {
          interaction.createMessage({ content: message });
        } else {
          harmonix.client.createMessage(interaction.channel.id, message);
        }
      },
      error => {
        const errorMessage = `Error setting feature flag: ${error.message}`;
        if (interaction instanceof CommandInteraction) {
          interaction.createMessage({ content: errorMessage });
        } else {
          harmonix.client.createMessage(interaction.channel.id, errorMessage);
        }
      }
    );
  }
}
