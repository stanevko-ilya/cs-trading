const rp = require('request-promise')

async function request() {
    const req = await rp('https://cs.money/ru/market/buy/', {
        headers: {
            cookie: 'steamid=76561199303436188; support_token=e3e962da6967a4bf7bc324782b301321990f863ffb84f5f34a64301518bcaa48; csgo_ses=828e5beaec6c78917675f5e9ae0446b3f1c8cf1f8cf2e0157cad2f67fabf3362; _uetvid=390819b0124611f09de9292b37a81190|1m3oo3j|1744059708428|16|1|bat.bing.com/p/insights/c/a'
        }
    });
    const index = req.indexOf('marketBalance');
    console.log(req.slice(index, index+20));
    
}
request();