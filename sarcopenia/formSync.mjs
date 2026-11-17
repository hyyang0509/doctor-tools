import { isEventConfigured } from './config.mjs';

// 只有讀得到、且 Apps Script 明確回覆 ok:true 的請求才算送出成功；
// 其餘情況（被拒、逾時、回覆格式不正確）一律拋錯，讓紀錄保持待送。
export async function submitToCloud(record, event, options = {}) {
  if (!isEventConfigured(event)) {
    throw new Error('EVENT_NOT_CONFIGURED');
  }
  const online = options.online ?? globalThis.navigator?.onLine ?? true;
  if (!online) throw new Error('OFFLINE');

  const body = new URLSearchParams();
  Object.entries(record).forEach(([key, value]) => {
    body.set(key, typeof value === 'boolean' ? String(value) : String(value ?? ''));
  });

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(event.endpointUrl, {
      method: 'POST',
      redirect: 'follow',
      credentials: 'omit',
      cache: 'no-store',
      body,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response || !response.ok || response.type === 'opaque') {
    throw new Error('NO_CONFIRMATION');
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('INVALID_RESPONSE');
  }
  if (!result || result.ok !== true) {
    throw new Error(result && result.error ? String(result.error) : 'REJECTED');
  }
  return result;
}
