import { Message, TextableChannel, Guild, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: 'serverinfo',
    description: 'Information about the Discord server where the bot is on',
    category: "information",
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        if (!(msg.channel instanceof GuildChannel)) {
            await harmonix.client.createMessage(msg.channel.id, "This command can only be used in a server.");
            return;
        }

        const guild: Guild = msg.channel.guild;

        const infoserver = {
            embed: {
                color: 0xF8AA2A,
                title: `Information about the server: ${guild.name}`,
                thumbnail: guild.iconURL ? { url: guild.iconURL } : undefined,
                fields: [
                    {
                        name: 'Created At',
                        value: new Date(guild.createdAt).toUTCString(),
                        inline: true
                    },
                    {
                        name: 'Member Count',
                        value: guild.memberCount.toString(),
                        inline: true
                    },
                    {
                        name: 'Joined At',
                        value: new Date(guild.joinedAt).toUTCString(),
                        inline: true
                    },
                    {
                        name: 'Server Owner',
                        value: (await harmonix.client.getRESTUser(guild.ownerID)).username,
                        inline: true
                    }
                ],
                timestamp: new Date()
            }
        };

        await harmonix.client.createMessage(msg.channel.id, infoserver);
    }};