import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';

export default {
  name: 'nowplaying',
  aliases: ['np'],
  description: "Show now playing music info",
  category: "music",
  async execute(harmonix: Harmonix, message: Message<TextableChannel>, args: string[]) {
      try {
          if (!message.guildID) {
              return harmonix.client.createMessage(message.channel.id, {
                  embed: {
                      color: 0xFF0000,
                      title: "Error | This command can only be used in a guild"
                  }
              });
          }

          const player = harmonix.manager.get(message.guildID);
          if (!player || !player.queue.current) {
              return harmonix.client.createMessage(message.channel.id, {
                  embed: {
                      color: 0xFF0000,
                      title: "Error | There is nothing playing"
                  }
              });
          }

          const current = player.queue.current;
          const duration = current.duration || 0;
          const position = player.position || 0;

          const embed = {
              author: { name: "Current song playing:", icon_url: harmonix.client.user.avatarURL || undefined },
              thumbnail: { url: `https://img.youtube.com/vi/${current.identifier}/mqdefault.jpg` },
              url: current.uri,
              color: 0x00FF00,
              title: `🎶 **${current.title}** 🎶`,
              fields: [
                  { name: "🕰️ Duration", value: formatTime(duration), inline: true },
                  { name: "🎼 Song By", value: current.author || "Unknown", inline: true },
                  { name: "🔢 Queue length", value: `${player.queue.length} Songs`, inline: true },
                  { name: "🎛️ Progress", value: createProgressBar(position, duration) }
              ],
              footer: { 
                  text: `Requested by: ${(current.requester as { username: string })?.username || 'Unknown'}`, 
                  icon_url: (current.requester as { avatarURL?: string })?.avatarURL || undefined 
              }
          };

          return harmonix.client.createMessage(message.channel.id, { embed });
      } catch (e) {
          console.error(e);
          return harmonix.client.createMessage(message.channel.id, {
              embed: {
                  color: 0xFF0000,
                  title: "ERROR | An error occurred",
                  description: `\`\`\`${e.message}\`\`\``
              }
          });
      }
  }};
function formatTime(milliseconds: number): string {
  if (!milliseconds || milliseconds <= 0) return "00:00";
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));

  return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0")
  ].join(":");
}

function createProgressBar(current: number, total: number): string {
  if (!total) return "**[▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇]**\n**00:00:00 / ◉ LIVE**";
  const size = 15;
  const percentage = current / total;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  const progressBar = "▇".repeat(progress) + "—".repeat(emptyProgress);
  return `**[${progressBar}]**\n**${formatTime(current)} / ${formatTime(total)}**`;
}