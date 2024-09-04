import { Message, TextableChannel, GuildChannel, Member, Role } from 'eris';
import { Harmonix } from '../core';

export default {
    name: "removerole",
    description: "Removes the specified role from the provided user.",
    aliases: [""],
    usage: '<@user/ID> <@role/ID>',
    permissions: ["manageRoles"],
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        if (!(msg.channel instanceof GuildChannel)) {
            return sendErrorEmbed(harmonix, msg, "This command can only be used in a guild.");
        }

        const memberId = msg.mentions[0]?.id || args[0];
        const member = msg.channel.guild.members.get(memberId);

        const roleId = msg.roleMentions[0] || args[1];
        const role = msg.channel.guild.roles.get(roleId) || 
                     msg.channel.guild.roles.find(r => r.name === args[1]);

        if (!member || !role) {
            return sendErrorEmbed(harmonix, msg, "Missing arguments", true);
        }

        const botMember = msg.channel.guild.members.get(harmonix.client.user.id);
        if (botMember && botMember.roles.length > 0) {
            const botHighestRole = Math.max(...botMember.roles.map(id => (msg.channel as GuildChannel).guild.roles.get(id)?.position || 0));
            if (botHighestRole <= role.position) {
                return sendErrorEmbed(harmonix, msg, "I cannot remove this role!");
            }
        }

        if (!member.roles.includes(role.id)) {
            return sendErrorEmbed(harmonix, msg, `${member.mention} doesn't have ${role.name} role!`);
        }

        try {
            await member.removeRole(role.id);
            return sendSuccessEmbed(harmonix, msg, `Successfully removed ${role.name} role from ${member.mention}!`);
        } catch (error) {
            return sendErrorEmbed(harmonix, msg, "An error occurred while removing the role.");
        }
    }
};

function sendErrorEmbed(harmonix: Harmonix, msg: Message<TextableChannel>, description: string, showUsage: boolean = false) {
    const embed: {
        color: number;
        description: string;
        title?: string;
    } = {
        color: 0xFF0000,
        description: description
    };

    if (showUsage) {
        const commandInfo = harmonix.commands.get("removerole");
        if (commandInfo) {
            embed.title = "Missing arguments";
            embed.description = `**Command:** \`${commandInfo.name}\`
**Description:** \`${commandInfo.description || "None"}\`
**Aliases:** \`${commandInfo.aliases?.join(", ") || "None"}\`
**Usage:** \`${harmonix.options.prefix}${commandInfo.name} ${commandInfo.usage}\`
**Permissions:** \`${commandInfo.permissions || "None"}\``;
        }
    }

    return msg.channel.createMessage({ embed });
}
function sendSuccessEmbed(harmonix: Harmonix, msg: Message<TextableChannel>, description: string) {
    const embed = {
        color: 0x00FF00,
        description: description
    };

    return msg.channel.createMessage({ embed });
}