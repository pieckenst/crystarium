import { Effect } from "effect";
import {
  HarmonixOptions,
  Harmonix,
  FeatureFlags,
} from "../typedefinitions/harmonixtypes";
import Eris from "eris";
import { Manager } from "erela.js";

export interface ClientStartConfig {
  options: HarmonixOptions;
  featureFlags: FeatureFlags;
}

export interface ClientStartResult {
  client: Eris.Client;
}

export interface HarmonixBuilderConfig {
  options: HarmonixOptions;
  featureFlags: FeatureFlags;
  token: string;
  intents?: (keyof typeof Eris.Constants.Intents)[];
}

export interface HarmonixBuilder {
  buildHarmonix(
    config: HarmonixBuilderConfig,
  ): Effect.Effect<Harmonix, Error, never>;
}

export function defineClientStart(): HarmonixBuilder {
  return {
    buildHarmonix(
      config: HarmonixBuilderConfig,
    ): Effect.Effect<Harmonix, Error, never> {
      return Effect.tryPromise(async () => {
        const client = new Eris.Client(config.token, {
          intents: config.intents || [],
          restMode: true,
        });

        return {
          client,
          options: config.options,
          commands: new Eris.Collection(),
          slashCommands: new Eris.Collection(),
          events: new Eris.Collection(),
          startTime: new Date(),
          manager: {} as Manager, // Placeholder, to be implemented in core.ts
        } as Harmonix;
      });
    },
  };
}
