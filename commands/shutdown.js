const Eris = require("eris");

module.exports = {
  name: "shutdown",
  description: "A Command To Shutdown The Bot!",
  usage: "shutdown",
  accessableby: "Owner",
  aliases: [""],
  async execute(client, message, args) {
    const ownerId = "540142383270985738";

    if (message.author.id !== ownerId) {
      return await message.channel.createMessage({
        embed: {
          title: "You Are Not The Bot Owner!",
          color: 0xff0000,
          footer: { text: message.member.guild.name },
          timestamp: new Date()
        }
      });
    }

    await message.channel.createMessage({
      embed: {
        title: "Bot Is Shutting Down...",
        color: 0x00ff00,
        footer: { text: message.member.guild.name },
        timestamp: new Date()
      }
    });

    await client.editStatus("online", {
      name: "❤️ for ya :) | Reboot or shutdown incoming - wait a bit",
      type: 3 // 3 corresponds to "WATCHING" in Eris
    });

    setTimeout(() => {
      client.disconnect();
      process.exit(0);
    }, 5000);
  }
};
