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
    const req = await got.get(
        {
            url: 'https://cs.money/1.0/market/sell-orders?limit=60&offset=0',
            throwHttpErrors: false,
            // headers: {
            //     cookie:
            //         'registered_user=true; cc_service2={%22services%22:[%22necessary%22%2C%22gtm%22%2C%22ym%22%2C%22amplitude%22%2C%22gleam%22%2C%22esputnik%22%2C%22hotjar%22%2C%22userSesDatToAnalytic%22%2C%22userSesDatToMarketing%22%2C%22cardVisualSize%22]%2C%22acceptanceDate%22:1744892408083%2C%22revision%22:0%2C%22additionalData%22:{%22country%22:%22RU%22}}; group_id=88128ba7-a318-455e-8e62-373d1bfdcda0; session_timer_104055=1; session_timer_-1653249155=1; sc=8CAB64EB-2340-CC2B-4D91-8E9F333152E3; _gcl_au=1.1.1555494824.1744892409; _hjSession_2848248=eyJpZCI6IjY4M2ExM2U1LWZiMjUtNDdlYy1hYjA3LWM2YTZkNGI0MWJjZSIsImMiOjE3NDQ4OTI0MDk0NzcsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=; _ym_uid=1744892410609714766; _ym_d=1744892410; _scid=iIZ7kahjS_smICLmxr_v6HybNx_4Usa8; _ga=GA1.1.1742003983.1744892410; isAnalyticEventsLimit=true; _fbp=fb.1.1744892411394.304944733434830124; _ScCbts=%5B%5D; _ym_isad=2; _ym_visorc=b; _sctr=1%7C1744848000000; steamid=76561199303436188; avatar=https://avatars.steamstatic.com/0e96fd1da4c91017a7c1de980d6361b139e6831d_medium.jpg; username=F%40L%24ER; _hjSessionUser_2848248=eyJpZCI6IjIzOThkYTQ0LWRiOWEtNThkNS1iNmJiLTYwMTE5MGUwZDU0OCIsImNyZWF0ZWQiOjE3NDQ4OTI0MDk0NzIsImV4aXN0aW5nIjp0cnVlfQ==; _hjHasCachedUserAttributes=true; _scid_r=ggZ7kahjS_smICLmxr_v6HybNx_4Usa8gaf8KA; _uetsid=4e867c601b8611f0a7b3090b0cc709aa|p9cn0y|2|fv5|0|1933; _uetvid=4e879ac01b8611f0a42b21c39ac231d7|1wxa3p8|1744892659211|3|1|bat.bing.com/p/insights/c/s; amplitude_id_c14fa5162b6e034d1c3b12854f3a26f5cs.money=eyJkZXZpY2VJZCI6ImNjZTRhNDYwLTdlM2UtNDExNS05NDFlLWJmZWY2MTUyOTUzNlIiLCJ1c2VySWQiOiI3NjU2MTE5OTMwMzQzNjE4OCIsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTc0NDg5MjQwODcxNiwibGFzdEV2ZW50VGltZSI6MTc0NDg5MjY2MDM2MywiZXZlbnRJZCI6OCwiaWRlbnRpZnlJZCI6Niwic2VxdWVuY2VOdW1iZXIiOjE0fQ==; was_called_in_current_session_104055=1; _ga_HY7CCPCD7H=GS1.1.1744892409.1.1.1744892677.40.0.0'
            // }
        }
    ).text();
    console.log(req);    
}
document.get
run();