import Eris, { Message, TextableChannel, Constants, EmbedOptions, CommandInteraction, ClientEvents } from 'eris';
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
import { logError } from './code-utils/centralloggingfactory';
import knex from 'knex';
import { setupServer as setupFastifyServer } from './server';

async function setupServer(harmonix: Harmonix): Promise<void> {
  try {
    await setupFastifyServer(harmonix);
    consola.success(colors.green('Dashboard server started successfully'));
  } catch (error) {
    consola.error(colors.red('Failed to start dashboard server:'), error);
    throw error; // Re-throw to allow main error handling to catch it
  }
}
// Load configuration
const loadConfig = Effect.tryPromise({
  try: async (): Promise<HarmonixOptions> => {
    const configPath = resolve(process.cwd(), 'config.json');
    if (!configPath) {
      consola.error(colors.red(`Config file not found at ${configPath}`));
      throw new ConfigError(`Config file not found at ${configPath}`);
    }
    consola.info(colors.yellow(` Loading configuration from: ${configPath}`));
    let configFile: string;
    try {
      configFile = readFileSync(configPath, 'utf-8');
    } catch (error) {
      consola.error(colors.red(`Failed to read config file: ${error.message}`));
      consola.error(colors.red(`Stack trace:\n${error.stack}`));
      throw new ConfigError(`Failed to read config file: ${error.message}`);
    }

    let config: HarmonixOptions;
    try {
      config = JSON.parse(configFile);
    } catch (error) {
      consola.error(colors.red(`Failed to parse config file: ${error.message}`));
      consola.error(colors.red(`Stack trace:\n${error.stack}`));
      throw new ConfigError(`Failed to parse config file: ${error.message}`);
    }

    const requiredFields = ['prefix', 'dirs', 'clientID', 'clientSecret', 'host', 'port', 'password'];
    const missingFields = requiredFields.filter(field => !(field in config));

    if (missingFields.length > 0) {
      consola.warn(colors.yellow(`Warning: Missing fields in config: ${missingFields.join(', ')}`));
      missingFields.forEach(field => {
        switch (field) {
          case 'prefix':
            config.prefix = '!';
            break;
          case 'dirs':
            config.dirs = { commands: './commands', events: './events' };
            break;
          case 'clientID':
          case 'clientSecret':
          case 'host':
          case 'password':
            config[field] = '';
            break;
          case 'port':
            config.port = 0;
            break;
        }
      });
    }

    if (!config.featureFlags) {
      config.featureFlags = {
        useDiscordJS: false,
        disabledCommands: [],
        betaCommands: [],
        useDatabase: 'none'
      };
      consola.warn(colors.yellow('Warning: featureFlags not found in config, using default values'));
    }

    return config;
  },
  catch: (error: unknown) => {
    consola.error(colors.red(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`));
    if (error instanceof Error && error.stack) {
      consola.error(colors.red(`Stack trace:\n${error.stack}`));
    }
    return new ConfigError(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
  }
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

const initDatabase = Effect.gen(function* (_) {
  const config = yield* _(loadConfig);
  if (config.featureFlags?.useDatabase === 'sqlite') {
    return knex({
      client: 'sqlite3',
      connection: {
        filename: './mydb.sqlite'
      },
      useNullAsDefault: true
    });
  } else if (config.featureFlags?.useDatabase === 'postgres') {
    return knex({
      client: 'pg',
      connection: {
        host: 'localhost',
        user: 'your_database_user',
        password: 'your_database_password',
        database: 'myapp_database'
      }
    });
  }
  return null;
});

// Initialize Harmonix
async function initHarmonix(): Promise<Harmonix> {
  const config = await Effect.runPromise(loadConfig);
  const token = await Effect.runPromise(loadToken);
  const database = await Effect.runPromise(initDatabase);


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
    restMode: true
  });

  const harmonix: Harmonix = {
    client,
    options: { ...config, token,database  },
    commands: new Collection<string, HarmonixCommand>(),
    slashCommands: new Collection<string, HarmonixCommand>(),
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

async function scanFiles(harmonix: Harmonix, dir: string): Promise<string[]> {
  const pattern = '**/*.{js,ts}';
  const files = await globby(pattern, {
    cwd: resolve(harmonix.options.dirs[dir]),
    absolute: true,
    deep: Infinity,
  });

  // Debug logging to show folder names where matches were found
  const folderNames = new Set(files.map(file => path.dirname(file)));
  if (harmonix.options.debug) {
    console.debug(`[DEBUG] Matches found in folders: ${Array.from(folderNames).join(', ')}`);

  }
  
  return files;
}

async function loadCommands(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'commands');

  for (const file of files) {
    if (harmonix.options.debug) {
      console.debug(`[DEBUG] Attempting to load command from file: ${file}`);

    }
    
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
            throw new Error(`Invalid command structure in file: ${file}. Please check for incorrect import statements or other issues.`);
          }

          if (command && typeof command === 'object' && 'name' in command && 'execute' in command) {
            if (
              (harmonix.options.featureFlags?.disabledCommands.includes(command.name)) ||
              (harmonix.options.featureFlags?.betaCommands.includes(command.name) && !command.beta)
            ) {
              if (harmonix.options.debug) {
                console.debug(`[DEBUG] Skipping ${harmonix.options.featureFlags?.disabledCommands.includes(command.name) ? 'disabled' : 'non-beta'} command: ${command.name}`);
              }
              return;
            }
            const relativePath = path.relative(harmonix.options.dirs.commands, file);
            const folderPath = path.dirname(relativePath);
            const folderName = folderPath === '.' ? 'main' : folderPath;
            
            if (command.slashCommand) {
              harmonix.slashCommands.set(command.name, command);
              consola.info(colors.blueBright(`[${folderName}] `) + colors.blue(`Loaded slash command: ${command.name}`));
            } else {
              harmonix.commands.set(command.name, command);
              consola.info(colors.blueBright(`[${folderName}] `) + colors.blue(`Loaded command: ${command.name}`));
            }
          } else {
            throw new Error(`Invalid command structure in file: ${file}. Please check for incorrect import statements or other issues.`);
          }
        },        catch: (error: Error) => Effect.sync(() => {
          consola.error(colors.red(`An error has occurred while loading command from file: ${file}`));
          
          let errorMessage: string;
          let stackTrace: string;
          if (error instanceof Error) {
            errorMessage = error.message;
            stackTrace = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
            if ('cause' in error && error.cause instanceof Error) {
              errorMessage = error.cause.message;
              stackTrace = error.cause.stack ? error.cause.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
            }
          } else {
            errorMessage = String(error);
            stackTrace = 'No stack trace available';
          }

          consola.error(colors.red(`Error details: ${errorMessage}`));
          consola.error(colors.red('Stack trace:'));
          consola.error(colors.red(stackTrace));

          // Log the error but continue execution
          consola.warn(colors.yellow(`An error occured in : ${file} - Bot will continue running`));
        })
      })
    );
  }

  consola.info(colors.green(` Loaded ${harmonix.commands.size} regular commands and ${harmonix.slashCommands.size} slash commands.`));
}


// Load events with Effect-based error handling
async function loadEvents(harmonix: Harmonix): Promise<void> {
  const files = await scanFiles(harmonix, 'events');
  for (const file of files) {
    if (harmonix.options.debug) {
      console.debug(`[DEBUG] Attempting to load event from file: ${file}`);

    }
    
    await Effect.runPromise(
      Effect.tryPromise({
        try: async () => {
          const eventModule = await import(file);
          let event: HarmonixEvent;

          if (typeof eventModule.default === 'function' && eventModule.default.build) {
            event = eventModule.default.build();
            consola.info(colors.cyan(` Event ${file} uses defineEvent structure`));
          } else if (typeof eventModule.default === 'object' && 'execute' in eventModule.default) {
            event = eventModule.default;
            consola.info(colors.cyan(` Event ${file} uses regular event structure`));
          } else {
            throw new Error(`Invalid event structure in file: ${file}`);
          }

          harmonix.events.set(event.name, event);
          harmonix.client.on(event.name as keyof ClientEvents, (...args: any[]) => 
            event.execute(harmonix, ...args)
          );

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

function watchAndReload(harmonix: Harmonix): void {
  const watcher = watch([
    harmonix.options.dirs.commands,
    harmonix.options.dirs.events,
  ]);

  const reload = debounce(async () => {
    consola.info(colors.yellow(' Preparing to reload bot...'));
    const owner = await harmonix.client.getRESTUser(harmonix.options.ownerId);
    consola.info(colors.yellow(` Owner: ${owner ? owner.username : 'Not found'}`));

    let dmChannel;
    // Send DM to bot owner
    try {
      if (owner) {
        dmChannel = await harmonix.client.getDMChannel(owner.id);
        consola.info(colors.yellow(` DM Channel: ${dmChannel ? dmChannel.id : 'Not created'}`));
        const embed = {
          title: "Bot Reload",
          description: "The bot will reload in 10 seconds due to file changes.",
          color: 0x7289DA,
          fields: [
            {
              name: "Reload Time",
              value: `<t:${Math.floor(Date.now() / 1000) + 10}:R>`
            }
          ],
          timestamp: new Date().toISOString()
        };
        await dmChannel.createMessage({ embed });
      }
    } catch (error) {
      consola.error(colors.red(`Failed to send DM to owner: ${error.message}`));
    }

    // Wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    consola.info(colors.yellow(' Reloading bot...'));

    // Fully disconnect the client
    harmonix.client.removeAllListeners();
    await harmonix.client.disconnect({ reconnect: false });
    consola.info(colors.blue(' Client fully disconnected'));

    // Clear commands and events
    harmonix.commands.clear();
    harmonix.slashCommands.clear();
    harmonix.events.clear();
    consola.info(colors.blue(' Commands and events cleared'));

    // Reinitialize the client with the token
    
    harmonix.client = new Eris.Client(harmonix.options.token, {
      intents: [
        Constants.Intents.guilds,
        Constants.Intents.guildMessages,
        Constants.Intents.guildMessageReactions,
        Constants.Intents.directMessages,
        Constants.Intents.directMessageReactions,
        Constants.Intents.guildVoiceStates
      ],
      restMode: true
    });

    // Reload commands and events
    await loadCommands(harmonix);
    await loadEvents(harmonix);
    consola.info(colors.blue(' Commands and events reloaded'));

    // Reconnect the client
    await harmonix.client.connect();
    consola.info(colors.blue(' Client reconnected'));

    consola.success(colors.green(' Reload complete'));

    // Send reload completed message to owner
    if (dmChannel) {
      const reloadCompletedEmbed = {
        title: "Bot Reload Completed",
        description: "The bot has successfully reloaded and is now back online.",
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      };
      await dmChannel.createMessage({ embed: reloadCompletedEmbed });
    }
  }, 100);
  watcher.on('change', reload);
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
        if (harmonix.options.debug) {
          console.debug(`The bot is running in debug mode.`);
        }
        await Effect.runPromise(Effect.tryPromise(() => loadCommands(harmonix)));
        await Effect.runPromise(Effect.tryPromise(() => loadEvents(harmonix)));

        // Launch the server
        await Effect.runPromise(Effect.tryPromise(() => setupServer(harmonix)));

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

        // Global error handling for command errors
        harmonix.client.on('error', (error: Error, id: string) => {
          consola.error(colors.red('Command Error:'), error);
          if (id) {
              harmonix.client.createMessage(id, {
              embed: {
                title: 'Command Error',
                description: 'An error occurred while executing the command.',
                color: 0xFF0000,
                fields: [
                {
                  name: 'Error Details',
                  value: `\`\`\`${error.message}\`\`\``
                }
                ]
              }
            }).catch(err => {
            consola.error(colors.red('Failed to send error message:'), err);
          });
        }   
        consola.warn(colors.yellow('Bot will continue running. The command error has been logged above.'));
      });        
      if (harmonix.options.debug) {
          watchAndReload(harmonix);
        }

        await Effect.runPromise(Effect.tryPromise(() => harmonix.client.connect()));
      },      
      catch: (error: Error) => {
        console.error(`An error has occurred in Harmonix core`);
        
        let errorMessage: string;
        let stackTrace: string;
        if (error instanceof Error) {
          errorMessage = error.message;
          stackTrace = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
          if ('cause' in error && error.cause instanceof Error) {
            errorMessage = error.cause.message;
            stackTrace = error.cause.stack ? error.cause.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
          }
        } else {
          errorMessage = String(error);
          stackTrace = 'No stack trace available';
        }

        consola.error(colors.red(' A critical error occurred:'), errorMessage);
        consola.error(colors.red('Stack trace:'));
        error.stack?.split('\n').forEach(line => consola.error(colors.red(line)));
        consola.error(colors.red('Error occurred at:'), new Date().toISOString());
        consola.warn(colors.yellow(' Bot will continue running. The error has been logged above.'));
      }
    })
  ).catch((error: Error) => {
    console.error(`A critical error has occurred in Harmonix core`);
    
    let errorMessage: string;
    let stackTrace: string;
    if (error instanceof Error) {
      errorMessage = error.message;
      stackTrace = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
      if ('cause' in error && error.cause instanceof Error) {
        errorMessage = error.cause.message;
        stackTrace = error.cause.stack ? error.cause.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace available';
      }
    } else {
      errorMessage = String(error);
      stackTrace = 'No stack trace available';
    }

    consola.error(colors.red(' A critical error occurred:'), errorMessage);
    consola.error(colors.red('Stack trace:'));
    error.stack?.split('\n').forEach(line => consola.error(colors.red(line)));
    consola.error(colors.red('Error occurred at:'), new Date().toISOString());
    consola.error(colors.red('Bot is shutting down due to critical error.'));
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
