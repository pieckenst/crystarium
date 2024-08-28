const Eris = require("eris");
const math = require("mathjs");

module.exports = {
  name: "calculator",
  description: "Bring up a calculator using Buttons!",
  async execute(client, message, args) {
    const buttons = [
      ["Exit", "(", ")", "/"],
      ["7", "8", "9", "*"],
      ["4", "5", "6", "-"],
      ["1", "2", "3", "+"],
      [".", "0", "00", "="]
    ];

    const components = buttons.map(row => ({
      type: 1,
      components: row.map(label => createButton(label))
    }));

    const embed = {
      type: "rich",
      description: "0",
      color: 0x0000FF
    };

    const msg = await message.channel.createMessage({ embeds: [embed], components });

    let value = "";
    let isWrong = false;
    const time = 600000;

    const collector = new Eris.MessageCollector(client, message.channel.id, {
      filter: m => m.author.id === message.author.id && m.data && m.data.custom_id && m.data.custom_id.startsWith("cal"),
      time: time
    });

    collector.on("collect", async (interaction) => {
      const val = interaction.data.custom_id.slice(3);

      if (val === "Exit") {
        await interaction.acknowledge();
        await msg.edit({
          embeds: [{
            title: "Exiting calculator",
            description: " calculator on request ",
            color: 0xD87093,
            footer: { text: "Terra" }
          }],
          components: []
        });
        collector.stop();
        return;
      }

      if (val === "=") {
        value = mathEval(value);
      } else if (isWrong) {
        value = val;
        isWrong = false;
      } else if (value === "0") {
        value = val;
      } else {
        value += val;
      }

      await interaction.acknowledge();
      await msg.edit({
        embeds: [{ ...embed, description: "" + value + "" }],
        components
      });
    });

    setTimeout(async () => {
      await msg.edit({
        embeds: [{
          ...embed,
          description: "Your time to use the calculator is running out...",
          color: 0xFF0000
        }]
      });
    }, time - 10000);

    function createButton(label) {
      let style = 2; // grey
      if (label === "Exit") style = 4; // red
      else if (label === "=") style = 3; // green
      else if (isNaN(label) && label !== ".") style = 1; // blue

      return {
        type: 2,
        style,
        label,
        custom_id: "cal" + label
      };
    }

    function mathEval(input) {
      try {
        return math.evaluate(input).toString();
      } catch {
        isWrong = true;
        return "An error occurred while evaluating your calculation!";
      }
    }
  },
};
