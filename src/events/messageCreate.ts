import { defineEvent } from "../code-utils/definingevent";
import { Harmonix } from "../typedefinitions/harmonixtypes";
import { EmbedOptions, Message, PossiblyUncachedTextableChannel } from "eris";
import { Effect } from "effect";
import { logInfo, logError } from "../code-utils/centralloggingfactory";
import { colors } from "consola/utils";
import consola from "consola";

export default class extends defineEvent({
  name: "messageCreate",
  description: "Emitted when a message is created",
}) {
  static async execute(
    harmonix: Harmonix,
    msg: Message<PossiblyUncachedTextableChannel>,
  ) {
    return Effect.runPromise(
      Effect.tryPromise(async () => {
        if (!msg.content.startsWith(harmonix.options.prefix)) {
          if (msg.mentions.includes(harmonix.client.user)) {
            consola.info(
              colors.yellow(
                ` Bot mentioned by ${msg.author.username} in ${msg.channel.id}`,
              ),
            );
            const embed = createBotInfoEmbed(harmonix);
            if (msg.channel.id) {
              await harmonix.client.createMessage(msg.channel.id, { embed });
            }
          }
          return;
        }
        if (
          "type" in msg.channel &&
          (msg.channel.type === 0 ||
            msg.channel.type === 1 ||
            msg.channel.type === 3 ||
            msg.channel.type === 5)
        ) {
          const args = msg.content
            .slice(harmonix.options.prefix.length)
            .trim()
            .split(/ +/);
          const commandName = args.shift()?.toLowerCase();

          if (!commandName) return;

          const command = harmonix.commands.get(commandName);
          if (command && "execute" in command) {
            consola.info(
              colors.cyan(
                `Command "${commandName}" used by ${msg.author.username} in ${msg.channel.id}`,
              ),
            );
            await command.execute(harmonix, msg, args);
          } else {
            consola.warn(
              colors.yellow(
                ` Unknown command "${commandName}" attempted by ${msg.author.username} in ${msg.channel.id}`,
              ),
            );
          }
        }
      }),
    );
  }
}

// Function to create an embed with bot start time and uptime
function createBotInfoEmbed(harmonix: Harmonix): EmbedOptions {
  const uptime = Date.now() - harmonix.startTime.getTime();
  const days = Math.floor(uptime / 86400000);
  const hours = Math.floor((uptime % 86400000) / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);

  return {
    title: "Bot Information",
    fields: [
      {
        name: "Start Time",
        value: harmonix.startTime.toUTCString(),
        inline: true,
      },
      {
        name: "Uptime",
        value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        inline: true,
      },
    ],
    color: 0x7289da, // Discord blurple color
    footer: {
      text: `${harmonix.client.user.username}`,
      icon_url: harmonix.client.user.avatarURL,
    },
    timestamp: new Date().toISOString(),
  };
}
