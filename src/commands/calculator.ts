import { ActionRow, InteractionButton, Message, TextableChannel, CommandInteraction } from 'eris';
import { Harmonix } from '../core';
import * as math from 'mathjs';
import { defineCommand } from '../code-utils/definingcommand';
import { ComponentInteraction } from 'eris';


export default class extends defineCommand({
  name: "calculator",
  description: "Bring up a calculator using Buttons!",
  category: "miscellaneous",
  slashCommand: true,
}) {
  static async execute(harmonix: Harmonix, message: Message<TextableChannel> | CommandInteraction) {
    const buttons = [
      ["Exit", "(", ")", "/"],
      ["7", "8", "9", "*"],
      ["4", "5", "6", "-"],
      ["1", "2", "3", "+"],
      [".", "0", "00", "="]
    ];

    const components = buttons.map(row => ({
      type: 1,
      components: row.map(label => this.createButton(label))
    })) as ActionRow[];

    const embed = {
      type: "rich",
      description: "0",
      color: 0x0000FF
    };

    const channel = 'channel' in message ? message.channel : (message as CommandInteraction).channel;
    const msg = await harmonix.client.createMessage(channel.id, { embeds: [embed], components });

    let value = "";
    let isWrong = false;
    const time = 600000;

    const collector = (interaction: ComponentInteraction<TextableChannel>) => {
      if (!interaction.data.custom_id?.startsWith('cal')) return;
      if (interaction.member?.id !== ('author' in message ? message.author.id : message.member?.id)) return;
    
      const val = interaction.data.custom_id.slice(3);
    
      if (val === "Exit") {
        interaction.acknowledge().then(() => {
          harmonix.client.editMessage(interaction.channel.id, msg.id, {
            embeds: [{
              title: "Exiting calculator",
              description: "Calculator closed on request",
              color: 0xD87093,
              footer: { text: "Terra" }
            }],
            components: []
          });
        });
        harmonix.client.off('interactionCreate', collector);
        return;
      }

      if (val === "=") {
        value = this.mathEval(value);
      } else if (isWrong) {
        value = val;
        isWrong = false;
      } else if (value === "0") {
        value = val;
      } else {
        value += val;
      }

      interaction.acknowledge();
      harmonix.client.editMessage(channel.id, msg.id, {
        embeds: [{ ...embed, description: "" + value + "" }],
        components
      });
    };

    harmonix.client.on('interactionCreate', collector);

    setTimeout(async () => {
      await harmonix.client.editMessage(channel.id, msg.id, {
        embeds: [{
          ...embed,
          description: "Your time to use the calculator is running out...",
          color: 0xFF0000
        }]
      });
    }, time - 10000);

    setTimeout(() => {
      harmonix.client.off('interactionCreate', collector);
    }, time);
  }

  static createButton(label: string): InteractionButton {
    let style: 1 | 2 | 3 | 4 = 2; // grey
    if (label === "Exit") style = 4; // red
    else if (label === "=") style = 3; // green
    else if (isNaN(Number(label)) && label !== ".") style = 1; // blue

    return {
      type: 2,
      style,
      label,
      custom_id: "cal" + label
    };
  }

  static mathEval(input: string): string {
    try {
      return math.evaluate(input).toString();
    } catch {
      return "An error occurred while evaluating your calculation!";
    }
  }
}