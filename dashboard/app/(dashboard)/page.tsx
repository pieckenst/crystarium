'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerList } from '@/components/ui/serverlist';
import { useState, useEffect } from 'react';


export default function ServerSelectionPage() {
  const [servers, setServers] = useState([]);
  const [newOffset, setNewOffset] = useState(0);
  const [totalServers, setTotalServers] = useState(0);

  const [featureFlags, setFeatureFlags] = useState<{
    disabledCommands?: string[];
    betaCommands?: string[];
    useDatabase?: "sqlite" | "postgres" | "none";
  }>({});
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState('0');

  const [apiBaseUrl, setApiBaseUrl] = useState('');

  useEffect(() => {
    setApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`);
  }, []);

  useEffect(() => {
    if (apiBaseUrl) {
      fetchServers();
      fetchFeatureFlags();
    }
  }, [search, offset, apiBaseUrl]);

  const fetchServers = async () => {
    const apiUrl = new URL('/api/servers', apiBaseUrl);
    apiUrl.searchParams.append('q', search);
    apiUrl.searchParams.append('offset', offset);
    
    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    setServers(data.servers);
    setNewOffset(data.newOffset);
    setTotalServers(data.totalServers);
  };

  const fetchFeatureFlags = async () => {
    const featureFlagsUrl = new URL('/api/featureflags', apiBaseUrl);
    const featureFlagsResponse = await fetch(featureFlagsUrl.toString());
    const flags = await featureFlagsResponse.json();
    setFeatureFlags(flags);
  };

  const handleServerSelect = (serverId: string) => {
    console.log(`Selected server: ${serverId}`);
  };

  const handleRefresh = async () => {
    console.log('Refreshing servers...');
    await fetchServers();
  };

  return (
    <div className="bg-background text-foreground dark:bg-background dark:text-foreground">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Servers</TabsTrigger>
            <TabsTrigger value="managed">Managed Servers</TabsTrigger>
            <TabsTrigger value="unmanaged">Unmanaged Servers</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleRefresh}>
              <Server className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Refresh Servers
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <ServerList
            servers={servers}
            offset={Number(newOffset) ?? 0}
            totalServers={totalServers}
            onServerSelect={handleServerSelect}
            onLoadMore={fetchServers}
            featureFlags={{
              disabledCommands: featureFlags.disabledCommands || [],
              betaCommands: featureFlags.betaCommands || [],
              useDatabase: featureFlags.useDatabase || "none"
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}