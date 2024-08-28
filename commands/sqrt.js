const Eris = require('eris');

module.exports = {
    name: "sqrt",
    aliases: [],
    description: "Calculates a square root",
    execute: async (client, message, args) => {
        const input = parseFloat(args[0]);

        if (isNaN(input) || input > 5000 || input < 0) {
            return message.channel.createMessage({
                embed: {
                    title: "Oops!",
                    description: "An error occurred while executing the command",
                    color: 0xff0000,
                    fields: [
                        {
                            name: "Invalid Value",
                            value: "Value must be between 0 and 5000"
                        }
                    ]
                }
            });
        }

        const result = Math.sqrt(input);

        return message.channel.createMessage({
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
                ]
            }
        });
    }
};