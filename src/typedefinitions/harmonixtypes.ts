
import Eris, { Message, TextableChannel, Collection } from 'eris';
import { Manager } from 'erela.js';

class ConfigError {
  readonly _tag = 'ConfigError';
  constructor(readonly message: string) {}
}

class TokenError {
  readonly _tag = 'TokenError';
  constructor(readonly message: string) {}
}

type HarmonixOptions = {
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
};

type HarmonixCommand = {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  category?: string;
  execute: (harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) => void;
};

type HarmonixEvent = {
  name: string;
  execute: (...args: any[]) => void;
};

type Harmonix = {
    client: Eris.Client;
    options: HarmonixOptions;
    commands: Collection<any>;
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
    Harmonix
};
