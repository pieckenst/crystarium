import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';
import { logInfo, logError } from '../code-utils/centralloggingfactory';

export default {
    name: "skip",
    description: "Skips the current playing music",
    usage: "skip",
    category: "music",
    accessableby: "Everyone",
    aliases: ["sk"],
    execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
        const player = harmonix.manager.get(msg.guildID!);
        if (!player) {
            await logInfo('No player for this guild', 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'There is no player for this guild.');
            }
            return;
        }

        const memberVoiceState = msg.member?.voiceState;
        if (!memberVoiceState?.channelID) {
            await logInfo('User not in voice channel', 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'You need to join a voice channel.');
            }
            return;
        }

        if (memberVoiceState.channelID !== player.voiceChannel) {
            await logInfo('User not in same voice channel', 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'You\'re not in the same voice channel.');
            }
            return;
        }

        if (!player.queue.current) {
            await logInfo('No music playing', 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, 'There is no music playing.');
            }
            return;
        }

        const { title } = player.queue.current;

        try {
            player.stop();
            await logInfo(`${title} was skipped`, 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
                    embed: {
                        title: "Song Skipped",
                        description: `${title} was skipped.`,
                        color: 0x00ff00,
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
        } catch (error) {
            await logError(`Failed to skip song: ${error}`, error instanceof Error ? error : undefined, 'skip');
            if (msg.channel.id) {
                await harmonix.client.createMessage(msg.channel.id, {
                    embed: {
                        title: "Error",
                        description: "An error occurred while trying to skip the song.",
                        color: 0xff0000,
                        footer: { text: (msg.channel as GuildChannel).guild?.name || "Direct Message" },
                        timestamp: new Date()
                    }
                });
            }
        }
    }};