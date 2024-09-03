const config = require('../config.json');
const Eris = require('eris');

module.exports = {
    name: "removerole",
    description: "Removes the specified role from the provided user.",
    aliases: [""],
    usage: '<@user/ID> <@role/ID>',
    permissions: ["manageRoles"],
    async execute(client, message, args) {
        const memberId = message.mentions[0] ? message.mentions[0].id : args[0];
        const member = message.channel.guild.members.get(memberId);

        const roleId = message.roleMentions[0] || args[1];
        const role = message.channel.guild.roles.get(roleId) || 
                     message.channel.guild.roles.find(r => r.name === args[1]);

        if (!member || !role) {
            return sendErrorEmbed(message, "Missing arguments", this);
        }

        const botMember = message.channel.guild.members.get(client.user.id);
        if (botMember.highestRole.position <= role.position) {
            return sendErrorEmbed(message, "I cannot remove this role!");
        }

        if (!member.roles.includes(role.id)) {
            return sendErrorEmbed(message, `${member.mention} doesn't have ${role.name} role!`);
        }

        try {
            await member.removeRole(role.id);
            return sendSuccessEmbed(message, `Successfully removed ${role.name} role from ${member.mention}!`);
        } catch (error) {
            return sendErrorEmbed(message, "An error occurred while removing the role.");
        }
    }
};

function sendErrorEmbed(message, description, commandInfo = null) {
    const embed = {
        color: 0xFF0000,
        description: description
    };

    if (commandInfo) {
        embed.title = "Missing arguments";
        embed.description = `**Command:** \`${commandInfo.name}\`
**Description:** \`${commandInfo.description || "None"}\`
**Aliases:** \`${commandInfo.aliases.join(", ") || "None"}\`
**Usage:** \`${config.prefix}${commandInfo.name}${commandInfo.usage}\`
**Permissions:** \`${commandInfo.permissions || "None"}\``;
    }

    return message.channel.createMessage({ embed });
}

function sendSuccessEmbed(message, description) {
    const embed = {
        color: 0x00FF00,
        description: description
    };

    return message.channel.createMessage({ embed });
}