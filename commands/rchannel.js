const Eris = require('eris');

module.exports = {
    name: 'recreatechannel',
    description: 'Deletes the channel and all messages in it and then recreates it with empty contents.',
    category: 'moderator',
    aliases: ["rchannel"],
    usage: '',
    permissions: ["manageChannels"],

    async execute(client, message, args) {
        const channel = message.channel;
        const { id, position, topic } = channel;

        try {
            const newChannel = await client.createChannel(message.guildID, channel.name, channel.type, {
                position,
                topic
            });

            await channel.delete();

            await newChannel.createMessage({
                embed: {
                    color: 0x0000FF,
                    description: " channel has been cleared of contents"
                }
            });
        } catch (error) {
            console.error('Error recreating channel:', error);
            await message.channel.createMessage('An error occurred while recreating the channel.');
        }
    }
}