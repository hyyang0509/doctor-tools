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
    描述: "北狄數萬騎越塞焚掠，邊郡告急。樞密院請發大軍，度支卻稱帑藏不足。",
    選項: [
      {
        id: "lead-army",
        文案: "御駕親征，以振軍心",
        結果: "天子親臨塞上，三軍奮勇，然轉餉靡費甚鉅。",
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
        文案: "遣使和親，歲輸絹帛",
        結果: "邊烽暫熄，朝士以為國恥，民間亦苦歲幣。",
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
    描述: "南境土酋因郡守橫徵而合兵反叛，驛道斷絕，守臣請援。",
    選項: [
      {
        id: "pacify-and-amnesty",
        文案: "誅貪守、赦脅從，遣使招撫",
        結果: "諸部感朝廷明斷，解甲納款，文官聲望日隆。",
        影響: {
          "EmpireStatus.國庫": -300, "EmpireStatus.社稷穩定度": 7,
          "EmpireStatus.四方威脅.南蠻": -16, "CurrentEmperor.四維屬性.仁德": 8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.武將.勢力值": -4, "CourtFactions.宦官.勢力值": -2,
        },
      },
      {
        id: "crush-revolt",
        文案: "命宿將進剿，以儆群夷",
        結果: "叛軍潰敗，南境懾服；兵燹所過，村寨多成焦土。",
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
    描述: "河朔節度使以養兵禦邊為名，截留三州租賦，朝命屢催不奉。",
    選項: [
      {
        id: "summon-to-court",
        文案: "降詔入朝，奪其兵柄",
        結果: "節度使懼天威而入覲，朝廷收回財權，邊軍稍有騷動。",
        影響: {
          "EmpireStatus.國庫": 650, "EmpireStatus.甲兵": -200,
          "EmpireStatus.社稷穩定度": 4, "CurrentEmperor.四維屬性.威儀": 8,
          "CourtFactions.武將.勢力值": -10, "CourtFactions.武將.忠誠度": -8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 6,
        },
      },
      {
        id: "recognize-autonomy",
        文案: "權授旌節，換取歲貢",
        結果: "軍鎮奉上薄貢，表面稱臣，實則尾大不掉。",
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
    描述: "大將班師，百姓夾道稱頌，軍中只知將軍而不知天子。御史密奏其有不臣之心。",
    選項: [
      {
        id: "honor-without-command",
        文案: "加爵厚賜，留京奉朝請",
        結果: "名位優隆而兵權盡解，將軍雖怏怏，尚未敢作亂。",
        影響: {
          "EmpireStatus.國庫": -500, "EmpireStatus.社稷穩定度": 5,
          "CurrentEmperor.四維屬性.威儀": 6, "CourtFactions.武將.勢力值": -7,
          "CourtFactions.武將.忠誠度": -4, "CourtFactions.文官.勢力值": 5,
          "CourtFactions.宦官.勢力值": 3, "CourtFactions.宦官.忠誠度": 4,
        },
      },
      {
        id: "return-command",
        文案: "仍付兵符，命鎮西陲",
        結果: "邊軍大悅，外患稍弭，朝中卻人人憂其難制。",
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
    描述: "京營欠餉三月，禁軍鼓譟於闕下，數名校尉高呼清君側。",
    選項: [
      {
        id: "pay-arrears",
        文案: "開內帑補餉，赦其脅從",
        結果: "軍士領餉散去，危局暫解，宦官監軍趁勢邀功。",
        影響: {
          "EmpireStatus.國庫": -850, "EmpireStatus.社稷穩定度": 4,
          "CurrentEmperor.四維屬性.仁德": 4, "CourtFactions.武將.忠誠度": 10,
          "CourtFactions.武將.勢力值": 5, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.宦官.忠誠度": 6, "CourtFactions.文官.勢力值": -3,
        },
      },
      {
        id: "purge-ringleaders",
        文案: "閉宮門，命親軍捕斬首惡",
        結果: "亂兵伏誅，京師戒嚴；血濺宮門，宿衛人心惶懼。",
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
    描述: "皇后請封兄長為大司馬，外廷群臣伏闕力諫，宮中氣氛驟冷。",
    選項: [
      {
        id: "grant-empty-title",
        文案: "授虛銜厚祿，不預政事",
        結果: "后族得其富貴而未握實權，兩宮尚稱和睦。",
        影響: {
          "EmpireStatus.國庫": -350, "EmpireStatus.社稷穩定度": 2,
          "CurrentEmperor.四維屬性.威儀": 3, "CourtFactions.外戚.勢力值": 6,
          "CourtFactions.外戚.忠誠度": 9, "CourtFactions.文官.勢力值": 2,
          "CourtFactions.文官.忠誠度": -2, "CourtFactions.宦官.勢力值": -2,
        },
      },
      {
        id: "reject-nepotism",
        文案: "申明祖制，后族不得干政",
        結果: "朝野稱快，皇后與國舅卻深銜天子。",
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
    描述: "嫡長子性情仁弱，貴妃所生皇子英武果決。中外各有所屬，請早定國本。",
    選項: [
      {
        id: "name-eldest",
        文案: "立嫡以長，冊皇長子",
        結果: "名分既正，士大夫稱頌；后族聲勢隨之而盛。",
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
        文案: "不拘嫡庶，立賢能者",
        結果: "新太子才具可觀，然廢長立幼之議自此不息。",
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
    描述: "宮中掘得桐木偶人，上書天子生辰。中宮指為貴妃所為，內侍又稱另有隱情。",
    選項: [
      {
        id: "public-trial",
        文案: "付三法司會審，禁內廷私刑",
        結果: "案情大白，多為宮人構陷；法度得伸，后族顏面盡失。",
        影響: {
          "EmpireStatus.社稷穩定度": 6, "CurrentEmperor.四維屬性.仁德": 6,
          "CurrentEmperor.四維屬性.威儀": 3, "CourtFactions.文官.勢力值": 8,
          "CourtFactions.文官.忠誠度": 8, "CourtFactions.外戚.勢力值": -7,
          "CourtFactions.宦官.勢力值": -5, "CourtFactions.宦官.忠誠度": -4,
        },
      },
      {
        id: "secret-investigation",
        文案: "命內侍密查，勿使外廷知悉",
        結果: "宮禁表面平靜，內侍藉機羅織，人人自危。",
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
    描述: "大河決口，數郡化為澤國，流民扶老攜幼湧向京畿。",
    選項: [
      {
        id: "relief-and-repair",
        文案: "發帑賑濟，徵夫塞決",
        結果: "災民得食，河工漸成，國用卻為之一空。",
        影響: {
          "EmpireStatus.國庫": -1100, "EmpireStatus.太倉": -900,
          "EmpireStatus.社稷穩定度": 9, "CurrentEmperor.四維屬性.仁德": 8,
          "CourtFactions.文官.勢力值": 7, "CourtFactions.文官.忠誠度": 7,
          "CourtFactions.武將.勢力值": -2, "CourtFactions.外戚.勢力值": -2,
        },
      },
      {
        id: "local-self-help",
        文案: "責令州縣自籌，朝廷節用",
        結果: "帑藏得全，地方豪強兼併賑糧，流民怨氣滋長。",
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
    描述: "入夏無雨，蝗蝻蔽日，太倉奏稱京師存糧僅足半載。",
    選項: [
      {
        id: "open-granaries",
        文案: "盡開常平倉，平糶濟民",
        結果: "米價稍平，饑民免於轉徙，地方官吏皆頌聖德。",
        影響: {
          "EmpireStatus.太倉": -1200, "EmpireStatus.國庫": -350,
          "EmpireStatus.社稷穩定度": 10, "CurrentEmperor.四維屬性.仁德": 9,
          "CourtFactions.文官.忠誠度": 8, "CourtFactions.文官.勢力值": 5,
          "CourtFactions.外戚.勢力值": -3, "CourtFactions.武將.勢力值": -2,
        },
      },
      {
        id: "pray-and-ration",
        文案: "減膳祈雨，嚴禁私糶",
        結果: "朝廷示以儉德，禁令卻催生黑市，權貴暗中牟利。",
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
    描述: "夜半地震，宗廟梁折，城中屋宇傾圮。群臣請罪己改元，以答天譴。",
    選項: [
      {
        id: "self-reproach",
        文案: "下罪己詔，罷土木一年",
        結果: "詔辭懇切，民心稍安；士大夫藉機要求整飭朝政。",
        影響: {
          "EmpireStatus.國庫": -450, "EmpireStatus.社稷穩定度": 8,
          "CurrentEmperor.四維屬性.仁德": 7, "CurrentEmperor.四維屬性.威儀": -2,
          "CourtFactions.文官.勢力值": 9, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.宦官.勢力值": -5, "CourtFactions.外戚.勢力值": -3,
        },
      },
      {
        id: "rebuild-grandly",
        文案: "重修宗廟，以昭國祚不移",
        結果: "新廟巍峨，朝儀復振；徭役繁重，市井頗多怨言。",
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
    描述: "連歲歉收，流民以白巾裹首，攻破縣城。官軍畏敵，鄉紳築堡自保。",
    選項: [
      {
        id: "amnesty-and-relief",
        文案: "赦首惡以下，蠲租三年",
        結果: "多數饑民歸田，餘黨漸散，朝廷財賦短期銳減。",
        影響: {
          "EmpireStatus.國庫": -800, "EmpireStatus.太倉": -600,
          "EmpireStatus.社稷穩定度": 11, "CurrentEmperor.四維屬性.仁德": 10,
          "CourtFactions.文官.勢力值": 6, "CourtFactions.文官.忠誠度": 8,
          "CourtFactions.武將.勢力值": -6, "CourtFactions.武將.忠誠度": -4,
        },
      },
      {
        id: "mobilize-local-armies",
        文案: "令督撫練勇，限期剿平",
        結果: "亂軍敗散，地方團練從此擁兵自重。",
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
    描述: "少壯給事中上疏，請清丈田畝、官營鹽鐵；老臣斥其聚斂擾民。",
    選項: [
      {
        id: "enact-reform",
        文案: "擢用新黨，次第行法",
        結果: "國課漸增，豪右受抑；新舊兩黨自此水火。",
        影響: {
          "EmpireStatus.國庫": 900, "EmpireStatus.社稷穩定度": -5,
          "CurrentEmperor.四維屬性.雄略": 7, "CourtFactions.文官.勢力值": 10,
          "CourtFactions.文官.忠誠度": 3, "CourtFactions.外戚.勢力值": -6,
          "CourtFactions.武將.忠誠度": -3, "CourtFactions.宦官.勢力值": -3,
        },
      },
      {
        id: "shelve-reform",
        文案: "以祖宗成法為重，留中不發",
        結果: "朝局暫安，積弊未除，權門豪族皆感聖恩。",
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
    描述: "御史連章彈劾宰相結黨營私，門生故吏遍於臺省。宰相則請究言官朋黨。",
    選項: [
      {
        id: "dismiss-chancellor",
        文案: "罷相待勘，整肅吏治",
        結果: "百官震懾，清議大張；中書政令一時停滯。",
        影響: {
          "EmpireStatus.國庫": 300, "EmpireStatus.社稷穩定度": -2,
          "CurrentEmperor.四維屬性.威儀": 6, "CourtFactions.文官.勢力值": -5,
          "CourtFactions.文官.忠誠度": 4, "CourtFactions.宦官.勢力值": 7,
          "CourtFactions.宦官.忠誠度": 6, "CourtFactions.外戚.勢力值": 3,
        },
      },
      {
        id: "silence-censors",
        文案: "貶逐言官，以全政局",
        結果: "宰相得以任事，臺諫噤聲，士林怨望。",
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
    描述: "今科榜首竟是主考門生之子，落第士子聚於貢院外，傳抄檄文，譁然京師。",
    選項: [
      {
        id: "reexamine",
        文案: "廢榜重試，嚴懲考官",
        結果: "寒門拍手稱快，官場人人自危，重試亦耗費國帑。",
        影響: {
          "EmpireStatus.國庫": -300, "EmpireStatus.社稷穩定度": 7,
          "CurrentEmperor.四維屬性.仁德": 5, "CurrentEmperor.四維屬性.威儀": 5,
          "CourtFactions.文官.勢力值": -6, "CourtFactions.文官.忠誠度": 6,
          "CourtFactions.宦官.勢力值": 4, "CourtFactions.外戚.勢力值": -2,
        },
      },
      {
        id: "protect-prestige",
        文案: "稱流言無據，維持原榜",
        結果: "朝廷顏面得全，士子卻視科名為權門私器。",
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

