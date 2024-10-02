import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../../core';

export default {
    name: 'pause',
    aliases: ['ps'],
    description: 'Pauses the current playing music',
    category: "music",
    execute: async (harmonix: Harmonix, message: Message<TextableChannel>, args: string[]) => {
      const voiceConnection = harmonix.client.voiceConnections.get(message.guildID ?? "default value");
      if (!voiceConnection) {
        return harmonix.client.createMessage(message.channel.id, 'There is no active voice connection in this guild.');
      }

      const memberVoiceState = message.member?.voiceState;
      if (!memberVoiceState?.channelID) {
        return harmonix.client.createMessage(message.channel.id, 'You need to join a voice channel.');
      }

      if (memberVoiceState.channelID !== voiceConnection.channelID) {
        return harmonix.client.createMessage(message.channel.id, 'You\'re not in the same voice channel.');
      }

      if (voiceConnection.paused) {
        return harmonix.client.createMessage(message.channel.id, 'The player is already paused.');
      }

      voiceConnection.pause();
      return harmonix.client.createMessage(message.channel.id, 'Paused the player.');
    }
};