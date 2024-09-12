    import { Message, Client, Member, Role } from 'eris';
    import { Harmonix } from '../../core';
    export default {
      name: "addrole",
      description: "Adds the specified role to the provided user.",
      category: "moderation",
      usage: '<@user/ID> <@role/ID>',
      permissions: ["manageRoles"],
      execute: async (harmonix: Harmonix, msg: Message, args: string[]) => {
        const client = harmonix.client;

        const getMember = (arg: string): Member | null => {
          const mentionRegex = /^<@!?(\d+)>$/;
          const mentionMatch = arg.match(mentionRegex);
          if (msg.channel.type === 0 && 'guild' in msg.channel) {
            return mentionMatch
              ? msg.channel.guild.members.get(mentionMatch[1]) ?? null
              : msg.channel.guild.members.get(arg) ?? null;
          }
          return null;
        };
        const getRole = (arg: string): Role | null => {
          const mentionRegex = /^<@&(\d+)>$/;
          const mentionMatch = arg.match(mentionRegex);
          if (msg.channel.type === 0 && 'guild' in msg.channel) {
            return mentionMatch
              ? msg.channel.guild.roles.get(mentionMatch[1]) ?? null
              : msg.channel.guild.roles.find(r => r.id === arg || r.name === arg) ?? null;
          }
          return null;
        };
        const member = getMember(args[0]);
        const role = getRole(args[1]);

        if (!member || !role) {
          await client.createMessage(msg.channel.id, {
            embed: {
              color: 0xFF0000,
              title: "Missing arguments",
              description: `**Command:** \`addrole\`\n**Description:** \`Adds the specified role to the provided user.\`\n**Usage:** \`<@user/ID> <@role/ID>\`\n**Permissions:** \`manageRoles\``,
              timestamp: new Date()
            }
          });
          return;
        }

        try {
          if (msg.channel.type === 0 && 'guild' in msg.channel) {
            const botMember = msg.channel.guild.members.get(client.user.id);
            if (botMember && botMember.roles.length > 0 && !botMember.roles.some(r => 'guild' in msg.channel && msg.channel.guild.roles.get(r)!.position > role.position)) {
              await client.createMessage(msg.channel.id, {
                embed: {
                  color: 0xFF0000,
                  description: "**I cannot give this role!**"
                }
              });
              return;
            }

            if (member.roles.includes(role.id)) {
              await client.createMessage(msg.channel.id, {
                embed: {
                  color: 0xFF0000,
                  description: `<@${member.id}> **already has ${role.name} role!**`
                }
              });
              return;
            }

            await member.addRole(role.id, "Role added by addrole command");
            await client.createMessage(msg.channel.id, {
              embed: {
                color: 0x00FF00,
                description: `**Successfully added ${role.name} role for <@${member.id}>!**`
              }
            });
          }
        } catch (error) {
          console.error("Error in addrole command:", error);
          await client.createMessage(msg.channel.id, {
            embed: {
              color: 0xFF0000,
              description: "**An error occurred while trying to add the role!**"
            }
          });
        }
      }
    };