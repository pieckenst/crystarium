import { Message, TextableChannel, Constants, Guild, Member } from 'eris';
import { Harmonix } from '../core';

export default {
    name: 'pmute',
    description: 'Permanently mute a person.',
    category: "moderation",
    aliases: ["permmute"],
    usage: '<@user/ID> [Reason]',
    permissions: ["manageRoles"],
    async execute(harmonix: Harmonix, message: Message<TextableChannel>, args: string[]) {
        if (!('guild' in message.channel)) {
            await harmonix.client.createMessage(message.channel.id, 'This command can only be used in guild channels.');
            return;
        }

        const guild = message.channel.guild as Guild;
        const userId = message.mentions[0]?.id || args[0];
        const muteReason = args.slice(1).join(' ') || "Not Specified.";

        if (!userId) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    title: "Missing arguments",
                    description: `**Command:** \`${this.name}\`\n**Description:** \`${this.description || "None"}\`\n**Aliases:** \`${this.aliases.join(", ") || "None"}\`\n**Usage:** \`${harmonix.options.prefix}${this.name} ${this.usage}\`\n**Permissions:** \`${this.permissions || "None"}\``,
                    timestamp: new Date()
                }
            });
            return;
        }

        const mutemember = guild.members.get(userId);

        if (!mutemember) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    description: "**User not found!**"
                }
            });
            return;
        }

        if (!message.member) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    description: "**Unable to retrieve member information!**"
                }
            });
            return;
        }

        if (mutemember.id === message.member.id) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute yourself!**"
                }
            });
            return;
        }

        if (mutemember.permissions.has("manageMessages") || mutemember.permissions.has("administrator")) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute someone with moderator or administrator permissions!**"
                }
            });
            return;
        }

        try {
            await guild.editMember(userId, {
                communicationDisabledUntil: new Date(Date.now() + 315569520000) // 10 years from now
            });

            harmonix.client.createMessage(mutemember.user.id, {
                embed: {
                    color: 0x0000FF,
                    description: `**You have been __muted__ in \`${guild.name}\` for \`${muteReason}\`!**`
                }
            }).catch(() => {});

            message.delete().catch(() => {});

            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0x00FF00,
                    title: "Member Muted",
                    description: `**Muted:** \`${mutemember.user.username}#${mutemember.user.discriminator}\`\n**Moderator:** ${message.member.mention}\n**Reason:** \`${muteReason}\``,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            await harmonix.client.createMessage(message.channel.id, {
                embed: {
                    color: 0xFF0000,
                    description: "**Something went wrong. Check my permissions and try again!**"
                }
            });
        }
    }};