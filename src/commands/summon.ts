import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Invoque un esprit');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
}

export const admin = false;