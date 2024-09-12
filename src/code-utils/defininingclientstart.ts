import { Effect } from 'effect';
import { HarmonixOptions, Harmonix, FeatureFlags } from '../typedefinitions/harmonixtypes';
import { Manager } from 'erela.js';
import Spotify from 'erela.js-spotify';
import { loadLibrary } from './libraryHelper';
/* DISABLE FOR NOW
export function defineClientStart(config: HarmonixOptions & { featureFlags: FeatureFlags }) {
  return class {
    static async build(): Promise<Harmonix> {
      const { Client, Collection } = await loadLibrary(config.featureFlags.useDiscordJS);

      const client = new Client({
        intents: config.featureFlags.useDiscordJS ? [
          'Guilds', 'GuildVoiceStates', 'GuildMessages', 'GuildMessageReactions', 'DirectMessages', 'DirectMessageReactions'
        ] : [
          'guilds', 'guildVoiceStates', 'guildMessages', 'guildMessageReactions', 'directMessages', 'directMessageReactions'
        ]
      });

      const harmonix: Harmonix = {
        client,
        options: config,
        commands: new Collection(),
        slashCommands: new Collection(),
        events: new Collection(),
        startTime: new Date(),
        manager: new Manager({
          plugins: [
            new Spotify({ clientID: config.clientID, clientSecret: config.clientSecret })
          ],
          nodes: [{
            host: config.host,
            port: config.port,
            password: config.password,
            retryDelay: 5000,
          }],
          autoPlay: true,
          send: (id, payload) => {
            const guild = client.guilds.get(id);
            if (guild) guild.shard.sendWS(payload.op, payload.d);
          }
        })
      };

      return harmonix;
    }
  };
} */
