import Eris, { Message, TextableChannel, Constants, EmbedOptions } from 'eris';
import { Collection } from 'eris';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import consola from 'consola';
import { colors } from 'consola/utils';
import { watch } from 'chokidar';
import { debounce } from 'perfect-debounce';
import { globby } from 'globby';
import path from 'path';
import { Manager } from 'erela.js';
import Spotify from 'erela.js-spotify';

// Types
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

export type Harmonix = {
    client: Eris.Client;
    options: HarmonixOptions;
    commands: Collection<any>;
    events: Collection<any>;
    startTime: Date;
    manager: Manager;
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

  const harmonix: Harmonix = {
    client,
    options: { ...config, token },
    commands: new Collection<string, HarmonixCommand>(),
    events: new Collection<string, HarmonixEvent>(),
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

  initializeManager(harmonix);

  return harmonix;
}

function initializeManager(harmonix: Harmonix): void {
  try {
    harmonix.manager
      .on("nodeConnect", node => consola.success(colors.green(`[UPSTART] Node "${node.options.identifier}" has connected.`)))
      .on("nodeError", (node, error) => consola.error(colors.red(`[ERROR] Node "${node.options.identifier}" encountered an error: ${error.message}.`)))
      .on("trackStart", (player, track) => {
        let channel = harmonix.client.getChannel(player.textChannel as any);
        if (channel && 'createMessage' in channel) {
          channel.createMessage({
            embeds: [{
              color: Math.floor(Math.random() * 0xFFFFFF),
              author: { name: "NOW PLAYING", icon_url: harmonix.client.user.avatarURL || undefined },
              description: `[${track.title}](${track.uri})`,
              fields: [{ name: "Requested By", value: (track.requester as { username: string }).username, inline: true }]
            }]
          }).catch(error => consola.error(colors.red(`[ERROR] Error sending trackStart message: ${error.message}`)));
        }
      })
      .on("trackStuck", (player, track) => {
        const channel = harmonix.client.getChannel(player.textChannel as any);
        if (channel && 'createMessage' in channel) {
          channel.createMessage({
            embeds: [{
              color: Math.floor(Math.random() * 0xFFFFFF),
              author: { name: "Track Stuck", icon_url: harmonix.client.user.avatarURL || undefined },
              description: track.title
            }]
          }).catch(error => consola.error(colors.red(`[ERROR] Error sending trackStuck message: ${error.message}`)));
        }
      })
      .on("queueEnd", player => {
        const channel = harmonix.client.getChannel(player.textChannel as any);
        if (channel && 'createMessage' in channel) {
          channel.createMessage({
            embeds: [{
              color: Math.floor(Math.random() * 0xFFFFFF),
              author: { name: "Queue has ended", icon_url: harmonix.client.user.avatarURL || undefined }
            }]
          }).catch(error => consola.error(colors.red(`[ERROR] Error sending queueEnd message: ${error.message}`)));
        }
        player.destroy();
      });
  } catch (error: any) {
    consola.error(colors.red(`[ERROR] Failed to initialize manager: ${error.message}`));
  }
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
      
      if (command && typeof command === 'object' && 'name' in command && 'execute' in command) {
        if (command.slash) {
          harmonix.client.createCommand(command);
          consola.info(colors.blue(`Loaded slash command: ${command.name}`));
        } else {
          harmonix.commands.set(command.name, command);
          consola.info(colors.blue(`Loaded regular command: ${command.name}`));
        }

        // Handle interval limits
        if (command.intervalLimit) {
          const list = command.intervalLimit;
          if (list.minute > list.hour || list.hour > list.day) {
            throw new Error('Impolitic Custom Interval style!');
          }
        }
      } else {
        consola.warn(colors.yellow(`Skipping invalid command in file: ${file}`));
      }
    } catch (error) {
      consola.error(colors.red(`Error loading command from file: ${file}`));
      consola.error(colors.red(`Error details: ${error.message}`));
      continue;
    }
  }

  consola.info(colors.green(`Loaded ${harmonix.commands.size} text commands.`));
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
    harmonix.client.editStatus("online", { name: "In development : Using Eris", type: 3 });
    harmonix.manager.init(harmonix.client.user.id);
  });

  harmonix.client.on('messageCreate', (msg: Message<TextableChannel>) => {
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
          command.execute(harmonix, msg, args);
        } catch (error) {
          consola.error(colors.red(`Error executing command "${commandName}": "${error}"`));
          // Send an error message to the channel
          harmonix.client.createMessage(msg.channel.id, {
            embed: {
              title: "Oops!",
              description: "An error occurred while executing the command",
              color: 0xff0000,
              fields: [{ name: "Exception that occurred", value: `\`\`\`fix\n${error.message}\n\`\`\`` }]
            }
          }).catch((sendError: any) => console.error(colors.red("[ERROR] Error sending error message:"), colors.red(sendError.message)));
        }
      } else {
        consola.warn(colors.yellow(`Unknown command "${commandName}" attempted by ${msg.author.username} in ${msg.channel.id}`));
      }
    }
  });

  harmonix.client.on("rawWS", (packet: any) => {
    try {
      if (packet.t === "VOICE_SERVER_UPDATE" || packet.t === "VOICE_STATE_UPDATE") {
        harmonix.manager.updateVoiceState(packet.d);
      }
    } catch (error: any) {
      consola.error(colors.red(`[ERROR] Failed to process rawWS event: ${error.message}`));
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
  consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
});

// Global error handling
process.on('uncaughtException', (error) => {
  consola.error(colors.red('Uncaught Exception:'), error);
  consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
});

process.on('unhandledRejection', (reason, promise) => {
  consola.error(colors.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
});