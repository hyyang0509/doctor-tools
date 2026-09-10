/**
 * 王朝文字遊戲｜事件簿
 *
 * 「影響」使用狀態路徑與增減值，交由 eventEngine.js 統一校驗與結算。
 * 每個抉擇均牽動國勢／帝王能力與至少兩股朝廷勢力。
 */

export const EVENT_CATEGORIES = Object.freeze({
  FOREIGN: "外族侵擾",
  MILITARY: "藩鎮武將",
  PALACE: "外戚後宮",
  DISASTER: "天災民變",
  CIVIL: "文官黨爭",
});

export const EVENTS = [
  {
    id: "northern-raiders-at-pass",
    類別: EVENT_CATEGORIES.FOREIGN,
    標題: "北騎叩關",
    描述: "北方騎兵越過邊界，沿途搶掠村莊。軍方主張立刻出兵，但國庫恐怕負擔不起長期戰事。",
    選項: [
      {
        id: "lead-army",
        文案: "親自率軍迎戰",
        結果: "皇帝親臨前線，軍隊士氣大增並擊退敵軍，但軍費與傷亡都很高。",
        影響: {
          "EmpireStatus.國庫": -900, "EmpireStatus.甲兵": -550,
          "EmpireStatus.社稷穩定度": 6, "EmpireStatus.四方威脅.北狄": -18,
          "CurrentEmperor.四維屬性.雄略": 8, "CurrentEmperor.四維屬性.壽元健康": -6,
          "CourtFactions.武將.勢力值": 8, "CourtFactions.武將.忠誠度": 10,
          "CourtFactions.文官.勢力值": -3, "CourtFactions.文官.忠誠度": -4,
        },
      },
      {
        id: "buy-peace",
        文案: "談和並支付歲幣",
        結果: "邊境暫時恢復和平，但朝臣認為有損國威，歲幣也增加國庫負擔。",
        影響: {
          "EmpireStatus.國庫": -650, "EmpireStatus.社稷穩定度": -3,
          "EmpireStatus.四方威脅.北狄": -10, "CurrentEmperor.四維屬性.威儀": -7,
          "CurrentEmperor.四維屬性.仁德": 3, "CourtFactions.文官.勢力值": 5,
          "CourtFactions.文官.忠誠度": -3, "CourtFactions.武將.勢力值": -6,
          "CourtFactions.外戚.勢力值": 4, "CourtFactions.外戚.忠誠度": 5,
        },
      },
    ],
  },
  {
    id: "southern-chieftains-revolt",
    類別: EVENT_CATEGORIES.FOREIGN,
    標題: "南徼諸部反",
    描述: "南方地方官長期加稅，引發部族聯合反抗，交通也被切斷。朝廷必須決定安撫或鎮壓。",
    選項: [
      {
        id: "pacify-and-amnesty",
        文案: "懲辦貪官並招撫叛軍",
        結果: "貪官被懲辦後，多數部族願意放下武器，文官的聲望因此提高。",
        影響: {
          "EmpireStatus.國庫": -300, "EmpireStatus.社稷穩定度": 7,
          "EmpireStatus.四方威脅.南蠻": -16, "CurrentEmperor.四維屬性.仁德": 8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.武將.勢力值": -4, "CourtFactions.宦官.勢力值": -2,
        },
      },
      {
        id: "crush-revolt",
        文案: "派大軍強勢鎮壓",
        結果: "叛軍被擊敗，南方短期內不敢再反抗，但戰火也摧毀許多村落。",
        影響: {
          "EmpireStatus.國庫": -600, "EmpireStatus.甲兵": -400,
          "EmpireStatus.社稷穩定度": -5, "EmpireStatus.四方威脅.南蠻": -24,
          "CurrentEmperor.四維屬性.雄略": 6, "CurrentEmperor.四維屬性.仁德": -6,
          "CourtFactions.武將.勢力值": 9, "CourtFactions.武將.忠誠度": 8,
          "CourtFactions.文官.勢力值": -4, "CourtFactions.文官.忠誠度": -5,
        },
      },
    ],
  },
  {
    id: "jiedushi-withholds-tax",
    類別: EVENT_CATEGORIES.MILITARY,
    標題: "節度使留賦",
    描述: "地方節度使拒絕上繳三州稅收，聲稱必須留下養兵。若放任不管，他的勢力可能越來越大。",
    選項: [
      {
        id: "summon-to-court",
        文案: "召他入京並收回兵權",
        結果: "節度使被迫入京，朝廷收回稅收與兵權，但邊軍對此相當不滿。",
        影響: {
          "EmpireStatus.國庫": 650, "EmpireStatus.甲兵": -200,
          "EmpireStatus.社稷穩定度": 4, "CurrentEmperor.四維屬性.威儀": 8,
          "CourtFactions.武將.勢力值": -10, "CourtFactions.武將.忠誠度": -8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 6,
        },
      },
      {
        id: "recognize-autonomy",
        文案: "承認自治以換取部分稅收",
        結果: "地方願意上繳部分稅收，卻實際取得更大自治權，日後可能難以控制。",
        影響: {
          "EmpireStatus.國庫": 250, "EmpireStatus.社稷穩定度": -6,
          "EmpireStatus.四方威脅.北狄": -5, "CurrentEmperor.四維屬性.威儀": -6,
          "CourtFactions.武將.勢力值": 12, "CourtFactions.武將.忠誠度": 5,
          "CourtFactions.文官.勢力值": -6, "CourtFactions.文官.忠誠度": -6,
        },
      },
    ],
  },
  {
    id: "victorious-general",
    類別: EVENT_CATEGORIES.MILITARY,
    標題: "功高震主",
    描述: "一名大將立下大功，深受百姓與士兵愛戴。官員擔心他聲望過高，將來可能威脅皇權。",
    選項: [
      {
        id: "honor-without-command",
        文案: "升官厚賞，但解除兵權",
        結果: "大將獲得高位與賞賜，但失去軍隊指揮權；他雖然不滿，暫時不敢反抗。",
        影響: {
          "EmpireStatus.國庫": -500, "EmpireStatus.社稷穩定度": 5,
          "CurrentEmperor.四維屬性.威儀": 6, "CourtFactions.武將.勢力值": -7,
          "CourtFactions.武將.忠誠度": -4, "CourtFactions.文官.勢力值": 5,
          "CourtFactions.宦官.勢力值": 3, "CourtFactions.宦官.忠誠度": 4,
        },
      },
      {
        id: "return-command",
        文案: "繼續讓他掌兵守邊",
        結果: "邊軍士氣提升、外敵壓力下降，但大將掌握的兵權也更難制衡。",
        影響: {
          "EmpireStatus.甲兵": 550, "EmpireStatus.社稷穩定度": -7,
          "EmpireStatus.四方威脅.西戎": -12, "CurrentEmperor.四維屬性.雄略": 3,
          "CourtFactions.武將.勢力值": 14, "CourtFactions.武將.忠誠度": 8,
          "CourtFactions.文官.勢力值": -5, "CourtFactions.文官.忠誠度": -7,
        },
      },
    ],
  },
  {
    id: "palace-guard-mutiny",
    類別: EVENT_CATEGORIES.MILITARY,
    標題: "禁軍索餉",
    描述: "守衛京城的禁軍已三個月沒領到軍餉，士兵聚集在宮門外抗議，局勢可能失控。",
    選項: [
      {
        id: "pay-arrears",
        文案: "立刻補發軍餉並從寬處理",
        結果: "士兵領到欠餉後散去，危機解除；負責協調的宦官勢力隨之上升。",
        影響: {
          "EmpireStatus.國庫": -850, "EmpireStatus.社稷穩定度": 4,
          "CurrentEmperor.四維屬性.仁德": 4, "CourtFactions.武將.忠誠度": 10,
          "CourtFactions.武將.勢力值": 5, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.宦官.忠誠度": 6, "CourtFactions.文官.勢力值": -3,
        },
      },
      {
        id: "purge-ringleaders",
        文案: "逮捕帶頭者、強行鎮壓",
        結果: "帶頭士兵被處決，京城恢復秩序，但禁軍更加不滿，宮廷仍有遇刺風險。",
        影響: {
          "EmpireStatus.甲兵": -450, "EmpireStatus.社稷穩定度": -10,
          "CurrentEmperor.四維屬性.威儀": 7, "CurrentEmperor.四維屬性.壽元健康": -20,
          "CourtFactions.武將.勢力值": -9, "CourtFactions.武將.忠誠度": -16,
          "CourtFactions.宦官.勢力值": 10, "CourtFactions.宦官.忠誠度": 5,
        },
        弒君機率: 0.12,
      },
    ],
  },
  {
    id: "empress-clan-seeks-office",
    類別: EVENT_CATEGORIES.PALACE,
    標題: "椒房請封",
    描述: "皇后希望讓自己的兄長擔任掌握軍權的高官，群臣強烈反對，認為外戚將因此坐大。",
    選項: [
      {
        id: "grant-empty-title",
        文案: "給他頭銜與俸祿，但不給實權",
        結果: "皇后的家族得到財富與名位，卻沒有實際軍權，雙方暫時都能接受。",
        影響: {
          "EmpireStatus.國庫": -350, "EmpireStatus.社稷穩定度": 2,
          "CurrentEmperor.四維屬性.威儀": 3, "CourtFactions.外戚.勢力值": 6,
          "CourtFactions.外戚.忠誠度": 9, "CourtFactions.文官.勢力值": 2,
          "CourtFactions.文官.忠誠度": -2, "CourtFactions.宦官.勢力值": -2,
        },
      },
      {
        id: "reject-nepotism",
        文案: "直接拒絕，禁止后族干政",
        結果: "群臣支持皇帝維護制度，但皇后與她的家族對皇帝更加不滿。",
        影響: {
          "EmpireStatus.社稷穩定度": 5, "CurrentEmperor.四維屬性.威儀": 6,
          "CourtFactions.外戚.勢力值": -8, "CourtFactions.外戚.忠誠度": -14,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.宦官.忠誠度": 3,
        },
      },
    ],
  },
  {
    id: "succession-dispute",
    類別: EVENT_CATEGORIES.PALACE,
    標題: "東宮未定",
    描述: "皇后所生的長子個性仁厚但能力普通；貴妃所生的三皇子能力出色，卻不是嫡長子。朝臣要求儘快決定太子。",
    選項: [
      {
        id: "name-eldest",
        文案: "依傳統立皇長子",
        結果: "依傳統立長子使政局安定，但皇后家族的政治勢力也因此上升。",
        設定儲君: {
          姓名: "皇長子",
          年齡: 16,
          資質: 58,
          正統性: 88,
          四維屬性: { 仁德: 72, 威儀: 50, 雄略: 42, 壽元健康: 88 },
        },
        影響: {
          "EmpireStatus.社稷穩定度": 9, "CurrentEmperor.四維屬性.仁德": 5,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 9,
          "CourtFactions.外戚.勢力值": 8, "CourtFactions.外戚.忠誠度": 7,
          "CourtFactions.武將.忠誠度": -4,
        },
      },
      {
        id: "name-talented-prince",
        文案: "打破傳統立三皇子",
        結果: "新太子能力出色，但打破繼承傳統，引發朝臣長期爭論。",
        設定儲君: {
          姓名: "皇三子",
          年齡: 14,
          資質: 82,
          正統性: 55,
          四維屬性: { 仁德: 52, 威儀: 68, 雄略: 78, 壽元健康: 92 },
        },
        影響: {
          "EmpireStatus.社稷穩定度": -6, "CurrentEmperor.四維屬性.雄略": 5,
          "CourtFactions.武將.勢力值": 7, "CourtFactions.武將.忠誠度": 7,
          "CourtFactions.外戚.勢力值": 10, "CourtFactions.外戚.忠誠度": 5,
          "CourtFactions.文官.忠誠度": -10,
        },
      },
    ],
  },
  {
    id: "concubine-witchcraft-case",
    類別: EVENT_CATEGORIES.PALACE,
    標題: "巫蠱起獄",
    描述: "宮中發現寫有皇帝生辰的詛咒木偶。皇后指控是貴妃所為，但宦官暗示此案可能有人栽贓。",
    選項: [
      {
        id: "public-trial",
        文案: "交由司法官公開調查",
        結果: "公開調查證明這是宮人栽贓，司法威信提高，皇后家族則顏面受損。",
        影響: {
          "EmpireStatus.社稷穩定度": 6, "CurrentEmperor.四維屬性.仁德": 6,
          "CurrentEmperor.四維屬性.威儀": 3, "CourtFactions.文官.勢力值": 8,
          "CourtFactions.文官.忠誠度": 8, "CourtFactions.外戚.勢力值": -7,
          "CourtFactions.宦官.勢力值": -5, "CourtFactions.宦官.忠誠度": -4,
        },
      },
      {
        id: "secret-investigation",
        文案: "交給宦官祕密調查",
        結果: "事件沒有公開擴大，但宦官藉調查排除異己，宮中人人自危。",
        影響: {
          "EmpireStatus.社稷穩定度": -5, "CurrentEmperor.四維屬性.壽元健康": -5,
          "CourtFactions.宦官.勢力值": 12, "CourtFactions.宦官.忠誠度": 8,
          "CourtFactions.文官.勢力值": -6, "CourtFactions.文官.忠誠度": -6,
          "CourtFactions.外戚.忠誠度": -5,
        },
        弒君機率: 0.05,
      },
    ],
  },
  {
    id: "yellow-river-flood",
    類別: EVENT_CATEGORIES.DISASTER,
    標題: "河決千里",
    描述: "黃河堤防潰決，多個郡縣淹水，大量災民正湧向京城。救災越積極，國庫與糧倉的負擔就越重。",
    選項: [
      {
        id: "relief-and-repair",
        文案: "中央全面出錢出糧救災",
        結果: "災民獲得糧食，堤防也逐步修復，但國庫和糧倉消耗巨大。",
        影響: {
          "EmpireStatus.國庫": -1100, "EmpireStatus.太倉": -900,
          "EmpireStatus.社稷穩定度": 9, "CurrentEmperor.四維屬性.仁德": 8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 7,
          "CourtFactions.武將.勢力值": -2, "CourtFactions.外戚.勢力值": -2,
        },
      },
      {
        id: "local-self-help",
        文案: "讓地方自行籌款救災",
        結果: "中央節省了支出，地方豪強卻侵吞救災物資，災民不滿快速升高。",
        影響: {
          "EmpireStatus.國庫": -150, "EmpireStatus.太倉": -250,
          "EmpireStatus.社稷穩定度": -14, "CurrentEmperor.四維屬性.仁德": -9,
          "CourtFactions.文官.忠誠度": -8, "CourtFactions.文官.勢力值": -4,
          "CourtFactions.武將.勢力值": 5, "CourtFactions.外戚.勢力值": 4,
        },
      },
    ],
  },
  {
    id: "great-drought",
    類別: EVENT_CATEGORIES.DISASTER,
    標題: "赤地大旱",
    描述: "各地長期乾旱又遇蝗災，糧食大幅減產；京城存糧也只夠支撐半年。",
    選項: [
      {
        id: "open-granaries",
        文案: "開放糧倉、低價供糧",
        結果: "糧價逐漸穩定，饑民不必逃難；代價是太倉存糧大幅減少。",
        影響: {
          "EmpireStatus.太倉": -1200, "EmpireStatus.國庫": -350,
          "EmpireStatus.社稷穩定度": 10, "CurrentEmperor.四維屬性.仁德": 9,
          "CourtFactions.文官.忠誠度": 8, "CourtFactions.文官.勢力值": 5,
          "CourtFactions.外戚.勢力值": -3, "CourtFactions.武將.勢力值": -2,
        },
      },
      {
        id: "pray-and-ration",
        文案: "限制糧食買賣、節省存糧",
        結果: "朝廷節省了糧食，但管制催生黑市，權貴趁機囤糧牟利。",
        影響: {
          "EmpireStatus.太倉": -400, "EmpireStatus.社稷穩定度": -9,
          "CurrentEmperor.四維屬性.威儀": -4, "CurrentEmperor.四維屬性.壽元健康": -3,
          "CourtFactions.外戚.勢力值": 6, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.文官.忠誠度": -7, "CourtFactions.文官.勢力值": -3,
        },
      },
    ],
  },
  {
    id: "earthquake-at-capital",
    類別: EVENT_CATEGORIES.DISASTER,
    標題: "京畿地動",
    描述: "京城發生強烈地震，宮殿、宗廟與民宅都有損壞。群臣認為皇帝應公開自責，以安定民心。",
    選項: [
      {
        id: "self-reproach",
        文案: "公開道歉並暫停大型工程",
        結果: "皇帝公開承擔責任後民心安定，文官則趁勢要求進一步改革。",
        影響: {
          "EmpireStatus.國庫": -450, "EmpireStatus.社稷穩定度": 8,
          "CurrentEmperor.四維屬性.仁德": 7, "CurrentEmperor.四維屬性.威儀": -2,
          "CourtFactions.文官.勢力值": 9, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.宦官.勢力值": -5, "CourtFactions.外戚.勢力值": -3,
        },
      },
      {
        id: "rebuild-grandly",
        文案: "大規模重建以展現國力",
        結果: "宏大的重建展現了皇權，但工程花費龐大，也增加百姓勞役。",
        影響: {
          "EmpireStatus.國庫": -1000, "EmpireStatus.社稷穩定度": -6,
          "CurrentEmperor.四維屬性.威儀": 8, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.宦官.忠誠度": 8, "CourtFactions.文官.忠誠度": -7,
          "CourtFactions.外戚.勢力值": 4,
        },
      },
    ],
  },
  {
    id: "white-lotus-uprising",
    類別: EVENT_CATEGORIES.DISASTER,
    標題: "饑民揭竿",
    描述: "連年歉收使饑民組成叛軍，已攻下數座縣城。地方軍無力應付，叛亂仍在擴大。",
    選項: [
      {
        id: "amnesty-and-relief",
        文案: "減稅賑濟並赦免多數叛民",
        結果: "多數叛民接受赦免並返鄉，社會恢復穩定，但政府收入明顯下降。",
        影響: {
          "EmpireStatus.國庫": -800, "EmpireStatus.太倉": -600,
          "EmpireStatus.社稷穩定度": 11, "CurrentEmperor.四維屬性.仁德": 10,
          "CourtFactions.文官.勢力值": 6, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.武將.勢力值": -6, "CourtFactions.武將.忠誠度": -4,
        },
      },
      {
        id: "mobilize-local-armies",
        文案: "授權地方招募軍隊鎮壓",
        結果: "叛軍被擊敗，但地方新建立的軍隊從此掌握武力，可能不再完全服從中央。",
        影響: {
          "EmpireStatus.甲兵": -650, "EmpireStatus.社稷穩定度": -8,
          "CurrentEmperor.四維屬性.雄略": 5, "CurrentEmperor.四維屬性.仁德": -7,
          "CourtFactions.武將.勢力值": 13, "CourtFactions.武將.忠誠度": 4,
          "CourtFactions.文官.勢力值": -4, "CourtFactions.外戚.勢力值": 3,
        },
      },
    ],
  },
  {
    id: "new-law-debate",
    類別: EVENT_CATEGORIES.CIVIL,
    標題: "新法廷議",
    描述: "改革派主張重新丈量土地並由政府經營鹽鐵，藉此增加稅收；保守派擔心政策太急會擾民。",
    選項: [
      {
        id: "enact-reform",
        文案: "支持改革並逐步推行",
        結果: "改革增加國家收入並限制豪強，但改革派與保守派的衝突更加嚴重。",
        影響: {
          "EmpireStatus.國庫": 900, "EmpireStatus.社稷穩定度": -5,
          "CurrentEmperor.四維屬性.雄略": 7, "CourtFactions.文官.勢力值": 10,
          "CourtFactions.文官.忠誠度": 3, "CourtFactions.外戚.勢力值": -6,
          "CourtFactions.武將.忠誠度": -3, "CourtFactions.宦官.勢力值": -3,
        },
      },
      {
        id: "shelve-reform",
        文案: "維持現狀、暫不改革",
        結果: "朝廷暫時避免衝突，但財政問題沒有改善，權貴勢力反而得到保護。",
        影響: {
          "EmpireStatus.國庫": -250, "EmpireStatus.社稷穩定度": 3,
          "CurrentEmperor.四維屬性.雄略": -5, "CourtFactions.文官.勢力值": -7,
          "CourtFactions.文官.忠誠度": -8, "CourtFactions.外戚.勢力值": 6,
          "CourtFactions.外戚.忠誠度": 7, "CourtFactions.宦官.勢力值": 4,
        },
      },
    ],
  },
  {
    id: "censor-impeaches-chancellor",
    類別: EVENT_CATEGORIES.CIVIL,
    標題: "臺諫攻相",
    描述: "御史指控宰相安插親信、結黨營私；宰相反控御史們聯手鬥爭。朝廷已分成兩派。",
    選項: [
      {
        id: "dismiss-chancellor",
        文案: "先撤換宰相並展開調查",
        結果: "撤換宰相展現整頓決心，但中央決策暫時失去領導，政務速度下降。",
        影響: {
          "EmpireStatus.國庫": 300, "EmpireStatus.社稷穩定度": -2,
          "CurrentEmperor.四維屬性.威儀": 6, "CourtFactions.文官.勢力值": -5,
          "CourtFactions.文官.忠誠度": 4, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.宦官.忠誠度": 6, "CourtFactions.外戚.勢力值": 3,
        },
      },
      {
        id: "silence-censors",
        文案: "支持宰相並處分御史",
        結果: "宰相得以繼續推動政務，但監督官員不敢再發言，文官普遍不滿。",
        影響: {
          "EmpireStatus.社稷穩定度": -7, "CurrentEmperor.四維屬性.威儀": -3,
          "CurrentEmperor.四維屬性.雄略": 3, "CourtFactions.文官.勢力值": 8,
          "CourtFactions.文官.忠誠度": -12, "CourtFactions.宦官.勢力值": -4,
          "CourtFactions.外戚.忠誠度": 3,
        },
      },
    ],
  },
  {
    id: "imperial-examination-fraud",
    類別: EVENT_CATEGORIES.CIVIL,
    標題: "春闈舞弊",
    描述: "科舉榜首是主考官學生的兒子，引發舞弊質疑。落榜考生聚集抗議，京城輿論沸騰。",
    選項: [
      {
        id: "reexamine",
        文案: "取消榜單、重新考試",
        結果: "重新考試恢復了公平，但官場受到震盪，舉辦重試也需要額外支出。",
        影響: {
          "EmpireStatus.國庫": -300, "EmpireStatus.社稷穩定度": 7,
          "CurrentEmperor.四維屬性.仁德": 5, "CurrentEmperor.四維屬性.威儀": 5,
          "CourtFactions.文官.勢力值": -6, "CourtFactions.文官.忠誠度": 6,
          "CourtFactions.宦官.勢力值": 4, "CourtFactions.外戚.勢力值": -2,
        },
      },
      {
        id: "protect-prestige",
        文案: "維持榜單、避免朝廷難堪",
        結果: "朝廷表面上維持權威，但考生認為科舉已被權貴操控，民心受損。",
        影響: {
          "EmpireStatus.社稷穩定度": -9, "CurrentEmperor.四維屬性.威儀": -5,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": -10,
          "CourtFactions.外戚.勢力值": 5, "CourtFactions.外戚.忠誠度": 5,
          "CourtFactions.宦官.勢力值": 3,
        },
      },
    ],
  },
];

export const EVENT_COUNTS = Object.freeze(
  EVENTS.reduce((counts, event) => {
    counts[event.類別] = (counts[event.類別] ?? 0) + 1;
    return counts;
  }, {}),
);
