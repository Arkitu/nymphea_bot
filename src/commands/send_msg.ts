import { ChatInputCommandInteraction, SlashCommandBuilder, TextBasedChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('send_msg')
    .setDescription('ADMIN: Envoie un message')
    .addSubcommand(subcmd => 
        subcmd.setName('simple')
            .setDescription('Envoie un message sans embed')
            .addStringOption(opt => 
                opt.setName('content')
                    .setDescription('Le contenu du message')
                    .setRequired(true)
            ).addChannelOption(opt =>
                opt.setName('channel')
                    .setDescription('Le channel dans lequel envoyer le message (par défaut: le channel actuel)')
                    .setRequired(false)
            )
    ).addSubcommand(subcmd =>
        subcmd.setName('advanced')
            .setDescription('Envoie un message avec embed')
            .addStringOption(opt =>
                opt.setName('json')
                    .setDescription('Le JSON de l\'embed (peut être généré avec https://glitchii.github.io/embedbuilder/)')
                    .setRequired(false)
            ).addChannelOption(opt =>
                opt.setName('channel')
                    .setDescription('Le channel dans lequel envoyer le message (par défaut: le channel actuel)')
                    .setRequired(false)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!process.env.RP_ADMIN_IDS?.split(", ").includes(interaction.user.id)) {
        await interaction.editReply({
            content: "⚠ Vous n'avez pas la permission d'utiliser cette commande"
        });
        return;
    }

    await interaction.deferReply({ ephemeral: true });
    switch (interaction.options.getSubcommand()) {
        case 'simple': {
            const content = interaction.options.getString('content', true);
            const channel = interaction.options.getChannel('channel', false) ?? interaction.channel;

            await (channel as TextBasedChannel).send(content);

            await interaction.editReply('Message envoyé');
            break;
        }
        case 'advanced': {
            const json = interaction.options.getString('json', false);

            if (!json) {
                await interaction.editReply('Pour envoyer un embed, vous devez fournir le JSON de l\'embed. Vous pouvez le générer avec https://glitchii.github.io/embedbuilder/\n Contactez Arkitu si vous avez besoin d\'aide.');
                return;
            }

            const channel = interaction.options.getChannel('channel', false) ?? interaction.channel;

            await (channel as TextBasedChannel).send(JSON.parse(json));

            await interaction.editReply('Message envoyé');
        }
    }
}

export const admin = false;