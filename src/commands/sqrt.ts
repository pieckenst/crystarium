import { Message, TextableChannel, GuildChannel, CommandInteraction } from 'eris';
import { Harmonix } from '../core';
import { logInfo } from '../code-utils/centralloggingfactory';
import { defineCommand } from '../code-utils/definingcommand';


export default class extends defineCommand({
    name: "sqrt",
    description: "Calculates a square root",
    usage: "sqrt <number>",
    category: "miscellaneous",
    aliases: [],
  }) {
    static async execute(harmonix: Harmonix, message: Message<TextableChannel> | CommandInteraction, args: string[] | { number: number }) {
        const input = typeof args === 'object' && 'number' in args ? args.number : parseFloat(args[0]);

        if (isNaN(input) || input > 5000 || input < 0) {
            await logInfo(`Invalid input for sqrt command: ${input}`, 'sqrt');
            const channel = 'channel' in message ? message.channel : (message as CommandInteraction).channel;
            if (channel?.id) {
                await harmonix.client.createMessage(channel.id, {
                    embed: {
                        title: "Oops!",
                        description: "An error occurred while executing the command",
                        color: 0xff0000,
                        fields: [
                            {
                                name: "Invalid Value",
                                value: "Value must be between 0 and 5000"
                            }
                        ],
                        footer: { text: (channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
            return;
        }

        const result = Math.sqrt(input);

        await logInfo(`Sqrt command executed successfully for input: ${input}`, 'sqrt');

        const channel = 'channel' in message ? message.channel : (message as CommandInteraction).channel;
        if (channel?.id) {
            await harmonix.client.createMessage(channel.id, {
                embed: {
                    title: "Mathematics",
                    description: "Square Root",
                    color: 9555352,
                    fields: [
                        {
                            name: "You entered",
                            value: `${input}`
                        },
                        {
                            name: "You got",
                            value: `${result}`
                        }
                    ],
                    footer: { text: (channel as GuildChannel).guild?.name || "Direct Message" },
                    timestamp: new Date()
                }
            });
        }
    }};