/** @OnlyCurrentDoc */
const FOOD_HEADERS = ['紀錄編號', '日期', '餐別', '飲食內容', '飲食標籤', '工作內容', '備註', '建立時間（台灣）', '寫入時間（台灣）'];
const FOOD_TAGS = ['水煮蛋', '拿鐵', '美式', '含糖咖啡', '醫院便當', '一般便當', '炸雞腿便當', '無糖飲料', '含糖飲料', '珍奶', '小火鍋', '八方雲集', '乾麵', '牛肉麵'];

// Run once from the spreadsheet's bound Apps Script editor; safe to run again.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('請從目標試算表的「擴充功能 → Apps Script」執行。');
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
  return json_({ ok: true, service: 'hy-food-log', version: 1 });
}

function doPost(e) {
  let lock;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 20000) return json_({ ok: false, error: 'INVALID_REQUEST' });
    const body = JSON.parse(raw);
    const props = PropertiesService.getScriptProperties();
    const key = props.getProperty('FOOD_ACCESS_KEY');
    if (!key || body.key !== key) return json_({ ok: false, error: 'UNAUTHORIZED' });
    if (body.action !== 'append') return json_({ ok: false, error: 'INVALID_ACTION' });
    const r = body.record;
    validate_(r);
    const sheetId = props.getProperty('FOOD_SPREADSHEET_ID');
    if (!sheetId) throw new Error('NOT_CONFIGURED');
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('飲食紀錄');
    if (!sheet) throw new Error('SHEET_MISSING');
    ensureHeaders_(sheet);
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
      .createTextFinder(r.id).matchEntireCell(true).useRegularExpression(false).findNext()) {
      return json_({ ok: true, id: r.id, duplicate: true });
    }
    const row = [r.id, r.date, r.meal, r.content.trim(), r.tags.join('、'), r.work.trim(), r.notes.trim(),
      Utilities.formatDate(new Date(r.createdAt), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss'),
      Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss')];
    // Force user text to literal values, including spreadsheet formula prefixes.
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row.map(literal_)]);
    SpreadsheetApp.flush();
    return json_({ ok: true, id: r.id });
  } catch (error) {
    // Do not echo incoming food/work text, access keys or internal details.
    return json_({ ok: false, error: 'WRITE_FAILED' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
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
  if (typeof r.createdAt !== 'string' || r.createdAt.length > 40 || isNaN(new Date(r.createdAt).getTime())) throw new Error('INVALID_TIME');
}

function ensureHeaders_(sheet) {
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, FOOD_HEADERS.length).setValues([FOOD_HEADERS]);
  const headers = sheet.getRange(1, 1, 1, FOOD_HEADERS.length).getDisplayValues()[0];
  if (!FOOD_HEADERS.every((value, index) => headers[index] === value)) throw new Error('HEADER_MISMATCH');
}
function literal_(value) { return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
