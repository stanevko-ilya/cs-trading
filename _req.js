const got = require('cloudflare-scraper').default;

async function run() {
    const start = Date.now();

    const url = 'https://cs.money/1.0/market/cart/items';
    const request = await
        got(url, {
            method: 'POST',
            headers: { 'cookie': '' },
            json: { items: [{id: 38135671, price: 0.04}] },
            throwHttpErrors: false
        }).json()
        // rp.get({ url, json: true })
    ;
    console.log(request);
    
    
    console.log(request.items.map((item, index) => `${index+1}) ${item.asset.names.full}`).join('\n'));    
    console.log(Date.now() - start);    
}
run();