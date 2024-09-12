
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
    consola.success(colors.green(` Logged in as ${harmonix.client.user.username}`));
    harmonix.client.editStatus("online", { name: "In development : Using Eris", type: 3 });
    harmonix.manager.init(harmonix.client.user.id);
    
    // Register slash commands
    const commands = harmonix.slashCommands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options,
      type: 1 as const // ChatInput command type
    }));
    harmonix.client.bulkEditCommands(commands);
  }
}
