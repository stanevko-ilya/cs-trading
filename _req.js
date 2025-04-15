require('./customize')
const asyncDelay = require('./functions/asyncDelay');
const cheerio = require('cheerio');
const got = require('cloudflare-scraper').default;

async function run() {
    const start = Date.now();

    const headers = { 'cookie': 'steamid=76561198323328082;support_token=a48fcfa5dc012168fccdb5b27f42e0ba44680601ab7bef19b517a703263f8da8;csgo_ses=5418a12e5e058e4107c381e5a24525492f0075ae00e60d8db6fb293c85a109fa;_uetvid=390819b0124611f09de9292b37a81190|1dxzc0z|1744661875339|3|1|bat.bing.com/p/insights/c/b' };
    
    // const req1 = await got('https://cs.money/ru/market/buy', { headers }).text();
    // console.log(JSON.parse(cheerio.load(req1)('#__app-params').text())?.userInfo?.marketBalance);
    console.log( (await got('https://cs.money/get_user_data', {
        method: 'POST',
        headers
    })).closed);
        
    const request = await
        got('https://cs.money/1.0/market/purchase', {
            method: 'POST',
            headers,
            json: { items: [{ id: 38135671, price: 0.04 }] },
            throwHttpErrors: false
        }).json()
        // rp.get({ url, json: true })
    ;
    console.log(request);
    
    
    console.log(request.items.map((item, index) => `${index+1}) ${item.asset.names.full}`).join('\n'));    
    console.log(Date.now() - start);    
}
run();