const Eris = require('eris');
const config = require('../config.json');

module.exports = {
    name: 'unmute',
    description: 'Unmute a person.',
    aliases: ["unmmute"],
    usage: '<@user/ID> [Reason]',
    permissions: ["moderateMembers"],

    async execute(client, message, args) {
        const mutememberId = message.mentions[0]?.id || args[0];
        const mutemember = message.channel.guild.members.get(mutememberId);
        const muteReason = args.slice(1).join(' ') || "Not Specified.";

        if (!mutemember) {
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
                    }\`\n**Permissions:** \`${this.permissions || "None"}\``,
                    timestamp: new Date()
                }
            });
        }

        if (!mutemember.communicationDisabledUntil) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: `${mutemember.mention} **is not muted!**`
                }
            });
        }

        try {
            await client.editGuildMember(message.channel.guild.id, mutemember.id, {
                communicationDisabledUntil: null
            }, muteReason);
            return message.channel.createMessage({
                embed: {
                    color: 0x00FF00,
                    title: "Member Unmuted",
                    description: `**Unmuted:** \`${mutemember.user.username}#${mutemember.user.discriminator}\`\n**Moderator:** ${message.member.mention}\n**Reason:** \`${muteReason}\``,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            console.error("Error unmuting member:", error);
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "An error occurred while trying to unmute the member."
                }
            });
        }
    }
};