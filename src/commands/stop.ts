import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';
import { logInfo, logError } from '../code-utils/centralloggingfactory';

export default {
    name: 'stop',
    aliases: ['dc'],
    description: 'Stops the current playing music',
    category: "music",
    accessableby: "Everyone",
    usage: "stop",
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        const player = harmonix.manager.get(msg.guildID!);
        if (!player) {
            await logInfo('No player for this guild', 'stop');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'There is no player for this guild.');
            }
            return;
        }

        const memberVoiceState = msg.member?.voiceState;
        if (!memberVoiceState?.channelID) {
            await logInfo('User not in voice channel', 'stop');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'You need to join a voice channel.');
            }
            return;
        }

        if (memberVoiceState.channelID !== player.voiceChannel) {
            await logInfo('User not in same voice channel', 'stop');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'You\'re not in the same voice channel.');
            }
            return;
        }

        try {
            player.destroy();
            await logInfo('Player destroyed', 'stop');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
                    embed: {
                        title: "Music Stopped",
                        description: "The player has been destroyed and the music has stopped.",
                        color: 0x00ff00,
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
        } catch (error) {
            await logError(`Failed to stop music: ${error}`, error instanceof Error ? error : undefined, 'stop');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
                    embed: {
                        title: "Error",
                        description: "An error occurred while trying to stop the music.",
                        color: 0xff0000,
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
        }
    }
};