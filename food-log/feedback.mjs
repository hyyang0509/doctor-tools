import { validDate, validEndpoint, taipeiDefaults } from './model.mjs';

export function feedbackRange(period, endDate) {
  if (!['day', 'week'].includes(period) || !validDate(endDate) || endDate < '1900-01-07' || endDate > taipeiDefaults().date) {
    throw new Error('請選擇今天或之前的有效日期。');
  }
  const start = new Date(`${endDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (period === 'week' ? 6 : 0));
  return { startDate: start.toISOString().slice(0, 10), endDate };
}

const HINTS = {
  UNAUTHORIZED: '連線金鑰不正確，請展開「試算表連線」重新設定。',
  INVALID_ACTION: '請先更新 Apps Script 的 Code.gs 並部署新版本，才能使用飲食回饋。',
  AI_NOT_CONFIGURED: 'AI 尚未設定：請依設定說明，在 Apps Script 加入 OPENAI_API_KEY，再執行 checkAIConnection 並部署新版本。',
  AI_KEY_INVALID: 'AI 金鑰或存取權限有誤，請在 Apps Script 檢查 OPENAI_API_KEY。',
  AI_RATE_LIMIT: 'AI 額度或使用速率受限，請檢查 API 帳戶額度，或稍後重試。',
  AI_MODEL_UNAVAILABLE: 'AI 模型無法使用，請在 Apps Script 檢查 FOOD_AI_MODEL 設定。',
  AI_DAILY_LIMIT: '今天已達 10 次新分析上限，明天再試；相同紀錄的已存回饋仍可查看。',
  AI_BUSY: '已有分析正在進行，請稍候再按一次。',
  EMPTY_PERIOD: '這段期間還沒有已上傳的飲食紀錄。先記下一餐，再來看看回饋。',
  INVALID_PERIOD: '請選擇今天或之前的有效日期。',
  PERIOD_TOO_LARGE: '這段期間的紀錄較多，請改選單日分析；系統未截斷紀錄或送出 AI 請求。',
  NOT_CONFIGURED: '試算表尚未初始化，請在 Apps Script 執行 setup。',
  SHEET_MISSING: '找不到「飲食紀錄」工作表，請檢查原試算表。',
  HEADER_MISMATCH: '飲食紀錄欄名與設定不符，請依說明檢查第一列，勿刪除紀錄。',
  FEEDBACK_HEADERS: '「飲食回饋」工作表欄名不符，請依設定說明還原第一列。',
  AI_UNAVAILABLE: 'AI 暫時無法回覆，請稍後重試；飲食紀錄仍保留在試算表。',
  AI_RESPONSE_INVALID: 'AI 未提供完整回饋，請稍後重試；這次未保存不完整的分析。',
  ANALYSIS_FAILED: '分析或回饋保存失敗，請檢查 Apps Script 授權與試算表編輯權限後重試。'
};

export async function requestFeedback(period, endDate, settings, fetchImpl = fetch, timeoutMs = 90000) {
  const range = feedbackRange(period, endDate);
  if (!validEndpoint(settings?.endpoint) || !settings?.key) throw new Error('請先完成上方「試算表連線」設定。');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(settings.endpoint, {
      method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: controller.signal,
      body: JSON.stringify({ action: 'analyze', key: settings.key, period, endDate })
    });
    if (!response.ok || response.type === 'opaque') throw new Error('無法讀取回饋，請檢查網路及部署權限。');
    let result;
    try { result = await response.json(); } catch { throw new Error('回覆格式不正確，請確認 /exec 網址與「任何人」存取權限。'); }
    if (result.ok !== true) throw new Error(HINTS[result.error] || '無法取得分析，請更新 Apps Script 並確認設定。');
    const a = result.analysis;
    if (!a || a.startDate !== range.startDate || a.endDate !== range.endDate || typeof a.text !== 'string' || !a.text.trim() || a.text.length > 10000 ||
        !Number.isInteger(a.recordCount) || a.recordCount < 1 || !Number.isInteger(a.recordedDays) || a.recordedDays < 1 ||
        a.recordedDays > (period === 'week' ? 7 : 1) || a.recordedDays > a.recordCount ||
        typeof a.generatedAt !== 'string' || Number.isNaN(Date.parse(a.generatedAt)) || typeof a.cached !== 'boolean') {
      throw new Error('尚未收到符合日期範圍的完整回饋，請更新 Apps Script 後重試。');
    }
    return a;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('連線中斷或分析較久。請稍後再按一次；若後端已完成，會直接顯示已保存的回饋。');
    throw error;
  } finally { clearTimeout(timer); }
}

export function initFeedback(getSettings, getPendingCount) {
  const $ = id => document.getElementById(id);
  const period = $('feedbackPeriod'), end = $('feedbackDate'), button = $('analyze');
  let busy = false, revision = 0;
  end.value = taipeiDefaults().date; end.max = end.value;
  function describe() {
    $('feedbackResult').hidden = true;
    try {
      const range = feedbackRange(period.value, end.value);
      $('feedbackRange').textContent = `${range.startDate} ～ ${range.endDate}（含起訖日）`;
    } catch { $('feedbackRange').textContent = '請選擇有效日期。'; }
    $('feedbackStatus').textContent = '';
  }
  period.addEventListener('change', describe); end.addEventListener('change', describe);
  describe();
  button.addEventListener('click', async () => {
    if (busy) return;
    const settings = { ...getSettings() }, selectedPeriod = period.value, selectedDate = end.value;
    const startedRevision = revision;
    const current = () => revision === startedRevision && getSettings()?.endpoint === settings.endpoint && getSettings()?.key === settings.key;
    busy = true; button.disabled = true; period.disabled = true; end.disabled = true;
    button.textContent = '正在整理飲食回饋…';
    $('feedbackPanel').setAttribute('aria-busy', 'true');
    $('feedbackResult').hidden = true;
    $('feedbackStatus').textContent = '正在讀取試算表並分析，可能需要約一分鐘。';
    try {
      const result = await requestFeedback(selectedPeriod, selectedDate, settings);
      if (!current()) throw new Error('連線或飲食紀錄已更新，請再按一次取得最新回饋。');
      $('feedbackText').textContent = result.text;
      const time = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'short' }).format(new Date(result.generatedAt));
      $('feedbackMeta').textContent = `${result.startDate} ～ ${result.endDate}｜已記錄 ${result.recordedDays} 天・${result.recordCount} 筆\n${result.cached ? '已保存回饋' : '新分析'}・${time}`;
      $('feedbackResult').hidden = false;
      const pending = getPendingCount();
      $('feedbackStatus').textContent = pending ? `另有 ${pending} 筆尚待確認上傳，這次僅分析試算表已寫入的紀錄。` : '僅依已上傳的紀錄回饋；未記錄不代表沒吃。';
    } catch (error) { $('feedbackStatus').textContent = error.message; }
    finally {
      busy = false; button.disabled = false; period.disabled = false; end.disabled = false;
      button.textContent = '查看飲食回饋'; $('feedbackPanel').setAttribute('aria-busy', 'false');
    }
  });
  return { invalidate(text) { revision++; $('feedbackResult').hidden = true; if (!busy) $('feedbackStatus').textContent = text; } };
}
