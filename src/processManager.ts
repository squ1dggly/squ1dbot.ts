import { fork, ChildProcess } from "node:child_process";
import { existsSync, createWriteStream } from "fs";
import { WriteStream } from "node:fs";
import { join } from "node:path";

const __argsv: string[] = process.argv.slice(2);
const IS_DEV_MODE = __argsv.includes("--dev");

const FILE_PATH = IS_DEV_MODE ? "./src/index.ts" : "./dist/index.js";
const LOGS_FOLDER = join(__dirname, "../logs");

let child: ChildProcess | null = null;
let logCache: any[] = [];

function spawn() {
    if (child) {
        return console.log("[PM] There is already a process running");
    } else {
        logCache = [];
        console.log("[PM] Starting process...");
    }

    child = fork(FILE_PATH, [], { silent: true });

    child.stdout?.on("data", data => process.stdout.write(data));
    child.stderr?.on("data", data => process.stdout.write(data));

    child.on("message", data => {});

    child.on("close", code => {
        console.log(`[PM] Process quit with code ${code}`);
        if (code === 1) respawn();
    });

    child.on("error", err => {
        console.error(`[PM] Process error: ${err}`);
        respawn();
    });

    /* - - - - - { Cache Logs } - - - - - */
    if (child.stdout) {
        child.stdout.on("data", data => logCache.push(data));
    }

    if (child.stderr) {
        child.stderr.on("data", data => logCache.push(data));
    }

    return child;
}

function respawn() {
    if (!child) {
        return console.log("[PM] There is no process to restart");
    } else {
        // Clears the console
        process.stdout.write("\x1Bc");

        // Write logs to file
        if (existsSync(LOGS_FOLDER)) {
            const logFilePath = `${LOGS_FOLDER}/logs_${new Date().toISOString()}.txt`;
            const logFileStream = createWriteStream(logFilePath, { flags: "a" });

            logCache.forEach(data => logFileStream?.write(data));
            console.log(`[PM] Logs have been saved to '${logFilePath}'.`);
        }

        console.log("[PM] The process stopped. Restarting...");
    }

    child.kill();
    child = null;
    spawn();
}

spawn();
