import { defineEvent } from '../code-utils/definingevent';
import { Harmonix } from '../typedefinitions/harmonixtypes';
import { logInfo } from '../code-utils/centralloggingfactory';
import { colors } from 'consola/utils';
import consola from 'consola';

export default class extends defineEvent({
  name: 'ready',
  description: 'Emitted when the client is ready',
}) {
  static async execute(harmonix: Harmonix) {
    try {
      consola.debug('Client ready event triggered');
      consola.success(colors.green(` Logged in as ${harmonix.client.user.username}`));
      
      consola.debug('Setting client status');
      harmonix.client.editStatus("online", { name: "In development : Using Eris", type: 3 });
      
      consola.debug('Initializing manager');
      harmonix.manager.init(harmonix.client.user.id);
      
      // Register slash commands
      consola.debug('Preparing slash commands for registration');
      const commands = harmonix.slashCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        options: cmd.options,
        type: 1 as const // ChatInput command type
      }));
      
      consola.debug(`Attempting to register ${commands.length} slash commands`);
      try {
        await harmonix.client.bulkEditCommands(commands);
        consola.success(colors.green(` Registered ${commands.length} slash commands`));
      } catch (error) {
        consola.error(colors.red(` Error registering slash commands: ${error.message}`));
      }
    } catch (error) {
      consola.error(colors.red(` An error occurred during client ready process: ${error.message}`));
      if (error instanceof Error) {
        consola.debug('Error stack:', error.stack);
      }
      // Optionally, you might want to rethrow the error or handle it in a specific way
      // throw error;
    }
  }
}