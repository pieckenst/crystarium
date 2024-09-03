const Eris = require('eris');

module.exports = {
    name: 'serverinfo',
    description: 'Information about the Discord server where the bot is on',
    execute(client, message, args) {
        const guild = message.channel.guild;

        const infoserver = {
            embed: {
                color: 0xF8AA2A,
                title: `Information about the server: ${guild.name}`,
                thumbnail: { url: guild.iconURL },
                fields: [
                    {
                        name: 'Region',
                        value: guild.region,
                        inline: true
                    },
                    {
                        name: 'Created At',
                        value: new Date(guild.createdAt).toUTCString(),
                        inline: true
                    },
                    {
                        name: 'Member Count',
                        value: guild.memberCount,
                        inline: true
                    },
                    {
                        name: 'Joined At',
                        value: new Date(guild.joinedAt).toUTCString(),
                        inline: true
                    },
                    {
                        name: 'Server Owner',
                        value: client.users.get(guild.ownerID).username,
                        inline: true
                    }
                ],
                timestamp: new Date()
            }
        };

        client.createMessage(message.channel.id, infoserver);
    }
};