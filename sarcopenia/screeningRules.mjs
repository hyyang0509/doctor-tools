export const GRIP_THRESHOLDS = Object.freeze({
  male: Object.freeze({ younger: 34, older: 28 }),
  female: Object.freeze({ younger: 20, older: 18 })
});

export const CALF_THRESHOLDS = Object.freeze({ male: 34, female: 33 });

export function resolveAgeInput(input, referenceDate = new Date()) {
  const method = input.age_input_method === 'roc_year' ? 'roc_year' : 'age';
  const errorKey = method === 'roc_year' ? 'roc_birth_year' : 'age';
  const rawValue = method === 'roc_year' ? input.roc_birth_year : input.age;
  const value = Number(rawValue);

  if (rawValue === '' || rawValue == null || !Number.isFinite(value)) {
    return { method, age: null, errorKey, error: method === 'roc_year' ? '請輸入有效的民國出生年。' : '請輸入有效年齡。' };
  }
  if (!Number.isInteger(value)) {
    return { method, age: null, errorKey, error: method === 'roc_year' ? '民國出生年請輸入整數。' : '年齡請輸入整數。' };
  }

  let age = value;
  if (method === 'roc_year') {
    const currentRocYear = referenceDate.getFullYear() - 1911;
    if (value < 1 || value > currentRocYear) {
      return { method, age: null, errorKey, error: `民國出生年須介於 1–${currentRocYear} 年。` };
    }
    age = currentRocYear - value;
  }

  if (age < 50) return { method, age, errorKey, error: '本版 AWGS 2025 自動判讀適用 50 歲以上。' };
  if (age > 130) return { method, age, errorKey, error: '年齡超出合理範圍，請核對。' };
  return { method, age, errorKey, error: '' };
}

export function validateInput(input) {
  const errors = {};
  const participantNo = String(input.participant_no ?? '').trim();
  const ageResult = resolveAgeInput(input);
  const grip = Number(input.grip_strength_kg);
  const calf = Number(input.calf_circumference_cm);

  if (!participantNo) errors.participant_no = '請輸入民眾編號。';
  if (ageResult.error) errors[ageResult.errorKey] = ageResult.error;

  if (!['male', 'female'].includes(input.sex)) errors.sex = '請選擇性別。';
  if (input.grip_strength_kg === '' || input.grip_strength_kg == null || !Number.isFinite(grip)) errors.grip_strength_kg = '請輸入有效的最大握力。';
  else if (grip < 0 || grip > 100) errors.grip_strength_kg = '最大握力須介於 0–100 kg。';

  if (input.calf_circumference_cm === '' || input.calf_circumference_cm == null || !Number.isFinite(calf)) errors.calf_circumference_cm = '請輸入有效的小腿圍。';
  else if (calf < 10 || calf > 80) errors.calf_circumference_cm = '小腿圍須介於 10–80 cm。';

  return errors;
}

export function assessScreening({ age, sex, grip_strength_kg, calf_circumference_cm }) {
  const ageBand = Number(age) >= 65 ? 'older' : 'younger';
  const gripThreshold = GRIP_THRESHOLDS[sex][ageBand];
  const calfThreshold = CALF_THRESHOLDS[sex];
  const gripLow = Number(grip_strength_kg) < gripThreshold;
  const calfLow = Number(calf_circumference_cm) < calfThreshold;
  const triggerReason = gripLow && calfLow ? 'both' : gripLow ? 'grip' : calfLow ? 'calf' : 'none';

  return {
    grip_low: gripLow,
    calf_low: calfLow,
    screening_result: gripLow || calfLow ? 'screen_positive' : 'negative',
    trigger_reason: triggerReason,
    thresholds: { grip: gripThreshold, calf: calfThreshold }
  };
}

export function triggerReasonLabel(reason) {
  return ({ grip: '握力偏低', calf: '小腿圍偏低', both: '握力與小腿圍皆偏低', none: '' })[reason] || '';
}
