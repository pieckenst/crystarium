import {
  ActionRow,
  InteractionButton,
  Message,
  TextableChannel,
  CommandInteraction,
  ComponentInteraction,
} from "eris";
import { Harmonix } from "../../discordkit/types/harmonixtypes";
import * as math from "mathjs";
import { defineCommand } from "../../discordkit/utils/command";

export default class extends defineCommand({
  name: "calculator",
  description: "Bring up a calculator using Buttons!",
  category: "miscellaneous",
  slashCommand: true,
}) {
  static async execute(
    harmonix: Harmonix,
    interaction: CommandInteraction | Message<TextableChannel>,
  ) {
    const buttons = [
      ["Exit", "(", ")", "/"],
      ["7", "8", "9", "*"],
      ["4", "5", "6", "-"],
      ["1", "2", "3", "+"],
      [".", "0", "00", "="],
    ];

    const components = buttons.map((row) => ({
      type: 1,
      components: row.map((label) => this.createButton(label)),
    })) as ActionRow[];

    const embed = {
      type: "rich",
      title: `${interaction.member?.username}'s calculator`,
      description: "\nNone",
      color: 0x7289da, // Discord Blurple color
      timestamp: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    };

    let msg: Message<TextableChannel>;
    if (interaction instanceof CommandInteraction) {
      await interaction.defer();
      msg = (await interaction.createFollowup({
        embeds: [embed],
        components,
      })) as Message<TextableChannel>;
    } else {
      msg = await harmonix.client.createMessage(interaction.channel.id, {
        embeds: [embed],
        components,
      });
    }

    let value = "";
    let isWrong = false;
    const time = 600000;

    const collector = (buttonInteraction: ComponentInteraction) => {
      if (!buttonInteraction.data.custom_id?.startsWith("cal")) return;
      if (
        buttonInteraction.member?.id !==
        (interaction instanceof Message
          ? interaction.author.id
          : interaction.member?.id)
      )
        return;

      const val = buttonInteraction.data.custom_id.slice(3);

      if (val === "Exit") {
        buttonInteraction.acknowledge();
        harmonix.client.editMessage(buttonInteraction.channel.id, msg.id, {
          embeds: [
            {
              title: "Exiting calculator",
              description: "Calculator closed on request",
              color: 0xd87093,
              footer: { text: "Terra" },
            },
          ],
          components: [],
        });
        harmonix.client.off("interactionCreate", collector);
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

      buttonInteraction.acknowledge();
      harmonix.client.editMessage(buttonInteraction.channel.id, msg.id, {
        embeds: [{ ...embed, description: `\n${value}` }],
        components,
      });
    };

    harmonix.client.on("interactionCreate", collector);

    setTimeout(async () => {
      await harmonix.client.editMessage(msg.channel.id, msg.id, {
        embeds: [
          {
            ...embed,
            description: "Your time to use the calculator is running out...",
            color: 0xff0000,
          },
        ],
      });
    }, time - 10000);

    setTimeout(() => {
      harmonix.client.off("interactionCreate", collector);
    }, time);
  }

  static createButton(label: string): InteractionButton {
    let style: 1 | 2 | 3 | 4 = 2; // grey
    if (label === "Exit")
      style = 4; // red
    else if (label === "=")
      style = 3; // green
    else if (isNaN(Number(label)) && label !== ".") style = 1; // blue

    return {
      type: 2,
      style,
      label,
      custom_id: "cal" + label,
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
