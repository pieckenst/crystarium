import { Harmonix } from '../../typedefinitions/harmonixtypes';
import { Guild } from 'eris';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export async function getServerList(): Promise<Partial<Guild>[]> {
  const harmonix = global.harmonix as Harmonix;
  
  if (!harmonix || !harmonix.client) {
    throw new Error('Bot instance not available');
  }

  const servers = Array.from(harmonix.client.guilds.values());
  
  return servers.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL,
    memberCount: guild.memberCount
  }));
  
}
export async function getServerDetails(serverId: string): Promise<Partial<Guild> | null> {
  const harmonix = global.harmonix as Harmonix;
  
  if (!harmonix || !harmonix.client) {
    throw new Error('Bot instance not available');
  }

  const guild = harmonix.client.guilds.get(serverId);
  
  if (!guild) {
    return null;
  }

  return {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL,
    memberCount: guild.memberCount,
    ownerID: guild.ownerID
  };
}

interface ServerListProps {
  servers: Guild[];
  onServerSelect: (serverId: string) => void;
}


  