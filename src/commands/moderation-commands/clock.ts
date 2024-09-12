import { GuildChannel, Message, TextableChannel } from 'eris';
import { Harmonix } from '../../core';

export default {
    name: 'channellock',
    description: 'Locks a channel.',
    category: 'moderation',
    aliases: ["clock"],
    usage: '',
    permissions: ["manageChannels"],

    execute: async (harmonix: Harmonix, message: Message<TextableChannel>, args: string[]) => {
        const channel = message.channel;

        if (!('guild' in channel)) {
            await harmonix.client.createMessage(channel.id, 'This command can only be used in guild channels.');
            return;
        }

        try {
            const roles = await channel.guild.getRESTRoles();
            const promises = roles.map(role => 
                (channel as GuildChannel).editPermission(role.id, 0, 2112, 0, 'Locking channel')
            );
            await Promise.all(promises);

            const embed = {
                color: 0x00FF00,
                title: "The channel has been locked",
                description: `**Locked by:** ${message.member?.mention ?? 'Unknown'}`
            };

            await harmonix.client.createMessage(channel.id, { embed });
        } catch (error) {
            console.error('Error locking channel:', error);
            await harmonix.client.createMessage(channel.id, 'An error occurred while locking the channel.');
        }
    }
};