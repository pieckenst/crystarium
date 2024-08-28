const Eris = require("eris");
const config = require("../config.json");

module.exports = {
  name: "help",
  category: "general",
  description: "Help command - self explanatory",

  async execute(client, message, args) {
    const commands = Array.from(client.commands.values());

    const helpEmbed = {
      title: "Terra: Help",
      description: "Bot commands are listed below",
      color: 0xF8AA2A,
      fields: [],
      timestamp: new Date().toISOString()
    };

    for (let i = 0; i < Math.min(commands.length, 25); i++) {
      const cmd = commands[i];
      helpEmbed.fields.push({
        name: `**${config.prefix}${cmd.name}${cmd.aliases ? ` (${cmd.aliases.join(", ")})` : ""}**`,
        value: cmd.description,
        inline: true
      });
    }

    try {
      await message.channel.createMessage({ embed: helpEmbed });
    } catch (error) {
      console.error("Error sending help message:", error);
    }
  },
};
