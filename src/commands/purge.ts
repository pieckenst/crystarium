const Eris = require("eris");
const config = require("../config.json");

module.exports = {
  name: "clear",
  description: "Purge messages in a channel.",
  category: "moderation",
  aliases: [""],
  usage: "<#messages>",
  permissions: ["manageMessages"],
  async execute(client, message, args) {
    const amount = parseInt(args[0]);

    if (isNaN(amount) || !amount || amount < 0) {
      return sendErrorEmbed(message, this);
    }

    const purgeLimit = Math.min(amount + 1, 100);

    try {
      const messages = await message.channel.getMessages(purgeLimit);
      await message.channel.deleteMessages(messages.map(m => m.id));

      const successEmbed = {
        color: 0x00FF00,
        description: `**Successfully deleted** \`${messages.length}\` **messages.**`
      };

      const successMessage = await message.channel.createMessage({ embed: successEmbed });
      setTimeout(() => successMessage.delete(), 5000);
    } catch (error) {
      const errorEmbed = {
        color: 0xFF0000,
        description: "**Unable to delete messages older than 2 weeks.**"
      };

      const errorMessage = await message.channel.createMessage({ embed: errorEmbed });
      setTimeout(() => errorMessage.delete(), 5000);
    }
  },
};

function sendErrorEmbed(message, command) {
  const errorEmbed = {
    color: 0xFF0000,
    title: "Missing arguments",
    description: `**Command:** \`${command.name}\`
**Description:** \`${command.description || "None"}\`
**Aliases:** \`${command.aliases.join(", ") || "None"}\`
**Usage:** \`${config.prefix}${command.name}${command.usage}\`
**Permissions:** \`${command.permissions || "None"}\``,
    timestamp: new Date()
  };

  return message.channel.createMessage({ embed: errorEmbed });
}
