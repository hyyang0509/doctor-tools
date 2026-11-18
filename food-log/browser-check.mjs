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
let visit = 0;
const resumeDraft = page => page.goto(url + '?visit=' + ++visit);
const endpoint = 'https://script.google.com/macros/s/test-food-log/exec';
const context = await browser.newContext({ viewport:{width:390,height:844}, serviceWorkers:'block' });
const page = await context.newPage();
await page.clock.setFixedTime(new Date('2026-11-06T16:01:00Z'));
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let mode='success', requests=[];
await page.route('https://script.google.com/**',async route=>{
  const request=JSON.parse(route.request().postData()); requests.push(request);
  if(mode==='network') return route.abort();
  const result=mode==='unauthorized'?{ok:false,error:'UNAUTHORIZED'}:{ok:true,id:request.record.id,...(request.action==='update'?{updated:true}:{})};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
});
await page.goto(url);
await page.waitForSelector('[data-tag]');
// The records shortcut opens the existing private spreadsheet without a receiver API.
const recordsLink=page.getByRole('link',{name:'📋 查看飲食紀錄 ↗'});
assert.equal(await recordsLink.getAttribute('href'),'https://docs.google.com/spreadsheets/d/1BLrkJ5DMfEDXFR_72tiPbPmodONE3o6Bh9UuAwiz-4c/edit');
assert.equal(await recordsLink.getAttribute('target'),'_blank');
assert.match(await recordsLink.getAttribute('rel'),/noreferrer/);
await context.route('https://docs.google.com/spreadsheets/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>Spreadsheet destination (mock)</p>'}));
const popupPromise=page.waitForEvent('popup');
await recordsLink.click();const popup=await popupPromise;
await popup.waitForLoadState();
assert.equal(new URL(popup.url()).hostname,'docs.google.com');
await popup.close();assert.equal(requests.length,0);

assert.equal(await page.locator('#tags [data-tag]').count(),10);
assert.equal(await page.locator('#tags [data-tag="一般便當"], #tags [data-tag="炸雞腿便當"]').count(),0);
assert.equal(await page.locator('[data-drink="白開水"]').isVisible(),false);
assert.equal(await page.inputValue('#date'),'2026-11-07');
await page.click('#yesterday');assert.equal(await page.inputValue('#date'),'2026-11-06');
await page.click('#today');assert.equal(await page.inputValue('#date'),'2026-11-07');
await page.click('#yesterday');
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
await page.locator('[data-drink="拿鐵"]').click();
await page.locator('[data-drink-sugar="拿鐵"] [data-sugar="無加糖"]').click();
await resumeDraft(page);
await page.waitForSelector('[data-drink][aria-pressed=true]');
assert.equal(await page.locator('[data-drink="拿鐵"]').getAttribute('aria-pressed'),'true');
assert.equal(await page.locator('[data-drink-sugar="拿鐵"] [data-sugar="無加糖"]').getAttribute('aria-pressed'),'true');
await page.locator('#submit').click();
assert.match(await page.locator('#status').innerText(),/請先在頁底/);
assert.equal(requests.length,0);
await page.fill('#endpoint',endpoint);await page.fill('#accessKey','test-only');
await page.click('#saveConnection');await page.click('#submit');
await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.equal(requests.length,1);assert.deepEqual(requests[0].record.tags,[]);assert.match(requests[0].record.content,/飲料：拿鐵（無加糖）/);
assert.equal(requests[0].record.date,'2026-11-06');
assert.equal(await page.locator('[data-tag][aria-pressed=true]').count(),0);
// Empty form cannot create a cloud record.
await page.click('#submit');assert.equal(requests.length,1);
await page.click('#sameDay');
assert.equal(await page.inputValue('#date'),'2026-11-06');
assert.equal(await page.locator('[name=meal]:checked').count(),0);
assert.equal(await page.inputValue('#content'),'');
await page.locator('#tags [data-tag="三明治"]').click();
await page.click('#submit');assert.equal(requests.length,1);
await page.locator('#meals label').filter({hasText:'早餐'}).click();
await page.click('#submit');await page.waitForSelector('#sameDay:not([hidden])');
assert.equal(requests.at(-1).record.date,'2026-11-06');
assert.equal(requests.at(-1).record.meal,'早餐');
assert.match(requests.at(-1).record.content,/餐點：三明治/);
// Supplement controls override the quick-food defaults and persist.
await page.locator('[data-tag="水煮蛋"]').click();
assert.equal(await page.locator('#nutrition').evaluate(el=>el.open),true);
await page.locator('[data-nutrition="vegetables"] [data-nutrition-value="少量"]').click();
await page.locator('[data-nutrition="vegetables"] [data-nutrition-value="約 1 拳"]').click();
assert.equal(await page.locator('[data-nutrition="vegetables"] [aria-pressed=true]').count(),1);
await page.locator('[data-nutrition="protein"] [data-nutrition-value="約 1 掌"]').click();
await page.locator('[data-nutrition="fruit"] [data-nutrition-value="約 1 拳"]').click();
await page.locator('[data-nutrition="fruit"] [data-nutrition-value="約 1 拳"]').click();
assert.equal(await page.locator('[data-nutrition="fruit"] [aria-pressed=true]').count(),0);
const dairySlider = page.getByRole('slider', {name:'乳品份量'});
assert.equal(await dairySlider.getAttribute('aria-valuetext'),'沒有');
assert.equal(await dairySlider.evaluate(el=>el.style.getPropertyValue('--portion-fill')),'0%');
assert.equal(await page.locator('#nutrition input[type=range]').count(),5);
await page.locator('[data-nutrition="dairy"] [data-nutrition-value="半杯"]').click();
await page.locator('[data-drink="美式"]').click();
await page.locator('[data-drink-sugar="美式"] [data-sugar="有加糖"]').click();
await page.locator('[data-drink="茶"]').click();
await resumeDraft(page);await page.waitForSelector('[data-drink="茶"][aria-pressed=true]');
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
assert.match(await page.locator('#nutritionLabel').innerText(),/蔬菜 約 1 拳/);
// Reload resets the form but retains the failed upload and its ID.
mode='network';await page.fill('#content','飯半碗');
await page.click('#submit');await page.waitForSelector('#next:not([hidden])');
assert.equal(await page.inputValue('#content'),'飯半碗');const failedId=requests.at(-1).record.id;
assert.equal(await page.locator('#pendingList li').count(),1);
await page.reload();await page.waitForSelector('#pendingList li');
assert.equal(await page.inputValue('#content'),'');
assert.equal(await page.inputValue('#date'),'2026-11-07');
assert.equal(await page.locator('[name=meal]:checked').inputValue(),'早餐');
assert.equal(await page.locator('#content').isDisabled(),false);
mode='success';await page.click('#retry');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.equal(requests.at(-1).record.id,failedId);
const detailed=requests.at(-1).record.content;
assert.match(detailed,/蔬菜：約 1 拳/);assert.match(detailed,/蛋白質食物：約 1 掌/);
assert.match(detailed,/乳品：半杯/);assert.doesNotMatch(detailed,/水果：/);
assert.match(detailed,/美式（有加糖）/);assert.match(detailed,/茶（加糖情況未記錄）/);
assert.equal((detailed.match(/【補充紀錄】/g)||[]).length,1);
assert.equal(await page.locator('[data-drink][aria-pressed=true]').count(),0);
assert.equal(await page.locator('#nutrition').getAttribute('open'),null);
// Previous beverage tags and pending records remain usable after an update.
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hy-food-log-v1'));s.draft.tags=['含糖咖啡','拿鐵','一般便當'];s.draft.drinks=[{type:'白開水',sugar:''}];s.draft.nutrition={dairy:['無糖優格','起司']};localStorage.setItem('hy-food-log-v1',JSON.stringify(s));});
await resumeDraft(page);await page.waitForSelector('#legacyTagButtons button');
assert.equal(await page.locator('#legacyTagButtons [aria-pressed=true]').count(),3);
assert.equal(await page.locator('[data-drink="白開水"]').isVisible(),true);
await page.locator('[data-drink="白開水"]').click();
assert.equal(await page.locator('[data-drink="白開水"]').isVisible(),false);
await page.locator('#legacyTagButtons [data-tag="拿鐵"]').click();
await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.deepEqual(requests.at(-1).record.tags,['含糖咖啡','一般便當']);
assert.deepEqual(requests.at(-1).record.nutrition.dairy,['無糖優格','起司']);
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
// Compact quick presets, editable nutrition and three multi-select water buttons.
mode='success';
await page.evaluate(async()=>{const m=await import('./model.mjs');localStorage.setItem(m.STORE_KEY,JSON.stringify({draft:m.taipeiDefaults(),pending:[],history:[],templates:[{id:'old',name:'舊常吃餐'}]}));});
await resumeDraft(page); await page.waitForSelector('#tags button');
assert.equal(await page.locator('#templates, #saveTemplate, #manageTemplates').count(),0);
assert.equal(await page.locator('#hydrationGroups button').count(),3);
assert.equal(await page.getByText('僅顯示此裝置已成功上傳的紀錄').count(),0);
assert.ok(await page.evaluate(()=>document.querySelector('#foodForm').compareDocumentPosition(document.querySelector('#connection')) & Node.DOCUMENT_POSITION_FOLLOWING));
assert.deepEqual(await page.locator('#hydrationGroups button').allTextContents(),['上午','下午','晚上']);
await page.locator('#meals label').filter({hasText:'早餐'}).click();
await page.locator('[data-tag="醫院便當"]').click();
for (const [group,value] of [['starch','1 碗'],['vegetables','約 1 拳'],['protein','約 1 掌'],['fruit','沒有'],['dairy','沒有']]) {
  assert.equal(await page.locator(`[data-nutrition="${group}"] [data-nutrition-value="${value}"]`).getAttribute('aria-pressed'),'true');
}
assert.equal(await page.locator('#nutrition').evaluate(el=>el.open),true);
await page.locator('#clearPortions').click();
assert.equal(await page.locator('[data-nutrition] [aria-pressed=true]').count(),0);
assert.equal(await page.locator('[data-tag="醫院便當"]').getAttribute('aria-pressed'),'true');
await page.locator('[data-tag="醫院便當"]').click();
assert.match(await page.locator('#nutritionLabel').innerText(),/主食 1 碗/);
await page.locator('[data-tag="醫院便當"]').click();
assert.equal(await page.locator('[data-nutrition] [aria-pressed=true]').count(),0);
await page.locator('[data-tag="醫院便當"]').click();
await page.locator('[data-tag="水煮蛋"]').click();
assert.equal(await page.locator('#tags [aria-pressed=true]').count(),2);
const starchSlider = page.getByRole('slider', {name:'主食份量'});
await page.locator('[data-tag="三明治"]').click();
assert.match(await page.locator('#nutritionLabel').innerText(), /主食 1.5 碗/);
await starchSlider.focus();
await starchSlider.press('Home');
await starchSlider.press('ArrowRight');
assert.equal(await starchSlider.getAttribute('aria-valuetext'), '半碗');
await page.locator('[data-tag="三明治"]').click();
assert.equal(await starchSlider.getAttribute('aria-valuetext'), '半碗');
await page.locator('#hydrationGroups [data-water="上午"]').click();
await page.locator('#hydrationGroups [data-water="上午"]').click();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hy-food-log-v1')).draft.hydration.上午),undefined);
await page.locator('#hydrationGroups [data-water="上午"]').click();
await page.locator('#hydrationGroups [data-water="下午"]').click();
await resumeDraft(page);await page.waitForSelector('#tags button');
assert.equal(await page.locator('[data-nutrition="starch"] [data-nutrition-value="半碗"]').getAttribute('aria-pressed'),'true');
assert.equal(await page.locator('#hydrationGroups [aria-pressed=true]').count(),2);
await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
const originalId=requests.at(-1).record.id;
assert.equal(requests.at(-1).record.nutrition.starch,'半碗');
assert.equal(requests.at(-1).record.nutritionOrigin,'manual');
assert.deepEqual(requests.at(-1).record.hydration,{上午:'達標',下午:'達標'});
assert.match(await page.locator('#overview').innerText(),/早餐 ✓/);
assert.match(await page.locator('#waterOverview').innerText(),/上午 ✓/);
assert.equal(await page.locator('#hydrationGroups [aria-pressed=true]').count(),0);
// Confirmed history edits preserve manually adjusted portions and stable ID.
await page.locator('#historyList').evaluate(el=>el.parentElement.open=true);
await page.locator('#historyList button').first().click();
await page.fill('#content','今天飯半碗');
await resumeDraft(page); await page.waitForSelector('#cancelEdit:not([hidden])');
await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.equal(requests.at(-1).action,'update');assert.equal(requests.at(-1).record.id,originalId);
assert.equal(requests.at(-1).record.nutrition.starch,'半碗');
assert.equal(await page.locator('#historyList li').count(),1);
// Legacy below-threshold data remains intact; a new checked period is water-only.
await page.evaluate(()=>{const key='hy-food-log-v1';const state=JSON.parse(localStorage.getItem(key));state.draft.hydration={上午:'未達'};localStorage.setItem(key,JSON.stringify(state));});
await resumeDraft(page);await page.waitForSelector('#hydrationGroups button');
assert.equal(await page.locator('#hydrationGroups [aria-pressed=true]').count(),0);
await page.locator('#hydrationGroups [data-water="晚上"]').click();
await page.click('#submit');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已確認'));
assert.match(requests.at(-1).record.content,/^【喝水紀錄】/);
assert.deepEqual(requests.at(-1).record.hydration,{上午:'未達',晚上:'達標'});
assert.match(await page.locator('#waterOverview').innerText(),/上午 未達/);
assert.match(await page.locator('#waterOverview').innerText(),/晚上 ✓/);
assert.match(await page.locator('#overview').innerText(),/午餐 待記/);
await page.goto(url+'?date=2026-11-06&meal='+encodeURIComponent('晚餐'));
await page.waitForSelector('#tags button');
assert.equal(await page.inputValue('#date'),'2026-11-06');
assert.equal(await page.locator('[name=meal]:checked').inputValue(),'晚餐');
await page.fill('#content','保留這份草稿');
await page.goto(url+'?date=2026-11-05&meal='+encodeURIComponent('午餐'));
await page.waitForSelector('#tags button');
assert.equal(await page.inputValue('#date'),'2026-11-06');
assert.equal(await page.inputValue('#content'),'保留這份草稿');
await page.click('#newMeal');
assert.equal(await page.inputValue('#date'),'2026-11-07');
assert.equal(await page.locator('[name=meal]:checked').inputValue(),'早餐');
assert.equal(await page.inputValue('#content'),'');
await page.locator('[data-tag="醫院便當"]').click();
await page.locator('[data-drink="茶"]').click();
await page.locator('[data-water="上午"]').click();
await page.fill('#content','重整前的草稿');
await page.reload();
await page.waitForSelector('#overview button');
assert.equal(await page.inputValue('#content'),'');
assert.equal(await page.locator('[data-tag][aria-pressed=true],[data-water][aria-pressed=true],[data-drink][aria-pressed=true]').count(),0);
assert.equal(await page.locator('#nutrition').evaluate(el=>el.open),false);
assert.equal(await page.locator('#nutritionLabel').innerText(),'選填');
assert.equal(await page.locator('#connectionLabel').innerText(),'已設定');
assert.match(await page.locator('#overview').innerText(),/早餐 ✓/);
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
// Old workers cache the unversioned modules. A fresh page must bypass those entries.
await swPage.evaluate(async () => {
  const old = await caches.open('hy-tools-v29');
  for (const name of ['app.mjs', 'model.mjs']) {
    await old.put(new URL(name, location.href), new Response('throw new Error("stale module")', {
      headers: {'Content-Type': 'text/javascript'}
    }));
  }
  await old.put(new URL('styles.css', location.href), new Response('body{display:none}', {
    headers: {'Content-Type': 'text/css'}
  }));
  localStorage.setItem('hy-food-log-connection-v1', JSON.stringify({
    endpoint: 'https://script.google.com/macros/s/cache-test/exec', key: 'mock'
  }));
  document.querySelector('#content').value = '更新前的草稿';
  document.querySelector('#content').dispatchEvent(new Event('input', {bubbles: true}));
});
await swPage.reload();
await swPage.waitForSelector('#tags button');
assert.equal(await swPage.inputValue('#content'), '');
assert.equal(await swPage.locator('#connectionLabel').textContent(), '已設定');
await swContext.setOffline(true);await swPage.reload();await swPage.waitForSelector('#tags button');
assert.equal(await swPage.locator('#tags button').count(),10);
assert.equal(await swPage.locator('[data-drink]:visible').count(),7);
assert.equal(await swPage.locator('[data-nutrition]').count(),5);
assert.equal(await swPage.locator('#hydrationGroups button').count(),3);
assert.equal(await swPage.locator('#templates').count(),0);
await swContext.close();await browser.close();
if(server) server.close();
console.log('PASS: optional nutrition, per-drink sugar, legacy drafts, serialization, drafts, tags-only submit, required inputs, connection validation, acknowledgement, stable retry IDs, retry-all, literal text, 320–1280px, navigation, JS console, SW/offline. Cloud responses mocked; Google deployment must still be tested live.');
