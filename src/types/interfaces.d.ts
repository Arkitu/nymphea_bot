import { AutocompleteInteraction, ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from "discord.js";

interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
    admin: boolean
}