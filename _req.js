require('./customize')
const asyncDelay = require('./functions/asyncDelay');
const getUserAgent = require('./functions/getUserAgent');
const cheerio = require('cheerio');
const got = require('cloudflare-scraper').default;

async function run1() {
    const start = Date.now();

    const headers = { 'cookie': 'steamid=76561198323328082;support_token=1d85dec8497a5e996069ba6186a3dec30bb6015df42715240793e641767ad20a;csgo_ses=9e6f383df4d0d1bdbc16592fe5e0f06c5b2f6fae86e3b839e67ff6a2d60cd3de;_uetvid=d7c0a8701a2211f08372abf37b855195|14yv3ol|1744739740425|1|1|bat.bing.com/p/insights/c/s' };
    const req1 = await got('https://cs.money/ru/market/buy', { headers }).text();
    // console.log(JSON.parse(cheerio.load(req1)('#__app-params').text())?.userInfo?.marketBalance);
    console.log(await got('https://cs.money/1.0/market/user-store', { headers, throwHttpErrors: false }).json());
    
    console.log(await got('https://cs.money/get_user_data', {
        method: 'POST',
        headers
    }).json());
        
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

async function run() {
    const req1 = await got('https://cs.money', { headers: { 'user-agent': getUserAgent() }, localAddress: '90.156.169.220', throwHttpErrors: false }).text();
    console.log(req1);    
}
run();