import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: 'recreatechannel',
    description: 'Deletes the channel and all messages in it and then recreates it with empty contents.',
    category: 'moderator',
    aliases: ["rchannel"],
    usage: '',
    permissions: ["manageChannels"],

    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        if (!(msg.channel instanceof GuildChannel)) {
            return harmonix.client.createMessage(msg.channel.id, "This command can only be used in a guild channel.");
        }

        const channel = msg.channel;
        const { id, position, name, type } = channel;
        const topic = 'topic' in channel ? channel.topic : undefined;

        try {
            const newChannel = await harmonix.client.createChannel(channel.guild.id, name, type, {
                position,
                topic
            } as any) as TextableChannel;

            await channel.delete();

            if (newChannel.id) {
                await harmonix.client.createMessage(newChannel.id, {
                    embed: {
                        color: 0x0000FF,
                        description: "Channel has been cleared of contents"
                    }
                });
            }
        } catch (error) {
            console.error('Error recreating channel:', error);
            await harmonix.client.createMessage(msg.channel.id, 'An error occurred while recreating the channel.');
        }
    }};