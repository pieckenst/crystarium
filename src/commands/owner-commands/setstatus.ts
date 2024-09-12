import { CommandInteraction, Message, TextableChannel, Constants } from 'eris';
import { Harmonix } from '../../typedefinitions/harmonixtypes';
import { defineCommand, createSlashCommandOption } from '../../code-utils/definingcommand';

export default class extends defineCommand({
    name: "setstatus",
    description: "Set the bot's activity status",
    category: "owner",
    usage: "setstatus <status>",
    slashCommand: true,
    ownerOnly: true,
    options: [
        createSlashCommandOption(
          3, // 3 represents STRING type
          "status",
          "The status to set for the bot",
          true
        )
      ]
}) {
    static async execute(harmonix: Harmonix, interaction: CommandInteraction | Message<TextableChannel>, args: { status: string } | string[]) {
        let setActivity: string;
      
        if (interaction instanceof CommandInteraction) {
          setActivity = (args as { status: string }).status;
        } else {
          setActivity = (args as string[]).join(" ");
        }

        if (harmonix.options.debug) {
          console.log(`Debug: Status being set: ${setActivity}`);
        }
      
        if (!setActivity) {
          const errorResponse = {
            embeds: [{
              title: "Error",
              description: "Please provide a status to set.",
              color: 0xff0000,
              footer: { text: harmonix.client.user.username },
              timestamp: new Date()
            }]
          };
          
          if (interaction instanceof CommandInteraction) {
            await interaction.createMessage(errorResponse);
          } else {
            await harmonix.client.createMessage(interaction.channel.id, errorResponse);
          }
          return;
        }
      
        try {
          await harmonix.client.editStatus("online", {
            name: setActivity,
            type: Constants.ActivityTypes.WATCHING
          });
      
          const response = {
            embeds: [{
              title: "Status Updated",
              description: `Status has been set to: ${setActivity}`,
              color: 0x00ff00,
              footer: { text: harmonix.client.user.username },
              timestamp: new Date()
            }]
          };
      
          if (interaction instanceof CommandInteraction) {
            await interaction.createMessage(response);
          } else {
            await harmonix.client.createMessage(interaction.channel.id, response);
          }
        } catch (error) {
        console.error("Error setting status:", error);
        const errorResponse = {
          embeds: [{
            title: "Error",
            description: "An error occurred while setting the status.",
            color: 0xff0000,
            footer: { text: harmonix.client.user.username },
            timestamp: new Date()
          }]
        };

        if (interaction instanceof CommandInteraction) {
          await interaction.createMessage(errorResponse);
        } else {
          await harmonix.client.createMessage(interaction.channel.id, errorResponse);
        }
      }
    }
}