import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import selectCharacter from '../selectCharacter.js';

export const data = new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Invoque un esprit');

export async function execute(baseInteraction: ChatInputCommandInteraction) {
    await baseInteraction.deferReply();

    const [char, interaction] = await selectCharacter(baseInteraction, baseInteraction.user.id);

    let rarity: number;
    let rand = Math.random();

    // 60% common
    if (rand < 0.6) {
        rarity = 0;
    // 30% rare
    } else if (rand < 0.9) {
        rarity = 1;
    // 10% legendary
    } else {
        rarity = 2;
    }

    const rarityString = ['commun', 'rare', 'légendaire'][rarity];

    // 10min lifetime
    await db.createSpirit(char.name, new Date(Date.now() + (1000 * 60 * 10)), rarity);

    await interaction.editReply(`${char.name} a invoqué un esprit ${rarityString} !`);
}

export const admin = false;