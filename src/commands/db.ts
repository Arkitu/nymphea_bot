import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

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
                        option.setName('id')
                            .setDescription('Identifiant de l\'objet')
                            .setRequired(true)
                    )
                    .addUserOption(option =>
                        option.setName('owner')
                            .setDescription('Propriétaire de l\'objet')
                            .setRequired(true)
                    )
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
                    .addIntegerOption(option =>
                        option.setName('quantity')
                            .setDescription('Quantité de l\'objet')
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
            await db.createItem(interaction.options.getString('id'), interaction.options.getUser('owner').id, interaction.options.getString('name'), interaction.options.getString('emoji'), interaction.options.getInteger('quantity'));
            await interaction.editReply("Objet créé ✅");
            break;
        case "item/list":
            let items = await db.getAllItems();
            let itemsString = "";
            for (let item of items) {
                itemsString += `${item.id} - <@${item.user_id}> - ${item.name} - ${item.emoji} - ${item.quantity}\n`;
            }
            await interaction.editReply(itemsString);
            break;
    }
}

export const admin = true;