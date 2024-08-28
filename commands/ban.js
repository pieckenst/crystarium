const Eris = require("eris");
const config = require("../config.json");

module.exports = {
  name: "ban",
  description: "Ban a user from the guild.",
  category: "moderation",
  aliases: [""],
  usage: "<@user/ID> [reason]",
  permissions: ["banMembers"],

  async execute(client, message, args) {
    const userId = message.mentions[0]?.id || args[0];
    const banReason = args.slice(1).join(" ") || "Not Specified.";

    if (!userId) {
      return sendMissingArgsEmbed(message, this);
    }

    const banMember = message.channel.guild.members.get(userId);

    if (!banMember) {
      return sendErrorEmbed(message, "User not found.");
    }

    if (!canBanMember(message.member, banMember)) {
      return sendErrorEmbed(message, "You don't have permission to ban this user.");
    }

    try {
      await message.channel.guild.banMember(userId, 0, banReason);
      await sendBanDM(client, banMember, message.channel.guild, banReason, message.author);
      await sendBanConfirmation(message, banMember, banReason);
    } catch (error) {
      console.error("Ban error:", error);
      return sendErrorEmbed(message, "An error occurred while trying to ban the user.");
    }
  },
};

function sendMissingArgsEmbed(message, command) {
  const embed = {
    color: 0xFF0000,
    title: "Missing arguments",
    description: `**Command:** \`${command.name}\`\n**Description:** \`${command.description || "None"}\`\n**Aliases:** \`${command.aliases.join(", ") || "None"}\`\n**Usage:** \`${config.prefix}${command.name}${command.usage}\`\n**Permissions:** \`${command.permissions || "None"}\``,
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
