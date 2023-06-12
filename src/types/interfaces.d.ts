import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from "discord.js";

interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    admin: boolean
}