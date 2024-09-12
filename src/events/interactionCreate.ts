import { defineEvent } from '../code-utils/definingevent';
import { Harmonix } from '../typedefinitions/harmonixtypes';
import { Interaction, CommandInteraction } from 'eris';
import { Effect } from 'effect';
import { logError } from '../code-utils/centralloggingfactory';
import { colors } from 'consola/utils';
import consola from 'consola';

export default class extends defineEvent({
  name: 'interactionCreate',
  description: 'Emitted when an interaction is created',
}) {
  static async execute(harmonix: Harmonix, interaction: Interaction) {
    return Effect.runPromise(
      Effect.tryPromise(() => 
        new Promise<void>(async (resolve, reject) => {
          try {
            if (interaction instanceof CommandInteraction) {
              const commandName = interaction.data.name;
              const command = harmonix.commands.get(commandName);
              
              if (command && 'executeSlash' in command) {
                consola.info(colors.cyan(`Slash command "${commandName}" used by ${interaction.member?.username} in ${interaction.channel.id}`));
                await command.executeSlash(harmonix, interaction);
              } else {
                consola.warn(colors.yellow(` Unknown slash command "${commandName}" attempted by ${interaction.member?.username} in ${interaction.channel.id}`));
                await interaction.createMessage({ content: 'Unknown command', flags: 64 });
              }
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        })
      ).pipe(
        Effect.tapError((error) => Effect.sync(() => {
          consola.error(colors.red(`Error processing interaction: ${error.message}`));
          if (interaction instanceof CommandInteraction) {
            interaction.createMessage({
              content: 'An error occurred while processing the command',
              flags: 64
            }).catch((sendError: any) => console.error(colors.red("[ERROR] Error sending error message:"), colors.red(sendError.message)));
          }
        }))
      )
    );
  }
}