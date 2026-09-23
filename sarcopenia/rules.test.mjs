import test from 'node:test';
import assert from 'node:assert/strict';
import { assessScreening, resolveAgeInput, validateInput } from './screeningRules.mjs';

const base = { age: 60, sex: 'male', grip_strength_kg: 40, calf_circumference_cm: 40 };

[
  [50, 'male', 33.9, true], [64, 'male', 34, false],
  [50, 'female', 19.9, true], [64, 'female', 20, false],
  [65, 'male', 27.9, true], [80, 'male', 28, false],
  [65, 'female', 17.9, true], [80, 'female', 18, false]
].forEach(([age, sex, grip, expected]) => {
  test(`${age} 歲 ${sex} 握力 ${grip}`, () => {
    assert.equal(assessScreening({ ...base, age, sex, grip_strength_kg: grip }).grip_low, expected);
  });
});

test('小腿圍邊界值使用嚴格小於', () => {
  assert.equal(assessScreening({ ...base, calf_circumference_cm: 33.9 }).calf_low, true);
  assert.equal(assessScreening({ ...base, calf_circumference_cm: 34 }).calf_low, false);
  assert.equal(assessScreening({ ...base, sex: 'female', calf_circumference_cm: 32.9 }).calf_low, true);
  assert.equal(assessScreening({ ...base, sex: 'female', calf_circumference_cm: 33 }).calf_low, false);
});

test('任一項偏低即篩檢陽性', () => {
  assert.equal(assessScreening({ ...base, grip_strength_kg: 33 }).screening_result, 'screen_positive');
  assert.equal(assessScreening({ ...base, calf_circumference_cm: 33 }).screening_result, 'screen_positive');
  assert.equal(assessScreening(base).screening_result, 'negative');
});

test('拒絕不適用年齡與超出合理範圍', () => {
  assert.equal(validateInput({ ...base, participant_no: '1', age: 49 }).age.includes('50 歲以上'), true);
  assert.ok(validateInput({ ...base, participant_no: '1', grip_strength_kg: 101 }).grip_strength_kg);
  assert.ok(validateInput({ ...base, participant_no: '1', calf_circumference_cm: 9 }).calf_circumference_cm);
});


test('民國出生年依當年度換算約略年齡', () => {
  const referenceDate = new Date('2026-09-23T00:00:00Z');
  assert.deepEqual(
    resolveAgeInput({ age_input_method: 'roc_year', roc_birth_year: '50' }, referenceDate),
    { method: 'roc_year', age: 65, errorKey: 'roc_birth_year', error: '' }
  );
});

test('直接輸入年齡為預設且優先採用', () => {
  const referenceDate = new Date('2026-09-23T00:00:00Z');
  assert.equal(resolveAgeInput({ age: '66', roc_birth_year: '50' }, referenceDate).age, 66);
});

test('民國出生年錯誤顯示在對應欄位', () => {
  const errors = validateInput({ ...base, participant_no: '1', age_input_method: 'roc_year', roc_birth_year: '' });
  assert.ok(errors.roc_birth_year);
  assert.equal(errors.age, undefined);
});
