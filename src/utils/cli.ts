import { createInterface } from "node:readline";
import { Client } from "discord.js";
import AppCommandManager from "@utils/AppCommandManager";
import jt from "@utils/jsTools";
import logger from "./logger";

function resolveGuildIds(client: Client, args: string[]) {
    const guildIds = args.slice(1);

    if (!guildIds.length) {
        if (!client.guilds.cache.size) {
            logger.error("[CLI]", "Guild IDs not provided. Usage example: '!push local 123456789 [...ids]'");
            return [];
        }

        guildIds.push(...client.guilds.cache.map(g => g.id));
    }

    return guildIds;
}

async function cmd_push(client: Client, acm: AppCommandManager, type: string, args: string[]) {
    if (!args.length) {
        logger.log("[CLI] '/push local' | '/push global'");
        return;
    }

    switch (type.toLowerCase()) {
        case "local":
            const guildIds = resolveGuildIds(client, args);
            if (!guildIds.length) return;
            await acm.registerToLocal(guildIds);
            return;

        case "global":
            await acm.registerToGlobal();
            return;

        default:
            return;
    }
}

async function cmd_remove(client: Client, acm: AppCommandManager, type: string, args: string[]) {
    if (!args.length) {
        logger.log("[CLI] '/push local' | '/push global'");
        return;
    }

    switch (type.toLowerCase()) {
        case "local":
            const guildIds = resolveGuildIds(client, args);
            if (!guildIds.length) return;
            return await acm.removeFromLocal(guildIds);

        case "global":
            return await acm.removeFromGlobal();

        default:
            return;
    }
}

function cmd_help() {
    console.log(
        "| - - - - - { COMMAND LINE INTERFACE } - - - - - |\n| Prefix: '/'\n| Available commands: '/push' | '/remove' | '/help'\n| ____________ Created by @xsqu1znt ____________ |"
    );
}

export default async function (client: Client, acm: AppCommandManager): Promise<void> {
    const rl = createInterface({
        input: process.stdin as unknown as NodeJS.ReadableStream,
        output: process.stdout as unknown as NodeJS.WritableStream,
        terminal: false
    });

    rl.on("line", async line => {
        const args = jt.forceArray(line.split(" ")).map(s => s.trim());
        const commandName = args[0];

        if (!commandName || !commandName.startsWith("/")) return;

        // Remove the command name argument
        args.shift();

        switch (commandName.toLowerCase()) {
            case "/push":
                return cmd_push(client, acm, args[0], args.slice(1));

            case "/remove":
                return cmd_remove(client, acm, args[0], args.slice(1));

            case "/help":
                return cmd_help();

            default:
                return;
        }
    });

    logger.log("[CLI] Use /help in the terminal to view runtime available commands.");
}
