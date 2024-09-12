import { CommandInteraction } from 'eris';
import { Harmonix } from '../typedefinitions/harmonixtypes';
import { defineCommand } from '../code-utils/definingcommand';
import { logError } from '../code-utils/centralloggingfactory';

export default class extends defineCommand({
    name: "throwerror",
    description: "Debugging command for throwing errors",
    category: "debug",
    slashCommand: true,
}) {
    static async execute(harmonix: Harmonix, interaction: CommandInteraction) {
        try {
            throw new Error('Testing the error checking - debug only');
        } catch (error) {
            await logError('Debug error thrown:', error);
            await interaction.createMessage({
                content: 'An error occurred: ' + error.message,
                flags: 64 // Ephemeral flag
            });
        }
    }
}