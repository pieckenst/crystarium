[![Harmonix placeholder banner](./.github/assets/banner.svg)](https://github.com/pieckenst/terra)

[![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)](https://forthebadge.com)
[![GitHub last commit](https://img.shields.io/github/last-commit/pieckenst/terra?style=for-the-badge)](https://github.com/pieckenst/terra/commits/indev)
[![GitHub last commit (branch)](https://img.shields.io/github/last-commit/pieckenst/terra/release?color=ff4500&label=RELEASE%3ALAST%20COMMIT&style=for-the-badge)](https://github.com/pieckenst/terra/commits/release)
[![GitHub](https://img.shields.io/github/license/pieckenst/terra?style=for-the-badge)](https://github.com/pieckenst/terra/blob/indev/LICENSE)
[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)

<h6 align="center"> This bot is a work in progress project</h6>

## Features

- **Music**: Play and manage music in your Discord server using Erela.js.
- **Moderation**: Tools for server moderation.
- **Information Commands**: Access various information commands, including FFXIV Lodestone character data.
- **Logging**: Centralized logging system for better debugging and monitoring.

# Terra

Terra is a Discord bot written in TypeScript using the Eris library for Discord bot functionality. It features a modular command system, event handling, and integration with external APIs like FFXIV Lodestone.

## Tech Stack

- **Server:** Node.js, Bun, Eris
- **Music:** Erela.js with Spotify integration
- **Logging:** Consola
- **Error Handling:** Effect

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pieckenst/terra.git
   cd terra
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up your environment variables in a .env file:
   ```
   token=YOUR_DISCORD_BOT_TOKEN
   ```
4.  Create a config.json file in the root directory with the following structure: 
  ```json
   {
   "prefix": "!",
   "dirs": {
    "commands": "./commands",
    "events": "./events"
   },
   "debug": true,
   "clientID": "YOUR_SPOTIFY_CLIENT_ID",
   "clientSecret": "YOUR_SPOTIFY_CLIENT_SECRET",
   "host": "localhost",
   "port": 2333,
   "password": "youshallnotpass"
   }
  ```



## Hosting
We recommend using bun package manager to launch this typescript project
To start the bot, run:
```bash
bun run core.ts
```

**Command examples:**
- `!lodestone Cerberus Zenos yae Galvus`: This command fetches FFXIV character information from Lodestone..
- `!ban [user]`: Bans a user from the server.

## Code Structure
The core file initializes the bot and sets up command and event handling:
```
async function main() {
  const harmonix = await initHarmonix();
  await loadCommands(harmonix);
  await loadEvents(harmonix);
  // ... (event listeners and error handling)
}
```   

## Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Submit a pull request describing your changes.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`token` - Your Discord bot token



## Feedback

If you have any feedback, please reach out in the discord server https://discord.com/invite/XjKfPTa5Kq
