import { DAIRY_AMOUNTS, WATER_PERIODS, hasFood, daySummary, quickNutrition, reminderDraft, TAGS, QUICK_TAGS, DRINK_TYPES, QUICK_DRINK_TYPES, SUGAR_OPTIONS, NUTRITION_GROUPS, recordContent, MEALS, SETTINGS_KEY, STORE_KEY, taipeiDefaults, taipeiQuickDates, validateRecord, validEndpoint, upload, readState, writeState } from './model.mjs?v=33';

const $ = id => document.getElementById(id);
const fields = ['date', 'content', 'work', 'notes'];
let state, settings = {}, busy = false, blocked = false;
let lastSavedDate = '';
let hydration = {}, nutritionOrigin = '';
let manualPortions = new Set();
let legacyDairy = [];
const portionTicks = group => group.key === 'dairy' ? DAIRY_AMOUNTS : group.options;
const portionNames = {starch: '主食', vegetables: '蔬菜', protein: '豆魚蛋肉', fruit: '水果', dairy: '乳品'};
function message(text, tone = '') { $('status').textContent = text; $('status').dataset.tone = tone; }
try {
  state = readState();
  settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
} catch {
  state = { draft: taipeiDefaults(), pending: [] };
  blocked = true;
  message('無法讀取本機資料。請確認瀏覽器允許網站儲存資料；若原有紀錄，請勿清除網站資料。', 'error');
}

const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
const linkedDraft = isReload ? null : reminderDraft(location.search);
if (linkedDraft && !state.draft.id && !state.draft.editId && !hasFood(state.draft) && !state.draft.work && !state.draft.notes && !Object.keys(state.draft.hydration || {}).length) {
  state.draft = { ...state.draft, ...linkedDraft };
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
  return toggleButton(`${emoji} ${label}`, { tag: label }, (button, selected) => {
    if (!QUICK_TAGS.some(([,value]) => value === label)) return;
    // After clearing portions, tapping an already selected food reapplies its preset.
    if (!selected && !nutritionOrigin) button.setAttribute('aria-pressed', 'true');
    const tags = [...document.querySelectorAll('[data-tag][aria-pressed=true]')].map(b => b.dataset.tag);
    const preset = quickNutrition(tags);
    const current = formValue().nutrition;
    for (const key of manualPortions) {
      if (current[key] === undefined) delete preset[key];
      else preset[key] = current[key];
    }
    setNutrition(preset);
    if (button.getAttribute('aria-pressed') === 'true') $('nutrition').open = true;
    nutritionOrigin = manualPortions.size ? 'manual' : Object.keys(preset).length ? 'preset' : '';
  });
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
    if (!selected && !QUICK_DRINK_TYPES.some(([, value]) => value === type)) button.hidden = true;
  }));
}
for (const group of NUTRITION_GROUPS) {
  const fieldset = document.createElement('fieldset');
  fieldset.dataset.nutrition = group.key;
  const legend = document.createElement('legend');
  legend.textContent = group.label;
  const slider = document.createElement('input');
  const ticks = portionTicks(group);
  slider.type = 'range';
  slider.min = 0;
  slider.max = ticks.length - 1;
  slider.value = 0;
  slider.setAttribute('aria-label', portionNames[group.key] + '份量');
  const options = document.createElement('div');
  options.className = 'tags portion-ticks';
  const savedDairy = document.createElement('small');
  savedDairy.className = 'legacy-dairy';
  function choose(value) {
    const nutrition = formValue().nutrition;
    if (value === undefined) delete nutrition[group.key];
    else nutrition[group.key] = group.multiple ? [value] : value;
    manualPortions.add(group.key);
    nutritionOrigin = 'manual';
    setNutrition(nutrition);
  }
  for (const value of ticks) {
    options.append(toggleButton(value, {nutritionValue: value}, (_, selected) => {
      choose(selected ? value : undefined);
    }));
  }
  slider.addEventListener('input', () => choose(ticks[Number(slider.value)]));
  fieldset.append(legend, slider, options);
  if (group.key === 'dairy') fieldset.append(savedDairy);
  $('nutritionGroups').append(fieldset);
}
function setNutrition(nutrition) {
  const dairy = nutrition.dairy || [];
  legacyDairy = dairy.filter(value => !DAIRY_AMOUNTS.includes(value));
  const legacy = document.querySelector('.legacy-dairy');
  legacy.hidden = !legacyDairy.length;
  legacy.textContent = legacyDairy.length ? '舊紀錄：' + legacyDairy.join('、') : '';
  for (const group of NUTRITION_GROUPS) {
    const value = group.multiple ? nutrition[group.key]?.find(item => DAIRY_AMOUNTS.includes(item)) : nutrition[group.key];
    const fieldset = document.querySelector(`[data-nutrition="${group.key}"]`);
    const slider = fieldset.querySelector('input');
    const tick = Math.max(0, portionTicks(group).indexOf(value));
    slider.value = tick;
    slider.style.setProperty('--portion-fill', (100 * tick / Number(slider.max)) + '%');
    slider.setAttribute('aria-valuetext', value || '未填');
    fieldset.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(value === button.dataset.nutritionValue));
    });
  }
}
$('clearPortions').addEventListener('click', () => {
  manualPortions.clear();
  nutritionOrigin = '';
  setNutrition({});
  saveDraft();
});
for (const period of WATER_PERIODS) {
  $('hydrationGroups').append(toggleButton(period, {water:period}, (_, selected) => {
    if (selected) hydration[period] = '達標'; else delete hydration[period];
  }));
}
function formValue() {
  const nutrition = {};
  for (const group of NUTRITION_GROUPS) {
    const values = [...document.querySelectorAll(`[data-nutrition="${group.key}"] [aria-pressed=true]`)].map(b => b.dataset.nutritionValue);
    if (values.length) nutrition[group.key] = group.multiple ? values : values[0];
  }
  if (!nutrition.dairy && legacyDairy.length) nutrition.dairy = [...legacyDairy];
  const drinks = [...document.querySelectorAll('[data-drink][aria-pressed=true]')].map(b => ({ type: b.dataset.drink,
    sugar: document.querySelector(`[data-drink-sugar="${b.dataset.drink}"] [aria-pressed=true]`)?.dataset.sugar || '' }));
  return { ...Object.fromEntries(fields.map(key => [key, $(key).value])),
    meal: document.querySelector('[name=meal]:checked')?.value || '',
    hydration: {...hydration}, nutritionOrigin, manualPortions: [...manualPortions],
    tags: [...document.querySelectorAll('[data-tag][aria-pressed=true]')].map(b => b.dataset.tag), drinks, nutrition };
}
function nutritionSummary() {
  const nutrition = formValue().nutrition;
  const summary = Object.entries(portionNames).flatMap(([key, label]) => {
    const raw = nutrition[key];
    const value = Array.isArray(raw) ? raw.join('、') : raw;
    return value && value !== '沒有' ? [label + ' ' + value] : [];
  });
  $('nutritionLabel').textContent = summary.join('・') || (Object.keys(nutrition).length ? '已記份量' : '選填');
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
  renderQuickDates();
  nutritionSummary();
  if (blocked || busy || state.draft.id) return;
  lastSavedDate = '';
  $('sameDay').hidden = true;
  // Read the latest pending queue so another tab's acknowledged writes are preserved.
  const draft = { ...formValue(), ...(state.draft.editId ? {editId: state.draft.editId, originalCreatedAt: state.draft.originalCreatedAt} : {}) };
  if (refreshState()) persist({ ...state, draft });
}
function renderQuickDates() {
  for (const [id, date] of Object.entries(taipeiQuickDates())) {
    $(id).setAttribute('aria-pressed', String($('date').value === date));
  }
}
function render() {
  const draft = state.draft;
  fields.forEach(key => { $(key).value = draft[key] || ''; });
  renderQuickDates();
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
    const button = document.querySelector(`[data-drink="${type}"]`);
    button.setAttribute('aria-pressed', String(Boolean(drink)));
    button.hidden = !drink && !QUICK_DRINK_TYPES.some(([, value]) => value === type);
    const group = document.querySelector(`[data-drink-sugar="${type}"]`); group.hidden = !drink;
    group.querySelectorAll('[data-sugar]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sugar === drink?.sugar)));
  }
  manualPortions = new Set(draft.manualPortions || (draft.nutritionOrigin === 'manual' ? Object.keys(draft.nutrition || {}) : []));
  setNutrition(draft.nutrition || {});
  nutritionOrigin = draft.nutritionOrigin || '';
  hydration = {...(draft.hydration || {})};
  document.querySelectorAll('#hydrationGroups [data-water]').forEach(b => b.setAttribute('aria-pressed', String(hydration[b.dataset.water] === '達標')));
  nutritionSummary();
  if (!Object.keys(draft.nutrition || {}).length) $('nutrition').open = false;
  $('optional').open = Boolean(draft.work || draft.notes);
  $('entryFields').disabled = blocked || busy || Boolean(draft.id);
  $('submit').disabled = blocked || busy;
  $('newMeal').disabled = busy || blocked;
  $('submit').textContent = busy ? '正在確認寫入…' : draft.id ? '重試這筆紀錄' : draft.editId ? '儲存修改到 Google 試算表' : '儲存到 Google 試算表';
  $('next').hidden = !draft.id || busy;
  $('sameDay').hidden = !lastSavedDate || blocked || busy || Boolean(draft.id);
  $('retry').disabled = blocked || busy;
  $('saveConnection').disabled = blocked || busy;
  $('pendingPanel').hidden = state.pending.length === 0;
  $('pendingCount').textContent = `（${state.pending.length}）`;
  $('pendingList').replaceChildren();
  for (const record of state.pending) {
    const li = document.createElement('li');
    li.textContent = `${record.date}・${record.meal}｜${[...record.tags, recordContent({ ...record, tags: [] })].filter(Boolean).join('、')}`;
    $('pendingList').append(li);
  }
  $('cancelEdit').hidden = !draft.editId || Boolean(draft.id);
  renderHabits();
  const configured = validEndpoint(settings?.endpoint) && Boolean(settings?.key);
  $('connectionLabel').textContent = configured ? '已設定' : '尚未設定';
}

function resetMeal() {
  if (busy || blocked || !refreshState()) return false;
  if (!persist({...state, draft:{...taipeiDefaults(), meal:'早餐'}})) return false;
  lastSavedDate = '';
  $('nutrition').open = false;
  return true;
}
$('newMeal').addEventListener('click', () => {
  if (!resetMeal()) return;
  render();
  message('已開啟新的一餐。');
  $('foodForm').scrollIntoView({block:'start'});
});

function beginDraft(patch) {
  if (busy || blocked || state.draft.id || !refreshState()) return;
  if ((hasFood(state.draft) || Object.keys(state.draft.hydration || {}).length || state.draft.editId) && !confirm('目前有草稿，要以選擇的紀錄取代嗎？')) return;
  if (persist({...state, draft:{...taipeiDefaults(), ...patch}})) { render(); $('foodForm').scrollIntoView({behavior:'smooth'}); }
}
function habitStatus(text, complete) {
  const span = document.createElement('span');
  span.className = complete ? 'habit-status complete' : 'habit-status';
  span.textContent = text;
  return span;
}
function renderHabits() {
  const today = taipeiDefaults().date;
  const summary = daySummary(state.history || [], today);
  $('overview').replaceChildren(); $('waterOverview').replaceChildren(); $('historyList').replaceChildren();
  for (const meal of MEALS.slice(0,3)) {
    const saved = summary.meals[meal];
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', meal + (saved ? '已記，補記' : '待記，補記'));
    button.disabled = busy || blocked || Boolean(state.draft.id);
    button.addEventListener('click', () => beginDraft({date:today, meal}));
    button.append(meal + " ", habitStatus(saved ? '✓' : '待記', saved));
    $('overview').append(button);
  }
  for (const period of WATER_PERIODS) {
    const reached = summary.hydration[period] === '達標';
    const cell = document.createElement('span');
    cell.className = 'water-status';
    cell.append(period + " ", habitStatus(reached ? '✓' : summary.hydration[period] || '未記', reached));
    $('waterOverview').append(cell);
  }
  for (const r of (state.history || []).slice().reverse().slice(0,30)) {
    const li=document.createElement('li'); const text=document.createElement('span');
    text.textContent=`${r.date}・${hasFood(r) ? r.meal : '喝水'}｜${[...(r.tags || []), recordContent({...r,tags:[]})].filter(Boolean).join('、')}`;
    const b=document.createElement('button'); b.type='button'; b.textContent='修改'; b.className='secondary';
    b.disabled=busy || blocked || Boolean(state.draft.id) || state.pending.some(p=>p.id===r.id);
    b.addEventListener('click',()=>beginDraft({...r,id:undefined,editId:r.id,originalCreatedAt:r.createdAt})); li.append(text,b); $('historyList').append(li);
  }
  if (!(state.history || []).length) { const li=document.createElement('li'); li.textContent='開始使用新版後，已確認上傳的紀錄會顯示在這裡。'; $('historyList').append(li); }
}
$('cancelEdit').addEventListener('click',()=>{if(refreshState() && persist({...state,draft:taipeiDefaults()})) {render();message('已取消修改，原紀錄未變更。');}});

$('foodForm').addEventListener('input', saveDraft);
$('foodForm').addEventListener('change', saveDraft);
for (const id of ['today', 'yesterday']) {
  $(id).addEventListener('click', () => {
    $('date').value = taipeiQuickDates()[id];
    saveDraft();
  });
}
$('sameDay').addEventListener('click', () => {
  if (!lastSavedDate || blocked || busy || !refreshState() || state.draft.id) return;
  const date = lastSavedDate;
  if (!persist({ ...state, draft: { ...state.draft, date, meal: '' } })) return;
  lastSavedDate = '';
  render();
  document.querySelector('[name=meal]')?.focus();
  message(`已選擇 ${date}，請選這一筆的餐別。`);
});
$('endpoint').value = settings?.endpoint || '';
$('accessKey').value = settings?.key || '';

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
  lastSavedDate = '';
  busy = true; message('正在確認寫入 Google 試算表…'); render();
  let count = 0;
  try {
    for (const record of records) {
      await upload(record, settings);
      if (!refreshState()) throw new Error('已收到雲端確認，但本機資料無法讀取；請保留本機資料。');
      const active = state.draft.id === record.id;
      const saved = {...record}; delete saved.action;
      const history = [...(state.history || []).filter(r => r.id !== record.id), saved].slice(-300);
      const next = { ...state, history, pending: state.pending.filter(r => r.id !== record.id),
        draft: active ? taipeiDefaults() : state.draft };
      if (!persist(next)) throw new Error('試算表已寫入，但本機狀態未能更新；重試也不會重複新增。');
      if (active) lastSavedDate = record.date;
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
    message('請先在頁底完成「試算表連線」設定；輸入內容仍保留。', 'error'); $('connection').open = true; $('connection').scrollIntoView({block:'nearest'}); $('endpoint').focus({preventScroll:true}); return;
  }
  const form = formValue();
  if (!refreshState()) return;
  if (state.draft.id) {
    const record = state.pending.find(r => r.id === state.draft.id);
    if (record) await sendRecords([record]);
    return;
  }
  try { validateRecord(form); } catch (error) { message(error.message, 'error'); return; }
  const editing = state.draft.editId;
  const record = { ...form, id: editing || crypto.randomUUID(), createdAt: editing ? state.draft.originalCreatedAt : new Date().toISOString(), ...(editing ? {action:'update', updatedAt:new Date().toISOString()} : {}) };
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
  if (event.key === STORE_KEY && refreshState()) {
    lastSavedDate = '';
    render();
  }
  if (event.key === SETTINGS_KEY) {
    try { settings = JSON.parse(event.newValue || '{}'); render(); } catch { /* Keep current settings. */ }
  }
});
if (isReload && resetMeal() && state.pending.length) message('表單已重置，待傳紀錄可在下方重試。');
render();
if (!blocked && state.draft.id) message('這筆紀錄尚待雲端確認，請重試；也可保留待傳資料後記錄下一筆。');
// Update the shell cache even when this page is opened directly.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
