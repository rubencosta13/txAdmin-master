//Requires
const modulename = 'WebServer:SettingsGet';
const cloneDeep = require('lodash/cloneDeep');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const { redactApiKeys } = require('../../extras/helpers');


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function SettingsGet(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('settings.view', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'You don\'t have permission to view this page.'});
    }

    const renderData = {
        headerTitle: 'settings',
        global: cleanRenderData(globals.configVault.getScopedStructure('global')),
        fxserver: cleanRenderData(globals.configVault.getScopedStructure('fxRunner')),
        playerController: cleanRenderData(globals.configVault.getScopedStructure('playerController')),
        monitor: cleanRenderData(globals.configVault.getScopedStructure('monitor')),
        discord: cleanRenderData(globals.configVault.getScopedStructure('discordBot')),
        readOnly: !ctx.utils.checkPermission('settings.write', modulename, false),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        activeTab: 'global',
        isZapHosting: GlobalData.isZapHosting,
        txDataPath: GlobalData.dataPath,
    };

    if (renderData.readOnly) {
        renderData.fxserver.commandLine = redactApiKeys(renderData.fxserver.commandLine);
    }

    return ctx.utils.render('settings', renderData);
};


//================================================================
function cleanRenderData(inputData) {
    const input = cloneDeep(inputData);
    const out = {};
    Object.keys(input).forEach((prop) => {
        if (input[prop] == null || input[prop] === false || typeof input[prop] === 'undefined') {
            out[prop] = '';
        } else if (input[prop] === true) {
            out[prop] = 'checked';
        } else if (input[prop].constructor === Array) {
            out[prop] = input[prop].join(', ');
        } else if (input[prop].constructor === Object) {
            out[prop] = cleanRenderData(input[prop]);
        } else {
            out[prop] = input[prop];
        }
    });
    return out;
}
