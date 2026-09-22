import { isEventConfigured } from './config.mjs';

export async function submitToGoogleForm(record, event) {
  if (!isEventConfigured(event)) {
    throw new Error('EVENT_NOT_CONFIGURED');
  }
  if (!navigator.onLine) throw new Error('OFFLINE');

  const body = new URLSearchParams();
  Object.entries(event.fields).forEach(([recordKey, entryId]) => {
    const value = record[recordKey];
    body.set(entryId, typeof value === 'boolean' ? String(value) : String(value ?? ''));
  });

  await fetch(event.formActionUrl, {
    method: 'POST',
    mode: 'no-cors',
    body
  });
}
