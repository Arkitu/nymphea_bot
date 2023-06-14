import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Intéragit avec l\'inventaire')
    .addSubcommand(subcommand =>
        subcommand.setName('view')
            .setDescription('Affiche l\'inventaire')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('L\'utilisateur dont on veut afficher l\'inventaire (par défaut: vous)')
                    .setRequired(false)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'view':
            await view(interaction);
            break;
    }
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user', false) || interaction.user;

    let items = await db.getItemsFromUser(user.id);

    let embed = new EmbedBuilder()
        .setTitle(`Inventaire de ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(`#${process.env.MAIN_COLOR}`);

    if (items.length === 0) {
        embed.setDescription('Cet utilisateur n\'a aucun item.');
    } else {
        let description = '';
        for (let item of items) {
            description += `• ${item.emoji} **${item.name}** x${item.quantity}\n`;
        }
        embed.setDescription(description);
    }

    await interaction.editReply({ embeds: [embed] });
}

export const admin = true;