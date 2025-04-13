const rp = require('request-promise');

async function run() {
    const start = Date.now();
    const request = await rp({
        url: 'https://cs.money/1.0/market/sell-orders?limit=5&offset=0',
        proxy: 'http://a470bf9d9fedf6ea8d04b-zone-custom-region-ru:ede1a312623bc5d287980ce8ebebe80298a82a87@p2.mangoproxy.com:2333',
        json: true
    });

    console.log(request);    
    console.log(Date.now() - start);    
}
run();