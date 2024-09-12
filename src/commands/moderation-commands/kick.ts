import { Message, Member, Constants } from 'eris';
import { Harmonix } from '../../core';

export default {
  name: "kick",
  category: "moderation",
  description: "This will kick a user of your choice from the server",
  permissions: ["kickMembers"],
  async execute(harmonix: Harmonix, message: Message, args: string[]) {
    if (!message.guildID) {
      return harmonix.client.createMessage(message.channel.id, "This command can only be used in a server.");
    }

    const guild = harmonix.client.guilds.get(message.guildID);
    if (!guild) return;

    const kickMemberId = message.mentions[0]?.id || args[0];
    const kickReason = args.slice(1).join(" ") || "Not Specified.";

    if (!kickMemberId) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          title: "Missing arguments",
          description: `**Command:** \`${this.name}\`\n**Description:** \`${this.description || "None"}\`\n**Usage:** \`${harmonix.options.prefix}${this.name} <user> [reason]\`\n**Permissions:** \`${this.permissions.join(", ") || "None"}\``,
          timestamp: new Date()
        }
      });
    }

    const kickMember = guild.members.get(kickMemberId);

    if (!kickMember) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          description: "**User not found!**"
        }
      });
    }

    if (!guild.members.get(harmonix.client.user.id)?.permission.has("kickMembers")) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          description: "**I don't have permission to kick members!**"
        }
      });
    }

    const memberRoles = kickMember.roles.map(roleId => guild.roles.get(roleId));
    if (memberRoles.some(role => role?.permissions.has("manageRoles") || role?.permissions.has("manageGuild"))) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          description: "**I cannot kick a moderator or administrator**"
        }
      });
    }

    const botMember = guild.members.get(harmonix.client.user.id);
    if (!botMember) return;

    const botHighestRole = Math.max(...botMember.roles.map(roleId => guild.roles.get(roleId)?.position || 0));
    const memberHighestRole = Math.max(...memberRoles.map(role => role?.position || 0));

    if (botHighestRole <= memberHighestRole) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          description: `**My highest role must be higher than \`${kickMember.username}#${kickMember.discriminator}\`'s highest role!**`
        }
      });
    }

    try {
      await guild.kickMember(kickMember.id, kickReason);

      harmonix.client.getDMChannel(kickMember.id).then(channel => {
        channel.createMessage({
          embed: {
            color: 0x0000FF,
            title: "You have been kicked!",
            description: `**Server: \`${guild.name}\`\nReason: \`${kickReason}\`\nModerator: \`${message.author.username}#${message.author.discriminator}\`**`
          }
        }).catch(() => {});
      });

      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0x00FF00,
          title: "Member Kicked",
          description: `**Kicked:** \`${kickMember.username}#${kickMember.discriminator}\`\n**Moderator:** ${message.author.mention}\n**Reason:** \`${kickReason}\``,
          timestamp: new Date()
        }
      });
    } catch (error) {
      return harmonix.client.createMessage(message.channel.id, {
        embed: {
          color: 0xFF0000,
          description: "**Something went wrong. Check my permissions and try again!**"
        }
      });
    }
  },};