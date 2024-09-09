const Eris = require('eris');

module.exports = {
  name: 'stop',
  aliases: ['dc'],
  description: 'Stops the current playing music',
  category: "music",
  execute: async (client, message, args) => {
      const player = client.manager.get(message.guildID);
      if (!player) {
          return message.channel.createMessage('There is no player for this guild.');
      }

      const memberVoiceState = message.member.voiceState;
      if (!memberVoiceState.channelID) {
          return message.channel.createMessage('You need to join a voice channel.');
      }

      if (memberVoiceState.channelID !== player.voiceChannel) {
          return message.channel.createMessage('You\'re not in the same voice channel.');
      }

      player.destroy();
      return message.channel.createMessage('Destroyed the player.');
  }
};
