/** 王朝文字遊戲｜事件引擎與皇統承繼 */

import {
  CourtFactions,
  CurrentEmperor,
  Dynasty,
  EmpireStatus,
  getGameState,
  saveGame,
} from "./gameState.js";
import { EVENTS } from "./eventsData.js";

const STATE_ROOTS = { Dynasty, CurrentEmperor, EmpireStatus, CourtFactions };
const PERCENT_FIELDS = new Set([
  "仁德", "威儀", "雄略", "壽元健康", "社稷穩定度",
  "北狄", "南蠻", "西戎", "東夷", "勢力值", "忠誠度", "資質", "正統性",
]);
const NON_NEGATIVE_FIELDS = new Set([
  "國庫", "太倉", "甲兵", "朝代累計積分", "在位年數", "年齡",
]);
const ERA_NAMES = ["景和", "承平", "熙寧", "永祐", "乾元", "隆昌", "明德", "泰始"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function randomIndex(length, random = Math.random) {
  if (!Number.isInteger(length) || length < 1) throw new RangeError("無可供抽選之項目。");
  const roll = Number(random());
  const safeRoll = Number.isFinite(roll) ? Math.min(0.999999999, Math.max(0, roll)) : 0;
  return Math.floor(safeRoll * length);
}

function getPathTarget(path) {
  const parts = path.split(".");
  const root = STATE_ROOTS[parts.shift()];
  if (!root) throw new TypeError(`不允許的狀態路徑：${path}`);

  let target = root;
  while (parts.length > 1) {
    const key = parts.shift();
    if (!target[key] || typeof target[key] !== "object") {
      throw new TypeError(`不存在的狀態路徑：${path}`);
    }
    target = target[key];
  }

  const key = parts[0];
  if (!key || typeof target[key] !== "number") {
    throw new TypeError(`事件只能增減既有數值：${path}`);
  }
  return { target, key };
}

function applyDelta(path, delta) {
  if (!Number.isFinite(delta)) throw new TypeError(`事件影響必須為數值：${path}`);
  const { target, key } = getPathTarget(path);
  const before = target[key];
  let after = before + delta;
  if (PERCENT_FIELDS.has(key)) after = clamp(after, 0, 100);
  else if (NON_NEGATIVE_FIELDS.has(key)) after = Math.max(0, Math.round(after));
  else after = Math.round(after);
  target[key] = after;
  return { path, before, delta: after - before, after };
}

function setHeir(heir) {
  if (!heir) return;
  CurrentEmperor.儲君資訊 = {
    是否冊立: true,
    姓名: heir.姓名,
    年齡: clamp(heir.年齡, 0, 120),
    資質: clamp(heir.資質, 0, 100),
    正統性: clamp(heir.正統性, 0, 100),
    四維屬性: {
      仁德: clamp(heir.四維屬性.仁德, 0, 100),
      威儀: clamp(heir.四維屬性.威儀, 0, 100),
      雄略: clamp(heir.四維屬性.雄略, 0, 100),
      壽元健康: clamp(heir.四維屬性.壽元健康, 0, 100),
    },
  };
}

function emperorScore() {
  const attributes = CurrentEmperor.四維屬性;
  return Math.max(0, Math.round(
    attributes.仁德 + attributes.威儀 + attributes.雄略
    + EmpireStatus.社稷穩定度 + Math.min(CurrentEmperor.在位年數 * 2, 40),
  ));
}

function assignTempleName(score, wasAssassinated) {
  if (Dynasty.歷代帝王譜.length === 0) return "太祖";
  if (wasAssassinated && score < 180) return "愍宗";
  if (score >= 300) return "世宗";
  if (score >= 245) return "仁宗";
  if (score >= 195) return "宣宗";
  return "哀宗";
}

function assignPosthumousTitle(score, wasAssassinated) {
  if (wasAssassinated) return "愍皇帝";
  const attributes = CurrentEmperor.四維屬性;
  if (attributes.仁德 >= 75) return "仁文皇帝";
  if (attributes.雄略 >= 75) return "武烈皇帝";
  if (score >= 260) return "孝成皇帝";
  return "恭皇帝";
}

function nextEraName(random) {
  return ERA_NAMES[randomIndex(ERA_NAMES.length, random)];
}

function clearHeir() {
  return {
    是否冊立: false, 姓名: "", 年齡: 0, 資質: 50, 正統性: 50,
    四維屬性: { 仁德: 50, 威儀: 50, 雄略: 50, 壽元健康: 100 },
  };
}

function enthrone({ name, attributes, era }) {
  CurrentEmperor.廟號 = "未定";
  CurrentEmperor.姓名 = name;
  CurrentEmperor.在位年數 = 1;
  CurrentEmperor.年號 = era;
  CurrentEmperor.四維屬性 = { ...attributes };
  CurrentEmperor.儲君資訊 = clearHeir();
}

/**
 * 判定駕崩並完成承繼。健康尚存且未遇弒時，不變更皇統。
 */
export function checkEmperorDeath({ 被弒 = false, 原因 = "壽元耗盡", random = Math.random } = {}) {
  if (!被弒 && CurrentEmperor.四維屬性.壽元健康 > 0) {
    return { triggered: false, state: getGameState() };
  }

  const heir = JSON.parse(JSON.stringify(CurrentEmperor.儲君資訊));
  const score = emperorScore();
  const templeName = assignTempleName(score, 被弒);
  const posthumousTitle = assignPosthumousTitle(score, 被弒);
  const reignStart = Dynasty.起始年份 + Dynasty.歷代帝王譜.reduce((sum, emperor) => sum + emperor.在位年數, 0);
  const record = {
    廟號: templeName,
    諡號: posthumousTitle,
    姓名: CurrentEmperor.姓名,
    年號: CurrentEmperor.年號,
    在位起年: reignStart,
    在位迄年: reignStart + Math.max(0, CurrentEmperor.在位年數 - 1),
    在位年數: CurrentEmperor.在位年數,
    帝王評分: score,
    駕崩原因: 被弒 ? `遇弒：${原因}` : 原因,
    繼承結果: "",
  };

  let succession;
  if (CourtFactions.外戚.勢力值 > 85) {
    applyDelta("EmpireStatus.社稷穩定度", -45);
    applyDelta("EmpireStatus.國庫", -1200);
    applyDelta("EmpireStatus.太倉", -900);
    applyDelta("EmpireStatus.甲兵", -700);
    applyDelta("CourtFactions.外戚.勢力值", 10);
    applyDelta("CourtFactions.外戚.忠誠度", -25);
    applyDelta("CourtFactions.文官.忠誠度", -20);
    applyDelta("CourtFactions.武將.忠誠度", -18);
    enthrone({
      name: "外戚所立新君",
      era: nextEraName(random),
      attributes: { 仁德: 30, 威儀: 35, 雄略: 38, 壽元健康: 80 },
    });
    succession = { type: "外戚篡弒", message: "外戚乘宮闈之變篡弒擁立，天下震動。" };
  } else if (!heir.是否冊立 || !heir.姓名) {
    applyDelta("EmpireStatus.社稷穩定度", -35);
    applyDelta("EmpireStatus.國庫", -900);
    applyDelta("EmpireStatus.太倉", -650);
    applyDelta("EmpireStatus.甲兵", -1000);
    applyDelta("CourtFactions.武將.勢力值", 14);
    applyDelta("CourtFactions.武將.忠誠度", -15);
    applyDelta("CourtFactions.文官.忠誠度", -12);
    applyDelta("CourtFactions.外戚.勢力值", 8);
    enthrone({
      name: "宗室新君",
      era: nextEraName(random),
      attributes: { 仁德: 38, 威儀: 32, 雄略: 48, 壽元健康: 82 },
    });
    succession = { type: "宗室爭位內戰", message: "國本未定，宗室諸王起兵爭位，京畿兵火連天。" };
  } else {
    applyDelta("EmpireStatus.社稷穩定度", Math.round((heir.正統性 - 50) / 8));
    applyDelta("CourtFactions.文官.忠誠度", 5);
    applyDelta("CourtFactions.武將.忠誠度", 3);
    enthrone({ name: heir.姓名, era: nextEraName(random), attributes: heir.四維屬性 });
    succession = { type: "儲君繼位", message: `${heir.姓名}奉遺詔即皇帝位，改元布新。` };
  }

  record.繼承結果 = succession.type;
  Dynasty.歷代帝王譜.push(record);
  Dynasty.朝代累計積分 += score;

  return {
    triggered: true,
    deceased: record,
    succession,
    state: getGameState(),
  };
}

/** 從事件簿抽取一案，可排除本輪已出現的事件。 */
export function drawEvent({ excludeIds = [], category, random = Math.random } = {}) {
  const excluded = new Set(excludeIds);
  const candidates = EVENTS.filter(
    (event) => !excluded.has(event.id) && (!category || event.類別 === category),
  );
  return candidates[randomIndex(candidates.length, random)];
}

/** 執行一項抉擇、套用多重影響，並立即檢查弒君或健康歸零。 */
export function resolveEvent(eventId, optionId, {
  random = Math.random,
  autoSave = true,
  storage,
} = {}) {
  const event = EVENTS.find((item) => item.id === eventId);
  if (!event) throw new RangeError(`查無事件：${eventId}`);
  const option = event.選項.find((item) => item.id === optionId);
  if (!option) throw new RangeError(`查無事件選項：${optionId}`);

  const changes = Object.entries(option.影響).map(([path, delta]) => applyDelta(path, delta));
  if (option.設定儲君) setHeir(option.設定儲君);

  const assassination = option.弒君機率
    ? Number(random()) < option.弒君機率
    : false;
  const death = checkEmperorDeath({
    被弒: assassination,
    原因: assassination ? `${event.標題}之變` : "傷病不起",
    random,
  });

  const saveResult = autoSave
    ? saveGame(storage)
    : { ok: true, message: "本次結算未自動存檔。" };

  return {
    eventId,
    optionId,
    narrative: option.結果,
    changes,
    death,
    saveResult,
    state: getGameState(),
  };
}

/** 歲序推進：在位年與儲君年齡加一，天子健康自然耗減 1–4。 */
export function advanceYear({ random = Math.random, autoSave = true, storage } = {}) {
  CurrentEmperor.在位年數 += 1;
  if (CurrentEmperor.儲君資訊.是否冊立) CurrentEmperor.儲君資訊.年齡 += 1;
  const healthLoss = 1 + randomIndex(4, random);
  applyDelta("CurrentEmperor.四維屬性.壽元健康", -healthLoss);
  const death = checkEmperorDeath({ 原因: "積年成疾", random });
  const event = drawEvent({ random });
  const saveResult = autoSave ? saveGame(storage) : { ok: true, message: "本年未自動存檔。" };
  return { healthLoss, death, event, saveResult, state: getGameState() };
}

