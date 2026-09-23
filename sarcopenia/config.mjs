export const APP_VERSION = '1.2.0';

// 正式啟用前，請依 google-apps-script/SETUP.md 部署各場的 Apps Script Web App，
// 再填入以 /exec 結尾的網址。
// 設定未完成時資料仍會安全保存於本機，但不會顯示為已送出。
export const EVENTS = [
  createEvent('event-1', '第一場', 'https://script.google.com/macros/s/AKfycbzQRkus5H9TnsrmKjJVCIYPgfj4CMNRrFJPXAH2c1bMJoZf4WG8nPdp6mO7Pc9Y1GKHXg/exec'),
  createEvent('event-2', '第二場'),
  createEvent('event-3', '第三場')
];

function createEvent(eventId, eventLabel, endpointUrl = '') {
  return {
    eventId,
    eventLabel,
    enabled: true,
    endpointUrl
  };
}

export function isEventConfigured(event) {
  return Boolean(event && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(event.endpointUrl));
}
