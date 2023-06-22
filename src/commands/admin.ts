import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Commandes d\'administration')
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName('character')
            .setDescription('Intéragit avec les personnages')
            .addSubcommand(subcommand =>
                subcommand.setName('add')
                    .setDescription('Ajoute un personnage')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('Nom du personnage')
                            .setRequired(true)
                    )
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('Utilisateur à qui attribuer le personnage')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('avatar_url')
                            .setDescription('URL de l\'avatar du personnage')
                            .setRequired(false)
                    )
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    if (!process.env.RP_ADMIN_IDS?.split(", ").includes(interaction.user.id)) {
        await interaction.editReply({
            content: "⚠ Vous n'avez pas la permission d'utiliser cette commande"
        });
        return;
    }

    const subcommandGroup = interaction.options.getSubcommandGroup();

    switch (subcommandGroup) {
        case 'character':
            switch (interaction.options.getSubcommand()) {
                case 'add':
                    await characterAdd(interaction);
                    break;
                default:
                    throw new Error(`Subcommand ${subcommandGroup} not implemented but used by ${interaction.user.username}`);
            }
            break;
        default:
            throw new Error(`SubcommandGroup ${subcommandGroup} not implemented but used by ${interaction.user.username}`);
    }
}

async function characterAdd(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    const user = interaction.options.getUser('user', true);
    const avatar_url = interaction.options.getString('avatar_url', false);

    await db.updateOrCreateUser(user.id, user.username);

    if (avatar_url) {
        await db.createCharacter(user.id, name, avatar_url);
    } else {
        await db.createCharacter(user.id, name);
    }

    await interaction.editReply({
        content: `✅ Le personnage ${name} a été ajouté à <@${user.id}>`
    });
}

export const admin = false;