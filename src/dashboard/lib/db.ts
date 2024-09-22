import 'server-only';
import { Harmonix } from '../../typedefinitions/harmonixtypes';
import { Guild } from 'eris';

export async function getServers(
  search: string,
  offset: number
): Promise<{
  servers: Guild[];
  newOffset: number | null;
  totalServers: number;
}> {
  const harmonix = global.harmonix as Harmonix;
  let servers = Array.from(harmonix.client.guilds.values());

  if (search) {
    servers = servers.filter(server => 
      server.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const totalServers = servers.length;
  const paginatedServers = servers.slice(offset, offset + 5);
  const newOffset = paginatedServers.length >= 5 ? offset + 5 : null;

  return {
    servers: paginatedServers,
    newOffset,
    totalServers
  };
}

export async function getServerFeatureFlags(serverId: string) {
  const harmonix = global.harmonix as Harmonix;
  const server = harmonix.client.guilds.get(serverId);
  if (!server) {
    throw new Error('Server not found');
  }

  // Assuming feature flags are stored per server in the bot's configuration
  // You might need to adjust this based on how you're actually storing server-specific settings
  return harmonix.options.featureFlags || {
    useDiscordJS: false,
    disabledCommands: [],
    betaCommands: [],
    useDatabase: 'none'
  };
}

export async function updateServerFeatureFlags(serverId: string, featureFlags: any) {
  const harmonix = global.harmonix as Harmonix;
  const server = harmonix.client.guilds.get(serverId);
  if (!server) {
    throw new Error('Server not found');
  }

  // Update the feature flags for the specific server
  // You'll need to implement the actual storage mechanism here
  // This is just a placeholder
  console.log(`Updating feature flags for server ${serverId}:`, featureFlags);

  // Return the updated feature flags
  return featureFlags;
}

export async function getCommands() {
  const harmonix = global.harmonix as Harmonix;
  return Array.from(harmonix.commands.values()).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    category: cmd.category,
  }));
}
