const Eris = require('eris');
const config = require('../config.json');

module.exports = {
    name: "addrole",
    description: "Adds the specified role to the provided user.",
    aliases: [""],
    usage: '<@user/ID> <@role/ID>',
    permissions: ["manageRoles"],
    async execute(client, message, args) {
      const getMember = (arg) => {
        const mentionRegex = /^<@!?(\d+)>$/;
        const mentionMatch = arg.match(mentionRegex);
        return mentionMatch
          ? message.channel.guild.members.get(mentionMatch[1])
          : message.channel.guild.members.get(arg);
      };

      const getRole = (arg) => {
        const mentionRegex = /^<@&(\d+)>$/;
        const mentionMatch = arg.match(mentionRegex);
        return mentionMatch
          ? message.channel.guild.roles.get(mentionMatch[1])
          : message.channel.guild.roles.find(r => r.id === arg || r.name === arg);
      };

      const member = getMember(args[0]);
      const role = getRole(args[1]);

      if (!member || !role) {
        return client.createMessage(message.channel.id, {
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

      try {
        const botMember = message.channel.guild.members.get(client.user.id);
        if (botMember.roles.length > 0 && !botMember.roles.some(r => r.position > role.position)) {
          return client.createMessage(message.channel.id, {
            embed: {
              color: 0xFF0000,
              description: "**I cannot give this role!**"
            }
          });
        }

        if (member.roles.includes(role.id)) {
          return client.createMessage(message.channel.id, {
            embed: {
              color: 0xFF0000,
              description: `<@${member.id}> **already has ${role.name} role!**`
            }
          });
        }

        await member.addRole(role.id, "Role added by addrole command");
        return client.createMessage(message.channel.id, {
          embed: {
            color: 0x00FF00,
            description: `**Successfully added ${role.name} role for <@${member.id}>!**`
          }
        });
      } catch (error) {
        console.error("Error in addrole command:", error);
        return client.createMessage(message.channel.id, {
          embed: {
            color: 0xFF0000,
            description: "**An error occurred while trying to add the role!**"
          }
        });
      }
    }
}