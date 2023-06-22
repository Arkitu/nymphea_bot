import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import selectCharacter from '../selectCharacter.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche le profil d\'un personnage')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('L\'utilisateur dont vous voulez afficher le profil (par défaut: vous)')
            .setRequired(false)
    );

export async function execute(baseInteraction: ChatInputCommandInteraction) {
    await baseInteraction.deferReply();

    const user = baseInteraction.options.getUser('user', false) ?? baseInteraction.user;

    let [character, interaction] = await selectCharacter(baseInteraction, user.id);

    let money = await db.getItemFromCharacter(character.name, "nymphéos") || { quantity: 0 };

    let embed = new EmbedBuilder()
        .setTitle(`Profil de ${character.name}`)
        .setThumbnail(character.avatar_url || user.displayAvatarURL())
        .addFields(
            { name: "Nymphéos :", value: `${money.quantity.toString()} 💰`, inline: false }
        );
    
    // Affichage spécial (https://discord.com/channels/1006544142324748380/1006604526670839849/1121464867359039550)
    if (baseInteraction.user.id ==  "330404932584734740") {
        embed = new EmbedBuilder()
            .setTitle(`Profil de ${character.name}`)
            .setThumbnail(character.avatar_url || user.displayAvatarURL())
            .addFields(
                { name: "Jakobdollars :", value: `${money.quantity.toString()} 💰`, inline: false }
            );
    }
    
    await interaction.editReply({
        embeds: [embed],
        content: "",
        components: []
    });
}

export const admin = false;