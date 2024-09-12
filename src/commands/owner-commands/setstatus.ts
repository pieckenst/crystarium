import { CommandInteraction, Message, TextableChannel, Constants } from 'eris';
import { BotActivityType, Harmonix } from '../../typedefinitions/harmonixtypes';
import { defineCommand, createSlashCommandOption } from '../../code-utils/definingcommand';
import { ActivityPartial } from 'eris';

export default class extends defineCommand({
    name: "setstatus",
    description: "Set the bot's activity status",
    category: "owner",
    usage: "setstatus <type> <status>",
    slashCommand: true,
    ownerOnly: true,
    options: [
        createSlashCommandOption(
            3,
            "type",
            "The type of status (PLAYING, STREAMING, LISTENING, WATCHING, COMPETING)",
            true,
            [
                { name: "Playing", value: "PLAYING" },
                { name: "Streaming", value: "STREAMING" },
                { name: "Listening", value: "LISTENING" },
                { name: "Watching", value: "WATCHING" },
                { name: "Competing", value: "COMPETING" }
            ]
        ),
        createSlashCommandOption(
            3,
            "status",
            "The status to set for the bot",
            true
        )
    ]
}) {
    static async execute(harmonix: Harmonix, interaction: CommandInteraction | Message<TextableChannel>, args: { type: string, status: string } | string[]) {
        let statusType: Constants['ActivityTypes'][keyof Constants['ActivityTypes']];
        let setActivity: string;
      
        if (harmonix.options.debug) {
            console.log(`Debug: Interaction type: ${interaction instanceof CommandInteraction ? 'CommandInteraction' : 'Message'}`);
            console.log(`Debug: Args: ${JSON.stringify(args)}`);
        }

        if (interaction instanceof CommandInteraction) {
            statusType = Constants.ActivityTypes[(args as { type: string, status: string }).type as keyof typeof Constants.ActivityTypes];
            setActivity = (args as { type: string, status: string }).status;
            if (harmonix.options.debug) {
                console.log(`Debug: StatusType: ${statusType}`);
                console.log(`Debug: SetActivity: ${setActivity}`);
            }
        } else {
            const [type, ...statusParts] = args as string[];
            statusType = Constants.ActivityTypes[type.toUpperCase() as keyof typeof Constants.ActivityTypes];
            setActivity = statusParts.join(" ");
            if (harmonix.options.debug) {
                console.log(`Debug: StatusType: ${statusType}`);
                console.log(`Debug: SetActivity: ${setActivity}`);
            }
        }

        try {
            const activity: ActivityPartial<BotActivityType> = {
                name: setActivity,
                type: statusType as BotActivityType
            };
          
            if (harmonix.options.debug) {
                console.log(`Debug: Activity: ${JSON.stringify(activity)}`);
            }

            await harmonix.client.editStatus("online", activity);
      
            const response = {
                embeds: [{
                    title: "Status Updated",
                    description: `Status has been set to: ${Object.keys(Constants.ActivityTypes).find(key => Constants.ActivityTypes[key] === statusType)} ${setActivity}`,
                    color: 0x00ff00,
                    footer: { text: harmonix.client.user.username },
                    timestamp: new Date()
                }]
            };
      
            if (harmonix.options.debug) {
                console.log(`Debug: Response: ${JSON.stringify(response)}`);
            }

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

            if (harmonix.options.debug) {
                console.log(`Debug: Error Response: ${JSON.stringify(errorResponse)}`);
            }

            if (interaction instanceof CommandInteraction) {
                await interaction.createMessage(errorResponse);
            } else {
                await harmonix.client.createMessage(interaction.channel.id, errorResponse);
            }
        }
    }
    static getStatusType(type: string): BotActivityType {
        switch (type.toUpperCase()) {
            case "PLAYING": return Constants.ActivityTypes.GAME;
            case "STREAMING": return Constants.ActivityTypes.STREAMING;
            case "LISTENING": return Constants.ActivityTypes.LISTENING;
            case "WATCHING": return Constants.ActivityTypes.WATCHING;
            case "COMPETING": return Constants.ActivityTypes.COMPETING;
            default: return Constants.ActivityTypes.GAME;
        }
    }
}