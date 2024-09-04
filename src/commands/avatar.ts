    import { Message, Client } from 'eris';

    export default {
        name: 'avatar',
        description: 'Show user discord avatar by command',
        execute: async (msg: Message, args: string[]) => {
            const client = msg.channel.client as Client;
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

            await client.createMessage(msg.channel.id, { embed: avatarEmbed });
        }
    };