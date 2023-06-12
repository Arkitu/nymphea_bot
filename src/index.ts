import { Client, Events, GatewayIntentBits } from 'discord.js';
import consoleStamp from 'console-stamp';
import getCmds from './get_cmds.js';
import loadConfig from './load_config.js';
import loadDb from './load_db.js';

// Enhance console logging
consoleStamp(console);

const commands = await getCmds();

loadConfig();

loadDb();

// Create client
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Log when ready
client.once(Events.ClientReady, () => {
    console.log("Bot is ready!");
});

// Handle commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = commands.get(interaction.commandName);
    if (command === undefined) {
        console.error(`${interaction.user.username} tried to use an unknown command: ${interaction.commandName}`);
        await interaction.reply({ content: '⚠️ Cette commande n\'existe pas!', ephemeral: true });
        return;
    }

    console.log(process.env.ADMIN_IDS?.split(", "));

    if (command.admin && !process.env.ADMIN_IDS?.split(", ").includes(interaction.user.id)) {
        console.log(`${interaction.user.username} tried to use an admin command: ${interaction.commandName}`);
        await interaction.reply({ content: '⚠️ Vous n\'avez pas la permission d\'utiliser cette commande!', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`${interaction.user.username} tried to use /${interaction.commandName} but an error occured: ${error}`);
        await interaction.reply({ content: '⚠️ Il y a eu une erreur lors de l\'exécution de cette commande!', ephemeral: true });
    }
})

// If no token is provided, exit
if (process.env.DISCORD_TOKEN === undefined) {
    console.error("No token provided! Please set the DISCORD_TOKEN environment variable in config.env");
    process.exit(1);
}

// Lauch bot
client.login(process.env.DISCORD_TOKEN);