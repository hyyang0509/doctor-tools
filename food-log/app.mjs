import { initFeedback } from './feedback.mjs';
import { TAGS, MEALS, SETTINGS_KEY, STORE_KEY, taipeiDefaults, validateRecord, validEndpoint, upload, readState, writeState } from './model.mjs';

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
for (const [emoji, label] of TAGS) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = `${emoji} ${label}`; button.dataset.tag = label;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    saveDraft();
  });
  $('tags').append(button);
}

function formValue() {
  return { ...Object.fromEntries(fields.map(key => [key, $(key).value])),
    meal: document.querySelector('[name=meal]:checked')?.value || '',
    tags: [...document.querySelectorAll('[data-tag][aria-pressed=true]')].map(b => b.dataset.tag) };
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
  if (blocked || busy || state.draft.id) return;
  // Read the latest pending queue so another tab's acknowledged writes are preserved.
  const draft = formValue();
  if (refreshState()) persist({ ...state, draft });
}
function render() {
  const draft = state.draft;
  fields.forEach(key => { $(key).value = draft[key] || ''; });
  document.querySelectorAll('[name=meal]').forEach(el => { el.checked = el.value === draft.meal; });
  document.querySelectorAll('[data-tag]').forEach(el => el.setAttribute('aria-pressed', String((draft.tags || []).includes(el.dataset.tag))));
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
    li.textContent = `${record.date}・${record.meal}｜${[...record.tags, record.content].filter(Boolean).join('、')}`;
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
  feedbackUI.invalidate('連線設定已更新，可重新查看回饋。');
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
      feedbackUI.invalidate('有新紀錄已上傳，點擊即可更新飲食回饋。');
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
  if (event.key === STORE_KEY && refreshState()) { render(); feedbackUI.invalidate('紀錄狀態已更新，可重新查看回饋。'); }
  if (event.key === SETTINGS_KEY) {
    try { settings = JSON.parse(event.newValue || '{}'); render(); feedbackUI.invalidate('連線設定已更新，可重新查看回饋。'); } catch { /* Keep current settings. */ }
  }
});
render();
const feedbackUI = initFeedback(() => settings, () => state.pending.length);
if (!blocked && state.draft.id) message('這筆紀錄尚待雲端確認，請重試；也可保留待傳資料後記錄下一筆。');
// Update the shell cache even when this page is opened directly.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
