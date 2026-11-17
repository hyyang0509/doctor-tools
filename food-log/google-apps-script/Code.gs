// Web-app uploads use openById, which requires the spreadsheets OAuth scope.
// Do not limit this project to spreadsheets.currentonly.
const FOOD_HEADERS = ['紀錄編號', '日期', '餐別', '飲食內容', '飲食標籤', '工作內容', '備註', '建立時間（台灣）', '寫入時間（台灣）'];
const FOOD_OBSERVATIONS_HEADER = '補充資料（JSON）';
const FOOD_TAGS = ['水煮蛋', '拿鐵', '美式', '含糖咖啡', '醫院便當', '一般便當', '炸雞腿便當', '無糖飲料', '含糖飲料', '珍奶', '小火鍋', '八方雲集', '乾麵', '牛肉麵'];

// Run once from the spreadsheet's bound Apps Script editor; safe to run again.
function setup() {
  const bound = SpreadsheetApp.getActiveSpreadsheet();
  if (!bound) throw new Error('請從目標試算表的「擴充功能 → Apps Script」執行。');
  // Exercise the exact same authorized opening path as doPost before deployment.
  const ss = SpreadsheetApp.openById(bound.getId());
  ss.setSpreadsheetTimeZone('Asia/Taipei');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('FOOD_SPREADSHEET_ID', ss.getId());
  const key = props.getProperty('FOOD_ACCESS_KEY') || Utilities.getUuid() + Utilities.getUuid();
  props.setProperty('FOOD_ACCESS_KEY', key);
  const sheet = ss.getSheetByName('飲食紀錄') || ss.insertSheet('飲食紀錄');
  ensureHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, FOOD_HEADERS.length).setBackground('#eeeeee').setFontWeight('bold');
  sheet.setColumnWidth(1, 290);
  sheet.setColumnWidths(2, 2, 110);
  sheet.setColumnWidths(4, 4, 240);
  sheet.setColumnWidths(8, 2, 180);
  SpreadsheetApp.getUi().alert('初始化完成', '請將以下連線金鑰貼入飲食紀錄工具。\n金鑰只供自己使用，不要貼入 GitHub：\n\n' + key, SpreadsheetApp.getUi().ButtonSet.OK);
}

function doGet() {
  // No reading endpoint: private records are never returned by the public web app.
  return json_({ ok: true, service: 'hy-food-log', version: 3 });
}

function doPost(e) {
  let lock;
  let stage = 'request';
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 20000) return json_({ ok: false, error: 'INVALID_REQUEST' });
    const body = JSON.parse(raw);
    const props = PropertiesService.getScriptProperties();
    const key = props.getProperty('FOOD_ACCESS_KEY');
    if (!key || body.key !== key) return json_({ ok: false, error: 'UNAUTHORIZED' });
    if (!['append', 'update'].includes(body.action)) return json_({ ok: false, error: 'INVALID_ACTION' });
    const r = body.record;
    validate_(r);
    const sheetId = props.getProperty('FOOD_SPREADSHEET_ID');
    if (!sheetId) throw new Error('NOT_CONFIGURED');
    stage = 'lock';
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    stage = 'open_spreadsheet';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('飲食紀錄');
    if (!sheet) throw new Error('SHEET_MISSING');
    stage = 'headers';
    ensureHeaders_(sheet);
    const existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
      .createTextFinder(r.id).matchEntireCell(true).useRegularExpression(false).findNext() : null;
    if (body.action === 'append' && existing) return json_({ ok: true, id: r.id, duplicate: true });
    if (body.action === 'update' && !existing) throw new Error('NOT_FOUND');
    const createdTime = body.action === 'update'
      ? sheet.getRange(existing.getRow(), 8, 1, 1).getDisplayValues()[0][0]
      : Utilities.formatDate(new Date(r.createdAt), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    const row = [r.id, r.date, r.meal, r.content.trim(), r.tags.join('、'), r.work.trim(), r.notes.trim(),
      createdTime,
      Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss'),
      r.observations === undefined ? '' : JSON.stringify(r.observations)];
    // Force user text to literal values, including spreadsheet formula prefixes.
    stage = 'write';
    sheet.getRange(body.action === 'update' ? existing.getRow() : sheet.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row.map(literal_)]);
    SpreadsheetApp.flush();
    return json_({ ok: true, id: r.id, updated: body.action === 'update' });
  } catch (error) {
    // Report only fixed error codes and stages, never incoming text/keys/IDs.
    const known = ['NOT_FOUND', 'INVALID_OBSERVATIONS', 'NOT_CONFIGURED', 'SHEET_MISSING', 'HEADER_MISMATCH', 'INVALID_ID', 'INVALID_DATE', 'INVALID_MEAL', 'INVALID_TAGS', 'INVALID_TEXT', 'EMPTY_RECORD', 'INVALID_TIME'];
    const code = known.includes(error.message) ? error.message : 'WRITE_FAILED';
    console.error('hy-food-log failure: ' + stage + ' / ' + code);
    return json_({ ok: false, error: code, stage: stage });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

// Owner-only diagnostic: run in the editor, not exposed through doGet/doPost.
// It reads only the header and does not create a food record or print the key.
function checkConnection() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FOOD_ACCESS_KEY') || !props.getProperty('FOOD_SPREADSHEET_ID')) throw new Error('請先執行 setup 完成初始化。');
  const sheet = SpreadsheetApp.openById(props.getProperty('FOOD_SPREADSHEET_ID')).getSheetByName('飲食紀錄');
  if (!sheet) throw new Error('找不到「飲食紀錄」工作表，請重新執行 setup。');
  ensureHeaders_(sheet);
  console.log('連線檢查成功：可透過 openById 開啟試算表，原九個欄名與補充資料欄正確。請確認新版本已部署，再從工具重試上傳。');
}

function validate_(r) {
  if (!r || typeof r.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(r.id)) throw new Error('INVALID_ID');
  if (typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || r.date < '1900-01-01') throw new Error('INVALID_DATE');
  const date = new Date(r.date + 'T00:00:00Z');
  if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== r.date) throw new Error('INVALID_DATE');
  if (!['早餐', '午餐', '晚餐', '點心'].includes(r.meal)) throw new Error('INVALID_MEAL');
  if (!Array.isArray(r.tags) || r.tags.length > FOOD_TAGS.length || new Set(r.tags).size !== r.tags.length || r.tags.some(t => !FOOD_TAGS.includes(t))) throw new Error('INVALID_TAGS');
  ['content', 'work', 'notes'].forEach(k => {
    if (typeof r[k] !== 'string' || r[k].length > 1000) throw new Error('INVALID_TEXT');
  });
  if (!r.content.trim() && !r.tags.length) throw new Error('EMPTY_RECORD');
  validateObservations_(r.observations);
  if (typeof r.createdAt !== 'string' || r.createdAt.length > 40 || isNaN(new Date(r.createdAt).getTime())) throw new Error('INVALID_TIME');
}

function validateObservations_(value) {
  if (value === undefined) return;
  const object = input => input && typeof input === 'object' && !Array.isArray(input);
  const invalid = () => { throw new Error('INVALID_OBSERVATIONS'); };
  if (!object(value) || JSON.stringify(value).length > 10000 ||
      Object.keys(value).some(k => !['hydration', 'nutrition', 'drinks', 'quickFoods'].includes(k))) invalid();
  if (value.hydration !== undefined && (!object(value.hydration) ||
      Object.entries(value.hydration).some(([k,v]) => !['上午', '下午', '晚上'].includes(k) || !['達標', '未達'].includes(v)))) invalid();
  if (value.nutrition !== undefined) {
    const choices = {starch: ['沒有', '半碗', '1 碗', '2 碗以上'], vegetables: ['沒有', '少量', '約 1 拳', '2 拳以上'], protein: ['沒有', '少量', '約 1 掌', '2 掌以上'],
      fruit: ['沒有', '約 1 拳', '2 拳以上'], dairy: ['沒有', '鮮奶', '無糖優格', '無糖優酪乳', '起司', '其他乳品']};
    if (!object(value.nutrition)) invalid();
    for (const [k, v] of Object.entries(value.nutrition)) {
      if (!Object.prototype.hasOwnProperty.call(choices, k)) invalid();
      const values = k === 'dairy' ? v : [v];
      if (!Array.isArray(values) || new Set(values).size !== values.length || values.some(item => !choices[k].includes(item)) ||
          (values.includes('沒有') && values.length > 1)) invalid();
    }
  }
  if (value.drinks !== undefined && (!Array.isArray(value.drinks) || value.drinks.length > 8 ||
      new Set(value.drinks.map(d => d && d.type)).size !== value.drinks.length ||
      value.drinks.some(d => !object(d) || Object.keys(d).some(k => !['type','sugar'].includes(k)) ||
        !['美式','拿鐵','茶','豆漿','鮮奶','珍奶','白開水','其他'].includes(d.type) || !['','無加糖','有加糖','不確定'].includes(d.sugar)))) invalid();
  if (value.quickFoods !== undefined && (!Array.isArray(value.quickFoods) || value.quickFoods.length > 18 ||
      new Set(value.quickFoods).size !== value.quickFoods.length ||
      value.quickFoods.some(v => !FOOD_TAGS.concat(['外食便當','三明治','壽司','漢堡']).includes(v)))) invalid();
}

function ensureHeaders_(sheet) {
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, FOOD_HEADERS.length).setValues([FOOD_HEADERS]);
  const headers = sheet.getRange(1, 1, 1, FOOD_HEADERS.length).getDisplayValues()[0];
  if (!FOOD_HEADERS.every((value, index) => headers[index] === value)) throw new Error('HEADER_MISMATCH');
  const extra = sheet.getRange(1, 10, 1, 1).getDisplayValues()[0][0];
  if (extra && extra !== FOOD_OBSERVATIONS_HEADER) throw new Error('HEADER_MISMATCH');
  if (!extra) sheet.getRange(1, 10, 1, 1).setValues([[FOOD_OBSERVATIONS_HEADER]]);
}
function literal_(value) { return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }

// Editor-only Telegram setup. None of these functions is routed by doGet/doPost.
// Secrets remain in Script Properties, never in this repository or the web form.
function setupTelegramReminders() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FOOD_SPREADSHEET_ID')) throw new Error('請先執行 setup。');
  const tokenInput = ui.prompt('Telegram 漏記提醒', '貼上自己的 Bot token（留空沿用既有設定）。請勿分享或貼入 GitHub。', ui.ButtonSet.OK_CANCEL);
  if (tokenInput.getSelectedButton() !== ui.Button.OK) return;
  const token = tokenInput.getResponseText().trim() || props.getProperty('FOOD_TELEGRAM_TOKEN');
  const chatInput = ui.prompt('Telegram 收件對象', '貼上自己的私人 chat ID（留空沿用既有設定）。請先在 Telegram 對這個 bot 按 Start。', ui.ButtonSet.OK_CANCEL);
  if (chatInput.getSelectedButton() !== ui.Button.OK) return;
  const chatId = chatInput.getResponseText().trim() || props.getProperty('FOOD_TELEGRAM_CHAT_ID');
  if (!token || !/^\d+:[A-Za-z0-9_-]+$/.test(token) || !chatId || !/^\d+$/.test(chatId)) {
    throw new Error('Bot token 或私人 chat ID 格式不正確；設定未變更。');
  }
  // Verify delivery before changing the stored configuration or installing a trigger.
  sendFoodTelegram_(token, chatId, { text: '飲食漏記提醒已連線。每天台灣時間約 20:30，僅在早餐、午餐或晚餐尚未收到紀錄時提醒。' });
  props.setProperty('FOOD_TELEGRAM_TOKEN', token);
  props.setProperty('FOOD_TELEGRAM_CHAT_ID', chatId);
  removeFoodReminderTriggers_();
  ScriptApp.newTrigger('sendFoodReminder').timeBased().atHour(20).nearMinute(30).everyDays(1).inTimezone('Asia/Taipei').create();
  ui.alert('提醒已啟用。每天約 20:30（Google 排程可能前後約 15 分鐘）；三餐皆有紀錄就不發送。');
}

function testTelegramReminder() {
  const props = PropertiesService.getScriptProperties();
  sendFoodTelegram_(props.getProperty('FOOD_TELEGRAM_TOKEN'), props.getProperty('FOOD_TELEGRAM_CHAT_ID'), {
    text: '飲食紀錄 Telegram 測試成功。這封測試不會佔用今天的漏記提醒。',
    reply_markup: { inline_keyboard: [[{ text: '開啟飲食紀錄', url: 'https://hyyang0509.github.io/doctor-tools/food-log/' }]] }
  });
}

function disableTelegramReminders() {
  removeFoodReminderTriggers_();
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('FOOD_TELEGRAM_TOKEN');
  props.deleteProperty('FOOD_TELEGRAM_CHAT_ID');
  props.deleteProperty('FOOD_TELEGRAM_LAST_DATE');
  SpreadsheetApp.getUi().alert('已關閉飲食漏記提醒，並移除這個專案保存的 Telegram 憑證。');
}

function removeFoodReminderTriggers_() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'sendFoodReminder')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

function sendFoodReminder() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('FOOD_TELEGRAM_TOKEN');
  const chatId = props.getProperty('FOOD_TELEGRAM_CHAT_ID');
  const sheetId = props.getProperty('FOOD_SPREADSHEET_ID');
  if (!token || !chatId || !sheetId) throw new Error('請先完成 Telegram 提醒設定。');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    if (props.getProperty('FOOD_TELEGRAM_LAST_DATE') === today) return;
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('飲食紀錄');
    if (!sheet) throw new Error('找不到「飲食紀錄」工作表。');
    ensureHeaders_(sheet);
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 3).getDisplayValues() : [];
    const seen = new Set(rows.filter(row => row[0] === today && !row[2].startsWith('【喝水紀錄】')).map(row => row[1]));
    const missing = ['早餐', '午餐', '晚餐'].filter(meal => !seen.has(meal));
    if (!missing.length) return;
    sendFoodTelegram_(token, chatId, {
      text: today + ' 尚未收到' + missing.join('、') + '紀錄。若資料仍在手機待傳清單，請開啟表單重試；今天沒吃的餐也可註記。',
      reply_markup: { inline_keyboard: missing.map(meal => [{ text: '補記' + meal,
        url: 'https://hyyang0509.github.io/doctor-tools/food-log/?date=' + today + '&meal=' + encodeURIComponent(meal) }]) }
    });
    // Mark only after Telegram confirms acceptance. A failed send can be retried.
    props.setProperty('FOOD_TELEGRAM_LAST_DATE', today);
  } finally { lock.releaseLock(); }
}

function sendFoodTelegram_(token, chatId, message) {
  if (!token || !chatId) throw new Error('尚未設定 Telegram Bot token 與 chat ID。');
  try {
    const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(Object.assign({ chat_id: chatId }, message)), muteHttpExceptions: true
    });
    const body = JSON.parse(response.getContentText());
    if (response.getResponseCode() !== 200 || body.ok !== true) throw new Error('DELIVERY_FAILED');
  } catch (_) {
    // Fetch exceptions may contain the request URL/token; replace them entirely.
    throw new Error('Telegram 發送失敗。請確認 Bot token、私人 chat ID，並先對 bot 按 Start；未記為已提醒。');
  }
}
