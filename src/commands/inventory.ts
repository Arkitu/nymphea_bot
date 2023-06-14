import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import getEmojiFromName from '../getEmojiFromName.js';

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
    )
    .addSubcommand(subcommand =>
        subcommand.setName('add')
            .setDescription('Ajoute un objet à l\'inventaire')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Nom de l\'objet')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('quantity')
                    .setDescription('Quantité de l\'objet')
                    .setMinValue(1)
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('Emoji de l\'objet')
                    .setRequired(false)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'view':
            await view(interaction);
            break;
        case 'add':
            await add(interaction);
            break;
        default:
            throw new Error(`Subcommand ${subcommand} not implemented but used by ${interaction.user.username}`);
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

    if (Object.keys(items).length === 0) {
        embed.setDescription('Cet utilisateur n\'a aucun item.');
    } else {
        let description = '';
        for (let itemName in items) {
            let item = await db.getItem(itemName);
            description += `• ${item.emoji} **${item.name}** x${items[item.name]}\n`;
        }
        embed.setDescription(description);
    }

    await interaction.editReply({ embeds: [embed] });
}

async function add(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const name = interaction.options.getString('name', true).toLocaleLowerCase();
    const emoji = interaction.options.getString('emoji', false) || await getEmojiFromName(name);
    const quantity = interaction.options.getInteger('quantity', false) || 1;

    await db.addItemToUserOrCreate(interaction.user.id, interaction.user.username, name, emoji, quantity);

    await interaction.editReply(`${quantity} ${emoji} **${name}** ${(()=>{if (quantity == 1) {return "a"} else {return "ont"} })()} été ajouté à votre inventaire.`);
}

export const admin = false;