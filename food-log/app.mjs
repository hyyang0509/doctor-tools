import { TAGS, QUICK_TAGS, DRINK_TYPES, SUGAR_OPTIONS, NUTRITION_GROUPS, recordContent, MEALS, SETTINGS_KEY, STORE_KEY, taipeiDefaults, validateRecord, validEndpoint, upload, readState, writeState } from './model.mjs';

const $ = id => document.getElementById(id);
const fields = ['date', 'content', 'work', 'notes'];
let state, settings = {}, busy = false, blocked = false;
function message(text, tone = '') { $('status').textContent = text; $('status').dataset.tone = tone; }
try {
  state = readState();
  settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
} catch {
  state = { draft: taipeiDefaults(), pending: [] };
  blocked = true;
  message('無法讀取本機資料。請確認瀏覽器允許網站儲存資料；若原有紀錄，請勿清除網站資料。', 'error');
}

for (const meal of MEALS) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'radio'; input.name = 'meal'; input.value = meal; input.required = true;
  const span = document.createElement('span'); span.textContent = meal;
  label.append(input, span); $('meals').append(label);
}
function toggleButton(text, data, click) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = text;
  Object.assign(button.dataset, data); button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    const selected = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(selected));
    click?.(button, selected); saveDraft();
  });
  return button;
}
function tagButton(emoji, label) {
  return toggleButton(`${emoji} ${label}`, { tag: label });
}
for (const [emoji, label] of QUICK_TAGS) $('tags').append(tagButton(emoji, label));
for (const [emoji, type] of DRINK_TYPES) {
  const group = document.createElement('fieldset'); group.className = 'drink-sugar'; group.hidden = true; group.dataset.drinkSugar = type;
  const legend = document.createElement('legend'); legend.textContent = `${type}・有加糖嗎？`;
  const hint = document.createElement('p'); hint.className = 'field-hint'; hint.textContent = '未選代表未記錄；無加糖仍可能含乳糖等天然糖。';
  const options = document.createElement('div'); options.className = 'tags';
  for (const sugar of SUGAR_OPTIONS) options.append(toggleButton(sugar, { sugar }, button => {
    options.querySelectorAll('button').forEach(other => { if (other !== button) other.setAttribute('aria-pressed', 'false'); });
  }));
  group.append(legend, hint, options); $('drinkSugar').append(group);
  $('drinks').append(toggleButton(`${emoji} ${type}`, { drink: type }, (button, selected) => {
    group.hidden = !selected;
    if (!selected) options.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }));
}
for (const group of NUTRITION_GROUPS) {
  const fieldset = document.createElement('fieldset'); fieldset.dataset.nutrition = group.key;
  const legend = document.createElement('legend'); legend.textContent = group.label;
  const hint = document.createElement('p'); hint.className = 'field-hint'; hint.textContent = group.hint;
  const options = document.createElement('div'); options.className = 'tags';
  for (const value of group.options) options.append(toggleButton(value, { nutritionValue: value }, (button, selected) => {
    options.querySelectorAll('button').forEach(other => {
      if (other !== button && (!group.multiple || (selected && (value === '沒有' || other.dataset.nutritionValue === '沒有')))) other.setAttribute('aria-pressed', 'false');
    });
  }));
  fieldset.append(legend, hint, options); $('nutritionGroups').append(fieldset);
}
function formValue() {
  const nutrition = {};
  for (const group of NUTRITION_GROUPS) {
    const values = [...document.querySelectorAll(`[data-nutrition="${group.key}"] [aria-pressed=true]`)].map(b => b.dataset.nutritionValue);
    if (values.length) nutrition[group.key] = group.multiple ? values : values[0];
  }
  const drinks = [...document.querySelectorAll('[data-drink][aria-pressed=true]')].map(b => ({ type: b.dataset.drink,
    sugar: document.querySelector(`[data-drink-sugar="${b.dataset.drink}"] [aria-pressed=true]`)?.dataset.sugar || '' }));
  return { ...Object.fromEntries(fields.map(key => [key, $(key).value])),
    meal: document.querySelector('[name=meal]:checked')?.value || '',
    tags: [...document.querySelectorAll('[data-tag][aria-pressed=true]')].map(b => b.dataset.tag), drinks, nutrition };
}
function nutritionSummary() {
  const count = Object.keys(formValue().nutrition).length;
  $('nutritionLabel').textContent = count ? `已補充 ${count} 項` : '選填';
}
function persist(next) {
  try { writeState(next); state = next; return true; }
  catch { message('本機儲存失敗，尚未送出新資料。請保留畫面內容並確認瀏覽器可儲存資料。', 'error'); return false; }
}
function refreshState() {
  try { state = readState(); return true; }
  catch { blocked = true; message('本機資料無法讀取，請勿清除網站資料。', 'error'); return false; }
}
function saveDraft() {
  nutritionSummary();
  if (blocked || busy || state.draft.id) return;
  // Read the latest pending queue so another tab's acknowledged writes are preserved.
  const draft = formValue();
  if (refreshState()) persist({ ...state, draft });
}
function render() {
  const draft = state.draft;
  fields.forEach(key => { $(key).value = draft[key] || ''; });
  document.querySelectorAll('[name=meal]').forEach(el => { el.checked = el.value === draft.meal; });
  $('legacyTagButtons').replaceChildren();
  for (const label of draft.tags || []) {
    if (!QUICK_TAGS.some(([, value]) => value === label)) {
      const tag = TAGS.find(([, value]) => value === label);
      if (tag) $('legacyTagButtons').append(tagButton(...tag));
    }
  }
  $('legacyTags').hidden = !$('legacyTagButtons').childElementCount;
  document.querySelectorAll('[data-tag]').forEach(el => el.setAttribute('aria-pressed', String((draft.tags || []).includes(el.dataset.tag))));
  for (const [, type] of DRINK_TYPES) {
    const drink = (draft.drinks || []).find(d => d.type === type);
    document.querySelector(`[data-drink="${type}"]`).setAttribute('aria-pressed', String(Boolean(drink)));
    const group = document.querySelector(`[data-drink-sugar="${type}"]`); group.hidden = !drink;
    group.querySelectorAll('[data-sugar]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sugar === drink?.sugar)));
  }
  for (const group of NUTRITION_GROUPS) {
    const value = draft.nutrition?.[group.key];
    document.querySelectorAll(`[data-nutrition="${group.key}"] button`).forEach(b => {
      b.setAttribute('aria-pressed', String(group.multiple ? (value || []).includes(b.dataset.nutritionValue) : value === b.dataset.nutritionValue));
    });
  }
  nutritionSummary();
  if (!Object.keys(draft.nutrition || {}).length) $('nutrition').open = false;
  $('optional').open = Boolean(draft.work || draft.notes);
  $('entryFields').disabled = blocked || busy || Boolean(draft.id);
  $('submit').disabled = blocked || busy;
  $('submit').textContent = busy ? '正在確認寫入…' : draft.id ? '重試這筆紀錄' : '儲存到 Google 試算表';
  $('next').hidden = !draft.id || busy;
  $('retry').disabled = blocked || busy;
  $('saveConnection').disabled = blocked || busy;
  $('pendingPanel').hidden = state.pending.length === 0;
  $('pendingCount').textContent = `（${state.pending.length}）`;
  $('pendingList').replaceChildren();
  for (const record of state.pending) {
    const li = document.createElement('li');
    li.textContent = `${record.date}・${record.meal}｜${[...record.tags, recordContent(record)].filter(Boolean).join('、')}`;
    $('pendingList').append(li);
  }
  const configured = validEndpoint(settings?.endpoint) && Boolean(settings?.key);
  $('connectionLabel').textContent = configured ? '已設定' : '尚未設定';
}

$('foodForm').addEventListener('input', saveDraft);
$('foodForm').addEventListener('change', saveDraft);
$('endpoint').value = settings?.endpoint || '';
$('accessKey').value = settings?.key || '';
$('connection').open = !validEndpoint(settings?.endpoint) || !settings?.key;
$('saveConnection').addEventListener('click', () => {
  const next = { endpoint: $('endpoint').value.trim(), key: $('accessKey').value.trim() };
  if (!validEndpoint(next.endpoint) || !next.key) {
    message('請填入正確的 Apps Script /exec 網址與連線金鑰。', 'error'); return;
  }
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); settings = next; }
  catch { message('無法儲存連線設定，請確認瀏覽器允許儲存資料。', 'error'); return; }
  $('connection').open = false; render();
  message('連線設定已儲存；下一筆紀錄會確認試算表是否成功寫入。');
});

async function sendRecords(records) {
  if (busy || blocked) return;
  busy = true; render();
  let count = 0;
  try {
    for (const record of records) {
      await upload(record, settings);
      if (!refreshState()) throw new Error('已收到雲端確認，但本機資料無法讀取；請保留本機資料。');
      const active = state.draft.id === record.id;
      const next = { ...state, pending: state.pending.filter(r => r.id !== record.id),
        draft: active ? taipeiDefaults() : state.draft };
      if (!persist(next)) throw new Error('試算表已寫入，但本機狀態未能更新；重試也不會重複新增。');
      count++;
    }
    message(`✓ 已確認 ${count} 筆寫入 Google 試算表。`, 'success');
  } catch (error) { message(`${count ? `已確認 ${count} 筆；` : ''}${error.message}`, 'error'); }
  finally { busy = false; render(); }
}

$('foodForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || blocked) return;
  if (!validEndpoint(settings?.endpoint) || !settings?.key) {
    message('請先展開上方「試算表連線」完成設定；輸入內容仍保留。', 'error'); $('connection').open = true; return;
  }
  const form = formValue();
  if (!refreshState()) return;
  if (state.draft.id) {
    const record = state.pending.find(r => r.id === state.draft.id);
    if (record) await sendRecords([record]);
    return;
  }
  try { validateRecord(form); } catch (error) { message(error.message, 'error'); return; }
  const record = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  if (!persist({ ...state, draft: record, pending: [...state.pending, record] })) return;
  await sendRecords([record]);
});
$('next').addEventListener('click', () => {
  if (!refreshState()) return;
  if (persist({ ...state, draft: taipeiDefaults() })) {
    render(); message('上一筆仍在待傳清單，可稍後按「全部重試」。現在可以記錄下一筆。');
  }
});
$('retry').addEventListener('click', () => { if (refreshState()) sendRecords([...state.pending]); });
window.addEventListener('storage', event => {
  if (busy) return;
  if (event.key === STORE_KEY && refreshState()) render();
  if (event.key === SETTINGS_KEY) {
    try { settings = JSON.parse(event.newValue || '{}'); render(); } catch { /* Keep current settings. */ }
  }
});
render();
if (!blocked && state.draft.id) message('這筆紀錄尚待雲端確認，請重試；也可保留待傳資料後記錄下一筆。');
// Update the shell cache even when this page is opened directly.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
