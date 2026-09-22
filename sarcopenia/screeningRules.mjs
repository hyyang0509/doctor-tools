export const GRIP_THRESHOLDS = Object.freeze({
  male: Object.freeze({ younger: 34, older: 28 }),
  female: Object.freeze({ younger: 20, older: 18 })
});

export const CALF_THRESHOLDS = Object.freeze({ male: 34, female: 33 });

export function validateInput(input) {
  const errors = {};
  const participantNo = String(input.participant_no ?? '').trim();
  const age = Number(input.age);
  const grip = Number(input.grip_strength_kg);
  const calf = Number(input.calf_circumference_cm);

  if (!participantNo) errors.participant_no = '請輸入民眾編號。';
  if (input.age === '' || input.age == null || !Number.isFinite(age)) errors.age = '請輸入有效年齡。';
  else if (!Number.isInteger(age)) errors.age = '年齡請輸入整數。';
  else if (age < 50) errors.age = '本版 AWGS 2025 自動判讀適用 50 歲以上。';
  else if (age > 130) errors.age = '年齡超出合理範圍，請核對。';

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
