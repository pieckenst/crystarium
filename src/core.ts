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
import { Effect, Console } from 'effect';
import { ConfigError, TokenError, HarmonixOptions, HarmonixCommand, HarmonixEvent } from './typedefinitions/harmonixtypes';
import type { Harmonix } from './typedefinitions/harmonixtypes';
import { ApplicationCommandStructure } from 'eris';


// Load configuration
const loadConfig = Effect.tryPromise({
  try: async (): Promise<HarmonixOptions> => {
    const configPath = resolve(process.cwd(), 'config.json');
    consola.info(colors.yellow(` Loading configuration from: ${configPath}`));
    const configFile = readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  },  catch: (error: unknown) => new ConfigError(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
});

// Load token from .env
const loadToken = Effect.gen(function* (_) {
  yield* Effect.tryPromise({
    try: async () => dotenv.config(),
    catch: (error) => new TokenError(`Failed to load .env: ${error instanceof Error ? error.message : String(error)}`)
  });

  const token = process.env.token;
  if (!token) {
    yield* Effect.fail(new TokenError('Token not found in .env file'));
  }
  return token;
});

// Initialize Harmonix
async function initHarmonix(): Promise<Harmonix> {
  const config = await Effect.runPromise(loadConfig);
  const token = await Effect.runPromise(loadToken);

  consola.info(colors.yellow(` Bot prefix: ${config.prefix}`));
  consola.info(colors.yellow(` Platform: ${process.platform}`));
  consola.info(colors.yellow(` Start time: ${new Date().toISOString()}`));

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

// Added Effect-based error handling
function initializeManager(harmonix: Harmonix): void {
  Effect.runPromise(
    Effect.tryPromise({
      try: async (signal: AbortSignal) => {
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
        
        // Return a promise to satisfy the PromiseLike<unknown> return type
        return Promise.resolve();
      },
      catch: (error: Error) => Effect.sync(() => console.error(`Failed to initialize manager: ${error.message}`))
    })
  );
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

async function loadCommands(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'commands');
  for (const file of files) {
    await Effect.runPromise(
      Effect.tryPromise({
        try: async () => {
          const commandModule = await import(file);
          let command: HarmonixCommand;

          if (typeof commandModule.default === 'function' && commandModule.default.build) {
            command = commandModule.default.build();
            consola.info(colors.cyan(` Command ${file} uses defineCommand structure`));
          } else if (typeof commandModule.default === 'object' && 'execute' in commandModule.default) {
            command = commandModule.default;
            consola.info(colors.cyan(` Command ${file} uses regular command structure`));
          } else {
            throw new Error(`Invalid command structure in file: ${file}`);
          }

          if (command && typeof command === 'object' && 'name' in command && 'execute' in command) {
            harmonix.commands.set(command.name, command);
            consola.info(colors.blue(` Loaded command: ${command.name}`));

            if (command.slashCommand) {
              const slashCommandData: Eris.ApplicationCommandStructure = {
                name: command.name,
                description: command.description,
                type: 1,
                options: command.options
              };
              await harmonix.client.createCommand(slashCommandData);
              consola.info(colors.blue(` Loaded slash command: ${command.name}`));
            }
          } else {
            throw new Error(`Invalid command structure in file: ${file}`);
          }
        },
        catch: (error: Error) => Effect.sync(() => {
          consola.error(colors.red(` Error loading command from file: ${file}`));
          consola.error(colors.red(` Error details: ${error.message}`));
        })
      })
    );
  }

  consola.info(colors.green(` Loaded ${harmonix.commands.size} commands.`));
}


// Load events with Effect-based error handling
async function loadEvents(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'events');
  for (const file of files) {
    await Effect.runPromise(
      Effect.tryPromise({
        try: async () => {
          const event = require(file).default as HarmonixEvent;
          harmonix.events.set(event.name, event);
          harmonix.client.on(event.name, (...args) => event.execute(...args));
          if (harmonix.options.debug) {
            consola.info(colors.blue(` Loaded event: ${event.name}`));
          }
        },
        catch: (error: Error) => {
          consola.error(colors.red(` Error loading event from file: ${file}`));
          consola.error(colors.red(` Error details: ${error.message}`));
        }
      })
    );
  }
}

// Watch for file changes and reload
function watchAndReload(harmonix: Harmonix): void {
  const watcher = watch([
    harmonix.options.dirs.commands,
    harmonix.options.dirs.events,
  ]);

  const reload = debounce(async () => {
    consola.info(colors.yellow(' Reloading commands and events...'));
    harmonix.commands.clear();
    harmonix.events.clear();
    await loadCommands(harmonix);
    await loadEvents(harmonix);
    consola.success(colors.green(' Reload complete'));
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
// Main function with Effect-based error handling
async function main() {
  await Effect.runPromise(
    Effect.tryPromise({
      try: async () => {
        const harmonix = await Effect.runPromise(Effect.tryPromise(() => initHarmonix()));

        // Display ASCII art and initialization message side by side
        const fs = require('fs');
        const path = require('path');
        const asciiArt = await Effect.runPromise(Effect.tryPromise(() =>
          fs.promises.readFile(path.join(__dirname, 'ascii-art.txt'), 'utf8')
        ));

        const asciiLines = (asciiArt as string).split('\n');
        const initMessage = ' Initializing Terra...';

        const maxAsciiWidth = Math.max(...asciiLines.map(line => line.length));
        const padding = ' '.repeat(10); // Space between ASCII art and text

        // Create large font version of initMessage
        const largeFont = [
                "┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐",
                "│ I │ │ N │ │ I │ │ T │ │ I │ │ A │ │ L │ │ I │ │ Z │ │ I │ │ N │ │ G │",
                "└───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘",
                "                ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐",
                "                │ T │ │ E │ │ R │ │ R │ │ A │",
                "                └───┘ └───┘ └───┘ └───┘ └───┘"
        ];

        console.log('\n');
        const terminalWidth = process.stdout.columns;
        const largeMessageWidth = Math.max(...largeFont.map(line => line.length));
        const leftPadding = Math.floor((terminalWidth - maxAsciiWidth - largeMessageWidth - padding.length) / 2);

        asciiLines.forEach((line, index) => {
                const paddedLine = line.padEnd(maxAsciiWidth);
                const largeFontLine = largeFont[index] || '';
                console.log('\x1b[94m' + ' '.repeat(leftPadding) + paddedLine + '\x1b[0m' + padding + colors.blue(largeFontLine));
        });

        console.log('\n');
        await Effect.runPromise(Effect.tryPromise(() => loadCommands(harmonix)));
        await Effect.runPromise(Effect.tryPromise(() => loadEvents(harmonix)));

        harmonix.client.on('ready', () => {
          consola.success(colors.green(` Logged in as ${harmonix.client.user.username}`));
          harmonix.client.editStatus("online", { name: "In development : Using Eris", type: 3 });
          harmonix.manager.init(harmonix.client.user.id);
        });

        harmonix.client.on('messageCreate', (msg: Message<TextableChannel>) => {
          Effect.runPromise(Effect.tryPromise({
            try: async () => {
              if (!msg.content.startsWith(harmonix.options.prefix)) {
                if (msg.mentions.includes(harmonix.client.user)) {
                  consola.info(colors.yellow(` Bot mentioned by ${msg.author.username} in ${msg.channel.id}`));
                  const embed = createBotInfoEmbed(harmonix);
                  if (msg.channel.id) {
                    await harmonix.client.createMessage(msg.channel.id, { embed });
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
                  await command.execute(harmonix, msg, args);
                } else {
                  consola.warn(colors.yellow(` Unknown command "${commandName}" attempted by ${msg.author.username} in ${msg.channel.id}`));
                }
              }
            },
            catch: (error: Error) => {
              consola.error(colors.red(`Error processing message: ${error.message}`));
              if (msg.channel.id) {
                harmonix.client.createMessage(msg.channel.id, {
                  embed: {
                    title: "Oops!",
                    description: "An error occurred while processing the message",
                    color: 0xff0000,
                    fields: [{ name: "Exception that occurred", value: `\`\`\`fix\n${error.message}\n\`\`\`` }]
                  }
                }).catch((sendError: any) => console.error(colors.red("[ERROR] Error sending error message:"), colors.red(sendError.message)));
              }
            }
          }));
        });

        harmonix.client.on("rawWS", (packet: any) => {
          Effect.runPromise(Effect.tryPromise({
            try: async () => {
              if (packet.t === "VOICE_SERVER_UPDATE" || packet.t === "VOICE_STATE_UPDATE") {
                await harmonix.manager.updateVoiceState(packet.d);
              }
            },
            catch: (error: Error) => {
              consola.error(colors.red(`[ERROR] Failed to process rawWS event: ${error.message}`));
            }
          }));
        });

        if (harmonix.options.debug) {
          watchAndReload(harmonix);
        }

        await Effect.runPromise(Effect.tryPromise(() => harmonix.client.connect()));
      },      catch: (error: Error) => {        consola.error(colors.red(' An error occurred:'), error);
        consola.warn(colors.yellow(' Bot will continue running. The error has been logged above.'));
        return Effect.fail(error);
      }
    })
  ).catch((error: Error) => {
    consola.error(colors.red(' A critical error occurred:'), error);
    process.exit(1);
  });
}


// Run the bot
Effect.runPromise(
  Effect.catchAll(
    Effect.tryPromise(() => main()),
    (error) => Effect.sync(() => {
      consola.error(colors.red('An error occurred:'), error);
      consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
    })
  )
);
// Global error handling
process.on('uncaughtException', (error) => {
  consola.error(colors.red('Uncaught Exception:'), error);
  
  if (error.message.includes('Connection reset by peer')) {
    consola.warn(colors.yellow('Connection reset by peer detected. Attempting to reload the bot...'));
    
    // Delay the reload to allow for any cleanup
    setTimeout(() => {
      consola.info(colors.blue('Restarting the bot...'));
      process.exit(1); // Exit with a non-zero code to trigger a restart if you're using a process manager
    }, 5000); // 5 seconds delay
  } else {
    consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
  }
});

process.on('unhandledRejection', (reason, promise) => {
  consola.error(colors.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  
  if (reason instanceof Error && reason.message.includes('Connection reset by peer')) {
    consola.warn(colors.yellow('Connection reset by peer detected in unhandled rejection. Attempting to reload the bot...'));
    
    setTimeout(() => {
      consola.info(colors.blue('Restarting the bot...'));
      process.exit(1);
    }, 5000);
  } else {
    consola.warn(colors.yellow('Bot will continue running. The error has been logged above.'));
  }
});

export { Harmonix };
