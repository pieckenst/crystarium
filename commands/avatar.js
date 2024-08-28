const Eris = require('eris');
const Canvas = require('canvas');

module.exports = {
    name: 'avatar',
    description: 'Show user discord avatar by command',
    async execute(client, message, args) {
        const targetUser = message.mentions[0] || message.author;
        
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

        await client.createMessage(message.channel.id, { embed: avatarEmbed });
    }
}