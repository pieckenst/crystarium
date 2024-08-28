const Eris = require('eris');
const config = require('../config.json');
const ms = require('ms');
const prettyMilliseconds = require('pretty-ms');

module.exports = {
    name: 'mute',
    description: 'Mute a user for a certain amount of time.',
    aliases: ["tmute"],
    usage: '<@user/ID> <time> [reason]',
    permissions: ["moderateMembers"],
    async execute(client, message, args) {
        const mutemember = message.mentions[0] || client.users.get(args[0]);
        const muteDuration = ms(args[1]);
        const muteReason = args.slice(2).join(' ') || "Not Specified.";

        if (!mutemember || !muteDuration) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    title: "Missing arguments",
                    description: `**Command:** \`${this.name}\`\n**Description:** \`${this.description || "None"}\`\n**Aliases:** \`${this.aliases.join(", ") || "None"}\`\n**Usage:** \`${config.prefix}${this.name}${this.usage}\`\n**Permissions:** \`${this.permissions || "None"}\``,
                    timestamp: new Date()
                }
            });
        }

        const guildMember = message.member.guild.members.get(mutemember.id);

        if (guildMember.id === message.member.id) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute yourself!**"
                }
            });
        }

        if (guildMember.highestRole.position >= message.member.highestRole.position) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**You cannot mute someone with an equal or higher role!**"
                }
            });
        }

        try {
            await guildMember.edit({
                communicationDisabledUntil: new Date(Date.now() + muteDuration)
            }, muteReason);
        } catch (error) {
            return message.channel.createMessage({
                embed: {
                    color: 0xFF0000,
                    description: "**Something went wrong. Check my permissions and try again!**"
                }
            });
        }

        const muteEmbed = {
            color: 0x0000FF,
            description: `**You have been __muted__ in \`${message.member.guild.name}\` for \`${prettyMilliseconds(muteDuration)}\` Reason: \`${muteReason}\`!**`
        };

        client.getDMChannel(mutemember.id).then(channel => {
            channel.createMessage({ embed: muteEmbed }).catch(() => {});
        });

        message.channel.createMessage({
            embed: {
                color: 0x00FF00,
                title: "Member Muted",
                description: `**Muted:** \`${mutemember.username}#${mutemember.discriminator}\`\n**Moderator:** ${message.member.mention}\n**Time:** \`${prettyMilliseconds(muteDuration)}\`\n**Reason:** \`${muteReason}\``,
                timestamp: new Date()
            }
        });

        setTimeout(() => {
            guildMember.edit({
                communicationDisabledUntil: null
            }).catch(() => {});

            const unmuteEmbed = {
                color: 0x0000FF,
                description: `**You have been __unmuted__ in \`${message.member.guild.name}\`!**`
            };

            client.getDMChannel(mutemember.id).then(channel => {
                channel.createMessage({ embed: unmuteEmbed }).catch(() => {});
            });

            message.channel.createMessage({
                embed: {
                    title: "Member Unmuted",
                    color: 0x0000FF,
                    fields: [{ name: "Unmuted:", value: mutemember.mention, inline: true }],
                    thumbnail: { url: mutemember.avatarURL },
                    timestamp: new Date()
                }
            });
        }, muteDuration);
    }
}