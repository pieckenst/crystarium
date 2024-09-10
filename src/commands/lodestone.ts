import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';
import axios from 'axios';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

enum ClassJob {
    GLADIATOR, PALADIN, MARAUDER, WARRIOR, DARK_KNIGHT, GUNBREAKER,
    CONJURER, WHITE_MAGE, SCHOLAR, ASTROLOGIAN, SAGE,
    PUGILIST, MONK, LANCER, DRAGOON, ROGUE, NINJA, SAMURAI, REAPER,
    ARCHER, BARD, MACHINIST, DANCER,
    THAUMATURGE, BLACK_MAGE, ARCANIST, SUMMONER, RED_MAGE, BLUE_MAGE,
    CARPENTER, BLACKSMITH, ARMORER, GOLDSMITH, LEATHERWORKER, WEAVER,
    ALCHEMIST, CULINARIAN,
    MINER, BOTANIST, FISHER
  }
  
  interface Experience {
    currentExp: number;
    expToNextLevel: number;
  }
  
  interface ClassJobLevel {
    level: number;
    experience: Experience | null;
  }
  
  interface ClassLevel {
    unlockState: ClassJob;
    level: number;
    experience: Experience | null;
  }

interface CharacterInfo {
      name: string;
      server: string;
      title?: string;
      race: string;
      clan: string;
      gender: string;
      level: string;
      jobName: string;
      jobIcon: string;
      portrait: string;
      freeCompany?: {
          name: string;
          id: string;
      };
      grandCompany?: {
          name: string;
          rank: string;
      };
      nameday: string;
      guardian: string;
      cityState: string;
      linkshells: string[];
      crossWorldLinkshells: string[];
      classLevels: Record<string, { level: string; exp: string; expMax: string }>;
      bio: string;
      activeClassJob: string;
      activeClassJobLevel: string;
      jobIconUrl: string;
      avatar: string;
      guardianDeity: {
          name: string;
          icon: string;
      };
      pvpTeam?: {
          name: string;
          id: string;
      };
      bozja?: {
          level: string;
          mettle: string;
          name: string;
      };
      eureka?: {
          level: string;
          exp: string;
          name: string;
      };
      parsedClassJobIcon: string;
}

type JobIconMapping = {
      [key: string]: string;
};

function getJobNameFromIcon(iconUrl: string): string {
      const jobIconMapping: JobIconMapping = {
          'HW6tKOg4SOJbL8Z20GnsAWNjjM': 'Monk',
          // Add more mappings here as needed
      };

      const iconId = iconUrl.split('/').pop()?.split('.')[0];
      return jobIconMapping[iconId || ''] || 'Unknown';
}

async function scrapeCharacterClassJob(id: string): Promise<Record<ClassJob, ClassJobLevel>> {
    const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/class_job/`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
  
    const classLevels: Partial<Record<ClassJob, ClassJobLevel>> = {};
  
    $('.character__job__list').each((_, element) => {
      $(element).find('li').each((_, jobElement) => {
        const jobName = $(jobElement).find('.character__job__name').text().trim();
        const level = parseInt($(jobElement).find('.character__job__level').text().trim(), 10);
        const expElement = $(jobElement).find('.character__job__exp');
        const [currentExp, expToNextLevel] = expElement.text().trim().split('/').map(exp => parseInt(exp.trim().replace(',', ''), 10));
  
        const job = ClassJob[jobName.toUpperCase().replace(' ', '_') as keyof typeof ClassJob];
        if (job !== undefined) {
          classLevels[job] = {
            level,
            experience: { currentExp, expToNextLevel }
          };
          console.log(`${jobName}: Level ${level}`);
        }
      });
    });
  
    if (Object.keys(classLevels).length === 0) {
      console.log("No classes or jobs found for this character.");
    }
  
    return classLevels as Record<ClassJob, ClassJobLevel>;
}
  
async function getLodestoneCharacterClassJob(id: string): Promise<Record<ClassJob, ClassJobLevel>> {
    try {
      return await scrapeCharacterClassJob(id);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Character with ID ${id} not found on The Lodestone.`);
      }
      throw new Error('An error occurred while fetching character information from The Lodestone.');
    }
}

async function fetchCharacterInfo(id: string): Promise<CharacterInfo> {
      const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/`;
      console.log(`Fetching character info from URL: ${url}`);
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      console.log('Parsing character name');
      const name = $('.frame__chara__name').text().trim();
      console.log(`Character name: ${name}`);

      console.log('Parsing server information');
      const server = $('.frame__chara__world').text().trim().match(/(?<World>\w*)\s+\[(?<DC>\w*)\]/)?.groups || {};
      console.log(`Server: ${JSON.stringify(server)}`);

      console.log('Parsing title');
      const title = $('.frame__chara__title').text().trim() || undefined;
      console.log(`Title: ${title}`);

      console.log('Parsing race, clan, and gender');
      const [race, clan, gender] = $('.character-block__name').first().text().trim().split(' / ');
      console.log(`Race: ${race}, Clan: ${clan}, Gender: ${gender}`);

      console.log('Parsing job and level information');
      const jobLevelElement = $('.character__class__data p:first-child');
      const level = jobLevelElement.text().trim().match(/LEVEL (?<Level>\d*)/)?.groups?.Level || '';
      const jobName = jobLevelElement.prev().text().trim();
      const jobIcon = jobLevelElement.prev().find('img').attr('src') || '';
      console.log(`Job: ${jobName}, Level: ${level}, Job Icon: ${jobIcon}`);

      console.log('Parsing portrait URL');
      const portrait = $('.js__image_popup > img:first-child').attr('src') || '';
      console.log(`Portrait URL: ${portrait}`);

      console.log('Parsing nameday');
      const nameday = $('.character-block__birth').text().trim();
      console.log(`Nameday: ${nameday}`);

      console.log('Parsing guardian');
      const guardian = $('p.character-block__name:nth-child(4)').text().trim();
      console.log(`Guardian: ${guardian}`);

      console.log('Parsing city-state');
      const cityState = $('div.character-block:nth-child(3) > div:nth-child(2) > p:nth-child(2)').text().trim();
      console.log(`City-state: ${cityState}`);

      console.log('Parsing grand company information');
      const grandCompanyElement = $('div.character-block:nth-child(4) > div:nth-child(2) > p:nth-child(2)');
      const grandCompanyMatch = grandCompanyElement.text().trim().match(/(?<Name>\S*) \/ (?<Rank>.*)/);
      const grandCompany = grandCompanyMatch ? {
          name: grandCompanyMatch.groups?.Name || '',
          rank: grandCompanyMatch.groups?.Rank || '',
      } : undefined;
      console.log(`Grand Company: ${JSON.stringify(grandCompany)}`);

      console.log('Parsing free company information');
      const freeCompanyElement = $('.character__freecompany__name > h4:nth-child(2) > a:nth-child(1)');
      const freeCompany = freeCompanyElement.length
          ? {
                name: freeCompanyElement.text().trim(),
                id: freeCompanyElement.attr('href')?.split('/')[3] || '',
            }
          : undefined;
      console.log(`Free Company: ${JSON.stringify(freeCompany)}`);

      console.log('Fetching class/job levels');
      const classJobUrl = `https://na.finalfantasyxiv.com/lodestone/character/${id}/class_job/`;
      console.log(`Fetching class/job info from URL: ${classJobUrl}`);
      const classJobResponse = await axios.get(classJobUrl);
      const classJobHtml = classJobResponse.data;
      const $classJob = cheerio.load(classJobHtml);

      console.log('Fetching class/job levels');
      const rawClassLevels = await getLodestoneCharacterClassJob(id);
      const classLevels: Record<string, { level: string; exp: string; expMax: string }> = {};
      for (const [job, data] of Object.entries(rawClassLevels)) {
        if (data.experience) {
          classLevels[job] = {
            level: data.level.toString(),
            exp: data.experience.currentExp.toString(),
            expMax: data.experience.expToNextLevel.toString()
          };
        } else {
          classLevels[job] = {
            level: data.level.toString(),
            exp: '0',
            expMax: '0'
          };
        }
      }
      console.log('Class/job levels fetched successfully');

      console.log('Parsing linkshells');
      const linkshells: string[] = [];
      console.log(`Linkshells: ${linkshells.join(', ')}`);

      console.log('Parsing cross-world linkshells');
      const crossWorldLinkshells: string[] = [];
      console.log(`Cross-world Linkshells: ${crossWorldLinkshells.join(', ')}`);

      console.log('Parsing bio');
      const bio = $('.character__selfintroduction').text().trim();
      console.log(`Bio: ${bio}`);

      const activeClassJob = $('.character__class_icon > img:first-child').attr('src') || '';
      const parsedClassJobIcon = activeClassJob.split('/').pop()?.split('.')[0] || '';

      console.log(`Active Class/Job Icon: ${activeClassJob}`);
      console.log(`Parsed Active Class/Job: ${parsedClassJobIcon}`);

      const jobIconUrl = `https://lds-img.finalfantasyxiv.com/h/K/${parsedClassJobIcon}.png`;
      console.log(`Job Icon URL: ${jobIconUrl}`);

      const activeJobName = getJobNameFromIcon(activeClassJob);
      console.log(`Job Name: ${activeJobName}`);

      console.log('Parsing active class/job level');
      const activeClassJobLevel = $('.character__class__data > p:first-child').text().trim().match(/LEVEL (?<Level>\d*)/)?.groups?.Level || '';
      console.log(`Active Class/Job Level: ${activeClassJobLevel}`);

      console.log('Parsing avatar URL');
      const avatar = $('.frame__chara__face > img:first-child').attr('src') || '';
      console.log(`Avatar URL: ${avatar}`);
      console.log('Parsing guardian deity');
      const guardianDeity = {
            name: $('p.character-block__name:nth-child(4)').text().trim(),
            icon: $('#character > div.character__content.selected > div.character__profile.clearfix > div.character__profile__data > div:nth-child(1) > div > div:nth-child(2) > img').attr('src') || '',
      };
      console.log(`Guardian Deity: ${JSON.stringify(guardianDeity)}`);

      console.log('Parsing PvP team information');
      const pvpTeamElement = $('.character__pvpteam__name > h4:nth-child(2) > a:nth-child(1)');
      const pvpTeam = pvpTeamElement.length
        ? {
                  name: pvpTeamElement.text().trim(),
                  id: pvpTeamElement.attr('href')?.split('/')[3] || '',
        }
        : undefined;
      console.log(`PvP Team: ${JSON.stringify(pvpTeam)}`);

      console.log('Parsing Bozja information');
      const bozja = {
            level: $('div.character__job__list:nth-child(7) > div:nth-child(2)').text().trim(),
            mettle: $('div.character__job__list:nth-child(7) > div:nth-child(4)').text().trim().match(/(?<Mettle>\S+) \//)?.groups?.Mettle || '',
            name: $('div.character__job__list:nth-child(7) > div:nth-child(3)').text().trim(),
      };
      console.log(`Bozja: ${JSON.stringify(bozja)}`);

      console.log('Parsing Eureka information');
      const eureka = {
            level: $('div.character__job__list:nth-child(9) > div:nth-child(2)').text().trim(),
            exp: $('div.character__job__list:nth-child(9) > div:nth-child(4)').text().trim(),
            name: $('div.character__job__list:nth-child(9) > div:nth-child(3)').text().trim(),
      };
      console.log(`Eureka: ${JSON.stringify(eureka)}`);

      return {
            name,
            server: `${server.World} [${server.DC}]`,
            title,
            race,
            clan,
            gender,
            level,
            jobName,
            jobIcon,
            portrait,
            freeCompany,
            grandCompany,
            nameday,
            guardian,
            cityState,
            classLevels,
            linkshells,
            crossWorldLinkshells,
            bio,
            activeClassJob: activeJobName,
            activeClassJobLevel,
            jobIconUrl,
            avatar,
            guardianDeity,
            pvpTeam,
            bozja,
            eureka,
            parsedClassJobIcon,
      };
}async function searchCharacter(server: string, name: string): Promise<string | null> {
      const url = `https://na.finalfantasyxiv.com/lodestone/character/?q=${encodeURIComponent(name)}&worldname=${encodeURIComponent(server)}`;
      console.log(`Searching character with URL: ${url}`);
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const characterLink = $('.entry__link').first().attr('href');
      if (characterLink) {
          const idMatch = characterLink.match(/(\d+)/);
          const characterId = idMatch ? idMatch[1] : null;
          console.log(`Found character ID: ${characterId}`);
          return characterId;
      }
      console.log('Character not found');
      return null;
  }

  export default {
      name: 'lodestone',
      description: 'Get FFXIV character information from Lodestone',
      usage: '<server> <character name> or <lodestone id>',
      category: "information",
      async execute(harmonix: Harmonix, msg: Message<TextableChannel>, args: string[]) {
          if (args.length === 0) {
              await harmonix.client.createMessage(msg.channel.id, 'Please provide a server and character name, or a Lodestone ID.');
              return;
          }

          let characterId: string | null = null;
          let emoji;

          if (args.length === 1 && /^\d+$/.test(args[0])) {
              characterId = args[0];
              console.log(`Using provided Lodestone ID: ${characterId}`);
          } else if (args.length >= 2) {
              const server = args[0];
              const name = args.slice(1).join(' ');
              console.log(`Searching for character: ${name} on server: ${server}`);
              characterId = await searchCharacter(server, name);
          }

          if (!characterId) {
              await harmonix.client.createMessage(msg.channel.id, 'Character not found. Please check the server name and character name, or provide a valid Lodestone ID.');
              return;
          }

          try {
              console.log(`Fetching character info for ID: ${characterId}`);
              const info = await fetchCharacterInfo(characterId);
              console.log('Character info fetched successfully');
              console.log(`job icon URL: ${info.jobIconUrl }`);

              // Fetch the image data using node-fetch
              if (info.jobIconUrl  && info.jobIconUrl .trim() !== '') {
                  console.log(`Fetching job icon from URL: ${info.jobIconUrl }`);
                  const imageResponse = await fetch(info.jobIconUrl );
                  const imageBuffer = await imageResponse.buffer();
                  const base64Image = imageBuffer.toString('base64');
                  
                  // Create emoji from jobIcon
                  if ('guild' in msg.channel) {
                      console.log(`Attempting to create emoji for job: ${info.jobName}`);
                      try {
                          emoji = await msg.channel.guild.createEmoji({
                              name: `job_${info.jobName.toLowerCase().replace(/\s+/g, '_')}`,
                              image: `data:image/png;base64,${base64Image}` // Use base64 data
                          });
                          console.log(`Emoji created successfully. Emoji ID: ${emoji.id}`);
                      } catch (error) {
                          console.error(`Failed to create emoji: ${error.message}`);
                      }
                  } else {
                      console.log('Channel does not have a guild, skipping emoji creation');
                  }
              } else {
                  console.log('No active class job found, skipping emoji creation');
              }

              const mainEmbed: {
                  title: string;
                  description: string;
                  url: string;
                  thumbnail: { url: string };
                  fields: { name: string; value: string; inline?: boolean }[];
                  image: { url: string };
                  color: number;
                  timestamp: string;
                  footer: { text: string };
              } = {
                  title: `${info.name} - ${info.server}`,
                  description: info.title || 'No title',
                  url: `https://na.finalfantasyxiv.com/lodestone/character/${characterId}/`,
                  thumbnail: { url: info.avatar },
                  fields: [
                      { name: 'Race/Clan/Gender', value: `${info.race} / ${info.clan} / ${info.gender}`, inline: true },
                      { name: 'Nameday', value: info.nameday, inline: true },
                      { name: 'Guardian', value: info.guardian, inline: true },
                      { name: 'City-state', value: info.cityState, inline: true },
                      { name: 'Grand Company', value: info.grandCompany ? (typeof info.grandCompany === 'string' ? info.grandCompany : `${info.grandCompany.name} - ${info.grandCompany.rank}`) : 'None', inline: true },
                      { name: 'Free Company', value: info.freeCompany ? (typeof info.freeCompany === 'string' ? info.freeCompany : `${info.freeCompany.name} (${info.freeCompany.id})`) : 'None', inline: true },
                      { name: 'Active Class/Job', value: emoji ? `<:${emoji.name}:${emoji.id}> ${info.activeClassJob} (Level ${info.activeClassJobLevel})` : `${info.activeClassJob} (Level ${info.activeClassJobLevel})`, inline: true },
                      { name: 'Guardian Deity', value: typeof info.guardianDeity === 'string' ? info.guardianDeity : info.guardianDeity.name, inline: true },
                      { name: 'PvP Team', value: info.pvpTeam ? (typeof info.pvpTeam === 'string' ? info.pvpTeam : info.pvpTeam.name) : 'None', inline: true },                    
                      { name: 'Bio', value: info.bio || 'No bio available', inline: false },
                  ],
                  image: { url: info.portrait },
                  color: Math.floor(Math.random() * 0xFFFFFF),
                  timestamp: new Date().toISOString(),
                  footer: {
                      text: 'FFXIV Lodestone'
                  },
              };

              if (info.bozja && info.bozja.level) {
                  mainEmbed.fields.push({ name: 'Bozja', value: `${info.bozja.name} (Level ${info.bozja.level}, Mettle: ${info.bozja.mettle})`, inline: true });
              }

              if (info.eureka && info.eureka.level) {
                  mainEmbed.fields.push({ name: 'Eureka', value: `${info.eureka.name} (Level ${info.eureka.level}, EXP: ${info.eureka.exp})`, inline: true });
              }

              await harmonix.client.createMessage(msg.channel.id, { embed: mainEmbed });

              // Create a separate embed for class levels
              const classLevelEmbed: {
                  title: string;
                  fields: { name: string; value: string; inline?: boolean }[];
                  color: number;
                  timestamp: string;
                  footer: { text: string };
              } = {
                  title: `${info.name} - Class Levels`,
                  fields: [],
                  color: Math.floor(Math.random() * 0xFFFFFF),
                  timestamp: new Date().toISOString(),
                  footer: {
                      text: 'FFXIV Lodestone - Class Levels'
                  },
              };
              const categories = ['Tank', 'Healer', 'Melee DPS', 'Physical Ranged DPS', 'Magical Ranged DPS', 'Disciples of the Hand', 'Disciples of the Land'];

              const characterInfo = await fetchCharacterInfo(characterId);
              const classLevels = characterInfo.classLevels;

              for (const category of categories) {
                  const categoryJobs = Object.entries(classLevels)
                      .filter(([key]) => key.startsWith(category))
                      .sort(([, a], [, b]) => Number(b.level) - Number(a.level));

                  if (categoryJobs.length > 0) {
                      classLevelEmbed.fields.push({
                          name: category,
                          value: categoryJobs.map(([key, data]) => {
                              const jobName = key.split(' - ')[1];
                              console.log(`Debug: Found class ${jobName} with level ${data.level}`);
                              return `${jobName}: ${data.level} (${data.exp}/${data.expMax})`;
                          }).join('\n'),
                          inline: false
                      });
                  }
              }

              // Send the class level embed
              await harmonix.client.createMessage(msg.channel.id, { embed: classLevelEmbed });
          } catch (error) {
              console.error('Error fetching character info:', error);
              await harmonix.client.createMessage(msg.channel.id, 'An error occurred while fetching character information. Please try again later.');
          }
      },    
    };