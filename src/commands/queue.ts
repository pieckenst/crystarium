import { Message, TextableChannel, GuildChannel } from 'eris';
import { Harmonix } from '../core';

export default {
  name: "queue",
  aliases: ['q'],
  description: "Displays the queue",
  execute: async (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => {
      const player = harmonix.manager.get(msg.guildID!);
      if (!player) return msg.channel.createMessage("There is no player for this guild.");

      const queue = player.queue;
      const embed: {
          author: { name: string };
          fields: { name: string; value: string }[];
          footer: { text: string };
          description?: string;
      } = {
          author: { name: `Queue for ${msg.channel instanceof GuildChannel ? msg.channel.guild.name : 'Unknown Guild'}` },
          fields: [],
          footer: { text: "" }
      };

      const tracksPerPage = 10;
      const page = args.length && Number(args[0]) ? Math.max(1, Number(args[0])) : 1;
      const maxPages = Math.ceil(queue.length / tracksPerPage);

      const start = (page - 1) * tracksPerPage;
      const end = start + tracksPerPage;
      const tracks = queue.slice(start, end);

      if (queue.current) {
          embed.fields.push({
              name: "Current",
              value: `[${queue.current.title}](${queue.current.uri})`
          });
      }

      if (tracks.length === 0) {
          embed.description = `No tracks in ${page > 1 ? `page ${page}` : "the queue"}.`;
      } else {
          embed.description = tracks.map((track, i) => 
              `${start + i + 1} - [${track.title}](${track.uri})`
          ).join("\n");
      }

      embed.footer.text = `Page ${Math.min(page, maxPages)} of ${maxPages}`;

      return msg.channel.createMessage({ embed });
  }};