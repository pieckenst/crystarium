import { Message, TextableChannel, GuildChannel } from "eris";
import { Harmonix } from "../../core";
import { defineCommand } from "../../code-utils/definingcommand";

export default class extends defineCommand({
  name: "unban",
  description: "Unban a user from the guild.",
  category: "moderation",
  aliases: [],
  usage: "<ID>",
  permissions: ["banMembers"],
}) {
  static async execute(
    harmonix: Harmonix,
    message: Message<TextableChannel>,
    args: string[],
  ) {
    const userID = args[0];

    if (!userID) {
      return this.sendErrorEmbed(harmonix, message);
    }

    if (!("guild" in message.channel)) {
      return this.sendEmbed(harmonix, message, {
        color: 0xff0000,
        description: "**This command can only be used in a guild!**",
      });
    }

    const guild = message.channel.guild;

    try {
      const bans = await guild.getBans();

      if (bans.length === 0) {
        return this.sendEmbed(harmonix, message, {
          color: 0xff0000,
          description: "**Nobody is banned from this server!**",
        });
      }

      const unbanUser = bans.find((ban) => ban.user.id === userID);

      if (!unbanUser) {
        return this.sendEmbed(harmonix, message, {
          color: 0xff0000,
          description: "**This user is not banned!**",
        });
      }

      await guild.unbanMember(userID);

      return this.sendEmbed(harmonix, message, {
        color: 0x00ff00,
        title: "Member Unbanned",
        description: `**Unbanned:** \`${unbanUser.user.username}#${unbanUser.user.discriminator}\`\n**Moderator:** ${message.author.mention}`,
      });
    } catch (error) {
      console.error("Error in unban command:", error);
      return this.sendEmbed(harmonix, message, {
        color: 0xff0000,
        description:
          "**Something went wrong. Please check my permissions and try again!**",
      });
    }
  }

  static sendErrorEmbed(harmonix: Harmonix, message: Message<TextableChannel>) {
    const embed = {
      color: 0xff0000,
      title: "Missing arguments",
      description: `**Command:** \`${this.name}\`\n**Description:** \`${(this.constructor as any).description || "None"}\`\n**Aliases:** \`${(this.constructor as any).aliases?.join(", ") || "None"}\`\n**Usage:** \`${harmonix.options.prefix}${this.name} ${(this.constructor as any).usage}\`\n**Permissions:** \`${(this.constructor as any).permissions?.join(", ") || "None"}\``,
      timestamp: new Date(),
    };
    return this.sendEmbed(harmonix, message, embed);
  }

  static async sendEmbed(
    harmonix: Harmonix,
    message: Message<TextableChannel>,
    embed: any,
  ) {
    await harmonix.client.createMessage(message.channel.id, { embed });
  }
}
