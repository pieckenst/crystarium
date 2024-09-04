const Eris = require('eris');

module.exports = {
  name: 'volume',
  aliases: ['v'],
  description: 'Set volume level of the music',
  category: "music",
  async execute(message, args, client) {
      const player = client.manager.get(message.guildID);

      if (!player) {
          return message.channel.createMessage('There is no player for this guild.');
      }

      if (args.length === 0) {
          return message.channel.createMessage(`The player volume is \`${player.volume}\`.`);
      }

      const memberVoiceState = message.member.voiceState;
      if (!memberVoiceState.channelID) {
          return message.channel.createMessage('You need to join a voice channel.');
      }

      if (memberVoiceState.channelID !== player.voiceChannel) {
          return message.channel.createMessage("You're not in the same voice channel.");
      }

      const volume = parseInt(args[0]);
      if (isNaN(volume) || volume < 1 || volume > 100) {
          return message.channel.createMessage('You need to give me a volume between 1 and 100.');
      }

      player.setVolume(volume);
      return message.channel.createMessage(`Set the player volume to \`${volume}\`.`);
  }
};
