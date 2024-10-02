import { Message, TextableChannel } from 'eris'
import { Harmonix } from '../core';

export default {
    name: 'ping',
    description: 'Performs a ping test on Discord',
    category: "information",
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        const startTime = Date.now()
        const pingMsg = await harmonix.client.createMessage(msg.channel.id, 'Pinging...')
        const latency = Date.now() - startTime
        
        const pingEmbed = {
            title: 'Ping Results',
            fields: [
                { name: 'Latency', value: `${latency} ms`, inline: true },
                { name: 'API', value: `${Math.round(harmonix.client.shards.get(0)?.latency || 0)} ms`, inline: true }
            ],
            color: 0x00FF00
        }

        await harmonix.client.editMessage(msg.channel.id, pingMsg.id, { content: '', embed: pingEmbed })
    }
}