[![Harmonix banner](./.github/assets/banner.svg)](https://github.com/pieckenst/terra)

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=for-the-badge" alt="Made with TypeScript"></a>
  <a href="https://github.com/pieckenst/terra/commits/indev"><img src="https://img.shields.io/github/last-commit/pieckenst/terra?style=for-the-badge&logo=github&labelColor=000000" alt="GitHub last commit"></a>
  <a href="https://github.com/pieckenst/terra/commits/release"><img src="https://img.shields.io/github/last-commit/pieckenst/terra/release?style=for-the-badge&logo=github&labelColor=000000&color=ff4500&label=Release%3A%20Last%20Commit" alt="GitHub last commit (release)"></a>
  <a href="https://github.com/pieckenst/terra/blob/indev/LICENSE"><img src="https://img.shields.io/github/license/pieckenst/terra?style=for-the-badge&logo=github&labelColor=000000" alt="License"></a>
  <a href="https://github.com/pieckenst/terra"><img src="https://img.shields.io/badge/Built%20with-Love-ff69b4?style=for-the-badge&logo=heart&labelColor=000000" alt="Built with Love"></a>
</p>

<h6 align="center"> This bot is a work in progress project</h6>

## Features

- **Music**: Play and manage music in your Discord server using Erela.js with Spotify integration.
- **Moderation**: Tools for server moderation.
- **Information Commands**: Access various information commands, including FFXIV Lodestone character data.
- **Logging**: Centralized logging system using Consola for better debugging and monitoring.
- **Error Handling**: Robust error handling using Effect.
- **Hot Reloading**: Automatic reloading of commands and events during development.

# Terra

Terra is a Discord bot written in TypeScript using the Eris library for Discord bot functionality. It features a modular command system, event handling, and integration with external APIs like FFXIV Lodestone.

## Tech Stack

- **Server:** Node.js, Bun, Eris
- **Music:** Erela.js with Spotify integration
- **Logging:** Consola
- **Error Handling:** Effect
- **File Scanning:** Globby
- **Hot Reloading:** Chokidar, perfect-debounce

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
      "password": "youshallnotpass",
      "ownerId": "YOUR_DISCORD_USER_ID"
     }
   ```



## Hosting
We recommend using bun package manager to launch this TypeScript project. To start the bot, run:
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
Terra uses a flexible command structure defined in src/code-utils/definingcommand.ts. Here's how to create a command:
```
import { defineCommand } from '../code-utils/definingcommand';

export default class extends defineCommand({
  name: "commandname",
  description: "Command description",
  usage: "commandname <arg>",
  category: "Category",
  aliases: [],
  slashCommand: true,
  options: [], // For slash command options
  permissions: ['SEND_MESSAGES'],
  ownerOnly: false,
}) {
  static async execute(harmonix, message, args) {
    // Command logic here
  }
}

This structure allows for easy creation of both regular and slash commands, with built-in permission checks and owner-only restrictions.
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
