import * as Eris from 'eris';
import * as Discord from 'discord.js';

class ConfigError {
  readonly _tag = 'ConfigError';
  constructor(readonly message: string) {}
}

class TokenError {
  readonly _tag = 'TokenError';
  constructor(readonly message: string) {}
}

export interface UniversalClient {
  eris?: Eris.Client;
  discord?: Discord.Client;

  getClient(harmonix: Harmonix): Eris.Client | Discord.Client;
  createMessage(harmonix: Harmonix, channelId: string, content: any): Promise<Eris.Message | Discord.Message>;
  editMessage(harmonix: Harmonix, channelId: string, messageId: string, content: any): Promise<Eris.Message | Discord.Message>;
  on(harmonix: Harmonix, event: string, listener: (...args: any[]) => void): void;
  off(harmonix: Harmonix, event: string, listener: (...args: any[]) => void): void;
  getChannel(harmonix: Harmonix, channelId: string): Eris.AnyChannel | Discord.Channel | null;
  getDMChannel(harmonix: Harmonix, userId: string): Promise<Eris.PrivateChannel | Discord.DMChannel>;
  getRESTUser(harmonix: Harmonix, userId: string): Promise<Eris.User | Discord.User>;
  removeAllListeners(harmonix: Harmonix): void;
  disconnect(harmonix: Harmonix, options?: { reconnect?: boolean }): Promise<void>;
  connect(harmonix: Harmonix): Promise<void>;
  get user(): Eris.User | Discord.ClientUser;
  editStatus(harmonix: Harmonix, status: string, activity?: { name: string; type: number; url?: string }): void;
  bulkEditCommands(harmonix: Harmonix, commands: any[]): Promise<any>;
}

export interface UniversalCollection<K = any, V = any> {
  // @ts-ignore

  eris?: Eris.Collection<K, V>;
  discord?: Discord.Collection<K, V>;

  getCollection<K, V>(
    collection: UniversalCollection<K, V>, 
    harmonix: Harmonix):
    // @ts-ignore

     Eris.Collection<K, V> | Discord.Collection<K, V>;
  getCommand(harmonix: Harmonix, name: string): HarmonixCommand | undefined;
  set(key: K, value: V): this;
  clear(): void;
  get size(): number;
  get(key: K): V | undefined;
  map<T>(callbackfn: (value: V, key: K, collection: this) => T): T[];
}

export interface UniversalMessage {
  eris?: Eris.Message;
  discord?: Discord.Message;
  author: { id: string };
  member?: { id: string };
  channel: { id: string };
}

export interface UniversalTextableChannel {
  eris?: Eris.TextableChannel;
  discord?: Discord.TextBasedChannel;
}

export interface UniversalCommandInteraction {
  eris?: Eris.CommandInteraction;
  discord?: Discord.CommandInteraction;
  member?: { id: string };
  user: { id: string };
  options?: any;
  channel: { id: string };
}

export type FeatureFlags = {
  useDiscordJS: boolean;
  disabledCommands: string[];
};

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
  featureFlags: FeatureFlags;
};

type CustomApplicationCommandOptions = {
  type: number;
  name: string;
  description: string;
  required?: boolean;
  choices?: { name: string; value: string | number }[];
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
      execute: (harmonix: Harmonix, msg: UniversalMessage | UniversalCommandInteraction, args: string[] | Record<string, any>) => Promise<void>;
};
    
type HarmonixEvent = {
      name: string;
      execute: (...args: any[]) => void;
};
    
type Harmonix = {
  client: UniversalClient;
  options: HarmonixOptions;
  commands: UniversalCollection<string, HarmonixCommand>;
  slashCommands: UniversalCollection<string, HarmonixCommand>;
  events: UniversalCollection<string, HarmonixEvent>;
  startTime: Date;
  manager: any;
};
type BotActivityType<T extends FeatureFlags> = T['useDiscordJS'] extends true
  ? Exclude<Discord.ActivityType, 4>
  : Exclude<Eris.Constants['ActivityTypes'][keyof Eris.Constants['ActivityTypes']], 4>;



export type Message = Eris.Message<TextableChannel> | Discord.Message;
export type TextableChannel = Eris.TextableChannel | Discord.TextBasedChannel;
  

export {
  ConfigError,
  TokenError,
  HarmonixOptions,
  HarmonixCommand,
  HarmonixEvent,
  BotActivityType,
  Harmonix, CustomApplicationCommandOptions,
};
