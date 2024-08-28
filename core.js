const fs = require("fs");
const Eris = require("eris");
const keepAlive = require('./server');

const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const { prefix } = require("./config.json");
const config = require('./config.json');

let token;
try {
    require("dotenv").config();
    token = process.env.token;
    if (!token) {
      throw new Error("Token not found in .env file");
    }
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error("Error: .env file not found. Please create a .env file with your token.");
    } else if (error.message === "Token not found in .env file") {
      console.error("Error: Token not found in .env file. Please add your token to the .env file.");
    } else {
      console.error("Error loading .env file:", error.message);
    }
    process.exit(1);
}

const client = new Eris(token, {
    intents: ["guilds", "guildMessages", "guildVoiceStates"],
    allowedMentions: {
      everyone: false,
      roles: false,
      users: false
    }
});

client.commands = new Map();
client.cooldowns = new Map();
const clientID = config.clientID;
const clientSecret = config.clientSecret;

const loadCommands = (dir = './commands') => {
    try {
      const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith(".js"));
      for (const file of commandFiles) {
        const filePath = `${dir}/${file}`;
        try {
          const command = require(filePath);
          if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`[UPSTART] Loaded ${file}`);
          } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
          }
        } catch (error) {
          console.error(`[ERROR] Failed to load command ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.error("[ERROR] Failed to load commands:", error.message);
    }
};

const initializeManager = () => {
    try {
      client.manager = new Manager({
        plugins: [
          new Spotify({ clientID, clientSecret })
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
      });

      client.manager
        .on("nodeConnect", node => console.log(`Node "${node.options.identifier}" has connected.`))
        .on("nodeError", (node, error) => console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}.`))
        .on("trackStart", (player, track) => {
          const channel = client.getChannel(player.textChannel);
          if (channel) {
            channel.createMessage({
              embed: {
                color: Math.floor(Math.random() * 0xFFFFFF),
                author: { name: "NOW PLAYING", icon_url: client.user.avatarURL },
                description: `[${track.title}](${track.uri})`,
                fields: [{ name: "Requested By", value: track.requester.username, inline: true }]
              }
            }).catch(error => console.error("Error sending trackStart message:", error.message));
          }
        })
        .on("trackStuck", (player, track) => {
          const channel = client.getChannel(player.textChannel);
          if (channel) {
            channel.createMessage({
              embed: {
                color: Math.floor(Math.random() * 0xFFFFFF),
                author: { name: "Track Stuck", icon_url: client.user.avatarURL },
                description: track.title
              }
            }).catch(error => console.error("Error sending trackStuck message:", error.message));
          }
        })
        .on("queueEnd", player => {
          const channel = client.getChannel(player.textChannel);
          if (channel) {
            channel.createMessage({
              embed: {
                color: Math.floor(Math.random() * 0xFFFFFF),
                author: { name: "Queue has ended", icon_url: client.user.avatarURL }
              }
            }).catch(error => console.error("Error sending queueEnd message:", error.message));
          }
          player.destroy();
        });
    } catch (error) {
      console.error("[ERROR] Failed to initialize manager:", error.message);
    }
};

client.on("ready", () => {
    try {
      console.log(`[UPSTART] Started the bot || Service logged in as ${client.user.username}`);
      client.editStatus("online", { name: "In development : Using Eris", type: 3 });
      client.manager.init(client.user.id);
      console.log("[UPSTART] Status setup complete");
    } catch (error) {
      console.error("[ERROR] Failed to complete ready event:", error.message);
    }
});

client.on("rawWS", (packet) => {
    try {
      if (packet.t === "VOICE_SERVER_UPDATE" || packet.t === "VOICE_STATE_UPDATE") {
        client.manager.updateVoiceState(packet.d);
      }
    } catch (error) {
      console.error("[ERROR] Failed to process rawWS event:", error.message);
    }
});

client.on("messageCreate", async (message) => {
    try {
      if (!message.content || !message.content.startsWith(prefix) || message.author.bot) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      const command = client.commands.get(commandName) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

      if (!command) return;

      if (command.guildOnly && !message.channel.guild) {
        return message.channel.createMessage("I can't execute that command inside DMs!");
      }

      if (message.content === prefix) {
        return message.channel.createMessage({
          embed: {
            title: "Oops!",
            description: "There is a problem here",
            color: 0xff0000,
            fields: [{ name: "You message is just the bot prefix", value: "Please pass down a command" }]
          }
        });
      }

      if (command.permissions) {
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

      const { cooldowns } = client;
      if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Map());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.name);
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
    } catch (error) {
      console.error("[ERROR] Failed to process message:", error.message);
      message.channel.createMessage({
        embed: {
          title: "Oops!",
          description: "An error occurred while executing the command",
          color: 0xff0000,
          fields: [{ name: "Exception that occurred", value: `\`\`\`fix\n${error.message}\n\`\`\`` }]
        }
      }).catch(sendError => console.error("Error sending error message:", sendError.message));
    }
});

try {
    loadCommands();
    initializeManager();
    keepAlive();
    client.connect();
} catch (error) {
    console.error("[FATAL ERROR] Failed to start the bot:", error.message);
    process.exit(1);
}