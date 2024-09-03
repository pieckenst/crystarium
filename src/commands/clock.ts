const Eris = require('eris');

module.exports = {
    name: 'channellock',
    description: 'Locks a channel.',
    category: 'moderator',
    aliases: ["clock"],
    usage: '',
    permissions: ["manageChannels"],

    async execute(client, message, args) {
        const channel = message.channel;

        try {
            const roles = await message.guild.getRESTRoles();
            const promises = roles.map(role => 
                channel.editPermission(role.id, 0, 2112, 'role', 'Locking channel')
            );
            await Promise.all(promises);

            const embed = {
                color: 0x00FF00,
                title: "The channel has been locked",
                description: `**Locked by:** ${message.member.mention}`
            };

            await client.createMessage(channel.id, { embed });
        } catch (error) {
            console.error('Error locking channel:', error);
            await client.createMessage(channel.id, 'An error occurred while locking the channel.');
        }
    }
}