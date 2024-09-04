import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: 'channelunlock',
    description: 'Unlocks a channel.',
    category: 'moderation',
    aliases: ["chanunlock"],
    usage: '',
    permissions: ["manageChannels"],

    execute: async (harmonix: Harmonix, message: Message<TextableChannel>, args: string[]) => {
        const channel = message.channel;

        try {
            if (!message.guildID) {
                return harmonix.client.createMessage(channel.id, "This command can only be used in a guild.");
            }

            const guild = harmonix.client.guilds.get(message.guildID);
            if (!guild) {
                return harmonix.client.createMessage(channel.id, "Unable to fetch guild information.");
            }

            const roles = await guild.getRESTRoles();
            if (channel.type === 0 || channel.type === 2 || channel.type === 5) {
                const promises = roles.map(role => 
                    channel.editPermission(role.id, 2112, 0, 0)
                );
                await Promise.all(promises);
            } else {
                return harmonix.client.createMessage(channel.id, "This command can only be used in a guild text channel.");
            }

            const embed = {
                color: 0x00FF00,
                title: "The channel has been unlocked",
                description: `**Unlocked by:** ${message.member?.mention}`
            };

            return harmonix.client.createMessage(channel.id, { embed });
        } catch (error) {
            console.error('Error unlocking channel:', error);
            return harmonix.client.createMessage(channel.id, "An error occurred while unlocking the channel.");
        }
    }
};