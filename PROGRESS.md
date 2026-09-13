# PROGRESS.md - Project State & Memory Checkpoint

這個檔案是 AI Agents（Gemini / ChatGPT / Codex）跨對話的記憶中繼站。
每次開啟全新對話視窗時，請先閱讀本檔案以快速同步專案現況。

---

## 1. 專案整體現況 (Overview)
- **專案定位**：個人臨床與生活純前端實用工具箱 (HY Doctor Tools)
- **部署環境**：GitHub Pages (支援 PWA 與 Service Worker 離線快取)
- **架構規範**：純前端、Mobile-first、不儲存病患個資、計算與 UI 分離、Git Branch + PR 工作流

---

## 2. 工具模組狀態清單 (Modules Status)

| 工具資料夾 | 功能描述 | 目前狀態 | 備註 / 注意事項 |
| :--- | :--- | :---: | :--- |
| `assets/` & 首頁 | 首頁 App Shell、搜尋、共用樣式 | 🟢 穩定 | 含 `index.html`, `sw.js`, PWA 設定 |
| `lipid/` | 血脂用藥工具 | 🟢 穩定 | 臨床規則需確保指引版本一致 |
| `followup/` | 回診日期計算器 | 🟢 穩定 | 需注意月底、跨年與閏年邊界值 |
| `taifex-alert/` | 台指期槓桿與保證金壓力測試 | 🟢 穩定 | 包含計算模組與單元測試 (`calculator.test.js`) |
| `text-game/` | 王朝事件決策文字遊戲 | 🟡 開發中 | 宣紙/黑金視覺，含狀態機、事件引擎與繼承邏輯 |

---

## 3. 當前進行中任務 (Active Task)
> *提示：開啟新對話時，直接請 AI 接續此處的待辦事項。*

- **當前焦點**：[填寫目前正在開發的工具或功能，例如：text-game 擴充事件 / 新增臨床工具]
- **已完成事項 (Done)**：
  - [x] 建立專案基礎架構與 `AGENTS.md`、`PROGRESS.md`
- **下一步待辦 (Next Steps)**：
  - [ ] 1. [填寫下一個具體的小任務，例如：修正某個計算邊界值]
  - [ ] 2. [填寫後續任務]

---

## 4. 最近重大變更紀錄 (Recent Log)
- **2026-09-13**：建立 `PROGRESS.md` 狀態檢查點機制，納入 Token 節約工作流。

---

## 5. 給 AI Agent 的更新指南
1. **完成小任務後**：請主動勾選 `[x]` 並在「下一步待辦」列出後續 1~2 個具體行動。
2. **開新對話前**：確保本檔案已反映最新進度，以便關閉舊視窗並開啟全新 Chat。
