import { FeatureFlags } from '../../typedefinitions/harmonixtypes';

export async function getServerList(search: string = '', offset: number = 0): Promise<{
  servers: Array<{ id: string; name: string; memberCount: number }>;
  newOffset: number | null;
  totalServers: number;
}> {
  const response = await fetch(`/api/servers?q=${search}&offset=${offset}`);
  if (!response.ok) {
    throw new Error('Failed to fetch servers');
  }
  return response.json();
}

export async function getServerDetails(serverId: string): Promise<{ id: string; name: string; memberCount: number } | null> {
  const response = await fetch(`/api/servers/${serverId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch server details');
  }
  return response.json();
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const response = await fetch('/api/featureflags');
  if (!response.ok) {
    throw new Error('Failed to fetch feature flags');
  }
  return response.json();
}

interface ServerListProps {
  servers: Array<{ id: string; name: string; memberCount: number }>;
  onServerSelect: (serverId: string) => void;
  offset: number;
  totalServers: number;
  featureFlags: FeatureFlags;
  onLoadMore: () => void;
}