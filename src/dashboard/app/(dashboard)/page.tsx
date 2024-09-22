import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServerList } from '@/lib/serverlist';
import { ServerList } from '@/components/ui/serverlist';

import { getServers } from '@/lib/db';

export default async function ServerSelectionPage({
  searchParams
}: {
  searchParams: { q: string; offset: string };
}) {
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;
  const { servers, newOffset, totalServers } = await getServers(
    search,
    Number(offset)
  );

  const handleServerSelect = (serverId: string) => {
    // Implement server selection logic here
    console.log(`Selected server: ${serverId}`);
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All Servers</TabsTrigger>
          <TabsTrigger value="managed">Managed Servers</TabsTrigger>
          <TabsTrigger value="unmanaged">Unmanaged Servers</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
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
          offset={newOffset ?? 0}
          totalServers={totalServers}
          onServerSelect={handleServerSelect}
        />
      </TabsContent>
    </Tabs>
  );
}