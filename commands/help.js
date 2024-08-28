const Eris = require("eris");
const { CommandBase } = Eris;
const config = require("../config.json");
const fs = require("fs");

class HelpCommand extends Eris.Command {
  constructor() {
    super({
      name: "help",
      description: "Shows the help menu",
      options: [
        {
          name: "command",
          description: "Get help for a specific command",
          type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
          required: false
        }
      ]
    });
  }

  async execute(interaction) {
    const commandName = interaction.data.options?.[0]?.value;

    if (!commandName) {
      await this.showMainHelpMenu(interaction);
    } else {
      await this.showSpecificCommandHelp(interaction, commandName);
    }
  }

  async showMainHelpMenu(interaction) {
    const dirs = fs.readdirSync("./commands");
    const slashCommands = await interaction.client.getCommands();

    const embed = {
      title: "Help Command",
      description: "Select an option to get the command list of. Only one option can be selected.",
      fields: [
        { name: "Total Command Categories", value: `${dirs.length}`, inline: true },
        { name: "Total Slash Commands", value: `${slashCommands.length}`, inline: true }
      ],
      color: 0x2F3136
    };

    const dropdownMenu = new DropdownMenu(interaction.client);

    await interaction.createMessage({
      embeds: [embed],
      components: [
        {
          type: Eris.Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Eris.Constants.ComponentTypes.SELECT_MENU,
              custom_id: dropdownMenu.custom_id,
              options: dropdownMenu.options
            }
          ]
        }
      ]
    });
  }

  async showSpecificCommandHelp(interaction, commandName) {
    const command = interaction.client.commands.get(commandName);
    if (command) {
      const dropdownMenu = new DropdownMenu(interaction.client);
      const category = command.category || dropdownMenu.getCategoryFromName(command.name);
      const embed = {
        title: `/${command.name}`,
        description: command.description || "No help found...",
        fields: [
          { name: "Category", value: category },
          { name: "Usable", value: "Yes" }
        ],
        footer: { text: "Developed with ❤️ by Middlle" },
        timestamp: new Date().toISOString()
      };

      await interaction.createMessage({ embeds: [embed] });
    } else {
      await interaction.createMessage(`No command called '${commandName}' found.`);
    }
  }
}

class DropdownMenu {
  constructor(bot) {
    this.bot = bot;
    this.type = Eris.Constants.ApplicationCommandOptionTypes.STRING;
    this.name = "category";
    this.description = "Select a category";
    this.required = true;
    this.custom_id = "help_dropdown";
    this.categories = this.getCategories();
    this.options = this.generateOptions();
    console.log("DropdownMenu constructed with options:", this.options);
  }

  getCategories() {
    const categories = {};
    console.log("Sorting commands by categories:");
    for (const [name, command] of this.bot.commands.entries()) {
      console.log(`Found command: ${name}`);
      const category = command.category || this.getCategoryFromName(name);
      if (!categories[category]) {
        categories[category] = [];
        console.log(`Created new category: ${category}`);
      }
      categories[category].push(command);
      console.log(`Added command "${name}" to category "${category}"`);
    }
    console.log("Finished sorting commands. Category structure:", Object.keys(categories));
    return categories;
  }

  getCategoryFromName(name) {
    const categoryMap = {
      'user': 'User',
      'profile': 'User',
      'mod': 'Moderation',
      'ban': 'Moderation',
      'kick': 'Moderation',
      'config': 'Configuration',
      'set': 'Configuration',
      'music': 'Music',
      'play': 'Music',
      'song': 'Music',
      'fun': 'Fun',
      'game': 'Fun',
      'info': 'Information',
      'stats': 'Information'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (name.includes(key)) {
        console.log(`Category match for "${name}": ${value}`);
        return value;
      }
    }

    console.log(`Category match for "${name}": Miscellaneous`);
    return 'Miscellaneous';
  }

  generateOptions() {
    console.log("Generating dropdown options:");
    const excludedCategories = ["testingcog", "preferences", "calculator", "help", "workers", "jishaku", "listeners", "utils"];
    const options = Object.keys(this.categories)
      .filter(category => !excludedCategories.includes(category.toLowerCase()))
      .map(category => {
        console.log(`Added option: ${category}`);
        return { label: category, value: category };
      });
    
    if (options.length === 0) {
      options.push({ label: "General", value: "General" });
      console.log("Added default General option");
    }
    
    options.push({ label: "Close", value: "Close" });
    console.log("Added Close option");
    console.log("Final options:", options);
    return options;
  }

  async execute(interaction, value) {
    console.log(`Executing DropdownMenu with value: ${value}`);
    try {
      await interaction.defer();
      if (value === "Close") {
        console.log("Closing help menu");
        const embed = {
          title: ":books: Help System",
          description: `Welcome To ${this.bot.user.username} Help System`,
          footer: { text: "Developed with ❤️ by Middlle" }
        };
        await interaction.editOriginalMessage({ embeds: [embed], components: [] });
      } else {
        const cog = this.categories[value];
        if (cog) {
          console.log(`Matched category: ${value}`);
          await getHelp(interaction, { name: value, commands: cog });
        } else {
          console.log(`Invalid category: ${value}`);
          await interaction.editOriginalMessage("Invalid category selected.");
        }
      }
    } catch (error) {
      console.error("Error executing DropdownMenu:", error);
      await interaction.editOriginalMessage("An error occurred while processing your request.");
    }
  }
}

async function getHelp(interaction, cog) {
  console.log(`Generating help for cog: ${cog.name}`);
  try {
    await interaction.defer();
    const embed = {
      title: `${cog.name} - Commands`,
      description: "Commands in this category",
      author: { name: "Help System" },
      fields: []
    };

    let commandsText = "";
    for (const command of cog.commands) {
      console.log(`Processing command: ${command.name}`);
      const commandText = `『\`${config.prefix}${command.name}\`』: ${command.description || "No description available"}\n`;
      if (commandsText.length + commandText.length > 1024) {
        console.log("Reached character limit, creating new field");
        embed.fields.push({ name: "Commands", value: commandsText, inline: false });
        commandsText = commandText;
      } else {
        commandsText += commandText;
      }
    }

    if (commandsText) {
      console.log("Adding final commands field");
      embed.fields.push({ name: "Commands", value: commandsText, inline: false });
    }

    console.log("Sending help embed");
    await interaction.editOriginalMessage({ embeds: [embed] });
  } catch (error) {
    console.error("Error generating help:", error);
    await interaction.editOriginalMessage("An error occurred while generating the help message.");
  }
}

module.exports = new HelpCommand();