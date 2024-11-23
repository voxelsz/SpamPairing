const { makeWASocket, Browsers, useMultiFileAuthState } = require("baileys");
const pino = require("pino");
const chalk = require("chalk");

async function spam(nomor) {
    const { state } = await useMultiFileAuthState("p");
    const client = makeWASocket({
        printQRInTerminal: false,
        browser: Browsers.macOS("Edge"),
        auth: state,
        logger: pino({ level: "fatal" })
    });

    const intervalId = setInterval(async () => {
        try {
            await client.requestPairingCode(nomor);
            console.log(chalk.cyan(`[ PROCESS ] ==> `) + chalk.green(`|| ${nomor} || Spaming Pairing`));
        } catch (err) {
            console.log(chalk.cyan(`[ ALERT ] ==> `) + chalk.green(`|| ${nomor} || Gagal Spaming`));
        }
    }, 60000);

    return intervalId;
}

module.exports = { spam };