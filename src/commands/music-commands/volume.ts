import { Message, TextableChannel, GuildChannel } from "eris";
import { Harmonix } from "../../core";
import {
  logInfo,
  logError,
} from "../../../discordkit/utils/centralloggingfactory";

export default {
  name: "volume",
  aliases: ["v"],
  description: "Set volume level of the music",
  category: "music",
  accessableby: "Everyone",
  usage: "volume [1-100]",
  execute: async (
    harmonix: Harmonix,
    msg: Message<TextableChannel>,
    args: string[],
  ) => {
    const player = harmonix.manager.get(msg.guildID!);

    if (!player) {
      await logInfo("No player for this guild", "volume");
      if (msg.channel.id) {
        await harmonix.client.createMessage(
          msg.channel.id,
          "There is no player for this guild.",
        );
      }
      return;
    }

    if (args.length === 0) {
      await logInfo(`Current volume: ${player.volume}`, "volume");
      if (msg.channel.id) {
        await harmonix.client.createMessage(
          msg.channel.id,
          `The player volume is \`${player.volume}\`.`,
        );
      }
      return;
    }

    const memberVoiceState = msg.member?.voiceState;
    if (!memberVoiceState?.channelID) {
      await logInfo("User not in voice channel", "volume");
      if (msg.channel.id) {
        await harmonix.client.createMessage(
          msg.channel.id,
          "You need to join a voice channel.",
        );
      }
      return;
    }

    if (memberVoiceState.channelID !== player.voiceChannel) {
      await logInfo("User not in same voice channel", "volume");
      if (msg.channel.id) {
        await harmonix.client.createMessage(
          msg.channel.id,
          "You're not in the same voice channel.",
        );
      }
      return;
    }

    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 1 || volume > 100) {
      await logInfo(`Invalid volume input: ${args[0]}`, "volume");
      if (msg.channel.id) {
        await harmonix.client.createMessage(
          msg.channel.id,
          "You need to give me a volume between 1 and 100.",
        );
      }
      return;
    }

    player.setVolume(volume);
    await logInfo(`Volume set to ${volume}`, "volume");
    if (msg.channel.id) {
      await harmonix.client.createMessage(msg.channel.id, {
        embed: {
          title: "Volume Changed",
          description: `Set the player volume to \`${volume}\`.`,
          color: 0x00ff00,
          footer: {
            text: (msg.channel as GuildChannel).guild?.name || "Direct Message",
          },
          timestamp: new Date(),
        },
      });
    }
  },
};
