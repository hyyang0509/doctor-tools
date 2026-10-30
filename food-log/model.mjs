export const MEALS = ['早餐', '午餐', '晚餐', '點心'];
export const TAGS = [
  ['🥚', '水煮蛋'], ['☕', '拿鐵'], ['☕', '美式'], ['🍬', '含糖咖啡'],
  ['🏥', '醫院便當'], ['🍱', '一般便當'], ['🍗', '炸雞腿便當'],
  ['🫖', '無糖飲料'], ['🥤', '含糖飲料'], ['🧋', '珍奶'],
  ['🍲', '小火鍋'], ['🥟', '八方雲集'], ['🍜', '乾麵'], ['🥩', '牛肉麵']
];
// Keep the original allowlist for older drafts, pending records and deployed receivers.
export const QUICK_TAGS = TAGS.filter(([, label]) => !['拿鐵', '美式', '含糖咖啡', '無糖飲料', '含糖飲料', '珍奶'].includes(label));
export const DRINK_TYPES = [['☕', '美式'], ['☕', '拿鐵'], ['🫖', '茶'], ['🥛', '豆漿'], ['🥛', '鮮奶'], ['🧋', '珍奶'], ['💧', '白開水'], ['🥤', '其他']];
export const SUGAR_OPTIONS = ['無加糖', '有加糖', '不確定'];
export const NUTRITION_GROUPS = [
  { key: 'vegetables', label: '🥬 蔬菜', options: ['沒有', '少量', '約 1 拳', '2 拳以上'], hint: '粗估吃下的蔬菜量即可，不必秤重。' },
  { key: 'protein', label: '🥚 蛋白質食物', options: ['沒有', '少量', '約 1 掌', '2 掌以上'], hint: '豆、魚、蛋、肉都算；1 顆蛋可選少量，肉魚約掌心大可選約 1 掌。' },
  { key: 'fruit', label: '🍎 水果', options: ['沒有', '約 1 拳', '2 拳以上'], hint: '記在吃的那一餐或點心即可。' },
  { key: 'dairy', label: '🥛 乳品', options: ['沒有', '鮮奶', '無糖優格', '無糖優酪乳', '起司', '其他乳品'], multiple: true, hint: '有吃再選，可複選。同一杯鮮奶不用重複選；拿鐵奶量可在飲食內容補充。' }
];

// Store explicit observations in the existing content column, so no receiver upgrade
// or header migration is required. Drafts/pending records retain the unmodified inputs.
export function recordContent(r) {
  const details = [];
  for (const drink of r.drinks || []) details.push(`飲料：${drink.type}（${drink.sugar || '加糖情況未記錄'}）`);
  for (const group of NUTRITION_GROUPS) {
    const value = r.nutrition?.[group.key];
    if (group.multiple ? value?.length : value) details.push(`${group.label.split(' ').slice(1).join(' ')}：${Array.isArray(value) ? value.join('、') : value}`);
  }
  return [r.content.trim(), details.length ? `【補充紀錄】\n${details.join('；')}` : ''].filter(Boolean).join('\n');
}

export const STORE_KEY = 'hy-food-log-v1';
export const SETTINGS_KEY = 'hy-food-log-connection-v1';

export function taipeiDefaults(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map(p => [p.type, p.value]));
  const hour = Number(parts.hour);
  return { date: `${parts.year}-${parts.month}-${parts.day}`,
    meal: hour >= 5 && hour < 11 ? '早餐' : hour >= 11 && hour < 15 ? '午餐' : hour >= 17 && hour < 21 ? '晚餐' : '點心',
    content: '', tags: [], drinks: [], nutrition: {}, work: '', notes: '' };
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateRecord(r) {
  if (!r || !validDate(r.date)) throw new Error('請選擇有效日期。');
  if (!MEALS.includes(r.meal)) throw new Error('請選擇餐別。');
  if (!Array.isArray(r.tags) || r.tags.length > TAGS.length ||
      r.tags.some(t => !TAGS.some(([, label]) => label === t)) || new Set(r.tags).size !== r.tags.length) {
    throw new Error('飲食標籤格式不正確。');
  }
  for (const key of ['content', 'work', 'notes']) {
    if (typeof r[key] !== 'string' || r[key].length > 1000) throw new Error('每個文字欄位最多 1000 字。');
  }
  if (r.drinks !== undefined && (!Array.isArray(r.drinks) || r.drinks.length > DRINK_TYPES.length ||
      new Set(r.drinks.map(d => d?.type)).size !== r.drinks.length || r.drinks.some(d => !d || !DRINK_TYPES.some(([, type]) => type === d.type) || (d.sugar !== '' && !SUGAR_OPTIONS.includes(d.sugar))))) {
    throw new Error('飲料選項格式不正確。');
  }
  if (r.nutrition !== undefined) {
    if (!r.nutrition || typeof r.nutrition !== 'object' || Array.isArray(r.nutrition) || Object.keys(r.nutrition).some(k => !NUTRITION_GROUPS.some(g => g.key === k))) throw new Error('營養補充格式不正確。');
    for (const group of NUTRITION_GROUPS) {
      const value = r.nutrition[group.key];
      if (value === undefined) continue;
      const values = group.multiple ? value : value === '' ? [] : [value];
      if (!Array.isArray(values) || new Set(values).size !== values.length || values.some(v => !group.options.includes(v)) || (values.includes('沒有') && values.length > 1)) throw new Error('營養補充選項格式不正確。');
    }
  }
  const content = recordContent(r);
  if (content.length > 1000) throw new Error('飲食內容加上補充紀錄超過 1000 字，請稍微縮短飲食內容。');
  if (!content && !r.tags.length) throw new Error('請點選標籤、補充項目或輸入飲食內容。');
  return r;
}

export function validEndpoint(value) {
  return typeof value === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value);
}

// Only a readable, matching server acknowledgement counts as a successful write.
export async function upload(record, settings, fetchImpl = fetch, timeoutMs = 30000) {
  validateRecord(record);
  if (!validEndpoint(settings.endpoint) || !settings.key) throw new Error('請先完成 Google 試算表連線設定。');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(settings.endpoint, {
      method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'append', key: settings.key, record: { ...record, content: recordContent(record) } }), signal: controller.signal
    });
    if (!response.ok || response.type === 'opaque') throw new Error('未收到試算表確認；請檢查連線及部署權限後重試。');
    let result;
    try { result = await response.json(); } catch { throw new Error('連線回覆格式不正確，請確認使用 /exec 網址與「任何人」存取權限。'); }
    if (result.ok !== true || result.id !== record.id) {
      const hints = {
        UNAUTHORIZED: '連線金鑰不正確，請重新設定。',
        NOT_CONFIGURED: '接收程式尚未初始化，請在 Apps Script 執行 setup。',
        SHEET_MISSING: '找不到「飲食紀錄」工作表，請在原試算表重新執行 setup。',
        HEADER_MISMATCH: '試算表第一列欄名不符，請依設定說明還原九個欄名，勿刪除既有紀錄。',
        INVALID_REQUEST: '接收程式無法辨識資料格式，請確認貼入完整的最新版 Code.gs。',
        INVALID_ACTION: '接收程式版本不符，請更新 Code.gs 並部署新版本。'
      };
      let hint = hints[result.error];
      if (!hint && result.error === 'WRITE_FAILED') {
        hint = result.stage === 'open_spreadsheet'
          ? '接收程式無法開啟試算表。請更新 Code.gs、執行 setup 重新授權，再以自己身分部署新版本。'
          : result.stage === 'write'
            ? '試算表寫入失敗，請確認部署者可編輯試算表，且工作表未被保護。'
            : result.stage === 'lock'
              ? '接收端忙碌，請稍後按重試。'
              : '試算表未確認寫入，請更新 Code.gs、執行 checkConnection，再部署新版本。';
      }
      throw new Error(hint || '試算表未確認寫入，請檢查接收程式與設定。');
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      throw new Error('尚未確認上傳，資料已保留；請檢查網路與部署設定後重試，同筆不會重複新增。');
    }
    throw error;
  } finally { clearTimeout(timer); }
}

export function readState(storage = localStorage) {
  const raw = storage.getItem(STORE_KEY);
  if (!raw) return { draft: taipeiDefaults(), pending: [] };
  const state = JSON.parse(raw);
  if (!state || !state.draft || !Array.isArray(state.pending)) throw new Error('本機紀錄無法讀取；請保留此裝置資料並聯絡維護者。');
  return state;
}

export function writeState(state, storage = localStorage) {
  storage.setItem(STORE_KEY, JSON.stringify(state));
}

// Private read: never put the key in a URL or persist returned meal history.
export async function fetchRecent(settings, fetchImpl = fetch, timeoutMs = 30000) {
  if (!validEndpoint(settings?.endpoint) || !settings?.key) throw new Error('請先展開「試算表連線」完成設定。');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(settings.endpoint, {
      method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'recent', key: settings.key }), signal: controller.signal
    });
    if (!response.ok || response.type === 'opaque') throw new Error('無法讀取最近紀錄，請檢查連線與部署權限後重新整理。');
    let result;
    try { result = await response.json(); } catch { throw new Error('讀取回覆格式不正確，請確認 /exec 網址與部署權限。'); }
    if (result.ok !== true) {
      if (result.error === 'INVALID_ACTION') throw new Error('請更新 Google Apps Script 程式並部署「新版本」，即可查看最近三筆紀錄。');
      if (result.error === 'UNAUTHORIZED') throw new Error('連線金鑰不正確，請重新設定。');
      throw new Error('讀取失敗，請確認接收程式設定並執行 checkConnection 後重新整理。');
    }
    if (!Array.isArray(result.records) || result.records.length > 3 || result.records.some(r => !r ||
      ['date', 'meal', 'content', 'tags', 'work', 'notes'].some(key => typeof r[key] !== 'string'))) {
      throw new Error('最近紀錄格式不正確，請更新接收程式後重新整理。');
    }
    return result.records;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('無法讀取最近紀錄，請檢查網路後重新整理。');
    throw error;
  } finally { clearTimeout(timer); }
}
