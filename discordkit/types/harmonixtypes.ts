import Eris, { Message, TextableChannel, Collection } from "eris";
import { Manager } from "erela.js";
import { ApplicationCommandOptions } from "eris";
import { Constants } from "eris";
import { Knex } from "knex";

class ConfigError {
  readonly _tag = "ConfigError";
  constructor(readonly message: string) {}
}

class TokenError {
  readonly _tag = "TokenError";
  constructor(readonly message: string) {}
}

type BotActivityType = Exclude<
  Constants["ActivityTypes"][keyof Constants["ActivityTypes"]],
  4
>;

export interface FeatureFlags {
  useDiscordJS?: boolean;
  disabledCommands: string[];
  betaCommands: string[];
  useDatabase: "sqlite" | "postgres" | "none";
}

export interface UniversalClient {
  eris?: Eris.Client;
  //discord?: Discord.Client;
}
/* DISABLE FOR NOW
export interface UniversalCollection<K, V> {
  eris?: Eris.Collection<K, V>;
  //discord?: Discord.Collection<K, V>;
}*/

export interface UniversalMessage {
  eris?: Eris.Message;
  //discord?: Discord.Message;
}

export interface UniversalTextableChannel {
  eris?: Eris.TextableChannel;
  //discord?: Discord.TextBasedChannel;
}

export interface UniversalCommandInteraction {
  eris?: Eris.CommandInteraction;
  //discord?: Discord.CommandInteraction;
}

type HarmonixOptions = {
  ownerId?: string | undefined;
  token: string;
  prefix: string;
  dirs: {
    commands: string;
    events: string;
  };
  debug: boolean;
  clientID: string;
  clientSecret: string;
  host: string;
  port: number;
  password: string;
  featureFlags?: FeatureFlags;
  database?: Knex | null;
  intents?: (keyof typeof Constants.Intents)[];
  activity?: {
    name?: string;
    type?: BotActivityType;
  };
  status?: "online" | "idle" | "dnd" | "invisible";
};

type CustomApplicationCommandOptions = Omit<
  ApplicationCommandOptions,
  "choices"
> & {
  choices?: { name: string; value: string | number }[] | undefined;
  required?: boolean;
};

type HarmonixCommand = {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  category?: string;
  slashCommand?: boolean;
  type?: 1;
  options?: CustomApplicationCommandOptions[];
  permissions?: string[];
  intervalLimit?: { minute: number; hour: number; day: number };
  beta?: boolean;
  execute: (
    harmonix: Harmonix,
    msg: Message<TextableChannel> | Eris.CommandInteraction,
    args: string[] | Record<string, any>,
  ) => Promise<void>;
};

type HarmonixEvent = {
  name: string;
  description?: string;
  once?: boolean;
  execute: (...args: any[]) => void;
};

type Harmonix = {
  client: Eris.Client;
  options: HarmonixOptions;
  commands: Collection<any>;
  slashCommands: Collection<any>; // Add this line
  events: Collection<any>;
  startTime: Date;
  manager: Manager;
};
export {
  ConfigError,
  TokenError,
  HarmonixOptions,
  HarmonixCommand,
  HarmonixEvent,
  BotActivityType,
  Harmonix,
  CustomApplicationCommandOptions,
};
