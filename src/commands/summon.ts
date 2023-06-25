import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Invoque un esprit');

export async function execute(interaction: ChatInputCommandInteraction) {
    // ~Fait~ Fera des trucs quand les instructions seront plus claires
}

export const admin = false;