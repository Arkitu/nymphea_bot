import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import selectCharacter from '../selectCharacter.js';
import { isUserJugesFiches } from '../check_if_user_is_admin.js';

export const data = new SlashCommandBuilder()
    .setName('character')
    .setDescription('Intéragis avec les personnages')
    .addSubcommand(subcommand =>
        subcommand.setName('add')
            .setDescription('Ajoute un personnage (juges fiches uniquement)')
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
    .addSubcommand(subcommand =>
        subcommand.setName('remove')
            .setDescription('Supprime un personnage (juges fiches uniquement)')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Nom du personnage')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('edit')
            .setDescription('Modifie un personnage')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('Utilisateur dont le personnage doit être modifié (par défaut: vous) (juges fiches uniquement)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('avatar_url')
                    .setDescription('URL de l\'avatar du personnage')
                    .setRequired(false)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'add':
            await characterAdd(interaction);
            break;
        case 'remove':
            await characterRemove(interaction);
            break;
        case 'edit':
            await characterEdit(interaction);
            break;
        default:
            throw new Error(`Subcommand ${subcommand} not implemented but used by ${interaction.user.username}`);
    }
}

async function characterAdd(interaction: ChatInputCommandInteraction) {

    if (!isUserJugesFiches(interaction.client, interaction.user.id)) {
        await interaction.editReply({
            content: "⚠ Vous n'avez pas la permission d'utiliser cette commande"
        });
        return;
    }

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

async function characterRemove(interaction: ChatInputCommandInteraction) {
    if (!isUserJugesFiches(interaction.client, interaction.user.id)) {
        await interaction.editReply({
            content: "⚠ Vous n'avez pas la permission d'utiliser cette commande"
        });
        return;
    }

    const name = interaction.options.getString('name', true);

    await db.removeCharacter(name);

    await interaction.editReply({
        content: `✅ Le personnage ${name} a été supprimé`
    });
}

async function characterEdit(baseInteraction: ChatInputCommandInteraction) {
    const optUser = baseInteraction.options.getUser('user', false);

    if (optUser && !isUserJugesFiches(baseInteraction.client, baseInteraction.user.id)) {
        await baseInteraction.editReply({
            content: "⚠ Vous n'avez pas la permission d'utiliser cette commande avec l'option `user`"
        });
        return;
    }

    const user = optUser || baseInteraction.user;
    const avatarUrl = baseInteraction.options.getString('avatar_url', false);

    const [char, interaction] = await selectCharacter(baseInteraction, user.id);

    await db.updateCharacter(char.name, avatarUrl);

    await interaction.editReply({
        content: `✅ Le personnage ${char.name} a été modifié`,
        components: []
    });
}

export const admin = false;