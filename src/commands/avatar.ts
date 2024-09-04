    import { Message, TextableChannel } from 'eris';
    import { Harmonix } from '../core';

    export default {
        name: 'avatar',
        description: 'Show user discord avatar by command',
        category: "information",
        execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
            const targetUser = msg.mentions[0] || msg.author;
        
            const avatarEmbed = {
                description: `Avatar of ${targetUser.username}#${targetUser.discriminator}`,
                image: {
                    url: targetUser.dynamicAvatarURL('png', 1024)
                },
                color: Math.floor(Math.random() * 0xFFFFFF),
                timestamp: new Date(),
                footer: {
                    text: 'Avatar command'
                }
            };

            await harmonix.client.createMessage(msg.channel.id, { embed: avatarEmbed });
        }
    };