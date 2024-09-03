const Eris = require("eris");

module.exports = {
  name: "kick",
  category: "moderation",
  description: "This will kick a user of your choice from the server",
  permissions: ["kickMembers"],
  async execute(client, message, args) {
    const kickMemberId = message.mentions[0]?.id || args[0];
    const kickReason = args.slice(1).join(" ") || "Not Specified.";

    if (!kickMemberId) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          title: "Missing arguments",
          description: `**Command:** \`${this.name}\`\n**Description:** \`${this.description || "None"}\`\n**Usage:** \`${client.config.prefix}${this.name} <user> [reason]\`\n**Permissions:** \`${this.permissions.join(", ") || "None"}\``,
          timestamp: new Date()
        }
      });
    }

    const kickMember = message.channel.guild.members.get(kickMemberId);

    if (!kickMember) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: "**User not found!**"
        }
      });
    }

    if (!kickMember.kickable) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: "**That person can't be kicked!**"
        }
      });
    }

    const memberRoles = kickMember.roles.map(roleId => message.channel.guild.roles.get(roleId));
    if (memberRoles.some(role => role.permissions.has("manageRoles") || role.permissions.has("manageGuild"))) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: "**I cannot kick a moderator or administrator**"
        }
      });
    }

    const botMember = message.channel.guild.members.get(client.user.id);
    const botHighestRole = Math.max(...botMember.roles.map(roleId => message.channel.guild.roles.get(roleId).position));
    const memberHighestRole = Math.max(...memberRoles.map(role => role.position));

    if (botHighestRole <= memberHighestRole) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: `**My highest role must be higher than \`${kickMember.username}#${kickMember.discriminator}\`'s highest role!**`
        }
      });
    }

    try {
      await client.kickGuildMember(message.channel.guild.id, kickMember.id, kickReason);

      client.createDMChannel(kickMember.id).then(channel => {
        channel.createMessage({
          embed: {
            color: 0x0000FF,
            title: "You have been kicked!",
            description: `**Server: \`${message.channel.guild.name}\`\nReason: \`${kickReason}\`\nModerator: \`${message.author.username}#${message.author.discriminator}\`**`
          }
        }).catch(() => {});
      });

      return message.channel.createMessage({
        embed: {
          color: 0x00FF00,
          title: "Member Kicked",
          description: `**Kicked:** \`${kickMember.username}#${kickMember.discriminator}\`\n**Moderator:** ${message.author.mention}\n**Reason:** \`${kickReason}\``,
          timestamp: new Date()
        }
      });
    } catch (error) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: "**Something went wrong. Check my permissions and try again!**"
        }
      });
    }
  },
};
