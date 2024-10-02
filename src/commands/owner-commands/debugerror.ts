import { CommandInteraction } from 'eris';
import { Harmonix } from '../../../discordkit/types/harmonixtypes';
import { defineCommand } from '../../../discordkit/utils/command';
import { logError } from '../../../discordkit/utils/centralloggingfactory';

export default class extends defineCommand({
    name: "throwerror",
    description: "Debugging command for throwing errors",
    category: "debug",
    slashCommand: true,
    ownerOnly: true,
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