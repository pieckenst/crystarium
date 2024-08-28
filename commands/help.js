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
      fields: commands.map((cmd) => ({
        name: `**${config.prefix}${cmd.name}${cmd.aliases ? ` (${cmd.aliases.join(", ")})` : ""}**`,
        value: cmd.description,
        inline: true
      })),
      timestamp: new Date().toISOString()
    };

    try {
      await message.channel.createMessage({ embed: helpEmbed });
    } catch (error) {
      console.error("Error sending help message:", error);
    }
  },
};
