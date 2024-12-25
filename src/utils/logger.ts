/** @file Reusable functions for using `console.log()`, but in 4k ultra HD retrocolor. */

/** */
interface FormatStyle {
    name: string;
    text: () => string;
    color: chalk.Chalk | null;
    condition?: () => boolean;
}

interface LogOptions {
    /** Format the message using the preset styles. Defaults to `true`. */
    format?: boolean;
    /** Add a timestamp before the message. Defaults to `true`. */
    timestamp?: boolean;
    /** Make the message bold. */
    bold?: boolean;
    /** Make the message italic. */
    italic?: boolean;
}

import { Client } from "discord.js";
import jt from "@utils/jsTools";
import chalk from "chalk";

import { VERSION } from "@constants";

import config from "@configs";
const { COLORS } = config.logger;

const FORMAT_PRESETS: FormatStyle[] = [
    {
        name: "::TIMESTAMP",
        text: () => `[${new Date().toLocaleTimeString()}]`,
        color: chalk.dim,
        condition: () => config.logger.LOG_TIMESTAMPS
    },

    { name: "::CLIENT", text: () => `[CLIENT]`, color: chalk.bold.white },
    { name: "::ACM_LOCAL", text: () => `[ACM/LOCAL]`, color: chalk.bold.dim },
    { name: "::ACM_GLOBAL", text: () => `[ACM/GLOBAL]`, color: chalk.bold.dim },
    { name: "::CLI", text: () => `[CLI]`, color: chalk.bold.white },

    { name: "::IMPORTER", text: () => `[IMPORTER]`, color: chalk.bold.dim },
    { name: "::IMPORT_EVENT", text: () => `[~/EVENT]`, color: chalk.bold.gray },
    { name: "::IMPORT_COMMAND", text: () => `[~/COMMAND]`, color: chalk.bold.gray },

    { name: "::COMMAND", text: () => `[⚡️COMMAND]`, color: chalk.hex(COLORS.COMMAND_NAME).bold },
    { name: "::EVENT", text: () => `[⚡️EVENT]`, color: chalk.hex(COLORS.EVENT_NAME).bold },
    { name: "::MONGO", text: () => `[🥭 MONGO]`, color: chalk.hex(COLORS.MONGO).bold }
];

function __formatPresets(str: string, colored: boolean = true): string {
    for (const FORMAT of FORMAT_PRESETS) {
        if (FORMAT.condition && !FORMAT.condition()) {
            str = str.replace(FORMAT.name, "");
            continue;
        }
        str = str.replace(FORMAT.name, colored && FORMAT.color ? FORMAT.color(FORMAT.text()) : FORMAT.text());
    }
    return str;
}

function __log(msg: string, format: boolean = true): void {
    const timestamp = __formatPresets("::TIMESTAMP ");
    console.log(`${timestamp}${format ? __formatPresets(`${msg}`) : `${msg}`}`);
}

function __error(msg: string, err: any, format: boolean = true): void {
    const timestamp = __formatPresets("::TIMESTAMP");
    console.error(`${timestamp} ${format ? __formatPresets(`${msg}`) : `${msg}`}`, err);
}

/* - - - - - { Base } - - - - - */
export function log(msg: string, options?: LogOptions): void {
    const timestamp_f = (options?.timestamp ?? true) ? __formatPresets("::TIMESTAMP ") : "";
    let msg_f = (options?.format ?? true) ? __formatPresets(`${msg}`) : `${msg}`;

    if (options?.bold) msg_f = chalk.bold(msg_f);
    if (options?.italic) msg_f = chalk.italic(msg_f);

    console.log(`${timestamp_f}${msg_f}`);
}

export function debug(msg: string, options?: LogOptions): void {
    const timestamp_f = (options?.timestamp ?? true) ? __formatPresets("::TIMESTAMP ") : "";
    let msg_f = (options?.format ?? true) ? __formatPresets(`${msg}`) : `${msg}`;

    if (options?.bold) msg_f = chalk.bold(msg_f);
    if (options?.italic) msg_f = chalk.italic(msg_f);

    console.log(`${timestamp_f}${chalk.hex(COLORS.DEBUG)(msg_f)}`);
}

export function error(header: string, msg: string, err: any = "", format: boolean = true): void {
    __error(`${chalk.bgRed("ERROR!")} ${chalk.bold.red(__formatPresets(header, false))} ${msg}`, err, format);
}

export function success(msg: string, format: boolean = true): void {
    __log(chalk.greenBright(msg), format);
}

/* - - - - - { Client } - - - - - */
export const client = {
    starting: (): void => __log(`::CLIENT ⏳ ${chalk.italic(jt.choice(config.logger.STARTUP_MESSAGES))}`),
    connecting: (): void => __log(`::CLIENT ⏳ ${chalk.italic("Connecting to Discord...")}`),
    online: (): void => __log(`::CLIENT ✅ ${chalk.greenBright("Successfuly connected to Discord!")}`),
    ready: (client?: Client) =>
        __log(
            `::CLIENT ✅ ${chalk.greenBright(`${chalk.bold.underline(client?.__name || "Discord Bot")} v${VERSION} is up and running!`)} 🎉`
        )
};

/* - - - - - { utils/importers } - - - - - */
export const importer = {
    event: (event: string, path: string, enabled: boolean): void => {
        const _msg = `${chalk.hex(COLORS.EVENT_NAME).bold(event)} ${chalk.italic.gray(`'${path}'`)}`;
        __log(`::IMPORT_EVENT ${chalk.bold("✔️ IMPORTED")} | ${enabled ? _msg : chalk.strikethrough(_msg)}`);
    },

    command: (command: string, path: string, type: "PRFX" | "SLSH" | "CTX" | "UI"): void => {
        let prefix = "";
        switch (type) {
            case "PRFX":
                prefix = config.client.PREFIX;
                break;
            case "SLSH":
                prefix = "/";
                break;
            case "CTX":
                prefix = "[ContextMenu] ";
                break;
            case "UI":
                prefix = "[UserInstallable] ";
                break;
        }
        __log(
            `::IMPORT_COMMAND ${chalk.bold("✔️ IMPORTED")} | ${chalk.dim(prefix)}${chalk
                .hex(COLORS.COMMAND_NAME)
                .bold(command)} ${path ? chalk.italic.gray(`'${path}'`) : ""}`
        );
    }
};

export const db = {
    mongo: {
        connecting: (): void => __log(`::MONGO ⏳ ${chalk.italic("Connecting to MongoDB...")}`),
        connected: (): void => __log(`::MONGO ✅ ${chalk.greenBright("Successfully connected to MongoDB!")}`)
    }
};

export const event = (event: string, msg: string): void => {
    __log(`::EVENT ${chalk.hex(COLORS.EVENT_NAME).bold(event)} | ${msg}`);
};

export const command = (command: string, msg: string, type: "PRFX" | "SLSH" | "CTX" | "UI"): void => {
    let prefix = "";
    switch (type) {
        case "PRFX":
            prefix = config.client.PREFIX;
            break;
        case "SLSH":
            prefix = "/";
            break;
        case "CTX":
            prefix = "[ContextMenu] ";
            break;
        case "UI":
            prefix = "[UserInstallable] ";
            break;
    }
    __log(`::COMMAND ${chalk.dim(prefix)}${chalk.hex(COLORS.COMMAND_NAME).bold(command)} | ${msg}`);
};

/* - - - - - { Test } - - - - - */
export function test(): void {
    log("This is a test log.");
    debug("This is a test debug.");
    error("::CLIENT", "This is a test error.", "This is an error message.");
    success("This is a test success.");

    console.log();

    client.starting();
    client.connecting();
    client.online();
    client.ready();

    console.log();

    importer.event("0_setStatus", "./events/ready/0_setStatus.ts", true);
    importer.event("9_botReady", "./events/ready/9_botReady.ts", false);
    importer.command("cookie_PRFX", "./commands/prefix/cookie_PRFX.ts", "PRFX");
    importer.command("cookie_SLSH", "./commands/slash/cookie_SLSH.ts", "SLSH");
    importer.command("avatar_CTX", "./commands/special/contextMenu/avatar_CTX.ts", "CTX");
    importer.command("pick_UI", "./commands/special/userInstallable/pick_UI.ts", "UI");

    console.log();

    event("9_processSlashCommand", "user: '842555247145779211' | guild: '1052726201086656612'");
    event("9_processPrefixCommand", "user: '842555247145779211' | guild: '1052726201086656612'");

    command("cookie", "user: '842555247145779211' | guild: '1052726201086656612'", "PRFX");
    command("cookie", "user: '842555247145779211' | guild: '1052726201086656612'", "SLSH");
    command("avatar", "user: '842555247145779211' | guild: '1052726201086656612'", "CTX");
    command("pick", "user: '842555247145779211' | guild: '1052726201086656612'", "UI");

    console.log();

    log(`Log Headers ${FORMAT_PRESETS.map(f => f.name).join(" ")}`);
    log(`Log Headers (Raw) ${FORMAT_PRESETS.map(f => f.name).join(" ")}`, { format: false });
}

export default { log, debug, error, success, client, importer, db, event, command, test };
