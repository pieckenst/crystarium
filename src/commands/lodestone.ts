import { Message, TextableChannel } from 'eris';
import { Harmonix } from '../core';
import axios from 'axios';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

import { JobData, ClassJob, Experience, ClassJobLevel, ClassLevel, Race, Clan, CharacterInfo, JobIconMapping } from '../typedefinitions/lodestonetypes';

import {
    getJobNameFromIcon,
    parseRaceAndClan,
    scrapeCharacterClassJob,
    getLodestoneCharacterClassJob,
    fetchCharacterInfo,
    searchCharacter,
    convertRace,
    convertClan
} from '../code-utils/lodestone-utils';

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

              // Create and send the "Please wait" embed
              const pleaseWaitEmbed = {
                  title: 'Please wait',
                  description: 'Fetching character information...',
                  color: 0xFFFF00,
                  footer: {
                      text: 'FFXIV Lodestone'
                  }
              };
              const waitMessage = await harmonix.client.createMessage(msg.channel.id, { embed: pleaseWaitEmbed });

              const startTime = Date.now();
              const info = await fetchCharacterInfo(characterId);
              const endTime = Date.now();
              const fetchTime = (endTime - startTime) / 1000; // Convert to seconds

              console.log('Character info fetched successfully');
              console.log(`job icon URL: ${info.jobIconUrl}`);

              // Fetch the image data using node-fetch
              if (info.jobIconUrl && info.jobIconUrl.trim() !== '') {
                  console.log(`Fetching job icon from URL: ${info.jobIconUrl}`);
                  const imageResponse = await fetch(info.jobIconUrl);
                  const imageBuffer = await imageResponse.buffer();
                  const base64Image = imageBuffer.toString('base64');
                  
                  // Create emoji from jobIcon
                if ('guild' in msg.channel) {
                    console.log(`Attempting to create emoji for job: ${info.jobName}`);
                    try {
                        const jobNameForEmoji = info.classLevels[info.activeClassJob]?.jobname || info.jobName; 
                        console.log(`Attempting to get jobname : ${jobNameForEmoji}`);

                        emoji = await msg.channel.guild.createEmoji({
                            name: `job_${jobNameForEmoji.toLowerCase().replace(/\s+/g, '_')}`,
                            image: `data:image/png;base64,${base64Image}` 
                        });
                        console.log(`Emoji created successfully. Emoji ID: ${emoji.id}`);
                    } catch (error) {
                          if (error.message.includes('Invalid Form Body') && error.message.includes('image: Invalid image data')) {
                              console.log('Skipping emoji creation due to invalid image data');
                          } else {
                              console.error(`Failed to create emoji: ${error.message}`);
                          }
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
                      { name: 'Race/Clan/Gender', value: `${convertRace(info.race)} / ${convertClan(info.clan)} / ${info.gender}`, inline: true },
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
                      text: `FFXIV Lodestone | Fetch time: ${fetchTime.toFixed(2)}s`
                  },
              };

              if (info.bozja && info.bozja.level) {
                  mainEmbed.fields.push({ name: 'Bozja', value: `${info.bozja.name} (Level ${info.bozja.level}, Mettle: ${info.bozja.mettle})`, inline: true });
              }

              if (info.eureka && info.eureka.level) {
                  mainEmbed.fields.push({ name: 'Eureka', value: `${info.eureka.name} (Level ${info.eureka.level}, EXP: ${info.eureka.exp})`, inline: true });
              }

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
            
            const categories = ['TANK', 'HEALER', 'MELEE_DPS', 'PHYSICAL_RANGED_DPS', 'MAGICAL_RANGED_DPS', 'DISCIPLE_OF_THE_HAND', 'DISCIPLE_OF_THE_LAND', 'SPECIAL'];

            let foundAnyJobs = false;
            for (const category of categories) {
                console.debug(`Processing category: ${category}`);
                const categoryJobs = Object.entries(info.classLevels)
                    .filter(([, data]) => data.categoryname === category)
                    .sort(([, a], [, b]) => Number(b.level) - Number(a.level));

                if (categoryJobs.length > 0) {
                foundAnyJobs = true;
                console.debug(`Found ${categoryJobs.length} jobs for category: ${category}`);
                    classLevelEmbed.fields.push({
                        name: category.replace(/_/g, ' '),
                        value: categoryJobs.map(([, data]) => {
                            console.debug(`Processing job: ${data.jobname}`);
                            const levelDisplay = data.level === 'Class not unlocked' ? 'Class not unlocked' : `Level ${data.level}`;
                            return `${data.jobname}: ${levelDisplay}`;
                        }).join('\n'),
                        inline: false
                    });
                } else {
                    console.debug(`No jobs found for category: ${category}`);
                }
            }
            
            if (!foundAnyJobs) {
                console.debug('No jobs found in any category. Outputting raw class level data.');
                classLevelEmbed.fields.push({
                    name: 'Class Levels',
                    value: Object.entries(info.classLevels)
                        .map(([key, data]) => {
                            if (typeof data === 'object' && data !== null && 'level' in data) {
                                return `${key}: Level ${data.level}`;
                            }
                            return `${key}: Unknown`;
                        })
                        .join('\n'),
                    inline: false
                });
            }
            
            // Add Bozjan Southern Front information
            if (info.bozja && info.bozja.level) {
                classLevelEmbed.fields.push({
                    name: 'Bozjan Southern Front',
                    value: `Resistance Rank: ${info.bozja.level}`,
                    inline: false
                });
            }
            
            // Add Eureka information if available
            if (info.eureka && info.eureka.level) {
                classLevelEmbed.fields.push({
                    name: 'Eureka',
                    value: `Elemental Level: ${info.eureka.level}`,
                    inline: false
                });
            }
            
            // Wait for 2 seconds before editing the message
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Edit the original "Please wait" message with the fetched data
            await harmonix.client.editMessage(msg.channel.id, waitMessage.id, { embed: mainEmbed });

            // Send the class level embed as a new message
            await harmonix.client.createMessage(msg.channel.id, { embed: classLevelEmbed });
          } catch (error) {
              console.error('Error fetching character info:', error);
              await harmonix.client.createMessage(msg.channel.id, 'An error occurred while fetching character information. Please try again later.');
          }
      },
    };
      


