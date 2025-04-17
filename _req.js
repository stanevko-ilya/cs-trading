const got = require('cloudflare-scraper').default;

async function run() {
    const cookie = 'steamid=76561198323328082;support_token=1d85dec8497a5e996069ba6186a3dec30bb6015df42715240793e641767ad20a;csgo_ses=9e6f383df4d0d1bdbc16592fe5e0f06c5b2f6fae86e3b839e67ff6a2d60cd3de;_uetvid=d7c0a8701a2211f08372abf37b855195|14yv3ol|1744739740425|1|1|bat.bing.com/p/insights/c/s';
    
    const request = got(
        'https://cs.money/get_currencies',
        {
            throwHttpErrors: false,
            headers: { cookie },
            // localAddress:
                // undefined // IP по умолчанию
                // '83.222.19.75'
                // '83.222.17.116' // 2й IP адресс
                // '90.156.169.220' // 3й IP адрес
        }
    );
    
    const response = await request.text();
    console.log(response);    
}
run();