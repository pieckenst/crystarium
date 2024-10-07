import { Message, TextableChannel, GuildChannel } from "eris";
import { Harmonix } from "../core";

export default {
  name: "seek",
  aliases: [""],
  description: "seek the current playing music",
  category: "music",
  execute: async (
    harmonix: Harmonix,
    msg: Message<TextableChannel>,
    args: string[],
  ) => {
    try {
      if (!(msg.channel instanceof GuildChannel)) {
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            title: "Error | This command can only be used in a guild",
          },
        });
      }

      const player = harmonix.manager.get(msg.channel.guild.id);
      if (!player || !player.queue.current) {
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            title: "Error | No song is currently playing",
          },
        });
      }

      const seekTime = Number(args[0]);
      const currentDuration = player.queue.current.duration || 0;
      if (
        isNaN(seekTime) ||
        seekTime < 0 ||
        seekTime >= currentDuration / 1000
      ) {
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0xff0000,
            title: `Error | You may seek from 0 - ${Math.floor(currentDuration / 1000)} seconds`,
          },
        });
      }

      await player.seek(seekTime * 1000);

      const embed = {
        title: `Success | Seeked song to: ${formatTime(seekTime * 1000)}`,
        fields: [{ name: "Progress", value: createProgressBar(player) }],
        color: 0x00ff00,
      };

      return harmonix.client.createMessage(msg.channel.id, { embed });
    } catch (e) {
      console.error(e);
      return harmonix.client.createMessage(msg.channel.id, {
        embed: {
          color: 0xff0000,
          title: "ERROR | An error occurred",
          description: `\`\`\`${e.message}\`\`\``,
        },
      });
    }
  },
};

function createProgressBar(player: any) {
  if (!player.queue.current) return "No song is currently playing";

  const current = player.position;
  const total = player.queue.current.duration;
  const size = 15;
  const progress = Math.round((size * current) / total);

  const bar = `${"▬".repeat(progress)}🔘${"▬".repeat(size - progress)}`;
  const timeString = `${formatTime(current)} / ${total === 0 ? "◉ LIVE" : formatTime(total)}`;

  return `${bar}\n${timeString}`;
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const paddedSeconds = String(seconds % 60).padStart(2, "0");
  const paddedMinutes = String(minutes % 60).padStart(2, "0");
  const paddedHours = String(hours).padStart(2, "0");

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}
