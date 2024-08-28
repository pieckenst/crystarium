const { Constants } = require('eris');

module.exports = {
    name: "uptime",
    aliases: [],
    description: "Show bot's uptime",
    async execute(client, message) {
        const uptime = client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);

        const uptimeString = [
            days && `${days} day${days !== 1 ? 's' : ''}`,
            hours && `${hours} hour${hours !== 1 ? 's' : ''}`,
            minutes && `${minutes} minute${minutes !== 1 ? 's' : ''}`,
            seconds && `${seconds} second${seconds !== 1 ? 's' : ''}`
        ].filter(Boolean).join(', ');

        try {
            await message.channel.createMessage(`Uptime: \`${uptimeString}\``);
        } catch (error) {
            console.error('Error sending uptime message:', error);
        }
    }
};
