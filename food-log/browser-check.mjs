// Starts a local server when TEST_BASE_URL is omitted:
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROMIUM_PATH=/path/to/chromium node food-log/browser-check.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
let server;
if (!process.env.TEST_BASE_URL) {
  const root=fileURLToPath(new URL('../../',import.meta.url));
  server=createServer(async(req,res)=>{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root)){res.writeHead(403).end();return;}
    const file=path+(req.url.split('?')[0].endsWith('/')?'/index.html':'');
    try{const body=await readFile(file);res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(body);}
    catch{res.writeHead(404).end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const base = process.env.TEST_BASE_URL || `http://127.0.0.1:${server.address().port}/doctor-tools/`;
const url = base + 'food-log/';
const endpoint = 'https://script.google.com/macros/s/test-food-log/exec';
const context = await browser.newContext({ viewport:{width:390,height:844}, serviceWorkers:'block' });
const page = await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let mode='success', requests=[];
await page.route('https://script.google.com/**',async route=>{
  const request=JSON.parse(route.request().postData()); requests.push(request);
  if(mode==='network') return route.abort();
  const result=mode==='unauthorized'?{ok:false,error:'UNAUTHORIZED'}:{ok:true,id:request.record.id};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
});
await page.goto(url);
await page.waitForSelector('[data-tag]');
assert.equal(await page.locator('#tags [data-tag]').count(),8);
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
await page.locator('[data-drink="拿鐵"]').click();
await page.locator('[data-drink-sugar="拿鐵"] [data-sugar="無加糖"]').click();
await page.reload();
await page.waitForSelector('[data-drink][aria-pressed=true]');
assert.equal(await page.locator('[data-drink="拿鐵"]').getAttribute('aria-pressed'),'true');
assert.equal(await page.locator('[data-drink-sugar="拿鐵"] [data-sugar="無加糖"]').getAttribute('aria-pressed'),'true');
await page.locator('#submit').click();
assert.match(await page.locator('#status').innerText(),/先展開/);
assert.equal(requests.length,0);
await page.fill('#endpoint',endpoint);await page.fill('#accessKey','test-only');
await page.click('#saveConnection');await page.click('#submit');
await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.equal(requests.length,1);assert.deepEqual(requests[0].record.tags,[]);assert.match(requests[0].record.content,/飲料：拿鐵（無加糖）/);
assert.equal(await page.locator('[data-tag][aria-pressed=true]').count(),0);
// Empty form cannot create a cloud record.
await page.click('#submit');assert.equal(requests.length,1);
// Supplement controls are optional, exclusive where appropriate, cancelable, and persist.
await page.locator('#nutrition summary').click();
await page.locator('[data-nutrition="vegetables"] [data-nutrition-value="少量"]').click();
await page.locator('[data-nutrition="vegetables"] [data-nutrition-value="約 1 拳"]').click();
assert.equal(await page.locator('[data-nutrition="vegetables"] [aria-pressed=true]').count(),1);
await page.locator('[data-nutrition="protein"] [data-nutrition-value="約 1 掌"]').click();
await page.locator('[data-nutrition="fruit"] [data-nutrition-value="約 1 拳"]').click();
await page.locator('[data-nutrition="fruit"] [data-nutrition-value="約 1 拳"]').click();
assert.equal(await page.locator('[data-nutrition="fruit"] [aria-pressed=true]').count(),0);
await page.locator('[data-nutrition="dairy"] [data-nutrition-value="沒有"]').click();
await page.locator('[data-nutrition="dairy"] [data-nutrition-value="無糖優格"]').click();
await page.locator('[data-nutrition="dairy"] [data-nutrition-value="起司"]').click();
assert.equal(await page.locator('[data-nutrition="dairy"] [aria-pressed=true]').count(),2);
await page.locator('[data-drink="美式"]').click();
await page.locator('[data-drink-sugar="美式"] [data-sugar="有加糖"]').click();
await page.locator('[data-drink="茶"]').click();
await page.reload();await page.waitForSelector('[data-drink="茶"][aria-pressed=true]');
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
assert.match(await page.locator('#nutritionLabel').innerText(),/3/);
// Failed response retains fields and ID, survives reload, then retries the same ID.
mode='network';await page.locator('[data-tag="水煮蛋"]').click();await page.fill('#content','飯半碗');
await page.click('#submit');await page.waitForSelector('#next:not([hidden])');
assert.equal(await page.inputValue('#content'),'飯半碗');const failedId=requests.at(-1).record.id;
assert.equal(await page.locator('#pendingList li').count(),1);
await page.reload();await page.waitForSelector('#next:not([hidden])');
assert.equal(await page.locator('#content').isDisabled(),true);
mode='success';await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.equal(requests.at(-1).record.id,failedId);
const detailed=requests.at(-1).record.content;
assert.match(detailed,/蔬菜：約 1 拳/);assert.match(detailed,/蛋白質食物：約 1 掌/);
assert.match(detailed,/乳品：無糖優格、起司/);assert.doesNotMatch(detailed,/水果：/);
assert.match(detailed,/美式（有加糖）/);assert.match(detailed,/茶（加糖情況未記錄）/);
assert.equal((detailed.match(/【補充紀錄】/g)||[]).length,1);
assert.equal(await page.locator('[data-drink][aria-pressed=true]').count(),0);
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
// Previous beverage tags and pending records remain usable after an update.
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hy-food-log-v1'));s.draft.tags=['含糖咖啡','拿鐵'];localStorage.setItem('hy-food-log-v1',JSON.stringify(s));});
await page.reload();await page.waitForSelector('#legacyTagButtons button');
assert.equal(await page.locator('#legacyTagButtons [aria-pressed=true]').count(),2);
await page.locator('#legacyTagButtons [data-tag="拿鐵"]').click();
await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.deepEqual(requests.at(-1).record.tags,['含糖咖啡']);
// Two failed records remain separate, and retry-all clears both after confirmation.
mode='unauthorized';await page.locator('[data-tag="牛肉麵"]').click();await page.click('#submit');
await page.waitForSelector('#next:not([hidden])');await page.click('#next');
await page.locator('[data-tag="乾麵"]').click();await page.click('#submit');await page.waitForSelector('#next:not([hidden])');
assert.equal(await page.locator('#pendingList li').count(),2);
mode='success';await page.click('#retry');await page.waitForFunction(()=>document.querySelector('#pendingPanel').hidden);
// Optional text remains literal in the DOM, with no injected markup.
await page.locator('#optional summary').click();await page.fill('#work','<img src=x onerror=alert(1)>');
await page.locator('[data-tag="八方雲集"]').click();mode='network';await page.click('#submit');
await page.waitForSelector('#next:not([hidden])');assert.equal(await page.locator('#pendingList img').count(),0);
await page.click('#next');
await page.locator('#nutrition summary').click();
await page.locator('[data-drink="拿鐵"]').click();
for(const width of [320,375,390,768,1280]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  assert.ok(await page.locator('#submit').isVisible());
}
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'/tmp/food-log-mobile.png',fullPage:true});
await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/food-log-desktop.png',fullPage:true});
await page.goto(base);await page.fill('#toolSearch','飲食');
assert.equal(await page.locator('[data-tool-id]:visible').count(),1);
await page.locator('[data-tool-id=food-log] a').click();await page.waitForSelector('#tags button');
assert.deepEqual(errors,[]);
await context.close();
// Verify actual SW installation and offline page/assets under /doctor-tools/.
const swContext=await browser.newContext();const swPage=await swContext.newPage();
await swPage.goto(url);await swPage.waitForFunction(()=>navigator.serviceWorker.controller);
await swPage.evaluate(async()=>{await navigator.serviceWorker.ready;});
await swContext.setOffline(true);await swPage.reload();await swPage.waitForSelector('#tags button');
assert.equal(await swPage.locator('#tags button').count(),8);
assert.equal(await swPage.locator('[data-drink]').count(),8);
assert.equal(await swPage.locator('[data-nutrition]').count(),4);
await swContext.close();await browser.close();
if(server) server.close();
console.log('PASS: optional nutrition, per-drink sugar, legacy drafts, serialization, drafts, tags-only submit, required inputs, connection validation, acknowledgement, stable retry IDs, retry-all, literal text, 320–1280px, navigation, JS console, SW/offline. Cloud responses mocked; Google deployment must still be tested live.');
