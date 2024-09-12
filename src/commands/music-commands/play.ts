import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';

export default {
  name: 'play',
  aliases: ['p'],
  description: "Plays your favourite music from youtube or spotify",
  category: "music",
  execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
    if (!msg.member || !msg.guildID) return harmonix.client.createMessage(msg.channel.id, 'You need to be in a guild to use this command.');
    const voiceState = msg.member.voiceState;

    if (!voiceState?.channelID) return harmonix.client.createMessage(msg.channel.id, 'You need to join a voice channel.');
    if (!args.length) return harmonix.client.createMessage(msg.channel.id, 'You need to give me a URL or a search term.');

    const player = harmonix.manager.create({
      guild: msg.guildID,
      voiceChannel: voiceState.channelID,
      textChannel: msg.channel.id,
      selfDeafen: true,
    });

    if (player.state !== "CONNECTED") player.connect();

    const search = args.join(' ');
    let res;

    try {
      res = await player.search(search, msg.author);
      if (res.loadType === 'LOAD_FAILED') {
        if (!player.queue.current) player.destroy();
        throw res.exception;
      }
    } catch (err) {
      return harmonix.client.createMessage(msg.channel.id, `There was an error while searching: ${err.message}`);
    }

    switch (res.loadType) {
      case 'NO_MATCHES':
        if (!player.queue.current) player.destroy();
        return harmonix.client.createMessage(msg.channel.id, 'There were no results found.');
      case 'TRACK_LOADED':
        player.queue.add(res.tracks[0]);

        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0x00f70c,
            author: { name: 'Enqueuing:', icon_url: harmonix.client.user.avatarURL },
            description: res.tracks[0].title,
            timestamp: new Date()
          }
        });
      case 'PLAYLIST_LOADED':
        player.queue.add(res.tracks);

        if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0x00f70c,
            author: { name: 'Enqueuing playlist:', icon_url: harmonix.client.user.avatarURL },
            description: `${res.playlist.name} with ${res.tracks.length} tracks.`,
            timestamp: new Date()
          }
        });
      case 'SEARCH_RESULT':
        const max = Math.min(5, res.tracks.length);
        const results = res.tracks
          .slice(0, max)
          .map((track, index) => `${index + 1} - [${track.title}](${track.uri})`)
          .join('\n');

        await harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0x00f70c,
            title: 'Search Results:',
            description: results,
            fields: [{ name: 'Cancel Search:', value: 'Type end or any other number to cancel the search', inline: true }],
            timestamp: new Date()
          }
        });

        const filter = (m: Message<TextableChannel>) => m.author.id === msg.author.id && /^(\d+|end)$/i.test(m.content);
        const response = await new Promise<Message<TextableChannel>[]>((resolve) => {
          const collector = new Eris.MessageCollector(msg.channel, filter, { max: 1, time: 30000 });
          collector.on('end', (collected) => resolve(Array.from(collected.values())));
        });

        if (!response.length) {
          if (!player.queue.current) player.destroy();
          return harmonix.client.createMessage(msg.channel.id, "You didn't provide a selection.");
        }

        const choice = response[0].content.toLowerCase();

        if (choice === 'end') {
          if (!player.queue.current) player.destroy();
          return harmonix.client.createMessage(msg.channel.id, 'Cancelled selection.');
        }

        const index = Number(choice) - 1;
        if (index < 0 || index >= max) return harmonix.client.createMessage(msg.channel.id, `The number you provided is too small or too big (1-${max}).`);

        const track = res.tracks[index];
        player.queue.add(track);

        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return harmonix.client.createMessage(msg.channel.id, {
          embed: {
            color: 0x00f70c,
            author: { name: 'Added To Queue', icon_url: harmonix.client.user.avatarURL },
            description: `[${track.title}](${track.uri})`,
            fields: [{ name: 'Requested By:', value: track.requester.username, inline: true }],
            timestamp: new Date()
          }
        });
    }
  },};