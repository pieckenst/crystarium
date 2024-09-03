    const Eris = require("eris");
 

    interface Config {
      prefix: string;
    }

    interface Command {
      name: string;
      description: string;
      aliases: string[];
      usage: string;
      permissions: string[];
      execute: (client: Client, message: Message, args: string[]) => Promise<void>;
    }

    const config: Config = {
      prefix: '!' // Replace with your actual prefix
    };

    module.exports = {
        name: "addrole",
        description: "Adds the specified role to the provided user.",
        aliases: [""],
        usage: '<@user/ID> <@role/ID>',
        permissions: ["manageRoles"],
        async execute(client: Client, message: Message, args: string[]): Promise<void> {
          const getMember = (arg: string) => {
            const mentionRegex = /^<@!?(\d+)>$/;
            const mentionMatch = arg.match(mentionRegex);
            if (message.channel.type === 0 && 'guild' in message.channel) {
              return mentionMatch
                ? message.channel.guild.members.get(mentionMatch[1])
                : message.channel.guild.members.get(arg);
            }
            return null;
          };

          const getRole = (arg: string) => {
            const mentionRegex = /^<@&(\d+)>$/;
            const mentionMatch = arg.match(mentionRegex);
            if (message.channel.type === 0 && 'guild' in message.channel) {
              return mentionMatch
                ? message.channel.guild.roles.get(mentionMatch[1])
                : message.channel.guild.roles.find(r => r.id === arg || r.name === arg);
            }
            return null;
          };

          const member = getMember(args[0]);
          const role = getRole(args[1]);

          if (!member || !role) {
            await client.createMessage(message.channel.id, {
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
            return;
          }

          try {
            if (message.channel.type === 0 && 'guild' in message.channel) {
              const botMember = message.channel.guild.members.get(client.user.id);
              if (botMember && botMember.roles.length > 0 && !botMember.roles.some(r => 'guild' in message.channel && message.channel.guild.roles.get(r)!.position > role.position)) {
                await client.createMessage(message.channel.id, {
                  embed: {
                    color: 0xFF0000,
                    description: "**I cannot give this role!**"
                  }
                });
                return;
              }

              if (member.roles.includes(role.id)) {
                await client.createMessage(message.channel.id, {
                  embed: {
                    color: 0xFF0000,
                    description: `<@${member.id}> **already has ${role.name} role!**`
                  }
                });
                return;
              }

              await member.addRole(role.id, "Role added by addrole command");
              await client.createMessage(message.channel.id, {
                embed: {
                  color: 0x00FF00,
                  description: `**Successfully added ${role.name} role for <@${member.id}>!**`
                }
              });
            }
          } catch (error) {
            console.error("Error in addrole command:", error);
            await client.createMessage(message.channel.id, {
              embed: {
                color: 0xFF0000,
                description: "**An error occurred while trying to add the role!**"
              }
            });
          }
        }
    };