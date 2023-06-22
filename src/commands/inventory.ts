import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import getEmojiFromName from '../getEmojiFromName.js';
import selectCharacter from '../selectCharacter.js';

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
    )
    .addSubcommand(subcommand =>
        subcommand.setName('remove')
            .setDescription('Retire un objet de l\'inventaire')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Nom de l\'objet')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('quantity')
                    .setDescription('Quantité de l\'objet (par défaut: tout)')
                    .setMinValue(1)
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('give')
            .setDescription('Donne un objet à un utilisateur')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('L\'utilisateur à qui donner l\'objet')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Nom de l\'objet')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('quantity')
                    .setDescription('Quantité de l\'objet (par défaut: tout)')
                    .setMinValue(1)
                    .setRequired(false)
            )
    )

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'view':
            await view(interaction);
            break;
        case 'add':
            await add(interaction);
            break;
        case 'remove':
            await remove(interaction);
            break;
        case 'give':
            await give(interaction);
            break;
        default:
            throw new Error(`Subcommand ${subcommand} not implemented but used by ${interaction.user.username}`);
    }
}

async function view(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', false) || interaction.user;

    await db.updateOrCreateUser(user.id, user.username);
    //let character, interaction = await selectCharacter(interaction, user.id);


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
    const name = interaction.options.getString('name', true).toLocaleLowerCase();
    const emoji = interaction.options.getString('emoji', false) || await getEmojiFromName(name);
    const quantity = interaction.options.getInteger('quantity', false) || 1;

    await db.updateOrCreateUser(interaction.user.id, interaction.user.username);

    await db.addItemToUserOrCreate(interaction.user.id, interaction.user.username, name, emoji, quantity);

    await interaction.editReply(`${quantity} ${emoji} **${name}** ${(()=>{if (quantity == 1) {return "a"} else {return "ont"} })()} été ajouté à votre inventaire.`);
}

async function remove(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true).toLocaleLowerCase();
    const quantity = interaction.options.getInteger('quantity', false);

    await db.updateOrCreateUser(interaction.user.id, interaction.user.username);

    let item = await db.getItem(name);
    let items = await db.getItemsFromUser(interaction.user.id);

    if (items[name] === undefined) {
        await interaction.editReply(`Vous n'avez pas d'objet nommé **${name}** dans votre inventaire.`);
        return;
    }

    await db.removeItemFromUser(interaction.user.id, name, quantity);
    
    if (quantity === null) {
        await interaction.editReply(`Tout les **${name}** ${item.emoji} ont été retiré de votre inventaire.`);
    } else {
        await interaction.editReply(`**${quantity} ${name}** ${item.emoji} ont été retiré de votre inventaire.`);
    }
}

async function give(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const name = interaction.options.getString('name', true).toLocaleLowerCase();
    const quantity = interaction.options.getInteger('quantity', false);

    await db.updateOrCreateUser(interaction.user.id, interaction.user.username);
    await db.updateOrCreateUser(user.id, user.username);

    const item = await db.getItem(name);
    if (item === undefined) {
        await interaction.editReply(`Il n'y a pas d'objet nommé ${name}.`);
        return;
    }

    db.giveItem(interaction.user.id, user.id, name, quantity);

    if (quantity === null) {
        await interaction.editReply(`${user.username} a reçu tout les **${name}** ${item.emoji}`);
    } else {
        await interaction.editReply(`${user.username} a reçu **${quantity} ${name}** ${item.emoji}`);
    }
}

export const admin = false;