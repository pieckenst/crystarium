const { Constants } = require('eris');

module.exports = {
    name: "uptime",
    aliases: [],
    description: "Bot uptime.",
    category: "miscellaneous",
    async execute(client, message) {
        const uptime = client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);

        const embed = {
            title: "Bot uptime",
            fields: [
                { name: "Days", value: `\`\`\`${days}d\`\`\``, inline: true },
                { name: "Hours", value: `\`\`\`${hours}h\`\`\``, inline: true },
                { name: "Minutes", value: `\`\`\`${minutes}m\`\`\``, inline: false },
                { name: "Seconds", value: `\`\`\`${seconds}s\`\`\``, inline: false }
            ],
            color: Constants.Colors.DEFAULT
        };

        try {
            await message.channel.createMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending uptime message:', error);
        }
    }
};