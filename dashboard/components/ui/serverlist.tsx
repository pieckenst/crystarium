import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import { FeatureFlags } from '../../../typedefinitions/harmonixtypes';

interface ServerData {
  id: string;
  name: string;
  memberCount: number;
}

const ServerList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    servers: ServerData[];
    onServerSelect: (serverId: string) => void;
    offset: number;
    totalServers: number;
    featureFlags: FeatureFlags;
    onLoadMore: () => void;
  }
>(({ className, servers, onServerSelect, offset, totalServers, featureFlags, onLoadMore, ...props }, ref) => {
  const displayedServers = servers.slice(0, 15);
  const hasMore = servers.length > 15 || offset < totalServers;

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedServers.map((server) => (
          <ServerItem 
            key={server.id} 
            server={server} 
            onSelect={() => onServerSelect(server.id)} 
            featureFlags={featureFlags}
          />
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={onLoadMore}>Load More</Button>
        </div>
      )}
    </div>
  );
})

ServerList.displayName = "ServerList"

const ServerItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li"> & {
    server: ServerData;
    onSelect: (serverId: string) => void;
    featureFlags: FeatureFlags;
  }
>(({ className, server, onSelect, featureFlags, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props}>
    <Card>
      <CardHeader>
        <CardTitle>{server.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Members: {server.memberCount}</p>
        <Button 
          onClick={() => onSelect(server.id)} 
          className="mt-2"
          disabled={featureFlags?.disabledCommands?.includes('manage_server')}
        >
          Manage
        </Button>
      </CardContent>
    </Card>
  </li>
))
ServerItem.displayName = "ServerItem"

export { ServerList, ServerItem }