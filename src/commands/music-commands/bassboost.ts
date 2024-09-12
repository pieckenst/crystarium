const levels = {
    0: 0.0,
    1: 0.50,
    2: 1.0,
    3: 2.0,
};

module.exports = {
    name: "bassboost",
    aliases: ['bb', 'bassboost'],
    description: "Set filter/bassboost level",
    category: "music",
    async execute(client, message, args) {
      const player = client.manager.get(message.guildID);
      if (!player) {
        return message.channel.createMessage("There is no player for this guild.");
      }

      const memberVoiceState = message.member.voiceState;
      if (!memberVoiceState.channelID) {
        return message.channel.createMessage("You need to join a voice channel.");
      }

      if (memberVoiceState.channelID !== player.voiceChannel) {
        return message.channel.createMessage("You're not in the same voice channel.");
      }

      const level = args[0] && levels.hasOwnProperty(args[0].toLowerCase()) ? args[0].toLowerCase() : "0";

      const bands = [0, 1, 2].map(band => ({ band, gain: levels[level] }));

      player.setEQ(bands);

      return message.channel.createMessage(`Set the bassboost level to ${level}`);
    }
};
