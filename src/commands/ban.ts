import { Message, Member, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
  name: "ban",
  description: "Ban a user from the guild.",
  category: "moderation",
  aliases: [""],
  usage: "<@user/ID> [reason]",
  execute: async (msg: Message, args: string[], harmonix: Harmonix) => {
    if (!msg.channel.guild) {
      return sendErrorEmbed(msg, "This command can only be used in a guild.");
    }

    const userId = msg.mentions[0]?.id || args[0];
    const banReason = args.slice(1).join(" ") || "Not Specified.";

    if (!userId) {
      return sendMissingArgsEmbed(msg, this);
    }

    const guild = (msg.channel as GuildChannel).guild;
    const banMember = guild.members.get(userId);

    if (!banMember) {
      return sendErrorEmbed(msg, "User not found.");
    }

    if (!canBanMember(msg.member!, banMember)) {
      return sendErrorEmbed(msg, "You don't have permission to ban this user.");
    }

    try {
      await guild.banMember(userId, 0, banReason);
      await sendBanDM(harmonix.client, banMember, guild, banReason, msg.author);
      await sendBanConfirmation(msg, banMember, banReason);
    } catch (error) {
      console.error("Ban error:", error);
      return sendErrorEmbed(msg, "An error occurred while trying to ban the user.");
    }

  },
};

function sendMissingArgsEmbed(message: Message, command: any) {
  const embed = {
    color: 0xFF0000,
    title: "Missing arguments",
    description: `**Command:** \`${command.name}\`\n**Description:** \`${command.description || "None"}\`\n**Aliases:** \`${command.aliases.join(", ") || "None"}\`\n**Usage:** \`${command.name} ${command.usage}\`\n**Permissions:** \`${command.permissions || "None"}\``,
    timestamp: new Date()
  };
  return message.channel.createMessage({ embed });
}
function sendErrorEmbed(message, errorMessage) {
  const embed = {
    color: 0xFF0000,
    description: errorMessage
  };
  return message.channel.createMessage({ embed });
}

function canBanMember(moderator, targetMember) {
  return moderator.permission.has("banMembers") &&
         moderator.highestRole.position > targetMember.highestRole.position;
}

async function sendBanDM(client, banMember, guild, reason, moderator) {
  const dmChannel = await client.getDMChannel(banMember.id);
  const embed = {
    color: 0x0000FF,
    title: "You have been banned!",
    description: `**Server:** \`${guild.name}\`\n**Reason:** \`${reason}\`\n**Moderator:** \`${moderator.username}#${moderator.discriminator}\``
  };
  return dmChannel.createMessage({ embed }).catch(() => {});
}

function sendBanConfirmation(message, banMember, reason) {
  const embed = {
    color: 0x00FF00,
    title: "Member Banned",
    description: `**Banned:** \`${banMember.username}#${banMember.discriminator}\`\n**Moderator:** ${message.author.mention}\n**Reason:** \`${reason}\``,
    timestamp: new Date()
  };
  return message.channel.createMessage({ embed });
}