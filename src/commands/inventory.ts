import { AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import getEmojiFromName from '../getEmojiFromName.js';
import selectCharacter from '../selectCharacter.js';
import objectFromUser from '../autocomplete/objectFromUser.js';

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
                    .setAutocomplete(true)
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
                    .setAutocomplete(true)
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
                    .setAutocomplete(true)
            )
            .addIntegerOption(option =>
                option.setName('quantity')
                    .setDescription('Quantité de l\'objet (par défaut: tout)')
                    .setMinValue(1)
                    .setRequired(false)
            )
    );

export async function autocomplete(interaction: AutocompleteInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const focused = interaction.options.getFocused(true);

    if (subcommand === 'add') {
        await interaction.respond(await objectFromUser(interaction.user.username, focused.value, true));
    } else {
        await interaction.respond(await objectFromUser(interaction.user.username, focused.value, false));
    }
}

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

async function view(baseInteraction: ChatInputCommandInteraction) {
    const user = baseInteraction.options.getUser('user', false) || baseInteraction.user;

    await db.updateOrCreateUser(user.id, user.username);
    let [character, interaction] = await selectCharacter(baseInteraction, user.id);

    let items = await db.getItemsFromCharacter(character.name);

    let embed = new EmbedBuilder()
        .setTitle(`Inventaire de ${character.name}`)
        .setThumbnail(character.avatar_url || user.displayAvatarURL())
        .setColor(`#${process.env.MAIN_COLOR}`);

    if (Object.keys(items).length === 0) {
        embed.setDescription('Ce personnage n\'a aucun item.');
    } else {
        let description = '';
        for (let itemName in items) {
            let item = await db.getItem(itemName);
            description += `• ${item.emoji} **${item.name}** x${items[item.name]}\n`;
        }
        embed.setDescription(description);
    }

    await interaction.editReply({ content:"", embeds: [embed], components: [] });
}

async function add(baseInteraction: ChatInputCommandInteraction) {
    const name = baseInteraction.options.getString('name', true).toLocaleLowerCase();
    const emoji = baseInteraction.options.getString('emoji', false) || await getEmojiFromName(name);
    const quantity = baseInteraction.options.getInteger('quantity', false) || 1;

    await db.updateOrCreateUser(baseInteraction.user.id, baseInteraction.user.username);
    let [character, interaction] = await selectCharacter(baseInteraction, baseInteraction.user.id);

    await db.addItemToCharacterOrCreate(character.name, name, emoji, quantity);

    let item = await db.getItem(name);

    await interaction.editReply({
        content: `${quantity} ${item.emoji} **${item.name}** ${(()=>{if (quantity == 1) {return "a"} else {return "ont"} })()} été ajouté à l'inventaire de **${character.name}**`,
        components: []
    });
}

async function remove(baseInteraction: ChatInputCommandInteraction) {
    const name = baseInteraction.options.getString('name', true).toLocaleLowerCase();
    const quantity = baseInteraction.options.getInteger('quantity', false);

    await db.updateOrCreateUser(baseInteraction.user.id, baseInteraction.user.username);
    let [character, interaction] = await selectCharacter(baseInteraction, baseInteraction.user.id);

    let item = await db.getItem(name);
    let items = await db.getItemsFromCharacter(character.name);

    if (items[name] === undefined) {
        await interaction.editReply({
            content: `**${character.name}** n'a pas d'objet nommé **${name}** dans son inventaire.`,
            components: []
        });
        return;
    }

    await db.removeItemFromCharacter(character.name, name, quantity);
    
    if (quantity === null) {
        await interaction.editReply({
            content: `Tout les **${name}** ${item.emoji} ont été retiré de l'inventaire de **${character.name}**.`,
            components: []
        });
    } else {
        await interaction.editReply({
            content: `**${quantity} ${name}** ${item.emoji} ont été retiré de l'inventaire de **${character.name}**.`,
            components: []
        });
    }
}

async function give(baseInteraction: ChatInputCommandInteraction) {
    const user = baseInteraction.options.getUser('user', true);
    const name = baseInteraction.options.getString('name', true).toLocaleLowerCase();
    const quantity = baseInteraction.options.getInteger('quantity', false);

    await db.updateOrCreateUser(baseInteraction.user.id, baseInteraction.user.username);
    await db.updateOrCreateUser(user.id, user.username);

    let [giver, secondInteraction] = await selectCharacter(baseInteraction, baseInteraction.user.id);
    let [receiver, interaction] = await selectCharacter(secondInteraction, user.id);


    const item = await db.getItem(name);
    if (item === undefined) {
        await interaction.editReply({
            content: `Il n'y a pas d'objet nommé ${name}.`,
            components: []
        });
        return;
    }

    db.giveItem(giver.name, receiver.name, name, quantity);

    if (quantity === null) {
        await interaction.editReply({
            content: `**${receiver.name}** a reçu tout les **${name}** ${item.emoji} de **${giver.name}**`,
            components: []
        });
    } else {
        await interaction.editReply({
            content: `**${receiver.name}** a reçu **${quantity} ${name}** ${item.emoji} de la part de **${giver.name}**`,
            components: []
        });
    }
}

export const admin = false;