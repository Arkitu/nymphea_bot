import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType } from 'discord.js';
import { Character } from './db.js';

export default async function selectCharacter(interaction: ChatInputCommandInteraction | ButtonInteraction, user_id: string|null = null): Promise<[Character, ChatInputCommandInteraction | ButtonInteraction]> {
    if (user_id === null) {
        user_id = interaction.user.id;
    }

    const characters = await db.getCharactersOfUser(user_id);

    if (characters.length === 0) {
        await interaction.editReply({
            content: "⚠️ Vous n'avez pas de personnage",
            components: []
        });
        throw new Error("No character");
    } else if (characters.length === 1) {
        return [characters[0], interaction];
    }

    const buttons = characters.map(character =>
        new ButtonBuilder().setCustomId(character.name).setLabel(character.name).setStyle(ButtonStyle.Primary)
    );

    if (buttons.length > 25) {
        await interaction.editReply({
            content: "⚠️ Vous avez trop de personnages",
            components: []
        });
        throw new Error("Too many characters");
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }

    const response = await interaction.followUp({
        content: "Choisissez un personnage",
        components: rows
    })

    let choice: ButtonInteraction;

    try {
        choice = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 10000, componentType: ComponentType.Button });
    } catch (error) {
        await interaction.editReply({
            content: "⏱️ Vous n'avez pas choisi de personnage à temps",
            components: []
        });
        throw new Error("Character chose timeout");
    }

    await choice.deferUpdate();

    return [characters.find(character => character.name === choice.customId), choice];
}