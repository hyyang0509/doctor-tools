import {
  CourtFactions,
  CurrentEmperor,
  Dynasty,
  EmpireStatus,
  loadGame,
  resetGame,
  saveGame,
} from "./gameState.js";
import { advanceYear, calculateDynastyEnding, drawEvent, resolveEvent } from "./eventEngine.js";

const byId = (id) => document.getElementById(id);
const number = new Intl.NumberFormat("zh-TW");
const pathLabels = {
  國庫: "國庫", 太倉: "太倉", 甲兵: "甲兵", 社稷穩定度: "社稷",
  仁德: "仁德", 威儀: "威儀", 雄略: "雄略", 壽元健康: "健康",
  北狄: "北境", 南蠻: "南境", 西戎: "西境", 東夷: "東境",
  勢力值: "勢力", 忠誠度: "忠誠",
};
let currentEvent = null;
let seenEvents = [];
let toastTimer;

function dynastyYear() {
  return Dynasty.起始年份
    + Dynasty.歷代帝王譜.reduce((sum, emperor) => sum + emperor.在位年數, 0)
    + CurrentEmperor.在位年數 - 1;
}

function yearText(year) {
  return year === 1 ? "元年" : `${number.format(year)}年`;
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderStatus() {
  byId("dynastySeal").textContent = Dynasty.國號.slice(0, 1);
  byId("dynastyEra").textContent = `大${Dynasty.國號} · ${CurrentEmperor.年號}${yearText(CurrentEmperor.在位年數)}`;
  byId("emperorName").textContent = CurrentEmperor.姓名;
  byId("stabilityValue").textContent = EmpireStatus.社稷穩定度;
  byId("stabilityBar").style.width = `${EmpireStatus.社稷穩定度}%`;
  byId("treasuryValue").textContent = number.format(EmpireStatus.國庫);
  byId("granaryValue").textContent = number.format(EmpireStatus.太倉);
  byId("armyValue").textContent = number.format(EmpireStatus.甲兵);

  byId("attributeGrid").replaceChildren(...Object.entries(CurrentEmperor.四維屬性).map(([name, value]) => {
    const item = document.createElement("div");
    item.className = "attribute-item";
    item.innerHTML = `<span>${name === "壽元健康" ? "健康" : name}</span><strong>${value}</strong><div class="attribute-track"><i style="width:${value}%"></i></div>`;
    return item;
  }));
}

function renderBalance() {
  byId("factionMeters").replaceChildren(...Object.entries(CourtFactions).map(([name, values]) => {
    const row = document.createElement("div");
    row.className = "meter-row";
    row.innerHTML = `<div class="meter-head"><span>${name}</span><span>勢 ${values.勢力值} · 忠 ${values.忠誠度}</span></div><div class="meter-track"><i style="width:${values.勢力值}%"></i></div>`;
    return row;
  }));

  byId("frontierMeters").replaceChildren(...Object.entries(EmpireStatus.四方威脅).map(([name, value]) => {
    const item = document.createElement("div");
    item.className = "frontier-item";
    item.innerHTML = `<span>${name}威脅</span><strong>${value}</strong>`;
    return item;
  }));
}

function renderChronicle() {
  const list = byId("chronicleList");
  const records = Dynasty.本朝起居注 ?? [];
  if (!records.length) {
    const empty = document.createElement("li");
    empty.className = "empty-chronicle";
    empty.textContent = "新朝肇始，史官正襟危坐，俟記天下大事。";
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...records.map((record) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    time.textContent = `${record.年號}\n${yearText(record.年份)}`;
    const category = document.createElement("em");
    category.textContent = record.類別;
    const text = document.createTextNode(record.記述);
    item.append(time, category, text);
    return item;
  }));
  list.scrollTop = list.scrollHeight;
}

function renderAll() {
  renderStatus();
  renderBalance();
  renderChronicle();
}

function impactSummary(changes) {
  return changes
    .filter((change) => change.delta !== 0)
    .slice(0, 9)
    .map((change) => {
      const parts = change.path.split(".");
      const last = parts.at(-1);
      const faction = parts[0] === "CourtFactions" ? parts[1] : "";
      const label = faction ? `${faction}${pathLabels[last] ?? last}` : (pathLabels[last] ?? last);
      const pill = document.createElement("span");
      pill.className = `change-pill ${change.delta > 0 ? "positive" : "negative"}`;
      pill.textContent = `${label} ${change.delta > 0 ? "+" : ""}${change.delta}`;
      return pill;
    });
}

function renderEvent(event) {
  currentEvent = event;
  byId("eventCategory").textContent = event.類別;
  byId("eventTitle").textContent = event.標題;
  byId("eventDescription").textContent = event.描述;
  byId("resolution").hidden = true;
  byId("nextYearButton").hidden = true;
  const choices = event.選項.map((option, index) => {
    const button = document.createElement("button");
    button.className = "decision-button";
    button.type = "button";
    button.innerHTML = `<strong>${index === 0 ? "朱批" : "墨議"} · ${option.文案}</strong><small>此詔一出，朝野皆將有所進退</small>`;
    button.addEventListener("click", () => choose(option.id));
    return button;
  });
  byId("decisionArea").replaceChildren(...choices);
}

function drawNextEvent(preselected) {
  if (seenEvents.length >= 15) seenEvents = [];
  const event = preselected ?? drawEvent({ excludeIds: seenEvents });
  seenEvents.push(event.id);
  renderEvent(event);
}

function choose(optionId) {
  if (!currentEvent) return;
  byId("decisionArea").querySelectorAll("button").forEach((button) => { button.disabled = true; });
  const result = resolveEvent(currentEvent.id, optionId);
  const text = result.death.triggered
    ? `${result.narrative} ${result.death.succession.message}`
    : result.narrative;
  byId("resolutionText").textContent = text;
  byId("changeList").replaceChildren(...impactSummary(result.changes));
  byId("resolution").hidden = false;
  byId("nextYearButton").hidden = false;
  renderAll();
  if (EmpireStatus.社稷穩定度 <= 0) showEnding();
}

function nextYear() {
  const result = advanceYear();
  renderAll();
  drawNextEvent(result.event);
  window.scrollTo({ top: byId("eventTitle").offsetTop - 130, behavior: "smooth" });
  if (result.death.triggered) showToast(result.death.succession.message);
}

function showEnding() {
  const ending = calculateDynastyEnding();
  byId("endingRank").textContent = ending.rank;
  byId("endingVerdict").textContent = ending.verdict;
  byId("endingScore").textContent = number.format(ending.score);
  byId("endingReigns").textContent = `${ending.reigns} 世`;
  byId("endingYears").textContent = `${ending.years} 年`;
  byId("endingStability").textContent = ending.ended ? "傾覆" : "未墜";
  byId("continueButton").hidden = ending.ended;
  const dialog = byId("endingDialog");
  if (!dialog.open) dialog.showModal();
}

function closeEnding() {
  const dialog = byId("endingDialog");
  if (dialog.open) dialog.close();
}

function startNewDynasty(requireConfirmation = true) {
  if (requireConfirmation && !window.confirm("另立新朝將清除目前存檔，是否繼續？")) return;
  resetGame();
  seenEvents = [];
  closeEnding();
  renderAll();
  drawNextEvent();
  saveGame();
  showToast("新朝肇始，百官入朝。");
}

byId("saveButton").addEventListener("click", () => showToast(saveGame().message));
byId("loadButton").addEventListener("click", () => {
  const result = loadGame();
  showToast(result.message);
  if (result.ok) { renderAll(); drawNextEvent(); }
});
byId("endingButton").addEventListener("click", showEnding);
byId("closeEndingButton").addEventListener("click", closeEnding);
byId("continueButton").addEventListener("click", closeEnding);
byId("newGameButton").addEventListener("click", () => startNewDynasty(true));
byId("restartFromEndingButton").addEventListener("click", () => startNewDynasty(true));
byId("nextYearButton").addEventListener("click", nextYear);
byId("endingDialog").addEventListener("click", (event) => {
  if (event.target === byId("endingDialog")) closeEnding();
});

const restored = loadGame();
if (!restored.ok) saveGame();
renderAll();
drawNextEvent();
