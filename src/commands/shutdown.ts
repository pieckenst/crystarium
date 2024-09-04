import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: "shutdown",
    description: "A Command To Shutdown The Bot!",
    usage: "shutdown",
    category: "owner",
    accessableby: "Owner",
    aliases: [""],
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        const ownerId = "540142383270985738";

        if (msg.author.id !== ownerId) {
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
                    embed: {
                        title: "You Are Not The Bot Owner!",
                        color: 0xff0000,
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
            return;
        }

        if (msg.channel.id) {
            await harmonix.client.createMessage(msg.channel.id, {
                embed: {
                    title: "Bot Is Shutting Down...",
                    color: 0x00ff00,
                    footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                    timestamp: new Date()
                }
            });
        }

        await harmonix.client.editStatus("online", {
            name: "❤️ for ya :) | Reboot or shutdown incoming - wait a bit",
            type: 3 // 3 corresponds to "WATCHING" in Eris
        });

        setTimeout(() => {
            harmonix.client.disconnect({reconnect: false});
            process.exit(0);
        }, 5000);
    }
};