import { Effect } from 'effect';
import { HarmonixOptions, Harmonix, FeatureFlags, UniversalCollection } from '../typedefinitions/harmonixtypes';
import { Manager } from 'erela.js';
import Spotify from 'erela.js-spotify';
import { loadLibrary } from './libraryHelper';
import { GatewayIntentBits, Collection as DiscordCollection, Client as DiscordClient } from 'discord.js';
import { Constants, Collection as ErisCollection, Client as ErisClient } from 'eris';

export function defineClientStart(config: HarmonixOptions & { featureFlags: FeatureFlags }) {
  return class {
    static async build(): Promise<Harmonix> {
      let client;
      let commands: UniversalCollection<string, any>;
      let slashCommands: UniversalCollection<string, any>;
      let events: UniversalCollection<string, any>;

      if (config.featureFlags.useDiscordJS) {
        const intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.DirectMessageReactions
        ];
        client = new DiscordClient({ intents });
        commands = { discord: new DiscordCollection() };
        slashCommands = { discord: new DiscordCollection() };
        events = { discord: new DiscordCollection() };
      } else {
        const intents = [
          Constants.Intents.guilds,
          Constants.Intents.guildVoiceStates,
          Constants.Intents.guildMessages,
          Constants.Intents.guildMessageReactions,
          Constants.Intents.directMessages,
          Constants.Intents.directMessageReactions
        ];
        client = new ErisClient(config.token, { intents });
        
        class BaseObject {
          id: string = '';
          constructor() {
            this.id = '';
          }
        }
      
        commands = { eris: new ErisCollection(BaseObject) };
        slashCommands = { eris: new ErisCollection(BaseObject) };
        events = { eris: new ErisCollection(BaseObject) };
      }

      const harmonix: Harmonix = {
        client: { [config.featureFlags.useDiscordJS ? 'discord' : 'eris']: client },
        options: config,
        commands,
        slashCommands,
        events,
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
            const guild = config.featureFlags.useDiscordJS
              ? client.guilds.cache.get(id)
              : client.guilds.get(id);
            if (guild) guild.shard.sendWS(payload.op, payload.d);
          }
        })
      };

      return harmonix;
    }  };
}
