import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../../core';

export default {
  name: "clear",
  description: "Purge messages in a channel.",
  category: "moderation",
  aliases: ["purge"],
  usage: "<#messages>",
  permissions: ["manageMessages"],
  execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
    const amount = parseInt(args[0]);

    if (isNaN(amount) || !amount || amount < 0) {
      return sendErrorEmbed(harmonix, msg, "clear");
    }

    const purgeLimit = Math.min(amount + 1, 100);

    try {
      const messages = await msg.channel.getMessages(purgeLimit);
      await harmonix.client.deleteMessages(msg.channel.id, messages.map(m => m.id));

      const successEmbed = {
        color: 0x00FF00,
        description: `**Successfully deleted** \`${messages.length}\` **messages.**`
      };

      const successMessage = await harmonix.client.createMessage(msg.channel.id, { embed: successEmbed });
      setTimeout(() => successMessage.delete(), 5000);
    } catch (error) {
      const errorEmbed = {
        color: 0xFF0000,
        description: "**Unable to delete messages older than 2 weeks.**"
      };

      const errorMessage = await harmonix.client.createMessage(msg.channel.id, { embed: errorEmbed });
      setTimeout(() => errorMessage.delete(), 5000);
    }
  },};

function sendErrorEmbed(harmonix: Harmonix, msg: Message<TextableChannel>, commandName: string) {
  const command = harmonix.commands.get(commandName);
  if (!command) return;

  const errorEmbed = {
    color: 0xFF0000,
    title: "Missing arguments",
    description: `**Command:** \`${command.name}\`
**Description:** \`${command.description || "None"}\`
**Aliases:** \`${command.aliases?.join(", ") || "None"}\`
**Usage:** \`${harmonix.options.prefix}${command.name} ${command.usage}\`
**Permissions:** \`${command.permissions || "None"}\``,
    timestamp: new Date()
  };

  return harmonix.client.createMessage(msg.channel.id, { embed: errorEmbed });
}