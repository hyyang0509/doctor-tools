/**
 * 王朝文字遊戲｜核心狀態管理
 *
 * 本檔只負責資料結構、資料校驗與本機存讀檔，不處理畫面或事件劇情。
 * 使用 ES Module 載入：<script type="module" src="./gameState.js"></script>
 */

export const SAVE_SCHEMA_VERSION = 3;
export const STORAGE_KEY = "hy-tools.text-game.save.v1";

const 屬性下限 = 0;
const 屬性上限 = 100;

const 初始王朝 = Object.freeze({
  國號: "晟",
  起始年份: 1,
  歷代帝王譜: [],
  本朝起居注: [],
  朝代累計積分: 0,
});

const 初始天子 = Object.freeze({
  廟號: "未定",
  姓名: "蕭承淵",
  在位年數: 1,
  年號: "開元",
  四維屬性: {
    仁德: 50,
    威儀: 50,
    雄略: 50,
    壽元健康: 100,
  },
  儲君資訊: {
    是否冊立: false,
    姓名: "",
    年齡: 0,
    資質: 50,
    正統性: 50,
    四維屬性: {
      仁德: 50,
      威儀: 50,
      雄略: 50,
      壽元健康: 100,
    },
  },
});

const 初始國勢 = Object.freeze({
  國庫: 5000,
  太倉: 5000,
  甲兵: 5000,
  社稷穩定度: 70,
  四方威脅: {
    北狄: 20,
    南蠻: 20,
    西戎: 20,
    東夷: 20,
  },
});

const 初始朝局 = Object.freeze({
  文官: { 勢力值: 25, 忠誠度: 60 },
  武將: { 勢力值: 25, 忠誠度: 60 },
  外戚: { 勢力值: 25, 忠誠度: 60 },
  宦官: { 勢力值: 25, 忠誠度: 60 },
});

/** 以 JSON 深拷貝，遊戲狀態僅容許可序列化資料。 */
function 謄錄(value) {
  return JSON.parse(JSON.stringify(value));
}

function 整數(value, fallback, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function 文字(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function 百分值(value, fallback) {
  return 整數(value, fallback, 屬性下限, 屬性上限);
}

function 整理帝王譜(records) {
  if (!Array.isArray(records)) return [];

  return records
    .filter((record) => record && typeof record === "object" && !Array.isArray(record))
    .map((record) => ({
      廟號: 文字(record.廟號, "未定"),
      姓名: 文字(record.姓名, "未詳"),
      年號: 文字(record.年號, "未詳"),
      在位起年: 整數(record.在位起年, 1, 1),
      在位迄年: 整數(record.在位迄年, 1, 1),
      在位年數: 整數(record.在位年數, 1, 0),
      帝王評分: 整數(record.帝王評分, 0, 0),
      諡號: 文字(record.諡號, "未議"),
      駕崩原因: 文字(record.駕崩原因, "壽終"),
      繼承結果: 文字(record.繼承結果, "未詳"),
    }));
}

function 整理起居注(records) {
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => record && typeof record === "object" && !Array.isArray(record))
    .slice(-100)
    .map((record) => ({
      年份: 整數(record.年份, 1, 1),
      年號: 文字(record.年號, "未詳"),
      類別: 文字(record.類別, "國政"),
      記述: 文字(record.記述, "史闕有間"),
    }));
}

function 整理王朝(source = {}) {
  return {
    國號: 文字(source.國號, 初始王朝.國號),
    起始年份: 整數(source.起始年份, 初始王朝.起始年份, 1),
    歷代帝王譜: 整理帝王譜(source.歷代帝王譜),
    本朝起居注: 整理起居注(source.本朝起居注),
    朝代累計積分: 整數(source.朝代累計積分, 初始王朝.朝代累計積分, 0),
  };
}

function 整理天子(source = {}) {
  const attributes = source.四維屬性 ?? {};
  const heir = source.儲君資訊 ?? {};
  const heirAttributes = heir.四維屬性 ?? {};

  return {
    廟號: 文字(source.廟號, 初始天子.廟號),
    姓名: 文字(source.姓名, 初始天子.姓名),
    在位年數: 整數(source.在位年數, 初始天子.在位年數, 1),
    年號: 文字(source.年號, 初始天子.年號),
    四維屬性: {
      仁德: 百分值(attributes.仁德, 初始天子.四維屬性.仁德),
      威儀: 百分值(attributes.威儀, 初始天子.四維屬性.威儀),
      雄略: 百分值(attributes.雄略, 初始天子.四維屬性.雄略),
      壽元健康: 百分值(attributes.壽元健康, 初始天子.四維屬性.壽元健康),
    },
    儲君資訊: {
      是否冊立: heir.是否冊立 === true,
      姓名: 文字(heir.姓名),
      年齡: 整數(heir.年齡, 初始天子.儲君資訊.年齡, 0),
      資質: 百分值(heir.資質, 初始天子.儲君資訊.資質),
      正統性: 百分值(heir.正統性, 初始天子.儲君資訊.正統性),
      四維屬性: {
        仁德: 百分值(heirAttributes.仁德, 初始天子.儲君資訊.四維屬性.仁德),
        威儀: 百分值(heirAttributes.威儀, 初始天子.儲君資訊.四維屬性.威儀),
        雄略: 百分值(heirAttributes.雄略, 初始天子.儲君資訊.四維屬性.雄略),
        壽元健康: 百分值(heirAttributes.壽元健康, 初始天子.儲君資訊.四維屬性.壽元健康),
      },
    },
  };
}

function 整理國勢(source = {}) {
  const threats = source.四方威脅 ?? {};

  return {
    國庫: 整數(source.國庫, 初始國勢.國庫, 0),
    太倉: 整數(source.太倉, 初始國勢.太倉, 0),
    甲兵: 整數(source.甲兵, 初始國勢.甲兵, 0),
    社稷穩定度: 百分值(source.社稷穩定度, 初始國勢.社稷穩定度),
    四方威脅: {
      北狄: 百分值(threats.北狄, 初始國勢.四方威脅.北狄),
      南蠻: 百分值(threats.南蠻, 初始國勢.四方威脅.南蠻),
      西戎: 百分值(threats.西戎, 初始國勢.四方威脅.西戎),
      東夷: 百分值(threats.東夷, 初始國勢.四方威脅.東夷),
    },
  };
}

function 整理朋黨(source = {}) {
  const faction = (name) => {
    const current = source[name] ?? {};
    const defaults = 初始朝局[name];
    return {
      勢力值: 百分值(current.勢力值, defaults.勢力值),
      忠誠度: 百分值(current.忠誠度, defaults.忠誠度),
    };
  };

  return {
    文官: faction("文官"),
    武將: faction("武將"),
    外戚: faction("外戚"),
    宦官: faction("宦官"),
  };
}

/**
 * 將來源資料整理為完整且安全的遊戲狀態。
 * 缺漏欄位會補預設值，超出 0–100 的屬性則自動收束。
 */
function 整理遊戲狀態(source = {}) {
  return {
    版本: SAVE_SCHEMA_VERSION,
    Dynasty: 整理王朝(source.Dynasty),
    CurrentEmperor: 整理天子(source.CurrentEmperor),
    EmpireStatus: 整理國勢(source.EmpireStatus),
    CourtFactions: 整理朋黨(source.CourtFactions),
  };
}

/** 建立一份互不共用參照的新局資料。 */
export function createInitialGameState() {
  return 整理遊戲狀態({
    Dynasty: 謄錄(初始王朝),
    CurrentEmperor: 謄錄(初始天子),
    EmpireStatus: 謄錄(初始國勢),
    CourtFactions: 謄錄(初始朝局),
  });
}

// 對外維持固定物件參照，讓後續 UI 即使在讀檔後也不會握到失效物件。
export const Dynasty = {};
export const CurrentEmperor = {};
export const EmpireStatus = {};
export const CourtFactions = {};

function 更新物件(target, source) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, 謄錄(source));
}

function 套用遊戲狀態(state) {
  const safeState = 整理遊戲狀態(state);
  更新物件(Dynasty, safeState.Dynasty);
  更新物件(CurrentEmperor, safeState.CurrentEmperor);
  更新物件(EmpireStatus, safeState.EmpireStatus);
  更新物件(CourtFactions, safeState.CourtFactions);
  return getGameState();
}

/** 取得當前狀態快照；修改快照不會意外改動正式遊戲資料。 */
export function getGameState() {
  return 謄錄({
    版本: SAVE_SCHEMA_VERSION,
    Dynasty,
    CurrentEmperor,
    EmpireStatus,
    CourtFactions,
  });
}

/**
 * 取得可用的 localStorage。
 * 無痕模式、瀏覽器禁用儲存或測試環境中，均以 null 安全退回。
 */
function 取得庫房() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * 將目前局勢封存於本機瀏覽器。
 * @returns {{ok: boolean, message: string}}
 */
export function saveGame(storage = 取得庫房()) {
  if (!storage) return { ok: false, message: "此瀏覽器目前無法使用本機存檔。" };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(getGameState()));
    return { ok: true, message: "局勢已封存。" };
  } catch (error) {
    console.error("[王朝遊戲] 存檔失敗：", error);
    return { ok: false, message: "存檔失敗，請確認瀏覽器儲存空間。" };
  }
}

/**
 * 讀取並校驗本機存檔。壞檔不會覆蓋目前進度。
 * @returns {{ok: boolean, message: string, state: object}}
 */
export function loadGame(storage = 取得庫房()) {
  if (!storage) {
    return { ok: false, message: "此瀏覽器目前無法使用本機存檔。", state: getGameState() };
  }

  try {
    const rawSave = storage.getItem(STORAGE_KEY);
    if (!rawSave) return { ok: false, message: "尚無可讀取的存檔。", state: getGameState() };

    const parsed = JSON.parse(rawSave);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("存檔格式不正確");
    }

    const state = 套用遊戲狀態(parsed);
    return { ok: true, message: "舊局已復。", state };
  } catch (error) {
    console.error("[王朝遊戲] 讀檔失敗：", error);
    return { ok: false, message: "存檔已損毀，未變更目前進度。", state: getGameState() };
  }
}

/**
 * 清除本機存檔並回到初始局勢。
 * 即使本機儲存不可用，記憶體內的遊戲仍會正常重置。
 */
export function resetGame(storage = 取得庫房()) {
  套用遊戲狀態(createInitialGameState());

  if (!storage) {
    return { ok: true, message: "新朝已立；惟此瀏覽器無法清除本機存檔。", state: getGameState() };
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return { ok: true, message: "舊局已除，新朝肇始。", state: getGameState() };
  } catch (error) {
    console.error("[王朝遊戲] 清除存檔失敗：", error);
    return { ok: false, message: "局勢已重置，但舊存檔未能清除。", state: getGameState() };
  }
}

// 啟建新局。
套用遊戲狀態(createInitialGameState());
