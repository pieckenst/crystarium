const Eris = require('eris');
const config = require('../config.json');

module.exports = {
    name: 'pmute',
    description: 'Permanently mute a person.',
    aliases: ["permmute"],
    usage: '<@user/ID> [Reason]',
    permissions: ["manageRoles"],
    async execute(client, message, args) {
        const userId = message.mentions[0]?.id || args[0];
        const muteReason = args.slice(1).join(' ') || "Not Specified.";

        if (!userId) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    title: "Missing arguments",
                    description: `**Command:** \`${this.name}\`\n**Description:** \`${this.description || "None"}\`\n**Aliases:** \`${this.aliases.join(", ") || "None"}\`\n**Usage:** \`${config.prefix}${this.name}${this.usage}\`\n**Permissions:** \`${this.permissions || "None"}\``,
                    timestamp: new Date()
                }
            });
        }

        const mutemember = message.channel.guild.members.get(userId);

        if (!mutemember) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**User not found!**"
                }
            });
        }

        if (mutemember.id === message.member.id) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute yourself!**"
                }
            });
        }

        if (mutemember.highestRole.position >= message.member.highestRole.position) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute someone with an equal or higher role!**"
                }
            });
        }

        try {
            await client.editGuildMember(message.channel.guild.id, userId, {
                communication_disabled_until: new Date(Date.now() + 315569520000) // 10 years from now
            });

            client.createMessage(mutemember.user.id, {
                embed: {
                    color: 0x0000FF,
                    description: `**You have been __muted__ in \`${message.channel.guild.name}\` for \`${muteReason}\`!**`
                }
            }).catch(() => {});

            message.delete().catch(() => {});

            return message.channel.createMessage({
                embed: {
                    color: 0x00FF00,
                    title: "Member Muted",
                    description: `**Muted:** \`${mutemember.user.username}#${mutemember.user.discriminator}\`\n**Moderator:** ${message.member.mention}\n**Reason:** \`${muteReason}\``,
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
    }
}