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
        .setColor(`#${process.env.MAIN_COLOR}`)
        .addFields(
            { name: "Nymphéos :", value: `${money.quantity.toString()} 💰`, inline: false }
        );
    
    // Affichage spécial (https://discord.com/channels/1006544142324748380/1006604526670839849/1121464867359039550)
    if (baseInteraction.user.id ==  "330404932584734740") {
        embed = new EmbedBuilder()
            .setTitle(`Profil de ${character.name}`)
            .setThumbnail(character.avatar_url || user.displayAvatarURL())
            .setColor(`#${process.env.MAIN_COLOR}`)
            .addFields(
                { name: "Jakobdollars :", value: `${money.quantity.toString()} 💰`, inline: false }
            );
    }

    const spirit = await db.getSpirit(character.name);
    if (spirit) {
        embed.addFields(
            { name: "Esprit :", value: `${spirit.rarity == 0 ? "commun" : spirit.rarity == 1 ? "rare" : "légendaire"} (expire dans ${Math.floor((spirit.death_date.getTime() - Date.now()) / 1000 / 60)} minutes)`, inline: false}
        );
    }
    
    await interaction.editReply({
        embeds: [embed],
        content: "",
        components: []
    });
}

export const admin = false;