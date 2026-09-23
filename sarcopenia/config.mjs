export const APP_VERSION = '1.1.0';

// 正式啟用前，請填入各場 Google 表單的 formResponse 網址與 entry ID。
// 設定未完成時資料仍會安全保存於本機，但不會顯示為已送出。
export const EVENTS = [
  createEvent('event-1', '第一場'),
  createEvent('event-2', '第二場'),
  createEvent('event-3', '第三場')
];

function createEvent(eventId, eventLabel) {
  return {
    eventId,
    eventLabel,
    enabled: true,
    formActionUrl: '',
    fields: {
      record_id: '',
      event_id: '',
      event_label: '',
      participant_no: '',
      age_input_method: '',
      age: '',
      roc_birth_year: '',
      sex: '',
      grip_strength_kg: '',
      grip_special_cause: '',
      calf_circumference_cm: '',
      grip_low: '',
      calf_low: '',
      screening_result: '',
      trigger_reason: '',
      measured_at: '',
      app_version: '',
      duplicate_override: ''
    }
  };
}

export function isEventConfigured(event) {
  if (!event || !/^https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[^/]+\/formResponse$/.test(event.formActionUrl)) return false;
  return Object.values(event.fields).every(value => /^entry\.\d+$/.test(value));
}
