//Requires
const modulename = 'DiscordBot:cmd:addwl';
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

/**
 * Usage options:
 *  /addwl <wl req id>
 *  /addwl <license>
 *  /addwl <mention> ???
 */
module.exports = {
    description: 'Adds a players to the whitelist',
    cooldown: 5,
    async execute(message, args) {
        //Check permissions
        //TODO: generalize this to other commands?
        const admin = globals.adminVault.getAdminByProviderUID(message.author.id);
        if (!admin) {
            return await message.reply('your Discord ID is not registered in txAdmin :face_with_monocle:');
        }
        if (
            admin.master !== true
            && !admin.permissions.includes('all_permissions')
            && !admin.permissions.includes('players.whitelist')
        ) {
            return await message.reply('you do not have whitelist permissions :face_with_raised_eyebrow:');
        }

        //Check if whitelist is enabled
        if (!globals.playerController.config.onJoinCheckWhitelist) {
            return await message.reply('**txAdmin** whitelist is disabled :man_facepalming:\nGo to the settings and enable it first.');
        }

        //Check usage
        if (args.length !== 1) {
            const msgLines = [
                'Type in the whitelist Request ID (R####) or License Identifier.',
                'Example:',
                `\`${globals.discordBot.config.prefix}addwl R1234\``,
                `\`${globals.discordBot.config.prefix}addwl license:65a97df7ab8208b531f5b7a9cb91c3b853095f1d\``,
                'An option to whitelist using other identifiers will soon be available.',
            ];
            return await message.reply(msgLines.join('\n'));
        }

        //Treat input to improve UX
        let reference = args[0];
        if (reference.length == 5) {
            reference = reference.toUpperCase();
        } else if (reference.length == 40) {
            reference = reference.toLowerCase();
        } else if (reference.length == 48) {
            reference = reference.substring(8).toLowerCase();
        }

        //Check input validity
        if (
            !GlobalData.regexWhitelistReqID.test(reference)
            && !/[0-9A-Fa-f]{40}/.test(reference)
        ) {
            return await message.reply('The value inserted is not a valid Whitelist Request ID (R####) nor a license identifier.');
        }

        //Whitelist reference
        try {
            await globals.playerController.approveWhitelist(reference, admin.name);
        } catch (error) {
            return await message.reply(`**Error:** ${error.message}`);
        }

        const logMessage = `[DISCORD][${admin.name}] Whitelisted ${reference}`;
        globals.logger.admin.write(logMessage);
        logOk(logMessage);
        return await message.reply('Player added to the whitelist :white_check_mark:');
    },
};
