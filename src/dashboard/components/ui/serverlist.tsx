import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import { Harmonix } from '../../../typedefinitions/harmonixtypes';
import { Guild } from 'eris';
const ServerList = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<"ul"> & {
    servers: Guild[];
    onServerSelect: (serverId: string) => void;
    offset: number;
    totalServers: number;
  }
>(({ className, servers, onServerSelect, offset, totalServers, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
    {...props}
  >
    {servers.map((server) => (
      <ServerItem key={server.id} server={server} onSelect={() => onServerSelect(server.id)} />
    ))}
  </ul>
))

ServerList.displayName = "ServerList"

const ServerItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li"> & {
    server: Guild;
    onSelect: (serverId: string) => void;
  }
>(({ className, server, onSelect, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props}>
    <Card>
      <CardHeader>
        <CardTitle>{server.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Members: {server.memberCount}</p>
        <Button onClick={() => onSelect(server.id)} className="mt-2">
          Manage
        </Button>
      </CardContent>
    </Card>
  </li>
))
ServerItem.displayName = "ServerItem"

export { ServerList, ServerItem }