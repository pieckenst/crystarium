const Eris = require("eris");

module.exports = {
  name: "setstatus",
  description: "A Command To Set bot activity!",
  usage: "setstatus [your status]",
  accessableby: "Owner",
  aliases: [""],
  async execute(client, message, args) {
    const ownerId = "540142383270985738";

    if (message.author.id !== ownerId) {
      return message.channel.createMessage({
        embed: {
          title: "You Are Not The Bot Owner!",
          color: 0xff0000,
          footer: { text: client.user.username },
          timestamp: new Date()
        }
      });
    }

    const setActivity = args.join(" ");
    
    try {
      await client.editStatus("online", {
        name: setActivity,
        type: Eris.Constants.ActivityTypes.WATCHING
      });

      return message.channel.createMessage({
        embed: {
          title: "Requested status has been set",
          color: 0x00ff00,
          footer: { text: client.user.username },
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error("Error setting status:", error);
      return message.channel.createMessage("An error occurred while setting the status.");
    }
  }
};