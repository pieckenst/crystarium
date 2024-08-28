const Eris = require('eris')

module.exports = {
    name: 'ping',
    description: 'Performs a ping test on Discord',
    async execute(client, message, args) {
        const startTime = Date.now()
        const msg = await message.channel.createMessage('Pinging...')
        const latency = Date.now() - startTime
        
        const pingEmbed = {
            title: 'Ping Results',
            fields: [
                { name: 'Latency', value: `${latency} ms`, inline: true },
                { name: 'API', value: `${Math.round(client.shards.get(0).latency)} ms`, inline: true }
            ],
            color: 0x00FF00
        }

        await msg.edit({ content: '', embed: pingEmbed })
    }
}
