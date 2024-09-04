import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: "randint",
    aliases: [''],
    description: "Random number from range between two entered numbers",
    category: "miscellaneous",
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        if (args.length !== 2 || isNaN(Number(args[0])) || isNaN(Number(args[1]))) {
            return harmonix.client.createMessage(msg.channel.id, "Please provide two valid numbers.");
        }

        const min = Math.min(Number(args[0]), Number(args[1]));
        const max = Math.max(Number(args[0]), Number(args[1]));

        const result = Math.floor(Math.random() * (max - min + 1) + min);

        const embed = {
            title: "Mathematics",
            description: "Random Number",
            color: 9555352,
            fields: [
                {
                    name: "Number One",
                    value: `\`\`\`fix\n${args[0]}\n\`\`\``
                },
                {
                    name: "Number Two",
                    value: `\`\`\`fix\n${args[1]}\n\`\`\``
                },
                {
                    name: "You got",
                    value: `\`\`\`fix\n${result}\n\`\`\``
                }
            ]
        };

        await harmonix.client.createMessage(msg.channel.id, { embed });
    }
};