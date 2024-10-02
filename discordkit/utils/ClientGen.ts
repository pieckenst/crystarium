import { Effect } from 'effect';
import { HarmonixOptions, Harmonix, FeatureFlags } from '../../discordkit/types/harmonixtypes';
import Eris from 'eris';
import { Manager } from 'erela.js';

export interface ClientConfig {
  options: HarmonixOptions;
  featureFlags: FeatureFlags;
  token: string;
  intents?: (keyof typeof Eris.Constants.Intents)[];
}

export interface ClientBuilder {
  buildClient(config: ClientConfig): Effect.Effect<Harmonix, Error, never>;
}

export class ClientGen {
  static defineClientStart(): ClientBuilder {
    return {
      buildClient: (config: ClientConfig): Effect.Effect<Harmonix, Error, never> => {
        return Effect.tryPromise({
          try: async () => {
            if (!Eris.Client) {
              throw new Error('Eris.Client is undefined. Make sure Eris is properly imported.');
            }
            const client = new Eris.Client(config.token, {
              intents: config.intents || [],
              restMode: true
            });
  
            return {
              client,
              options: config.options,
              commands: new Eris.Collection(),
              slashCommands: new Eris.Collection(),
              events: new Eris.Collection(),
              startTime: new Date(),
              manager: {} as Manager
            } as Harmonix;
          },
          catch: (error: unknown) => {
            console.error('Error in ClientGen.buildClient:', error);
            if (error instanceof Error) {
              console.error('Error stack:', error.stack);
            }
            return new Error(`Failed to build client: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      
      }
    };
  }
}
