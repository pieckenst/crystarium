import { JobData, ClassJob, Experience, ClassJobLevel, ClassLevel, Race, Clan, CharacterInfo, JobIconMapping } from '../typedefinitions/lodestonetypes';
import axios from 'axios';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
function getJobNameFromIcon(iconUrl: string): string {
    const jobIconMapping: JobIconMapping = {
        'HW6tKOg4SOJbL8Z20GnsAWNjjM': 'Monk',
        'A3UhbjZvDeN3tf_6nJ85VP0RY0': 'Warrior',
        // Add more mappings here as needed
    };

    const iconId = iconUrl.split('/').pop()?.split('.')[0];
    return jobIconMapping[iconId || ''] || 'Unknown';
}

function parseRaceAndClan($: cheerio.CheerioAPI): { race: Race, clan: Clan } {
  const charBlock = $('.character-block__name').first();
  const [raceStr, clanAndGender] = charBlock.html()?.split('<br>') ?? [];
  const [clanStr] = clanAndGender?.split(' / ') ?? [];

  let race: Race;
  let clan: Clan;

  switch (raceStr?.trim().toLowerCase()) {
      case 'hyur':
          race = Race.Hyur;
          clan = clanStr.toLowerCase() === 'midlander' ? Clan.Midlander : Clan.Highlander;
          break;
      case 'elezen':
          race = Race.Elezen;
          clan = clanStr.toLowerCase() === 'wildwood' ? Clan.Wildwood : Clan.Duskwight;
          break;
      case 'lalafell':
          race = Race.Lalafell;
          clan = clanStr.toLowerCase() === 'plainsfolk' ? Clan.Plainsfolk : Clan.Dunesfolk;
          break;
      case 'miqo\'te':
          race = Race.Miqote;
          clan = clanStr.toLowerCase() === 'seeker of the sun' ? Clan.SeekerOfTheSun : Clan.KeeperOfTheMoon;
          break;
      case 'roegadyn':
          race = Race.Roegadyn;
          clan = clanStr.toLowerCase() === 'sea wolf' ? Clan.SeaWolf : Clan.Hellsguard;
          break;
      case 'au ra':
          race = Race.AuRa;
          clan = clanStr.toLowerCase() === 'raen' ? Clan.Raen : Clan.Xaela;
          break;
      case 'viera':
          race = Race.Viera;
          clan = clanStr.toLowerCase() === 'rava' ? Clan.Rava : Clan.Veena;
          break;
      case 'hrothgar':
          race = Race.Hrothgar;
          clan = clanStr.toLowerCase() === 'helion' ? Clan.Helion : Clan.Lost;
          break;
      default:
          throw new Error(`Unknown race: ${raceStr}`);
  }

  return { race, clan };
}


async function scrapeCharacterClassJob(id: string): Promise<Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>>> {
  const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/class_job/`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const classLevels: Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>> = {};
  const tankJobs: JobData[] = [];
  const healerJobs: JobData[] = [];
  const meleeDpsJobs: JobData[] = [];
  const physicalRangedDpsJobs: JobData[] = [];
  const magicalRangedDpsJobs: JobData[] = [];
  const handJobs: JobData[] = [];
  const landJobs: JobData[] = [];

  $('.character__content.selected .character__job__role').each((_, roleElement) => {
      const roleName = $(roleElement).find('.heading--lead').text().trim();
      
      $(roleElement).find('.character__job li').each((_, jobElement) => {
          const jobName = $(jobElement).find('.character__job__name').text().trim();
          const level = parseInt($(jobElement).find('.character__job__level').text().trim(), 10);
          const expElement = $(jobElement).find('.character__job__exp');
          let currentExp = 0;
          let expToNextLevel = 0;
  
          if (expElement.text().trim() !== '-- / --') {
              [currentExp, expToNextLevel] = expElement.text().trim().split('/').map(exp => parseInt(exp.replace(/,/g, '').trim(), 10));
          }
  
          const jobData = {
              name: jobName,
              level,
              experience: currentExp === 0 && expToNextLevel === 0 ? null : { currentExp, expToNextLevel }
          };
  
          const physicalRangedJobs = ['Bard', 'Machinist', 'Dancer'];
          const magicalRangedJobs = ['Black Mage', 'Arcanist', 'Summoner', 'Red Mage', 'Pictomancer', 'Blue Mage'];


          if (physicalRangedJobs.includes(jobName)) {
              physicalRangedDpsJobs.push(jobData);
          } else if (magicalRangedJobs.includes(jobName)) {
              magicalRangedDpsJobs.push(jobData);
          } else {
              switch(roleName) {
                  case 'Tank':
                      tankJobs.push(jobData);
                      break;
                  case 'Healer':
                      healerJobs.push(jobData);
                      break;
                  case 'Melee DPS':
                      meleeDpsJobs.push(jobData);
                      break;
                  case 'Physical Ranged DPS':
                      physicalRangedDpsJobs.push(jobData);
                      break;
                  case 'Magical Ranged DPS':
                      magicalRangedDpsJobs.push(jobData);
                      break;
                  case 'Disciples of the Hand':
                      handJobs.push(jobData);
                      break;
                  case 'Disciples of the Land':
                      landJobs.push(jobData);
                      break;
              }
          }
      });
  });    
  const processJobs = (jobs: JobData[], rolePrefix: string, classLevels: Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>>) => {
      console.log(`\n--- ${rolePrefix} ---`);
      jobs.forEach(job => {
          const formattedJobName = job.name.toUpperCase().replace(/\s+/g, '_');
          console.log(`${formattedJobName}: Level ${job.level}`);
          
          // Convert job name to ClassJob enum
          const classJobKey = ClassJob[formattedJobName as keyof typeof ClassJob];
          
          if (classJobKey !== undefined) {
              classLevels[classJobKey] = {
                  level: job.level,
                  experience: job.experience,
                  categoryname: rolePrefix,
                  jobname: job.name
              };
          }
      });
  };
  
  // Update the function calls
  processJobs(tankJobs, 'TANK', classLevels);
  processJobs(healerJobs, 'HEALER', classLevels);
  processJobs(meleeDpsJobs, 'MELEE_DPS', classLevels);
  processJobs(physicalRangedDpsJobs, 'PHYSICAL_RANGED_DPS', classLevels);
  processJobs(magicalRangedDpsJobs, 'MAGICAL_RANGED_DPS', classLevels);
  processJobs(handJobs, 'DISCIPLE_OF_THE_HAND', classLevels);
  processJobs(landJobs, 'DISCIPLE_OF_THE_LAND', classLevels);

  console.log('\n\n--- Special Jobs ---');

  // Handle Bozjan Southern Front
  const bozjaElement = $('.character__job__list:contains("Resistance Rank")');
  if (bozjaElement.length) {
      const bozjaLevel = parseInt(bozjaElement.find('.character__job__level').text().trim(), 10);
      const bozjaExp = bozjaElement.find('.character__job__exp').text().trim().match(/Current Mettle: ([\d,]+) \/ Mettle to Next Rank: ([\d,]+)/);
      if (bozjaExp) {
          classLevels[ClassJob.BOZJAN] = {
              level: bozjaLevel,
              experience: {
                  currentExp: parseInt(bozjaExp[1].replace(/,/g, ''), 10),
                  expToNextLevel: parseInt(bozjaExp[2].replace(/,/g, ''), 10)
              },
              categoryname: 'SPECIAL',
              jobname: 'Bozjan Southern Front'
          };
          console.log(`  Bozjan Southern Front - Resistance Rank: ${bozjaLevel}, Mettle: ${bozjaExp[1]}/${bozjaExp[2]}`);
      }
  }

  // Handle Eureka
  const eurekaElement = $('.character__job__list:contains("Elemental Level")');
  if (eurekaElement.length) {
      const eurekaLevel = parseInt(eurekaElement.find('.character__job__level').text().trim(), 10);
      const eurekaExp = eurekaElement.find('.character__job__exp').text().trim().split('/').map(exp => parseInt(exp.replace(/,/g, '').trim(), 10));
      classLevels[ClassJob.EUREKA] = {
          level: eurekaLevel,
          experience: {
              currentExp: eurekaExp[0],
              expToNextLevel: eurekaExp[1]
          },
          categoryname: 'SPECIAL',
          jobname: 'Eureka'
      };
      console.log(`  Eureka - Elemental Level: ${eurekaLevel}, Exp: ${eurekaExp[0]}/${eurekaExp[1]}`);
  }

  if (Object.keys(classLevels).length === 0) {
      console.log("\n\nNo classes or jobs found for this character.");
  }

  return classLevels;
}

async function getLodestoneCharacterClassJob(id: string): Promise<Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>>> {
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
    const { race, clan } = parseRaceAndClan($);
    const gender = $('.character-block__name').first().text().trim().split(' / ')[2];
    console.log(`Race: ${Race[race]}, Clan: ${Clan[clan]}, Gender: ${gender}`);
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
    const rawClassLevels = await getLodestoneCharacterClassJob(id);
    
    const classLevels: Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>> = {};

    console.log('Fetching class/job levels');
    try {
          for (const [job, data] of Object.entries(rawClassLevels)) {
              console.log(`Processing job: ${job}`);
              console.log('Raw class levels fetched:');
              for (const [job, data] of Object.entries(rawClassLevels)) {
                  for (const [key, value] of Object.entries(data)) {
                      console.log(`  ${key}: ${value}`);
                  }
                  console.log('');
              }
              let levelValue = data.level;
              if (levelValue === 'Level NaN' || levelValue === 'NaN' || Number.isNaN(levelValue)) {
                  levelValue = 'Class not unlocked';
              }
              classLevels[job as unknown as ClassJob] = {
                  level: levelValue,
                  experience: data.experience || { currentExp: 0, expToNextLevel: 0 },
                  categoryname: data.categoryname,
                  jobname: data.jobname
              };
              console.log(`Processed job ${job}:`, JSON.stringify(classLevels[job as unknown as ClassJob]));
          }
          console.log('All class levels processed:', JSON.stringify(classLevels));
      } catch (error) {
          console.error('Error fetching or processing class/job levels:', error);
          throw error;
      }

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
}

async function searchCharacter(server: string, name: string): Promise<string | null> {      const url = `https://na.finalfantasyxiv.com/lodestone/character/?q=${encodeURIComponent(name)}&worldname=${encodeURIComponent(server)}`;
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

function convertRace(raceEnum: number): string {
    const races = ['Hyur', 'Elezen', 'Lalafell', 'Miqo\'te', 'Roegadyn', 'Au Ra', 'Hrothgar', 'Viera'];
    return races[raceEnum] || 'Unknown';
}

function convertClan(clanEnum: number): string {
    const clans = ['Midlander', 'Highlander', 'Wildwood', 'Duskwight', 'Plainsfolk', 'Dunesfolk', 'Seeker of the Sun', 'Keeper of the Moon', 'Sea Wolf', 'Hellsguard', 'Raen', 'Xaela', 'Helions', 'The Lost', 'Rava', 'Veena'];
    return clans[clanEnum] || 'Unknown';
}

export {
    getJobNameFromIcon,
    parseRaceAndClan,
    scrapeCharacterClassJob,
    getLodestoneCharacterClassJob,
    fetchCharacterInfo,
    searchCharacter,
    convertRace,
    convertClan
};