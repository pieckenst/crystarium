  import { Message, TextableChannel } from 'eris';
  import { Harmonix } from '../core';
  import fetch from 'node-fetch';
  import cheerio from 'cheerio';

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
      classLevels: Record<string, { level: string; icon: string }>;
  }

  async function fetchCharacterInfo(id: string): Promise<CharacterInfo> {
      const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/`;
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const name = $('.frame__chara__name').text().trim();
      const server = $('.frame__chara__world').text().trim();
      const title = $('.frame__chara__title').text().trim() || undefined;
      const [race, clan, gender] = $('.character-block__name').first().text().trim().split(' / ');
      const jobLevelElement = $('.character__class__data p:first-child');
      const level = jobLevelElement.text().trim();
      const jobName = jobLevelElement.prev().text().trim();
      const jobIcon = jobLevelElement.prev().find('img').attr('src') || '';
      const portrait = $('.frame__chara__face img').attr('src') || '';

      const nameday = $('.character-block__birth').text().trim();
      const guardian = $('.character-block__guardian').text().trim();
      const cityState = $('.character-block__name:contains("City-state")').next().text().trim();

      const grandCompanyElement = $('.character-block__name:contains("Grand Company")');
      const grandCompany = grandCompanyElement.length
          ? {
                name: grandCompanyElement.next().text().trim().split('/')[0].trim(),
                rank: grandCompanyElement.next().text().trim().split('/')[1].trim(),
            }
          : undefined;

      const freeCompanyElement = $('.character__freecompany__name h4 a');
      const freeCompany = freeCompanyElement.length
          ? {
                name: freeCompanyElement.text().trim(),
                id: freeCompanyElement.attr('href')?.split('/')[3] || '',
            }
          : undefined;

      const classLevels: Record<string, { level: string; icon: string }> = {};
      $('.character__level__list li').each((_, el) => {
          const className = $(el).find('.character__class__data').text().trim();
          const classLevel = $(el).find('.character__class__data strong').text().trim();
          const classIcon = $(el).find('img').attr('src') || '';
          classLevels[className] = { level: classLevel, icon: classIcon };
      });

      const linkshells: string[] = [];
      const crossWorldLinkshells: string[] = [];

      return {
          name,
          server,
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
      };
  }

  async function searchCharacter(server: string, name: string): Promise<string | null> {
      const url = `https://na.finalfantasyxiv.com/lodestone/character/?q=${encodeURIComponent(name)}&worldname=${encodeURIComponent(server)}`;
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const characterLink = $('.entry__link').first().attr('href');
      if (characterLink) {
          const idMatch = characterLink.match(/(\d+)/);
          return idMatch ? idMatch[1] : null;
      }
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

          if (args.length === 1 && /^\d+$/.test(args[0])) {
              characterId = args[0];
          } else if (args.length >= 2) {
              const server = args[0];
              const name = args.slice(1).join(' ');
              characterId = await searchCharacter(server, name);
          }

          if (!characterId) {
              await harmonix.client.createMessage(msg.channel.id, 'Character not found. Please check the server name and character name, or provide a valid Lodestone ID.');
              return;
          }

          try {
              const info = await fetchCharacterInfo(characterId);
              const embed = {
                  title: `${info.name} - ${info.server}`,
                  description: info.title,
                  url: `https://na.finalfantasyxiv.com/lodestone/character/${characterId}/`,
                  thumbnail: { url: info.portrait },
                  fields: [
                      { name: 'Race/Clan/Gender', value: `${info.race} / ${info.clan} / ${info.gender}`, inline: true },
                      { name: 'Nameday', value: info.nameday, inline: true },
                      { name: 'Guardian', value: info.guardian, inline: true },
                      { name: 'City-state', value: info.cityState, inline: true },
                      { name: 'Grand Company', value: info.grandCompany ? `${info.grandCompany.name} / ${info.grandCompany.rank}` : 'None', inline: true },
                      { name: 'Free Company', value: info.freeCompany ? `${info.freeCompany.name} (${info.freeCompany.id})` : 'None', inline: true },
                      { name: 'Linkshell(s)', value: info.linkshells.join(', ') || 'None', inline: false },
                      { name: 'Cross-world Linkshells', value: info.crossWorldLinkshells.join(', ') || 'None', inline: false },
                      ...Object.entries(info.classLevels).map(([job, data]) => ({
                          name: job,
                          value: `Level ${data.level}`,
                          inline: true
                      }))
                  ],
                  color: Math.floor(Math.random() * 0xFFFFFF),
                  timestamp: new Date(),
                  footer: {
                      text: 'FFXIV Lodestone'
                  },
              };

              await harmonix.client.createMessage(msg.channel.id, { embed });
          } catch (error) {
              console.error('Error fetching character info:', error);
              await harmonix.client.createMessage(msg.channel.id, 'An error occurred while fetching character information. Please try again later.');
          }
      },
  };