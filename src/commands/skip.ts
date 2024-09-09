const Eris = require('eris');

module.exports = {
  name: 'skip',
  aliases: ['sk'],
  description: 'Skips the current playing music',
  category: "music",
  async execute(message, args, client) {
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

      if (!player.queue.current) {
          return message.channel.createMessage('There is no music playing.');
      }

      const { title } = player.queue.current;

      player.stop();
      return message.channel.createMessage(`${title} was skipped.`);
  }
};
