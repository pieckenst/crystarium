import { Message, TextableChannel, CommandInteraction } from "eris";
import { Harmonix } from "../core";
import { defineCommand } from "../../discordkit/utils/command";
import fetch from "node-fetch";
import {
  fetchCharacterInfo,
  searchCharacter,
  convertRace,
  convertClan,
} from "../../discordkit/utils/lodestone-utils";
import {
  JobData,
  ClassJob,
  Experience,
  ClassJobLevel,
  ClassLevel,
  Race,
  Clan,
  CharacterInfo,
  JobIconMapping,
} from "../typedefinitions/lodestonetypes";

export default class extends defineCommand({
  name: "lodestone",
  description: "Get FFXIV character information from Lodestone",
  usage: "<server> <character name> or <lodestone id>",
  category: "information",
  slashCommand: true,
  options: [
    {
      type: 3,
      name: "character",
      description: "The character name or Lodestone ID",
      required: true,
    },
    {
      type: 3,
      name: "server",
      description: "The server name",
      required: false,
    },
  ],
}) {
  static async execute(
    harmonix: Harmonix,
    interaction: CommandInteraction | Message<TextableChannel>,
    args: { server?: string; character: string },
  ) {
    if (harmonix.options.debug) {
      console.debug("[Lodestone] Debug: Starting execution");
      console.debug(
        "[Lodestone] Debug: Interaction type:",
        interaction.constructor.name,
      );
    }

    let character: string | undefined;
    let server: string | undefined;

    if (interaction instanceof CommandInteraction) {
      const characterOption = interaction.data.options?.find(
        (opt) => opt.name === "character",
      );
      const serverOption = interaction.data.options?.find(
        (opt) => opt.name === "server",
      );
      character =
        characterOption && "value" in characterOption
          ? (characterOption.value as string)
          : undefined;
      server =
        serverOption && "value" in serverOption
          ? (serverOption.value as string)
          : undefined;
    } else {
      // Handle regular message command if needed
      server = args.server;
      character = args.character;
    }

    if (harmonix.options.debug) {
      console.debug("[Lodestone] Debug: Character:", character);
      console.debug("[Lodestone] Debug: Server:", server);
    }

    let characterId: string | null = null;
    let emoji;

    if (character && /^\d+$/.test(character)) {
      characterId = character;
      if (harmonix.options.debug) {
        console.debug(
          "[Lodestone] Debug: Character ID provided directly:",
          characterId,
        );
      }
    } else if (character && server) {
      if (harmonix.options.debug) {
        console.debug(
          "[Lodestone] Debug: Searching for character:",
          character,
          "on server:",
          server,
        );
      }
      characterId = await searchCharacter(server, character);
    }

    if (!characterId) {
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Character not found");
      }
      await this.sendErrorMessage(
        harmonix,
        interaction,
        "Character not found. Please check the server name and character name, or provide a valid Lodestone ID.",
      );
      return;
    }

    if (harmonix.options.debug) {
      console.debug("[Lodestone] Debug: Starting execution");
    }

    if (interaction instanceof CommandInteraction) {
      await interaction.defer();
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Interaction deferred");
      }
    }

    try {
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Creating please wait embed");
      }
      const pleaseWaitEmbed = {
        title: "Please wait",
        description: "Fetching character information...",
        color: 0xffff00,
        footer: {
          text: "FFXIV Lodestone",
        },
      };

      let responseMessage;
      if (interaction instanceof CommandInteraction) {
        responseMessage = await interaction.createFollowup({
          embeds: [pleaseWaitEmbed],
        });
      } else {
        responseMessage = await harmonix.client.createMessage(
          interaction.channel.id,
          { embed: pleaseWaitEmbed },
        );
      }
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Please wait message sent");
      }

      const startTime = Date.now();
      if (harmonix.options.debug) {
        console.debug(
          "[Lodestone] Debug: Fetching character info for ID:",
          characterId,
        );
      }
      const info = await fetchCharacterInfo(characterId);
      const fetchTime = (Date.now() - startTime) / 1000;
      if (harmonix.options.debug) {
        console.debug(
          "[Lodestone] Debug: Character info fetched in",
          fetchTime,
          "seconds",
        );
      }

      if (info.jobIconUrl && info.jobIconUrl.trim() !== "") {
        if (harmonix.options.debug) {
          console.debug(
            "[Lodestone] Debug: Fetching job icon from URL:",
            info.jobIconUrl,
          );
        }
        const imageResponse = await fetch(info.jobIconUrl);
        const imageBuffer = await imageResponse.buffer();
        const base64Image = imageBuffer.toString("base64");

        if ("guild" in interaction.channel) {
          if (harmonix.options.debug) {
            console.debug(
              "[Lodestone] Debug: Attempting to create emoji for job:",
              info.jobName,
            );
          }
          try {
            const jobNameForEmoji =
              info.classLevels[info.activeClassJob]?.jobname || info.jobName;
            if (harmonix.options.debug) {
              console.debug(
                "[Lodestone] Debug: Job name for emoji:",
                jobNameForEmoji,
              );
            }

            emoji = await interaction.channel.guild.createEmoji({
              name: `job_${jobNameForEmoji.toLowerCase().replace(/\s+/g, "_")}`,
              image: `data:image/png;base64,${base64Image}`,
            });
            if (harmonix.options.debug) {
              console.debug(
                "[Lodestone] Debug: Emoji created successfully. Emoji ID:",
                emoji.id,
              );
            }
          } catch (error) {
            if (
              error.message.includes("Invalid Form Body") &&
              error.message.includes("image: Invalid image data")
            ) {
              if (harmonix.options.debug) {
                console.debug(
                  "[Lodestone] Debug: Skipping emoji creation due to invalid image data",
                );
              }
            } else {
              console.error(
                "[Lodestone] Error: Failed to create emoji:",
                error.message,
              );
            }
          }
        } else {
          if (harmonix.options.debug) {
            console.debug(
              "[Lodestone] Debug: Channel does not have a guild, skipping emoji creation",
            );
          }
        }
      } else {
        if (harmonix.options.debug) {
          console.debug(
            "[Lodestone] Debug: No active class job found, skipping emoji creation",
          );
        }
      }

      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Creating main embed");
      }
      const mainEmbed = this.createMainEmbed(
        info,
        characterId,
        emoji,
        fetchTime,
      );
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Creating class level embed");
      }
      const classLevelEmbed = this.createClassLevelEmbed(info);

      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Sending final response");
      }
      if (interaction instanceof CommandInteraction) {
        await interaction.editMessage(responseMessage.id, {
          embeds: [mainEmbed, classLevelEmbed],
        });
      } else {
        await harmonix.client.editMessage(
          interaction.channel.id,
          responseMessage.id,
          { embeds: [mainEmbed, classLevelEmbed] },
        );
      }
      if (harmonix.options.debug) {
        console.debug("[Lodestone] Debug: Final response sent");
      }
    } catch (error) {
      console.error("[Lodestone] Error: Error fetching character info:", error);
      await this.sendErrorMessage(
        harmonix,
        interaction,
        "An error occurred while fetching character information. Please try again later.",
      );
    }
  }

  static createMainEmbed(
    info: CharacterInfo,
    characterId: string,
    emoji: any,
    fetchTime: number,
  ) {
    return {
      title: `${info.name} - ${info.server}`,
      description: info.title || "No title",
      url: `https://na.finalfantasyxiv.com/lodestone/character/${characterId}/`,
      thumbnail: { url: info.avatar },
      fields: [
        {
          name: "Race/Clan/Gender",
          value: `${convertRace(info.race)} / ${convertClan(info.clan)} / ${info.gender}`,
          inline: true,
        },
        { name: "Nameday", value: info.nameday, inline: true },
        { name: "Guardian", value: info.guardian, inline: true },
        { name: "City-state", value: info.cityState, inline: true },
        {
          name: "Grand Company",
          value: info.grandCompany
            ? typeof info.grandCompany === "string"
              ? info.grandCompany
              : `${info.grandCompany.name} - ${info.grandCompany.rank}`
            : "None",
          inline: true,
        },
        {
          name: "Free Company",
          value: info.freeCompany
            ? typeof info.freeCompany === "string"
              ? info.freeCompany
              : `${info.freeCompany.name} (${info.freeCompany.id})`
            : "None",
          inline: true,
        },
        {
          name: "Active Class/Job",
          value: emoji
            ? `<:${emoji.name}:${emoji.id}> ${info.activeClassJob} (Level ${info.activeClassJobLevel})`
            : `${info.activeClassJob} (Level ${info.activeClassJobLevel})`,
          inline: true,
        },
        {
          name: "Guardian Deity",
          value:
            typeof info.guardianDeity === "string"
              ? info.guardianDeity
              : info.guardianDeity.name,
          inline: true,
        },
        {
          name: "PvP Team",
          value: info.pvpTeam
            ? typeof info.pvpTeam === "string"
              ? info.pvpTeam
              : info.pvpTeam.name
            : "None",
          inline: true,
        },
        { name: "Bio", value: info.bio || "No bio available", inline: false },
      ],
      image: { url: info.portrait },
      color: Math.floor(Math.random() * 0xffffff),
      timestamp: new Date().toISOString(),
      footer: {
        text: `FFXIV Lodestone | Fetch time: ${fetchTime.toFixed(2)}s`,
      },
    };
  }

  static createClassLevelEmbed(info: CharacterInfo) {
    const classLevelEmbed: {
      title: string;
      fields: { name: string; value: string; inline?: boolean }[];
      color: number;
      timestamp: string;
      footer: { text: string };
    } = {
      title: `${info.name} - Class Levels`,
      fields: [],
      color: Math.floor(Math.random() * 0xffffff),
      timestamp: new Date().toISOString(),
      footer: {
        text: "FFXIV Lodestone - Class Levels",
      },
    };

    const categories = [
      "TANK",
      "HEALER",
      "MELEE_DPS",
      "PHYSICAL_RANGED_DPS",
      "MAGICAL_RANGED_DPS",
      "DISCIPLE_OF_THE_HAND",
      "DISCIPLE_OF_THE_LAND",
      "SPECIAL",
    ];

    let foundAnyJobs = false;
    for (const category of categories) {
      console.debug(`Processing category: ${category}`);
      const categoryJobs = Object.entries(info.classLevels)
        .filter(([, data]) => (data as ClassJobLevel).categoryname === category)
        .sort(
          ([, a], [, b]) =>
            Number((b as ClassJobLevel).level) -
            Number((a as ClassJobLevel).level),
        );

      if (categoryJobs.length > 0) {
        foundAnyJobs = true;
        console.debug(
          `Found ${categoryJobs.length} jobs for category: ${category}`,
        );
        classLevelEmbed.fields.push({
          name: category.replace(/_/g, " "),
          value: categoryJobs
            .map(([, data]) => {
              console.debug(
                `Processing job: ${(data as ClassJobLevel).jobname}`,
              );
              const levelDisplay =
                (data as ClassJobLevel).level === "Class not unlocked"
                  ? "Class not unlocked"
                  : `Level ${(data as ClassJobLevel).level}`;
              return `${(data as ClassJobLevel).jobname}: ${levelDisplay}`;
            })
            .join("\n"),
          inline: false,
        });
      } else {
        console.debug(`No jobs found for category: ${category}`);
      }
    }

    if (!foundAnyJobs) {
      console.debug(
        "No jobs found in any category. Outputting raw class level data.",
      );
      classLevelEmbed.fields.push({
        name: "Class Levels",
        value: Object.entries(info.classLevels)
          .map(([key, data]) => {
            if (typeof data === "object" && data !== null && "level" in data) {
              return `${key}: Level ${data.level}`;
            }
            return `${key}: Unknown`;
          })
          .join("\n"),
        inline: false,
      });
    }

    if (info.bozja && info.bozja.level) {
      classLevelEmbed.fields.push({
        name: "Bozjan Southern Front",
        value: `Resistance Rank: ${info.bozja.level}`,
        inline: false,
      });
    }

    if (info.eureka && info.eureka.level) {
      classLevelEmbed.fields.push({
        name: "Eureka",
        value: `Elemental Level: ${info.eureka.level}`,
        inline: false,
      });
    }

    return classLevelEmbed;
  }

  static async sendErrorMessage(
    harmonix: Harmonix,
    interaction: CommandInteraction | Message<TextableChannel>,
    message: string,
  ) {
    if (harmonix.options.debug) {
      console.debug("[Lodestone] Debug: Sending error message:", message);
    }
    if (interaction instanceof CommandInteraction) {
      await interaction.createMessage({ content: message, flags: 64 });
    } else {
      await harmonix.client.createMessage(interaction.channel.id, message);
    }
  }
}
