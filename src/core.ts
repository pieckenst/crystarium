    // Function to check and import dependencies
    const checkAndImportDependencies = () => {
        const dependencies = [
            { name: 'fs', importName: 'fs' },
            { name: 'colors', importName: 'colors' },
            { name: 'Eris', importName: 'eris' }, 
            { name: 'Erela.js Manager', importName: 'erela.js' },
            { name: 'Erela.js Spotify', importName: 'erela.js-spotify' },
            { name: 'dotenv', importName: 'dotenv' },
            { name: 'consola', importName: 'consola' }
        ];

        for (const dep of dependencies) {
            try {
                console.log(`[UPSTART] Dependency check for ${dep.name}`.yellow);
                require(dep.importName);
                console.log(`[UPSTART] Successfully imported ${dep.name}`.green);
            } catch (error) {
                console.error(`[ERROR] Failed to import ${dep.name}. Please make sure it's installed.`.red);
                process.exit(1);
            }
        }
    };

    // Run the dependency check
    checkAndImportDependencies();
    import { Client, Constants, Collection, CommandInteraction } from 'eris';
    import fs from 'fs';
    import { Manager } from 'erela.js';
    import Spotify from 'erela.js-spotify';
    import dotenv from 'dotenv';
    import consola from 'consola';
    import colors from 'colors';
    import * as eris from 'eris';
    import path from 'path';

    const configPath = path.resolve('./config.json');
    console.log(`[UPSTART] Loading config from: ${configPath}`.cyan);
    import { prefix } from "./config.json";
    import { disabledCommandCategories } from "./config.json";
    import config from './config.json';
    import keepAlive from './server';

    export default class MyClient extends Client {
        commands: Collection<any>;
        slashCommands: Collection<any>;
        cooldowns: Map<string, Collection<any>>;
        manager: Manager;
        disabledCommandCategories: string[];

        constructor(token: string, options: any) {
            super(token, options);
            this.commands = new Collection();
            this.slashCommands = new Collection();
            this.cooldowns = new Map();
            this.disabledCommandCategories = disabledCommandCategories;
            this.loadCommands();
            this.initializeManager();
        }

        loadCommands(dir = './commands') {
            try {
                const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
                for (const file of commandFiles) {
                    const filePath = `${dir}/${file}`;
                    try {
                        const command = require(filePath);
                        if ('name' in command && 'execute' in command) {
                            if (command.slash) {
                                this.slashCommands.set(command.name, command);
                                consola.debug(`[UPSTART] Registered slash command: ${command.name}`.cyan);
                            } else {
                                this.commands.set(command.name, command);
                                consola.debug(`[UPSTART] Registered regular command: ${command.name}`.cyan);
                            }
                            console.log(`[UPSTART] Loaded ${file}`.green);

                            

                            // Handle categories
                            const category = path.basename(path.dirname(filePath));
                            if (category && !this.disabledCommandCategories.includes(category)) {
                                command.category = category;
                                if (!this.commands.has(category)) {
                                    this.commands.set(category, new Collection());
                                }
                                this.commands.get(category).set(command.name, command);
                            }

                            // Handle interval limits
                            if (command.intervalLimit) {
                                const list = command.intervalLimit;
                                if (list.minute > list.hour || list.hour > list.day) {
                                    throw 'Impolitic Custom Interval style!';
                                }
                            }
                        } else {
                            console.warn(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`.yellow);
                        }
                    } catch (error: any) {
                        if (file === 'avatar.js' && error.message.includes('The module \'canvas\' was compiled against a different Node.js ABI version')) {
                            console.error(`[ERROR] Failed to load command ${file}:`.red, 'The canvas module needs to be recompiled for this version of Node.js. Please reinstall the canvas package.'.red);
                        } else if (file === 'help.js' && error.message.includes('undefined is not an object (evaluating \'options.description\')')) {
                            console.error(`[ERROR] Failed to load command ${file}:`.red, 'The options object is missing a description property. Please add a description to the command.'.red);
                        } else {
                            console.error(`[ERROR] Failed to load command ${file}:`.red, error.message.red);
                        }
                    }
                }

                console.log("[UPSTART] Registered Slash Commands:".green);
                this.slashCommands.forEach(cmd => console.log(`[UPSTART] - ${cmd.name}`.green));
                console.log("[UPSTART] Registered Regular Commands:".green);
                this.commands.forEach((category, categoryName) => {
                    if (category instanceof Collection) {
                        category.forEach(cmd => console.log(`[UPSTART] - ${categoryName}/${cmd.name}`.green));
                    } else {
                        console.log(`[UPSTART] - ${categoryName}`.green);
                    }
                });

                console.log(colors.green.bold(`Loaded ${this.commands.size} text commands.`));
                console.log(colors.green.bold(`Loaded ${this.slashCommands.size} slash commands.`));
            } catch (error) {
                console.error("[ERROR] Failed to load commands:".red, error.message.red);
            }
        }        initializeManager() {
            try {
                this.manager = new Manager({
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
                        const guild = this.guilds.get(id);
                        if (guild) guild.shard.sendWS(payload.op, payload.d);
                    }
                });

                this.manager
                    .on("nodeConnect", node => console.log(`[UPSTART] Node "${node.options.identifier}" has connected.`.green))
                    .on("nodeError", (node, error) => console.error(`[ERROR] Node "${node.options.identifier}" encountered an error: ${error.message}.`.red))
                    .on("trackStart", (player, track) => {
                        let channel :any = this.getChannel(player.textChannel as any);
                        if (channel && 'createMessage' in channel) {
                            channel.createMessage({
                                embeds: [{
                                    color: Math.floor(Math.random() * 0xFFFFFF),
                                    author: { name: "NOW PLAYING", icon_url: this.user.avatarURL || undefined },
                                    description: `[${track.title}](${track.uri})`,
                                    fields: [{ name: "Requested By", value: (track.requester as { username: string }).username, inline: true }]
                                }]
                            }).catch(error => console.error("[ERROR] Error sending trackStart message:".red, error.message.red));
                        }
                    })
                    .on("trackStuck", (player, track) => {
                        const channel = this.getChannel(player.textChannel as any);
                        if (channel && 'createMessage' in channel) {
                            channel.createMessage({
                                embeds: [{
                                    color: Math.floor(Math.random() * 0xFFFFFF),
                                    author: { name: "Track Stuck", icon_url: this.user.avatarURL || undefined },
                                    description: track.title
                                }]
                            }).catch(error => console.error("[ERROR] Error sending trackStuck message:".red, error.message.red));
                        }
                    })
                    .on("queueEnd", player => {
                        const channel = this.getChannel(player.textChannel as any);
                        if (channel && 'createMessage' in channel) {
                            channel.createMessage({
                                embeds: [{
                                    color: Math.floor(Math.random() * 0xFFFFFF),
                                    author: { name: "Queue has ended", icon_url: this.user.avatarURL || undefined }
                                }]
                            }).catch(error => console.error("[ERROR] Error sending queueEnd message:".red, error.message.red));
                        }
                        player.destroy();
                    });            } catch (error: any) {
                console.error("[ERROR] Failed to initialize manager:".red, error.message.red);
            }
        }
    }

    let token: string;
    try {
        dotenv.config();
        token = process.env.token as string;
        if (!token) {
            throw new Error("Token not found in .env file");
        }
    } catch (error: any) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error("[ERROR] .env file not found. Please create a .env file with your token.".red);
        } else if (error.message === "Token not found in .env file") {
            console.error("[ERROR] Token not found in .env file. Please add your token to the .env file.".red);
        } else {
            console.error("[ERROR] Error loading .env file:".red, error.message.red);
        }
        process.exit(1);
    }

    const client = new MyClient(token, {
        intents: [
            Constants.Intents.guilds,
            Constants.Intents.guildMessages,
            Constants.Intents.guildMessageReactions,
            Constants.Intents.directMessages,
            Constants.Intents.directMessageReactions,
            Constants.Intents.guildVoiceStates
        ],
        allowedMentions: {
            everyone: false,
            roles: false,
            users: false
        }
    });

    client.on("ready", () => {
        try {
            console.log(`[UPSTART] Started the bot || Service logged in as ${client.user.username} || Prefix: ${prefix}`.green);
            client.editStatus("online", { name: "In development : Using Eris", type: 3 });
            client.manager.init(client.user.id);
            console.log("[UPSTART] Status setup complete".green);

            // Register slash commands
            const slashCommands = Array.from(client.slashCommands.values()).map(command => ({
                name: command.name,
                description: command.description,
                options: command.options,
                type: 1 as const // Specify the type as a const assertion
            }));
            client.bulkEditCommands(slashCommands);
            console.log(`[UPSTART] Registered ${slashCommands.length} slash commands`.green);
        } catch (error: any) {
            console.error("[ERROR] Failed to complete ready event:".red, error.message.red);
        }
    });

    client.on("rawWS", (packet: any) => {
        try {
            if (packet.t === "VOICE_SERVER_UPDATE" || packet.t === "VOICE_STATE_UPDATE") {
                client.manager.updateVoiceState(packet.d);
            }
        } catch (error: any) {
            console.error("[ERROR] Failed to process rawWS event:".red, error.message.red);
        }
    });
    client.on("messageCreate", async (message: eris.Message) => {
        let anyfuckingtime = "bleh";
        try {
            if (!message.content || !message.content.startsWith(prefix) || message.author.bot) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase() || '';

            const command = client.commands.get(commandName) ||
                client.commands.find((cmd: eris.Command) => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) return;

            if (command.guildOnly && !(message.channel instanceof eris.GuildChannel)) {
                return message.channel.createMessage("I can't execute that command inside DMs!");
            }

            if (message.content === prefix) {
                return message.channel.createMessage({
                    embed: {
                        title: "Oops!",
                        description: "There is a problem here",
                        color: 0xff0000,
                        fields: [{ name: "Your message is just the bot prefix", value: "Please pass down a command" }]
                    }
                });
            }

            if (command.permissions && message.member) {
                const memberPerms = message.member.permission.json;
                if (!memberPerms[command.permissions]) {
                    return message.channel.createMessage({
                        embed: {
                            title: "Oops!",
                            description: "You cannot execute this command!",
                            color: 0xff0000,
                            fields: [{ name: "You require this permission", value: `\`\`\`fix\n${command.permissions}\n\`\`\`` }]
                        }
                    });
                }
            }

            if (command.args && !args.length) {
                let reply = `You didn't provide any arguments, ${message.author.mention}!`;
                if (command.usage) {
                    reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
                }
                return message.channel.createMessage(reply);
            }

            const cooldowns = client.cooldowns;
            let anyfuckingarray:any  = []

            if (!cooldowns.has(command.name)) {
                cooldowns.set(command.name, new Collection(anyfuckingarray));
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            if (!timestamps) {
                return;
            }
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return message.channel.createMessage(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
                }
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

            await command.execute(client, message, args);
        } catch (error: any) {
            console.error("[ERROR] Failed to process message:".red, error.message.red);
            message.channel.createMessage({
                embed: {
                    title: "Oops!",
                    description: "An error occurred while executing the command",
                    color: 0xff0000,
                    fields: [{ name: "Exception that occurred", value: `\`\`\`fix\n${error.message}\n\`\`\`` }]
                }
            }).catch((sendError: any) => console.error("[ERROR] Error sending error message:".red, sendError.message.red));
        }
    });    client.on("interactionCreate", async (interaction: eris.CommandInteraction) => {        if (interaction instanceof eris.CommandInteraction) {
            const command = client.slashCommands.get(interaction.data.name);
            if (!command) return;
            try {                await command.execute(client, interaction);
            } catch (error: any) {
                console.error("[ERROR] Failed to process slash command:".red, error.message.red);
                await interaction.createMessage({
                    content: "There was an error while executing this command!",
                    flags: 64
                }).catch((sendError: any) => console.error("[ERROR] Error sending error message:".red, sendError.message.red));
            }
        }
    });

    try {
        keepAlive();
        client.connect();
    } catch (error: any) {
        console.error("[FATAL ERROR] Failed to start the bot:".red, error.message.red);
        process.exit(1);
    }