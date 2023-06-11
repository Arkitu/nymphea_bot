import { readdirSync } from 'fs';
import { Command } from './types/interfaces';
import path from 'path';

export default function getCmds() {
    const commands = new Map<string, Command>();
    for (const fileName of readdirSync(path.join(process.cwd(), "src", "commands"))) {
        const command = require(path.join(process.cwd(), "src", "commands", fileName));
        commands.set(command.data.name, command);
    }
    return commands;
}