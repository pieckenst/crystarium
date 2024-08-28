const Eris = require('eris');

module.exports = {
    name: "repeat",
    aliases: ['loop', 'lp'],
    description: "Toggles repeat modes",
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

        if (args.length && /queue/i.test(args[0])) {
            player.setQueueRepeat(!player.queueRepeat);
            const queueRepeat = player.queueRepeat ? "Enabled" : "Disabled";
            return message.channel.createMessage(`${queueRepeat} queue repeat.`);
        }

        player.setTrackRepeat(!player.trackRepeat);
        const trackRepeat = player.trackRepeat ? "Enabled" : "Disabled";
        return message.channel.createMessage(`${trackRepeat} track repeat.`);
    }
};
