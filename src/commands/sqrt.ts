import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';
import { logInfo, logError } from '../code-utils/centralloggingfactory';

export default {
    name: "sqrt",
    description: "Calculates a square root",
    usage: "sqrt <number>",
    category: "math",
    accessableby: "Everyone",
    aliases: [],
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        const input = parseFloat(args[0]);

        if (isNaN(input) || input > 5000 || input < 0) {
            await logInfo(`Invalid input for sqrt command: ${args[0]}`, 'sqrt');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
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
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
            return;
        }

        const result = Math.sqrt(input);

        await logInfo(`Sqrt command executed successfully for input: ${input}`, 'sqrt');

        if (msg.channel.id) {
            await harmonix.client.createMessage(msg.channel.id, {
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
                    footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                    timestamp: new Date()
                }
            });
        }
    }
};