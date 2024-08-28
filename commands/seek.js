const Eris = require('eris');

module.exports = {
  name: "seek",
  aliases: [''],
  description: "seek the current playing music",
  async execute(client, message, args) {
      try {
          const player = client.manager.get(message.guildID);
          if (!player || !player.queue.current) {
              return message.channel.createMessage({
                  embed: {
                      color: 0xFF0000,
                      title: "Error | No song is currently playing"
                  }
              });
          }

          const seekTime = Number(args[0]);
          if (isNaN(seekTime) || seekTime < 0 || seekTime >= player.queue.current.duration / 1000) {
              return message.channel.createMessage({
                  embed: {
                      color: 0xFF0000,
                      title: `Error | You may seek from 0 - ${Math.floor(player.queue.current.duration / 1000)} seconds`
                  }
              });
          }

          await player.seek(seekTime * 1000);

          const embed = new Eris.Embed()
              .setTitle(`Success | Seeked song to: ${formatTime(seekTime * 1000)}`)
              .addField("Progress", createProgressBar(player))
              .setColor(0x00FF00);

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

function createProgressBar(player) {
  if (!player.queue.current) return "No song is currently playing";

  const current = player.position;
  const total = player.queue.current.duration;
  const size = 15;
  const progress = Math.round((size * current) / total);

  const bar = `${"▬".repeat(progress)}🔘${"▬".repeat(size - progress)}`;
  const timeString = `${formatTime(current)} / ${total === 0 ? "◉ LIVE" : formatTime(total)}`;

  return `${bar}\n${timeString}`;
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const paddedSeconds = String(seconds % 60).padStart(2, '0');
  const paddedMinutes = String(minutes % 60).padStart(2, '0');
  const paddedHours = String(hours).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}
