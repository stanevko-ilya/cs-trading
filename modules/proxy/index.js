const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const Module = require('../_class');

class Proxy extends Module {
    #list = [];
    #last_index = -1;
    #last_load = 0;

    async getList() { return await this.#load() && this.#list }
    async getNext() {
        const list = await this.getList();
        if (!list) return false;

        let index = this.#last_index+1;
        if (index > list.length-1) index = 0;
        this.#last_index = index;

        return list[index];
    }

    #save_path = null;
    #inited = false;
    async #load() {
        if (!this.#inited && this.#save_path) {
            this.#inited = true;
            if (fs.existsSync(this.#save_path)) {
                const data = fs.readFileSync(this.#save_path).toString();
                try {
                    const parsed = JSON.parse(data);
                    if (Object.isObject(parsed) && 'last_load' in parsed && 'list' in parsed) {
                        this.#list = parsed.list;
                        this.#last_load = parsed.last_load;
                    }
                } catch (e) { console.warn(e) }
            }
        }

        const config = this.getConfig();
        if ((Date.now() - this.#last_load)/1000/60 < config.params.sessionDuration) return true;

        const request = await rp('https://backend.mangoproxy.com/public-api/v1/upstream/json', {
            method: 'POST',
            json: true,
            headers: { 'x-api-key': config.apiKey },
            body: config.params
        });
        if (Array.isArray(request)) {
            this.#list = request.map(item => item[Object.keys(item)[0]]);
            this.#last_index = -1;
            this.#last_load = Date.now();
            new Promise(() => fs.writeFileSync(this.#save_path, JSON.stringify({ list: this.#list, last_load: this.#last_load }, null, 4)));
            return true;
        }
        return false;
    }
    
    constructor() {
        super(__dirname);
        this.#save_path = path.join(this.getDirname(), './files/save.json');
    }

    async startFunction() { await this.#load() }
}

module.exports = Proxy;