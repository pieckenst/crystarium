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

1. Install Bun:

   For macOS and Linux:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
   For Windows: 
   ```
   powershell -c "irm bun.sh/install.ps1|iex"
   ```
   Note: Bun requires a minimum of Windows 10 version 1809.

2. Verify the installation:
   ```bash
   bun --version
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/pieckenst/terra.git
   cd terra
   ```
4. Install dependencies:
   ```bash
   bun install
   ```
5. Set up your environment variables in a .env file:
   ```
   token=YOUR_DISCORD_BOT_TOKEN
   ```
6.  Create a config.json file in the root directory with the following structure: 
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
Terra uses a flexible command structure defined in discordkit/utils/command.ts. 
The command.ts file in the Terra project provides a robust and flexible structure for defining commands, which is essential for several reasons:

Slash Command Support: Regular Eris has limited support for slash commands. By using the command.ts structure, Terra seamlessly integrates slash command functionality, allowing developers to create both traditional and slash commands with ease.

Cleaner and More Readable Structure: The class-based approach with static members offers a clear and organized way to define commands. It separates configuration from execution logic, making the code more maintainable and easier to understand at a glance.

Consistent Error Handling: The command structure incorporates built-in error handling, ensuring that all commands have a standardized way of dealing with exceptions. This consistency improves the overall reliability of the bot.

Type Safety: By leveraging TypeScript's type system, the command structure provides better type checking and autocompletion, reducing the likelihood of runtime errors.

Extensibility: The class-based approach allows for easy extension and modification of command behavior through inheritance if needed.

Precondition and Permission Handling: The structure includes built-in support for command permissions and owner-only restrictions, simplifying the implementation of access control.

Unified Interface: By using a consistent structure for all commands, it becomes easier to implement features like command help generation or command management systems.

Hot Reloading Support: The structure is designed to work well with hot reloading, facilitating easier development and testing of commands.

Using this command structure results in a more stable, maintainable, and feature-rich codebase for Terra, addressing the limitations of vanilla TypeScript structures when working with Eris and slash commands.
Here's how to create a command:
```
import { defineCommand } from '../../discordkit/utils/command';

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

```   
This structure allows for easy creation of both regular and slash commands, with built-in permission checks and owner-only restrictions.


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
