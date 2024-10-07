import { Message, TextableChannel, GuildChannel } from "eris";
import { Harmonix } from "../../core";
import {
  logInfo,
  logError,
} from "../../../discordkit/utils/centralloggingfactory";

export default {
  name: "unmute",
  description: "Unmute a person.",
  category: "moderation",
  aliases: ["unmmute"],
  usage: "<@user/ID> [Reason]",
  accessableby: "Moderators",
  execute: async (
    harmonix: Harmonix,
    msg: Message<TextableChannel>,
    args: string[],
  ) => {
    if (!(msg.channel instanceof GuildChannel)) {
      return;
    }

    const mutememberId = msg.mentions[0]?.id || args[0];
    const mutemember = msg.channel.guild.members.get(mutememberId);
    const muteReason = args.slice(1).join(" ") || "Not Specified.";

    if (!mutemember) {
      await logInfo("Missing arguments for unmute command", "unmute");
      if (msg.channel.id) {
        await harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            title: "Missing arguments",
            description: `**Command:** \`${harmonix.commands.get("unmute")?.name || "unmute"}\`\n**Description:** \`${
              harmonix.commands.get("unmute")?.description || "None"
            }\`\n**Aliases:** \`${
              harmonix.commands.get("unmute")?.aliases?.join(", ") || "None"
            }\`\n**Usage:** \`${harmonix.options.prefix}${harmonix.commands.get("unmute")?.name || "unmute"} ${
              harmonix.commands.get("unmute")?.usage || ""
            }\`\n**Permissions:** \`${harmonix.commands.get("unmute")?.accessableby || "None"}\``,
            timestamp: new Date(),
          },
        });
      }
      return;
    }

    if (!mutemember.communicationDisabledUntil) {
      await logInfo(`${mutemember.username} is not muted`, "unmute");
      if (msg.channel.id) {
        await harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            description: `${mutemember.mention} **is not muted!**`,
          },
        });
      }
      return;
    }

    try {
      await harmonix.client.editGuildMember(
        msg.channel.guild.id,
        mutemember.id,
        {
          communicationDisabledUntil: null,
        },
        muteReason,
      );

      await logInfo(
        `${mutemember.username} was unmuted by ${msg.author.username}`,
        "unmute",
      );

      if (msg.channel.id) {
        await harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0x00ff00,
            title: "Member Unmuted",
            description: `**Unmuted:** \`${mutemember.username}#${mutemember.discriminator}\`\n**Moderator:** ${msg.member?.mention}\n**Reason:** \`${muteReason}\``,
            timestamp: new Date(),
          },
        });
      }
    } catch (error) {
      await logError(
        `Error unmuting member: ${error}`,
        error instanceof Error ? error : undefined,
        "unmute",
      );
      if (msg.channel.id) {
        await harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            description: "An error occurred while trying to unmute the member.",
          },
        });
      }
    }
  },
};
