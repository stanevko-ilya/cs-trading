const path = require('path');
const directorySearch = require('./functions/directorySearch');

module.exports = {
    /** @type {import('./modules/logger')} */
    logger: null,

    /** @type {import('./modules/browser')} */
    browser: null,

    /** @type {import('./modules/markets')} */
    markets: null
};

directorySearch(
    path.join(__dirname, './modules'),
    file_path => {        
        const module_class = require(file_path);
        const name = file_path.replace(/\\/g, '/').split('/').reverse()[1];
        module.exports[name] = new module_class();
    },
    'index.js'
);