require('./customize');
const cliSelect = require('cli-select');
const { ips } = require('./functions/getIp');
const modules = require('./modules');

cliSelect({ values: ips.list }, async selected => {
    const ip = selected.value;
    console.log(ip);
    await modules.browser.start(ip);
});