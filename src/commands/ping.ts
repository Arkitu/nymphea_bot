import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond pong');

export async function execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
}

export const admin = false;