const Eris = require('eris');

module.exports = {
  name: 'pause',
  aliases: ['ps'],
  description: 'Pauses the current playing music',
  run: async (client, message, args) => {
      const voiceConnection = client.voiceConnections.get(message.guildID);
      if (!voiceConnection) {
          return message.channel.createMessage('There is no active voice connection in this guild.');
      }

      const memberVoiceState = message.member.voiceState;
      if (!memberVoiceState.channelID) {
          return message.channel.createMessage('You need to join a voice channel.');
      }

      if (memberVoiceState.channelID !== voiceConnection.channelID) {
          return message.channel.createMessage('You\'re not in the same voice channel.');
      }

      if (voiceConnection.paused) {
          return message.channel.createMessage('The player is already paused.');
      }

      voiceConnection.pause();
      return message.channel.createMessage('Paused the player.');
  }
};
