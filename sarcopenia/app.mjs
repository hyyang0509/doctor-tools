import { APP_VERSION, EVENTS, isEventConfigured } from './config.mjs';
import { assessScreening, triggerReasonLabel, validateInput } from './screeningRules.mjs';
import {
  addPendingRecord, clearAll, createRecordId, getPendingRecords, isDuplicate,
  loadCurrentEvent, loadRecords, markRecordSent, saveCurrentEvent
} from './storage.mjs';
import { submitToGoogleForm } from './formSync.mjs';

const $ = id => document.getElementById(id);
const elements = {
  eventSetup: $('eventSetup'), eventSelect: $('eventSelect'), confirmEvent: $('confirmEvent'),
  workspace: $('workspace'), currentEventLabel: $('currentEventLabel'), changeEvent: $('changeEvent'),
  configWarning: $('configWarning'), form: $('screeningForm'), formError: $('formError'),
  submitButton: $('submitButton'), pendingCount: $('pendingCount'), retryButton: $('retryButton'),
  duplicateDialog: $('duplicateDialog'), resultCard: $('resultCard'), resultIcon: $('resultIcon'),
  resultTitle: $('resultTitle'), resultReason: $('resultReason'), resultAdvice: $('resultAdvice'),
  specialNote: $('specialNote'), syncStatus: $('syncStatus'), nextButton: $('nextButton'),
  exportButton: $('exportButton'), clearButton: $('clearButton'), participantNo: $('participantNo')
};

let currentEvent = null;
let queuedDuplicateInput = null;
let isSaving = false;

function enabledEvents() { return EVENTS.filter(event => event.enabled); }
function findEvent(id) { return enabledEvents().find(event => event.eventId === id) || null; }

function initializeEvents() {
  enabledEvents().forEach(event => {
    const option = document.createElement('option');
    option.value = event.eventId;
    option.textContent = event.eventLabel;
    elements.eventSelect.append(option);
  });
  const saved = findEvent(loadCurrentEvent());
  if (saved) activateEvent(saved);
  updatePendingStatus();
}

function activateEvent(event) {
  currentEvent = event;
  saveCurrentEvent(event.eventId);
  elements.eventSelect.value = event.eventId;
  elements.currentEventLabel.textContent = event.eventLabel;
  elements.configWarning.hidden = isEventConfigured(event);
  elements.eventSetup.hidden = true;
  elements.workspace.hidden = false;
  resetForNext();
}

function showEventPicker() {
  elements.eventSelect.value = currentEvent?.eventId || '';
  elements.workspace.hidden = true;
  elements.eventSetup.hidden = false;
  elements.eventSelect.focus();
}

function readInput() {
  const formData = new FormData(elements.form);
  return {
    participant_no: String(formData.get('participant_no') || '').trim(),
    age: String(formData.get('age') || ''),
    sex: String(formData.get('sex') || ''),
    grip_strength_kg: String(formData.get('grip_strength_kg') || ''),
    grip_special_cause: formData.get('grip_special_cause') === 'on',
    calf_circumference_cm: String(formData.get('calf_circumference_cm') || '')
  };
}

function showErrors(errors) {
  document.querySelectorAll('[data-error-for]').forEach(node => {
    const key = node.dataset.errorFor;
    node.textContent = errors[key] || '';
    const input = elements.form.elements[key];
    if (input && typeof input.setAttribute === 'function') {
      if (errors[key]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  });
  elements.formError.hidden = true;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return true;
  const target = elements.form.elements[firstKey];
  if (target instanceof RadioNodeList) target[0]?.focus();
  else target?.focus();
  return false;
}

function buildRecord(input, duplicateOverride) {
  const assessment = assessScreening(input);
  return {
    record_id: createRecordId(),
    event_id: currentEvent.eventId,
    event_label: currentEvent.eventLabel,
    participant_no: input.participant_no,
    age: Number(input.age),
    sex: input.sex,
    grip_strength_kg: Number(input.grip_strength_kg),
    grip_special_cause: input.grip_special_cause,
    calf_circumference_cm: Number(input.calf_circumference_cm),
    grip_low: assessment.grip_low,
    calf_low: assessment.calf_low,
    screening_result: assessment.screening_result,
    trigger_reason: assessment.trigger_reason,
    measured_at: new Date().toISOString(),
    app_version: APP_VERSION,
    duplicate_override: Boolean(duplicateOverride)
  };
}

async function saveAndSync(input, duplicateOverride = false) {
  if (isSaving) return;
  isSaving = true;
  elements.submitButton.disabled = true;
  elements.submitButton.textContent = '儲存中…';
  const record = buildRecord(input, duplicateOverride);

  try {
    addPendingRecord(record);
  } catch {
    showFormError('本機儲存失敗，資料尚未送出。請確認瀏覽器儲存空間後再試。');
    finishSaving();
    return;
  }

  let syncResult = 'pending';
  let syncMessage = isEventConfigured(currentEvent)
    ? '⚠ 尚未送出，已保存在本機'
    : '⚠ 尚未送出：目前場次尚未完成資料連結設定，已保存在本機';
  try {
    await submitToGoogleForm(record, currentEvent);
    markRecordSent(record.record_id);
    syncResult = 'sent';
    syncMessage = '✓ 已送出，並保留本機紀錄';
  } catch (error) {
    if (error.message !== 'EVENT_NOT_CONFIGURED' && navigator.onLine) {
      syncMessage = '⚠ 送出未完成，已保存在本機，請稍後補送';
    }
  }

  renderResult(record, syncResult, syncMessage);
  updatePendingStatus();
  finishSaving();
}

function finishSaving() {
  isSaving = false;
  elements.submitButton.disabled = false;
  elements.submitButton.textContent = '儲存並送出';
}

function showFormError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
}

function renderResult(record, syncResult, syncMessage) {
  const positive = record.screening_result === 'screen_positive';
  elements.resultCard.className = `result-card ${positive ? 'positive' : 'negative'}`;
  elements.resultIcon.textContent = positive ? '!' : '✓';
  elements.resultTitle.textContent = positive ? '肌少症篩檢陽性，建議進一步評估' : '本次篩檢未見明顯異常';
  elements.resultReason.textContent = positive ? `觸發原因：${triggerReasonLabel(record.trigger_reason)}` : '';
  elements.resultReason.hidden = !positive;
  elements.resultAdvice.textContent = positive ? '建議至本院接受 DXA 肌肉量等進一步評估。' : '本結果為當次篩檢參考。';
  elements.specialNote.hidden = !record.grip_special_cause;
  elements.syncStatus.textContent = syncMessage;
  elements.syncStatus.dataset.status = syncResult;
  elements.form.hidden = true;
  elements.resultCard.hidden = false;
  elements.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  elements.nextButton.focus({ preventScroll: true });
}

function resetForNext() {
  elements.form.reset();
  showErrors({});
  elements.formError.hidden = true;
  elements.resultCard.hidden = true;
  elements.form.hidden = false;
  requestAnimationFrame(() => elements.participantNo.focus());
}

function updatePendingStatus() {
  const count = getPendingRecords().length;
  elements.pendingCount.textContent = count ? `尚有 ${count} 筆未送出` : '尚無待送資料';
  elements.retryButton.disabled = count === 0;
}

async function retryPending() {
  const pending = getPendingRecords();
  if (!pending.length) return;
  if (!navigator.onLine) {
    window.alert('目前沒有網路連線，資料仍安全保存在本機。');
    return;
  }
  elements.retryButton.disabled = true;
  elements.retryButton.textContent = '補送中…';
  let sent = 0;
  let unconfigured = 0;
  for (const record of pending) {
    const event = findEvent(record.event_id);
    if (!isEventConfigured(event)) { unconfigured += 1; continue; }
    try {
      await submitToGoogleForm(record, event);
      markRecordSent(record.record_id);
      sent += 1;
    } catch { /* 保留 pending，讓工作人員稍後再次補送 */ }
  }
  elements.retryButton.textContent = '補送未同步資料';
  updatePendingStatus();
  const remaining = getPendingRecords().length;
  const detail = unconfigured ? `；其中 ${unconfigured} 筆的場次尚未完成連結設定` : '';
  window.alert(`已補送 ${sent} 筆，尚有 ${remaining} 筆未送出${detail}。`);
}

function csvCell(value) {
  let text = typeof value === 'boolean' ? String(value) : String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  const records = loadRecords();
  if (!records.length) { window.alert('目前沒有可匯出的本機紀錄。'); return; }
  const headers = ['record_id','event_id','event_label','participant_no','age','sex','grip_strength_kg','grip_special_cause','calf_circumference_cm','grip_low','calf_low','screening_result','trigger_reason','measured_at','app_version','duplicate_override','sync_status','sent_at'];
  const rows = [headers.map(csvCell).join(','), ...records.map(record => headers.map(key => csvCell(record[key])).join(','))];
  const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `肌少症篩檢本機備份_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearLocalData() {
  if (!window.confirm('確定要清除這台裝置上的所有肌少症篩檢紀錄嗎？')) return;
  const pending = getPendingRecords().length;
  const secondMessage = pending
    ? `仍有 ${pending} 筆尚未送出，清除後無法復原。再次確認仍要清除？`
    : '清除後無法復原。再次確認仍要清除？';
  if (!window.confirm(secondMessage)) return;
  clearAll();
  currentEvent = null;
  updatePendingStatus();
  showEventPicker();
}

elements.confirmEvent.addEventListener('click', () => {
  const event = findEvent(elements.eventSelect.value);
  if (!event) { elements.eventSelect.focus(); return; }
  activateEvent(event);
});

elements.changeEvent.addEventListener('click', () => {
  const pending = getPendingRecords().length;
  const message = pending
    ? `尚有 ${pending} 筆未送出。資料會保留原場次，不會改掛到新場次。仍要更換嗎？`
    : '確定要更換活動場次嗎？';
  if (window.confirm(message)) showEventPicker();
});

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  if (!currentEvent || isSaving) return;
  const input = readInput();
  if (!showErrors(validateInput(input))) return;
  if (isDuplicate(currentEvent.eventId, input.participant_no)) {
    queuedDuplicateInput = input;
    if (typeof elements.duplicateDialog.showModal === 'function') elements.duplicateDialog.showModal();
    else if (window.confirm('此編號在目前場次已有紀錄。確認仍要新增？')) saveAndSync(input, true);
    return;
  }
  saveAndSync(input);
});

elements.duplicateDialog.addEventListener('close', () => {
  if (elements.duplicateDialog.returnValue === 'confirm' && queuedDuplicateInput) saveAndSync(queuedDuplicateInput, true);
  queuedDuplicateInput = null;
});
elements.nextButton.addEventListener('click', resetForNext);
elements.retryButton.addEventListener('click', retryPending);
elements.exportButton.addEventListener('click', exportCsv);
elements.clearButton.addEventListener('click', clearLocalData);
window.addEventListener('online', updatePendingStatus);

initializeEvents();
