import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
    name: "repeat",
    aliases: ['loop', 'lp'],
    description: "Toggles repeat modes",
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        if (!(msg.channel instanceof GuildChannel)) {
            return harmonix.client.createMessage(msg.channel.id, "This command can only be used in a guild.");
        }

        const player = harmonix.manager.get(msg.channel.guild.id);
        if (!player) {
            return harmonix.client.createMessage(msg.channel.id, "There is no player for this guild.");
        }

        const memberVoiceState = msg.member?.voiceState;
        if (!memberVoiceState?.channelID) {
            return harmonix.client.createMessage(msg.channel.id, "You need to join a voice channel.");
        }

        if (memberVoiceState.channelID !== player.voiceChannel) {
            return harmonix.client.createMessage(msg.channel.id, "You're not in the same voice channel.");
        }

        if (args.length && /queue/i.test(args[0])) {
            player.setQueueRepeat(!player.queueRepeat);
            const queueRepeat = player.queueRepeat ? "Enabled" : "Disabled";
            return harmonix.client.createMessage(msg.channel.id, `${queueRepeat} queue repeat.`);
        }

        player.setTrackRepeat(!player.trackRepeat);
        const trackRepeat = player.trackRepeat ? "Enabled" : "Disabled";
        return harmonix.client.createMessage(msg.channel.id, `${trackRepeat} track repeat.`);
    }
};