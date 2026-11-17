import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('./google-apps-script/Code.gs', import.meta.url), 'utf8');
const headers = ['紀錄編號', '日期', '餐別', '飲食內容', '飲食標籤', '工作內容', '備註', '建立時間（台灣）', '寫入時間（台灣）', '補充資料（JSON）'];
function fixture({ rows = [], failed = false, malformed = false } = {}) {
  const properties = new Map(Object.entries({ FOOD_SPREADSHEET_ID: 'sheet', FOOD_TELEGRAM_TOKEN: '123:private-token', FOOD_TELEGRAM_CHAT_ID: '456' }));
  const calls = []; let locked = false;
  const triggers = [{getHandlerFunction: () => 'unrelated'}, {getHandlerFunction: () => 'sendFoodReminder'}];
  const props = {getProperty: key => properties.get(key), setProperty: (key, value) => properties.set(key, value), deleteProperty: key => properties.delete(key)};
  const fixtureHeaders = headers.slice();
  const sheet = {getLastRow: () => rows.length + 1, getRange: (row, col, count = 1, width = 1) => ({
    getDisplayValues: () => row === 1 ? [fixtureHeaders.slice(col - 1, col - 1 + width)] : rows,
    getValue: () => fixtureHeaders[col - 1] || '',
    setValue(value) { fixtureHeaders[col - 1] = value; return this; },
    setValues(values) { if (row === 1) values[0].forEach((value, index) => { fixtureHeaders[col - 1 + index] = value; }); return this; }
  })};
  const triggerConfig = {};
  const builder = Object.fromEntries(['timeBased', 'atHour', 'nearMinute', 'everyDays', 'inTimezone'].map(key => [key, function(value) { triggerConfig[key] = value; return this; }]));
  builder.create = () => {triggers.push({getHandlerFunction: () => 'sendFoodReminder'});};
  const ui = { Button: {OK: 'ok'}, ButtonSet: {OK_CANCEL: 'buttons'}, prompt: () => ({getSelectedButton: () => 'ok', getResponseText: () => calls.filter(c => c === 'prompt').length === 1 ? '123:new-token' : '456'}), alert() {}};
  let promptCount = 0;
  ui.prompt = () => {promptCount++; return {getSelectedButton: () => 'ok', getResponseText: () => promptCount === 1 ? '123:new-token' : '456'};};
  const context = vm.createContext({
    PropertiesService: {getScriptProperties: () => props},
    LockService: {getScriptLock: () => ({waitLock() {locked = true;}, releaseLock() {locked = false;}})},
    SpreadsheetApp: {openById: () => ({getSheetByName: () => sheet}), getUi: () => ui},
    Utilities: {formatDate(date, timezone, pattern) {assert.equal(timezone, 'Asia/Taipei'); assert.equal(pattern, 'yyyy-MM-dd'); return '2026-11-18';}},
    ScriptApp: {getProjectTriggers: () => triggers.slice(), deleteTrigger: trigger => triggers.splice(triggers.indexOf(trigger), 1), newTrigger: name => {triggerConfig.name = name; return builder;}},
    UrlFetchApp: {fetch(url, options) {calls.push({url, body: JSON.parse(options.payload)}); if(failed) throw new Error(url); return {getResponseCode: () => 200, getContentText: () => malformed ? 'bad' : '{"ok":true}'};}},
  });
  vm.runInContext(source, context);
  return {context, properties, calls, triggers, triggerConfig, ui, get locked() {return locked;}};
}
test('reminder uses recorded date, ignores snacks and hydration-only rows, and links only missing meals', () => {
  const f = fixture({rows: [['2026-11-17', '晚餐', '便當'], ['2026-11-18', '早餐', '蛋'], ['2026-11-18', '點心', '水果'], ['2026-11-18', '午餐', '【喝水紀錄】上午：已達500mL']]});
  f.context.sendFoodReminder();
  assert.equal(f.calls.length, 1);
  assert.match(f.calls[0].body.text, /午餐、晚餐/);
  assert.deepEqual(f.calls[0].body.reply_markup.inline_keyboard.map(row => new URL(row[0].url).searchParams.get('meal')), ['午餐', '晚餐']);
  assert.equal(new URL(f.calls[0].body.reply_markup.inline_keyboard[0][0].url).searchParams.get('date'), '2026-11-18');
  assert.equal(f.properties.get('FOOD_TELEGRAM_LAST_DATE'), '2026-11-18');
  assert.equal(f.locked, false);
  f.context.sendFoodReminder(); assert.equal(f.calls.length, 1);
});
test('completed days stay silent; empty day reminds all three meals', () => {
  const f = fixture({rows: ['早餐','午餐','晚餐'].map(meal => ['2026-11-18',meal,'餐點'])});
  f.context.sendFoodReminder(); assert.equal(f.calls.length, 0);
  const empty = fixture(); empty.context.sendFoodReminder();
  assert.equal(empty.calls[0].body.reply_markup.inline_keyboard.length, 3);
});
test('failed or malformed Telegram response never consumes daily reminder or leaks token', () => {
  for (const options of [{failed:true}, {malformed:true}]) {
    const f = fixture(options);
    assert.throws(() => f.context.sendFoodReminder(), error => /發送失敗/.test(error.message) && !/private-token/.test(error.message));
    assert.equal(f.properties.has('FOOD_TELEGRAM_LAST_DATE'), false);
    assert.equal(f.locked, false);
    assert.throws(() => f.context.sendFoodReminder()); assert.equal(f.calls.length, 2);
  }
});
test('owner setup sends test, installs one Taiwan evening trigger and preserves unrelated triggers', () => {
  const f = fixture(); f.context.setupTelegramReminders();
  assert.equal(f.calls.length, 1);
  assert.equal(f.properties.get('FOOD_TELEGRAM_TOKEN'), '123:new-token');
  assert.equal(f.triggers.filter(t => t.getHandlerFunction() === 'sendFoodReminder').length, 1);
  assert.equal(f.triggers.filter(t => t.getHandlerFunction() === 'unrelated').length, 1);
  assert.equal(f.triggerConfig.atHour, 20); assert.equal(f.triggerConfig.nearMinute, 30);
  assert.equal(f.triggerConfig.inTimezone, 'Asia/Taipei'); assert.equal(f.triggerConfig.everyDays, 1);
  f.context.testTelegramReminder(); assert.equal(f.properties.has('FOOD_TELEGRAM_LAST_DATE'), false);
  f.context.disableTelegramReminders();
  assert.equal(f.properties.has('FOOD_TELEGRAM_TOKEN'), false);
  assert.equal(f.triggers.length, 1);
});
test('cancelled setup and failed verification preserve existing reminder configuration', () => {
  const f = fixture(); f.ui.prompt = () => ({getSelectedButton: () => 'cancel'});
  f.context.setupTelegramReminders(); assert.equal(f.calls.length, 0); assert.equal(f.triggers.length, 2);
  const failed = fixture({failed:true}); assert.throws(() => failed.context.setupTelegramReminders());
  assert.equal(failed.properties.get('FOOD_TELEGRAM_TOKEN'), '123:private-token'); assert.equal(failed.triggers.length, 2);
});
