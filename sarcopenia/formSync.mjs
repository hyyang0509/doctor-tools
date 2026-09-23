import { isEventConfigured } from './config.mjs';

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
  await fetchImpl(event.endpointUrl, {
    method: 'POST',
    mode: 'no-cors',
    body
  });
}
