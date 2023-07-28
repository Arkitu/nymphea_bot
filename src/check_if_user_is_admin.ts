import { Client } from "discord.js";

export function getMainGuild(client: Client) {
    return client.guilds.fetch(process.env.MAIN_GUILD_ID);
}

export async function isUserJugesFiches(client: Client, user_id: string): Promise<boolean> {
    return (await (await getMainGuild(client)).members.fetch(user_id)).roles.cache.some(role => role.id === process.env.JUGES_FICHES_ROLE_ID)
}