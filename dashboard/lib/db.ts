import 'server-only';

export async function getServers(
  search: string,
  offset: number
): Promise<{
  servers: Array<{ id: string; name: string; memberCount: number }>;
  newOffset: number | null;
  totalServers: number;
}> {
  const response = await fetch(`/api/servers?q=${search}&offset=${offset}`);
  if (!response.ok) {
    throw new Error('Failed to fetch servers');
  }
  const data = await response.json();
  return {
    servers: data.servers,
    newOffset: data.newOffset,
    totalServers: data.totalServers
  };
}

export async function getServerFeatureFlags() {
  const response = await fetch('/api/featureflags');
  if (!response.ok) {
    throw new Error('Failed to fetch feature flags');
  }
  return response.json();
}

export async function updateServerFeatureFlags(serverId: string, featureFlags: any) {
  // This function is not implemented in the API yet.
  // You would need to add a new API route to handle this.
  console.warn('updateServerFeatureFlags is not implemented in the API');
  return featureFlags;
}

export async function getCommands() {
  const response = await fetch('/api/commands');
  if (!response.ok) {
    throw new Error('Failed to fetch commands');
  }
  return response.json();
}
