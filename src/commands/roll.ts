import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lance un dé')
    .addIntegerOption(option => 
        option.setName('faces')
            .setDescription('Nombre de faces du dé (par défaut 6)')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const faces = interaction.options.getInteger('faces') || 6;
    const result = Math.floor(Math.random() * faces) + 1;
    await interaction.reply(`Résultat du dé à ${faces} faces : ${result}`);
}

export const admin = false;