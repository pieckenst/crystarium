const Eris = require('eris');

module.exports = {
    name: 'channelunlock',
    description: 'Unlocks a channel.',
    category: 'moderator',
    aliases: ["chanunlock"],
    usage: '',
    permissions: ["manageChannels"],

    async execute(client, message, args) {
        const channel = message.channel;

        try {
            const roles = await message.guild.getRESTRoles();
            const promises = roles.map(role => 
                channel.editPermission(role.id, 2112, 0, 'role')
            );
            await Promise.all(promises);

            const embed = {
                color: 0x00FF00,
                title: "The channel has been unlocked",
                description: `**Unlocked by:** ${message.member.mention}`
            };

            return client.createMessage(channel.id, { embed });
        } catch (error) {
            console.error('Error unlocking channel:', error);
            return client.createMessage(channel.id, "An error occurred while unlocking the channel.");
        }
    }
}