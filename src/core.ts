import Eris, { Message, TextableChannel, Constants, EmbedOptions, Collection } from 'eris';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import consola from 'consola';
import { colors } from 'consola/utils';
import { watch } from 'chokidar';
import { debounce } from 'perfect-debounce';
import { globby } from 'globby';
import path from 'path';

// Types
type HarmonixOptions = {
  token: string;
  prefix: string;
  
  dirs: {
    commands: string;
    events: string;
  };
  debug: boolean;
};

type HarmonixCommand = {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  category?: string;
  execute: (msg: Eris.Message, args: string[]) => void;
};

type HarmonixEvent = {
  name: string;
  execute: (...args: any[]) => void;
};

export type Harmonix = {
    client: Eris.Client;
    options: HarmonixOptions;
    commands: Collection<any>;
    events: Collection<any>;
    startTime: Date;
};

// Load configuration
function loadConfig(): HarmonixOptions {
  const configPath = resolve(process.cwd(), 'config.json');
  const configFile = readFileSync(configPath, 'utf-8');
  return JSON.parse(configFile);
}

// Load token from .env
function loadToken(): string {
  dotenv.config();
  const token = process.env.token;
  if (!token) {
    consola.error(colors.red('[ERROR] Token not found in .env file. Please add your token to the .env file.'));
    process.exit(1);
  }
  return token;
}

// Initialize Harmonix
async function initHarmonix(): Promise<Harmonix> {
  const config = loadConfig();
  const token = loadToken();

  const client = new Eris.Client(token, {
    intents: [
        Constants.Intents.guilds,
        Constants.Intents.guildMessages,
        Constants.Intents.guildMessageReactions,
        Constants.Intents.directMessages,
        Constants.Intents.directMessageReactions,
        Constants.Intents.guildVoiceStates
    ],
  });

  return {
    client,
    options: { ...config, token },
    commands: new Collection<string, HarmonixCommand>(),
    events: new Collection<string, HarmonixEvent>(),
    startTime: new Date(),
  };
}
// Scan for command and event files
async function scanFiles(harmonix: Harmonix, dir: string): Promise<string[]> {
  const pattern = '**/*.{js,ts}';
  const files = await globby(pattern, {
    cwd: resolve(harmonix.options.dirs[dir]),
    absolute: true,
  });
  return files;
}

// Load commands
async function loadCommands(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'commands');
  for (const file of files) {
    try {
      const commandModule = require(file);
      const command = commandModule.default || commandModule;
      
      if (command && typeof command === 'object' && command.name) {
        harmonix.commands.set(command.name, command);
        
        consola.info(colors.blue(`Loaded command: ${command.name}`));
        
      } else {
        consola.warn(colors.yellow(`Skipping invalid command in file: ${file}`));
      }
    } catch (error) {
      consola.error(colors.red(`Error loading command from file: ${file}`));
      consola.error(colors.red(`Error details: ${error.message}`));
      continue;
    }
  }
}

// Load events
async function loadEvents(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'events');
  for (const file of files) {
    const event = require(file).default as HarmonixEvent;
    harmonix.events.set(event.name, event);
    harmonix.client.on(event.name, (...args) => event.execute(...args));
    if (harmonix.options.debug) {
      consola.info(colors.blue(`Loaded event: ${event.name}`));
    }
  }
}

// Watch for file changes and reload
function watchAndReload(harmonix: Harmonix): void {
  const watcher = watch([
    harmonix.options.dirs.commands,
    harmonix.options.dirs.events,
  ]);

  const reload = debounce(async () => {
    consola.info(colors.yellow('Reloading commands and events...'));
    harmonix.commands.clear();
    harmonix.events.clear();
    await loadCommands(harmonix);
    await loadEvents(harmonix);
    consola.success(colors.green('Reload complete'));
  }, 100);

  watcher.on('change', reload);
}

// Function to create an embed with bot start time and uptime
function createBotInfoEmbed(harmonix: Harmonix): EmbedOptions {
  const uptime = Date.now() - harmonix.startTime.getTime();
  const days = Math.floor(uptime / 86400000);
  const hours = Math.floor((uptime % 86400000) / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);

  return {
    title: 'Bot Information',
    fields: [
      {
        name: 'Start Time',
        value: harmonix.startTime.toUTCString(),
        inline: true
      },
      {
        name: 'Uptime',
        value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        inline: true
      }
    ],
    color: 0x7289DA, // Discord blurple color
    footer: {
      text: `${harmonix.client.user.username}`,
      icon_url: harmonix.client.user.avatarURL
    },
    timestamp: new Date().toISOString()
  };
}

// Main function
async function main() {
  const harmonix = await initHarmonix();

  consola.info(colors.blue('Initializing Terra...'));

  await loadCommands(harmonix);
  await loadEvents(harmonix);

  harmonix.client.on('ready', () => {
    consola.success(colors.green(`Logged in as ${harmonix.client.user.username}`));
  });

  harmonix.client.on('messageCreate', (msg) => {
    if (!msg.content.startsWith(harmonix.options.prefix)) {
      if (msg.mentions.includes(harmonix.client.user)) {
        consola.info(colors.yellow(`Bot mentioned by ${msg.author.username} in ${msg.channel.id}`));
        const embed = createBotInfoEmbed(harmonix);
        if (msg.channel.id) {
          harmonix.client.createMessage(msg.channel.id, { embed });
        }
      }
      return;
    }
    if ('type' in msg.channel && (msg.channel.type === 0 || msg.channel.type === 1 || msg.channel.type === 3 || msg.channel.type === 5)) {
      const args = msg.content.slice(harmonix.options.prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = harmonix.commands.get(commandName);
      if (command && 'execute' in command) {
        consola.info(colors.cyan(`Command "${commandName}" used by ${msg.author.username} in ${msg.channel.id}`));
        try {
          command.execute(msg as Message<TextableChannel>, args);
        } catch (error) {
          consola.error(colors.red(`Error executing command "${commandName}": "${error}"`));
          // Send an error message to the channel
          harmonix.client.createMessage(msg.channel.id, `An error occurred while executing the command "${commandName}". Please try again later.`);
        }
      } else {
        consola.warn(colors.yellow(`Unknown command "${commandName}" attempted by ${msg.author.username} in ${msg.channel.id}`));
      }
    }
  });

  if (harmonix.options.debug) {
    watchAndReload(harmonix);
  }

  harmonix.client.connect();
}

// Run the bot
main().catch((error) => {
  consola.error(colors.red('An error occurred:'), error);
  if (error instanceof TypeError) {
    consola.warn(colors.yellow('TypeError detected. Gracefully disconnecting the bot...'));
    try {
      const harmonix = global.harmonix as Harmonix;
      if (harmonix && harmonix.client) {
        harmonix.client.disconnect({ reconnect: false });
        consola.info(colors.green('Bot successfully disconnected.'));
        process.exit(1);
      } else {
        consola.warn(colors.yellow('Unable to access the bot client. Exiting...'));
        process.exit(1);
      }
    } catch (disconnectError) {
      consola.error(colors.red('Error during graceful shutdown:'), disconnectError);
      process.exit(1);
    }
  } else {
    consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
  }
});