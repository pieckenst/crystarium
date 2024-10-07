import { Effect } from 'effect';
import { HarmonixOptions, Harmonix } from '../types/harmonixtypes';
import Eris from 'eris';

export const ClientTemplate = {
  define: (options: HarmonixOptions) => ({
    intents: options.intents,
    token: options.token,
    prefix: options.prefix,
    debug: options.debug,
    featureFlags: options.featureFlags,
    dirs: options.dirs,
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    host: options.host,
    port: options.port,
    password: options.password,
    ownerId: options.ownerId,
    build: Effect.gen(function* (_) {
      const client = new Eris.Client(options.token, {
        intents: options.intents || [],
        restMode: true
      });

      const harmonix: Harmonix = {
        client,
        options,
        commands: new Eris.Collection(),
        slashCommands: new Eris.Collection(),
        events: new Eris.Collection(),
        startTime: new Date(),
        manager: {} as any // Manager initialization is deferred
      };

      return harmonix;
    })
  })
};