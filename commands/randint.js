const Eris = require('eris');

module.exports = {
  name: "randint",
  aliases: [''],
  description: "Random number from range between two entered numbers",
  async execute(client, message, args) {
      if (args.length !== 2 || isNaN(args[0]) || isNaN(args[1])) {
          return message.channel.createMessage("Please provide two valid numbers.");
      }

      const min = Math.min(Number(args[0]), Number(args[1]));
      const max = Math.max(Number(args[0]), Number(args[1]));

      const result = Math.floor(Math.random() * (max - min + 1) + min);

      const embed = {
          title: "Mathematics",
          description: " Number",
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

      await message.channel.createMessage({ embed });
  }
};