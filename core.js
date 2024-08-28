const fs = require("fs");
const Eris = require("eris");
const keepAlive = require('./server');

const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const { prefix } = require("./config.json");
const config = require('./config.json');
require("dotenv").config();
const token = process.env.token;

const client = new Eris(token, {
  intents: ["guilds", "guildMessages", "guildVoiceStates"]
});

client.commands = new Map();
client.cooldowns = new Map();
const clientID = config.clientID;
const clientSecret = config.clientSecret;

const loadCommands = (dir = './commands') => {
  const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = `${dir}/${file}`;
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
      client.commands.set(command.name, command);
      console.log(`[UPSTART] Loaded ${file}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
    }
  }
};

const initializeManager = () => {
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
              });
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
              });
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
              });
          }
          player.destroy();
      });
};

client.on("ready", () => {
  console.log(`[UPSTART] Started the bot || Service logged in as ${client.user.username}`);
  client.editStatus("online", { name: "In development : Using Eris", type: 3 });
  client.manager.init(client.user.id);
  console.log("[UPSTART] Status setup complete");
});

client.on("rawWS", (packet) => {
  if (packet.t === "VOICE_SERVER_UPDATE" || packet.t === "VOICE_STATE_UPDATE") {
      client.manager.updateVoiceState(packet.d);
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

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

  try {
      await command.execute(client, message, args);
  } catch (error) {
      console.error(error);
      message.channel.createMessage({
          embed: {
              title: "Oops!",
              description: "An error occurred while executing the command",
              color: 0xff0000,
              fields: [{ name: "Exception that occurred", value: `\`\`\`fix\n${error}\n\`\`\`` }]
          }
      });
  }
});

loadCommands();
initializeManager();
keepAlive();
client.connect();