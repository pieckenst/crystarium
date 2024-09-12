export async function loadLibrary(useDiscordJS) {
    if (useDiscordJS) {
        const Discord = await import('discord.js');
        return {
            Client: Discord.Client,
            Collection: Discord.Collection,
        };
    }
    else {
        const Eris = await import('eris');
        return {
            Client: Eris.Client,
            Collection: Eris.Collection,
        };
    }
}
export function getClientMethod(client, methodName) {
    if (client.eris && client.eris[methodName]) {
        return client.eris[methodName].bind(client.eris);
    }
    else if (client.discord && client.discord[methodName]) {
        return client.discord[methodName].bind(client.discord);
    }
    throw new Error(`Method ${methodName} not found on client`);
}
//# sourceMappingURL=libraryHelper.js.map