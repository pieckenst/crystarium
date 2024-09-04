const Eris = require('eris');
const fs = require('fs');
const path = require('path');
const { stripIndents } = require('common-tags');

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

class HelpCommand extends Eris.Command {
  constructor(bot) {
    super("help", {
      description: "Displays all commands that the bot has.",
      options: [
        {
          name: "command",
          description: "The command name",
          type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
          required: false
        }
      ]
    });
    this.bot = bot;
    this.category = 'Info';
    this.usage = '<command_name>';
    this.aliases = ['h'];
  }

  async execute(interaction) {
    const commandName = interaction.data.options?.[0]?.value;

    if (commandName) {
      await this.showHelpForCommand(interaction, commandName);
    } else {
      await this.showHelp(interaction);
    }
  }

  async showHelp(interaction) {
    const categories = new Set(this.bot.commands.map(cmd => cmd.category || "Uncategorized"));
    const embed = new Eris.Embed()
      .setThumbnail(this.bot.user.dynamicAvatarURL("png", 2048))
      .setColor(0x7289DA)
      .setAuthor("Command List");

    for (let category of categories) {
      const commands = this.bot.commands.filter(cmd => (cmd.category || "Uncategorized") === category);
      embed.addField(
        `❯ ${category.toString().toUpperCase()} [${commands.size}]`,
        commands.map(cmd => `\`${cmd.name}\``).join(', ')
      );
    }

    embed.setFooter(`Total Commands: ${this.bot.commands.size}`);

    return interaction.createMessage({ embeds: [embed] });
  }

  async showHelpForCommand(interaction, commandName) {
    const command = this.bot.commands.get(commandName) || this.bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
      return interaction.createMessage({
        embeds: [{
          title: "Invalid command",
          description: `Use \`/${this.name}\` to see all commands.`,
          color: 0xFF0000
        }]
      });
    }

    const embed = new Eris.Embed()
      .setThumbnail(this.bot.user.dynamicAvatarURL("png", 2048))
      .setColor(0x7289DA)
      .setDescription(stripIndents`
        Name: \`${command.name}\`
        Description: \`${command.description || "No description available"}\`
        Usage: ${command.usage ? `\`/${command.name} ${command.usage}\`` : "No usage specified"}
        Category: \`${command.category || "Uncategorized"}\`
        Aliases: \`${command.aliases ? command.aliases.join(', ') : "No aliases"}\`
      `);

    return interaction.createMessage({ embeds: [embed] });
  }
}

module.exports = {
  name: 'help',
  execute: (bot) => {
    const helpCommand = new HelpCommand(bot);
    return {
      name: helpCommand.name,
      description: helpCommand.description,
      options: helpCommand.options,
      execute: (interaction) => helpCommand.execute(interaction)
    };
  }
};