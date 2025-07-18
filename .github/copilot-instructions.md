# Tampermonkey Userscript Best Practices

本專案僅存放 Tampermonkey userscript，請依下列規範協助 AI 代理程式產生、維護腳本：

## Metadata Block 標準
- 每個腳本必須以 `// ==UserScript== ... // ==/UserScript==` 開頭，包含：
  - `@name` 腳本名稱
  - `@namespace` 唯一命名空間
  - `@version` 版本號，更新時務必遞增
  - `@description` 簡要描述功能
  - `@author` 作者資訊
  - `@match` 或 `@include` 指定作用網域
  - `@grant` 明確列出所需 Tampermonkey API（如 GM_setValue、GM_getValue 等）
  - `@downloadURL`、`@updateURL` 指向 GitHub raw 路徑，方便自動更新
  - 依需求加入 `@require`（外部 JS）、`@resource`（外部資源）、`@icon`（腳本圖示）、`@connect`（允許跨域請求）

## 程式設計建議
- 優先使用 Tampermonkey 提供的 GM_* API 操作儲存、DOM、網路請求等，避免直接操作 window/localStorage。
- 如需外部資源，建議加上 SRI hash（`#sha256=...`）確保資源未被竄改。
- 插入 DOM 元素建議用 `GM_addElement`，樣式用 `GM_addStyle`，避免污染原網頁。
- 用 `GM_setValue`/`GM_getValue` 儲存用戶偏好、狀態，並可用 `GM_addValueChangeListener` 監聽跨分頁變化。
- 用 `GM_xmlhttpRequest` 發送跨域請求，並於 metadata block 加入 `@connect` 權限。
- 用 `GM_notification` 提示用戶重要事件。
- 用 `GM_registerMenuCommand` 增加自訂選單，方便用戶操作。
- 如需偵測單頁應用 URL 變化，加入 `@grant window.onurlchange` 並監聽 `urlchange` 事件。

## 維護與發佈
- 腳本更新時，務必同步更新 `@version`，確保 Tampermonkey 能自動偵測並提示用戶升級。
- `@downloadURL` 與 `@updateURL` 必須指向正確的 raw GitHub 路徑。
- 建議於 README.md 列出所有腳本安裝連結與簡介，方便用戶快速選用。

## 範例片段
```javascript
// ==UserScript==
// @name         Example Script
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  範例腳本
// @author       YourName
// @match        https://example.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @downloadURL  https://github.com/YourName/Repo/raw/main/src/example.user.js
// @updateURL    https://github.com/YourName/Repo/raw/main/src/example.user.js
// ==/UserScript==
```

## 參考資源
- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [Tampermonkey API](https://tampermonkey.net/api)
- [Metadata Block 說明](https://tampermonkey.net/metadata)
