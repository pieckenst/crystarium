const Eris = require('eris');

module.exports = {
  name: 'nowplaying',
  aliases: ['np'],
  description: "Show now playing music info",
  async execute(client, message, args) {
      try {
          const player = client.manager.get(message.guildID);
          if (!player || !player.queue.current) {
              return message.channel.createMessage({
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
              author: { name: "Current song playing:", icon_url: client.user.avatarURL },
              thumbnail: { url: `https://img.youtube.com/vi/${current.identifier}/mqdefault.jpg` },
              url: current.uri,
              color: 0x00FF00,
              title: `🎶 **${current.title}** 🎶`,
              fields: [
                  { name: "🕰️ Duration", value: formatTime(duration), inline: true },
                  { name: "🎼 Song By", value: current.author, inline: true },
                  { name: "🔢 Queue length", value: `${player.queue.length} Songs`, inline: true },
                  { name: "🎛️ Progress", value: createProgressBar(position, duration) }
              ],
              footer: { text: `Requested by: ${current.requester.username}`, icon_url: current.requester.avatarURL }
          };

          return message.channel.createMessage({ embed });
      } catch (e) {
          console.error(e);
          return message.channel.createMessage({
              embed: {
                  color: 0xFF0000,
                  title: "ERROR | An error occurred",
                  description: `\`\`\`${e.message}\`\`\``
              }
          });
      }
  }
};

function formatTime(milliseconds) {
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

function createProgressBar(current, total) {
  if (!total) return "**[▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇—▇]**\n**00:00:00 / ◉ LIVE**";
  const size = 15;
  const percentage = current / total;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  const progressBar = "▇".repeat(progress) + "—".repeat(emptyProgress);
  return `**[${progressBar}]**\n**${formatTime(current)} / ${formatTime(total)}**`;
}
