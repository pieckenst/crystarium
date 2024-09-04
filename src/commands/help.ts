import { Message, Client, Constants, EmbedOptions } from 'eris';
import { stripIndents } from 'common-tags';
import { Harmonix } from '../core';

export default {
  name: 'help',
  description: 'Displays all commands that the bot has.',
  usage: '<command_name>',
  aliases: ['h'],
  category: 'Info',
  execute: async (msg: Message, args: string[], harmonix: Harmonix) => {
    const commandName = args[0];

    if (commandName) {
      await showSpecificCommandHelp(msg, commandName, harmonix);
    } else {
      await showMainHelpMenu(msg, harmonix);
    }
  }
};

async function showSpecificCommandHelp(msg: Message, commandName: string, harmonix: Harmonix) {
  const command = harmonix.commands?.get(commandName) || 
    Array.from(harmonix.commands?.values() || []).find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) {
    return msg.channel.createMessage({
      embed: {
        title: "Invalid command",
        description: `Use \`${harmonix.options.prefix}help\` to see all commands.`,
        color: 0xFF0000
      }
    });
  }

  const embed: EmbedOptions = {
    thumbnail: { url: harmonix.client.user.dynamicAvatarURL("png", 2048) },
    color: 0x7289DA,
    description: stripIndents`
      Name: \`${command.name}\`
      Description: \`${command.description || "No description available"}\`
      Usage: ${command.usage ? `\`${harmonix.options.prefix}${command.name} ${command.usage}\`` : "No usage specified"}
      Category: \`${command.category}\`
      Aliases: \`${command.aliases ? command.aliases.join(', ') : "No aliases"}\`
    `
  };

  return msg.channel.createMessage({ embed });
}

async function showMainHelpMenu(msg: Message, harmonix: Harmonix) {
  if (!harmonix.commands) {
    return msg.channel.createMessage({
      embed: {
        title: "Error",
        description: "Commands are not available at the moment.",
        color: 0xFF0000
      }
    });
  }

  const categories = new Set(Array.from(harmonix.commands.values()).map(cmd => cmd.category).filter((category): category is string => category !== undefined));
  const embed: EmbedOptions = {
    thumbnail: { url: harmonix.client.user.dynamicAvatarURL("png", 2048) },
    color: 0x7289DA,
    author: { name: "Command List" },
    fields: []
  };

  for (const category of categories) {
    const commands = Array.from(harmonix.commands.values()).filter(cmd => cmd.category === category);
    embed.fields!.push({
      name: `❯ ${category.toUpperCase()} [${commands.length}]`,
      value: commands.map(cmd => `\`${cmd.name}\``).join(', ')
    });
  }

  embed.footer = { text: `Total Commands: ${harmonix.commands.size}` };

  return msg.channel.createMessage({ embed });
}