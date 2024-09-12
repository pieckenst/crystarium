import { defineEvent } from '../code-utils/definingevent';
import { Harmonix } from '../typedefinitions/harmonixtypes';
import { Interaction, CommandInteraction, ComponentInteraction } from 'eris';
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
              const command = harmonix.slashCommands.get(interaction.data.name);
              if (!command) return;

              try {
                await command.execute(harmonix, interaction, interaction.data.options);
              } catch (error) {
                logError(`Error handling interaction for command ${interaction.data.name}:`, error);
                await interaction.createMessage({
                  content: 'An error occurred while processing the command.',
                  flags: 64
                });
              }
            } else if (interaction instanceof ComponentInteraction) {
              const command = harmonix.commands.find(cmd => interaction.data.custom_id.startsWith(cmd.name));
              if (!command) return;

              try {
                await command.execute(harmonix, interaction, {});
              } catch (error) {
                logError(`Error handling interaction for command ${command.name}:`, error);
                await interaction.createMessage({
                  content: 'An error occurred while processing the interaction.',
                  flags: 64
                });
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
        }))
      )
    );
  }
}