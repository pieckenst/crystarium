import { FeatureFlags } from '../types/harmonixtypes';

export async function loadLibrary(useDiscordJS: boolean) {
    //if (useDiscordJS) {
    //const Discord = await import('discord.js');
    //return {
      //Client: Discord.Client,
      //Collection: Discord.Collection,
      // Add other Discord.js specific imports here
    //};
  //} else {
    const Eris = await import('eris');
    return {
      Client: Eris.Client,
      Collection: Eris.Collection,
      // Add other Eris specific imports here
    };
  //}

    
}
  
    
  //}
//}

export function getClientMethod(client: any, methodName: string) {
  if (client[methodName]) {
    return client[methodName].bind(client);
  }
  throw new Error(`Method ${methodName} not found on client`);
}
