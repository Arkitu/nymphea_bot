import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import getEmojiFromName from '../getEmojiFromName.js';

export const data = new SlashCommandBuilder()
    .setName('db')
    .setDescription('Utilise la base de données')
    .addSubcommandGroup(group =>
        group.setName('user')
            .setDescription('Commandes utilisateurs')
            .addSubcommand(subcommand =>
                subcommand.setName('create')
                    .setDescription('Crée un utilisateur')
                    .addStringOption(option =>
                        option.setName('id')
                            .setDescription('Identifiant de l\'utilisateur')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('Nom de l\'utilisateur')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('list')
                    .setDescription('Liste les utilisateurs')
            )
    )
    .addSubcommandGroup(group =>
        group.setName('item')
            .setDescription('Commandes objets')
            .addSubcommand(subcommand =>
                subcommand.setName('create')
                    .setDescription('Crée un objet')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('Nom de l\'objet')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('emoji')
                            .setDescription('Emoji de l\'objet')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('list')
                    .setDescription('Liste les objets')
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    switch (interaction.options.getSubcommandGroup(true) + "/" + interaction.options.getSubcommand(true)) {
        case "user/create":
            await db.createUser(interaction.options.getString('id'), interaction.options.getString('name'));
            await interaction.editReply("Utilisateur créé ✅");
            break;
        case "user/list":
            let users = await db.getAllUsers();
            let usersString = "";
            for (let user of users) {
                usersString += `${user.id} - ${user.username}\n`;
            }
            await interaction.editReply(usersString);
            break;
        case "item/create":
            const name = interaction.options.getString('name');
            const emoji = interaction.options.getString('emoji') || await getEmojiFromName(name);
            await db.createItem(name, emoji);
            await interaction.editReply("Objet créé ✅");
            break;
        case "item/list":
            let items = await db.getAllItems();
            let itemsString = "";
            for (let item of items) {
                itemsString += `• ${item.emoji} ${item.name}\n`;
            }
            await interaction.editReply(itemsString);
            break;
    }
}

export const admin = true;