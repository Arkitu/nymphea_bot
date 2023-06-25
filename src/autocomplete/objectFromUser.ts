import { ApplicationCommandOptionChoiceData } from "discord.js";

/**
 * @param complete If true, will complete the list with other items from the database
 */
export default async function objectFromUser(username: string, value: string, complete: boolean = true): Promise<ApplicationCommandOptionChoiceData<string>[]> {
    value = value.toLocaleLowerCase();

    let choices: Set<string> = new Set();

    // Get items that the user's characters have
    for (const c of await db.getCharactersOfUser(username)) {
        for (const i of Object.keys(await db.getItemsFromCharacter(c.name))) {
            if (value.startsWith(i)) {
                choices.add(i);
            }
        }
    }

    // If there is still some space, add some other items
    if (choices.size < 25 && complete) {
        let items: string[] = (await db.getAllItems()).map(i => i.name);
        for (const i of items) {
            if (choices.size >= 25) {
                break
            }
            if (i.startsWith(value)) {
                choices.add(i);
            }
        }
    }

    return [...choices].map(c => {
        return {
            name: c,
            value: c
        }
    })
}