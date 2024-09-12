import { Message, TextableChannel, Constants } from 'eris';
import { Harmonix } from '../../core';

export default {
  name: "setstatus",
  description: "A Command To Set bot activity!",
  category: "owner",
  usage: "setstatus [your status]",
  accessableby: "Owner",
  aliases: [""],
  execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
      const ownerId = "540142383270985738";

      if (msg.author.id !== ownerId) {
          return harmonix.client.createMessage(msg.channel.id, {
              embed: {
                  title: "You Are Not The Bot Owner!",
                  color: 0xff0000,
                  footer: { text: harmonix.client.user.username },
                  timestamp: new Date()
              }
          });
      }

      const setActivity = args.join(" ");
        
      try {
          await harmonix.client.editStatus("online", {
              name: setActivity,
              type: Constants.ActivityTypes.WATCHING
          });

          return harmonix.client.createMessage(msg.channel.id, {
              embed: {
                  title: "Requested status has been set",
                  color: 0x00ff00,
                  footer: { text: harmonix.client.user.username },
                  timestamp: new Date()
              }
          });
      } catch (error) {
          console.error("Error setting status:", error);
          return harmonix.client.createMessage(msg.channel.id, "An error occurred while setting the status.");
      }
  }
};