# HY Doctor Tools

一個以 GitHub Pages 部署的個人工作／生活工具箱。核心原則：**簡單、快速、手機優先、純前端優先、可驗證**。

## 目前工具

- `lipid/`：血脂用藥工具
- `followup/`：回診日期計算器
- `taifex-alert/`：台指期槓桿與保證金壓力測試

## 專案結構

```text
doctor-tools/
├── index.html              # 首頁 / app shell
├── assets/
│   ├── styles.css          # 首頁共用設計系統
│   ├── app.js              # 搜尋與 PWA 註冊
│   └── icon.svg            # PWA 圖示
├── lipid/
│   └── index.html
├── followup/
│   └── index.html
├── taifex-alert/
│   ├── index.html
│   ├── calculator.js       # 計算邏輯
│   ├── app.js              # 畫面互動
│   └── calculator.test.js  # 單元測試
├── manifest.webmanifest
└── sw.js                   # 離線快取
```

## 新增工具規範

1. 每個工具使用獨立資料夾，例如 `egfr/index.html`。
2. 工具頁應 mobile-first，避免依賴大型框架或外部 CDN，除非確有必要。
3. 優先純前端運算；不要把 API key、密碼或機敏資訊放進前端程式碼。
4. 不儲存病人可識別資料。若未來需要資料同步，必須另外設計隱私與後端架構。
5. 新工具加入首頁時，必須提供：
   - `data-tool-id`
   - `data-title`
   - `data-search` 關鍵字
   - 工具名稱與一句簡短描述
6. 計算型／醫療型工具的演算法與 UI 應分離；重要公式需標示依據與版本。
7. 計算型工具至少測試：正常值、邊界值、無效輸入；日期類另測月底、跨年、閏年。
8. AI 修改程式時優先建立 branch + Pull Request，不直接改 `main`。

## 首頁功能

- 關鍵字搜尋工具
- PWA manifest
- Service Worker 離線基礎
- Responsive / mobile-first UI

## PWA / 離線說明

Service Worker 採用：

- 導航頁面：network-first，網路失敗才使用快取
- 靜態資源：cache-first

更新 `sw.js` 的快取內容時，請同步調整 `CACHE` 版本，例如 `hy-tools-v2`，避免舊快取殘留。

## 醫療工具開發原則

這個專案可協助臨床工作流程，但不應把 AI 生成內容直接視為醫療規則。醫療邏輯、公式、適應症、禁忌與 guideline 版本必須由使用者最終確認。

### 建議 AI 任務格式

```text
在 HY Doctor Tools 新增 XXX 工具。

需求：
- 輸入：...
- 輸出：...
- 計算規則：...
- mobile-first
- 不儲存病人資料
- 列出 edge cases
- 加入必要測試
- 更新首頁搜尋關鍵字
- 更新 service worker cache
- 建 branch + PR，不直接 merge
```
