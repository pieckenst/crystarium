const Eris = require("eris");
const config = require("../config.json");

module.exports = {
  name: "unban",
  description: "Unban a user from the guild.",
  category: "moderation",
  aliases: [""],
  usage: "<ID>",
  permissions: ["banMembers"],
  async execute(client, message, args) {
    const userID = args[0];

    if (!userID) {
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          title: "Missing arguments",
          description: `**Command:** \`${this.name}\`\n**Description:** \`${
            this.description || "None"
          }\`\n**Aliases:** \`${
            this.aliases.join(", ") || "None"
          }\`\n**Usage:** \`${config.prefix}${this.name} ${
            this.usage
          }\`\n**Permissions:** \`${this.permissions.join(", ") || "None"}\``,
          timestamp: new Date()
        }
      });
    }

    try {
      const bans = await message.channel.guild.getBans();
      
      if (bans.length === 0) {
        return message.channel.createMessage({
          embed: {
            color: 0xFF0000,
            description: "**Nobody is banned from this server!**"
          }
        });
      }

      const unbanUser = bans.find(ban => ban.user.id === userID);
      
      if (!unbanUser) {
        return message.channel.createMessage({
          embed: {
            color: 0xFF0000,
            description: "**This user is not banned!**"
          }
        });
      }

      await message.channel.guild.unbanMember(userID);
      
      return message.channel.createMessage({
        embed: {
          color: 0x00FF00,
          title: "Member Unbanned",
          description: `**Unbanned:** \`${unbanUser.user.username}#${unbanUser.user.discriminator}\`\n**Moderator:** ${message.member.mention}`
        }
      });
    } catch (error) {
      console.error("Error in unban command:", error);
      return message.channel.createMessage({
        embed: {
          color: 0xFF0000,
          description: "**Something went wrong. Please check my permissions and try again!**"
        }
      });
    }
  },
};
