// ==UserScript==
// @name         TxTicket
// @namespace    http://tampermonkey.net/
// @version      1.3.5
// @description  強化UI/勾選同意條款/銀行辨識/選取購票/點選立即購票/選擇付款方式/alt+↓=切換日期/Enter送出/關閉提醒/移除廣告/執行倒數/控制面板設定/進階設定固定預設值/場次空值視為隨機/儲存時逗號檢查/絕對時間設定/UI位置優化左下角/控制台增加文字顯示/設定面板優化寬度和滾動條/自動模式倒數計時啟動/關閉面板時檢查未儲存變更/設定面板遮罩效果
// @author       KuoAnn
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=tixcraft.com
// @connect      *
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * TxTicket 自動搶票腳本
 * 功能：自動購票、驗證碼識別、UI優化等
 */

(function () {
    "use strict";

    // ==================== 配置參數 ====================
    class ConfigManager {
        constructor() {
            this.defaultConfig = {
                // 購票配置
                BUY_DATE_INDEXES: [1, ""], // 場次優先順序：1=第一場 2=第二場... 負數=隨機 空值=隨機
                BUY_AREA_GROUPS: ["1388", ""], // 座位群組(通常是價位)：""=全部
                BUY_AREA_SEATS: ["206", ""], // 座位優先順序；""=隨機 空白分隔=AND邏輯
                BUY_COUNT: 2, // 購買張數，若無則選擇最大值
                PAY_TYPE: "A", // 付款方式：A=ATM, C=信用卡
                EXECUTE_TIME: "", // 啟動時間：YYYY-MM-DD HH:mm:ss，""=立即執行

                // OCR API 配置
                OCR_API_URL: "https://asia-east1-futureminer.cloudfunctions.net/ocr",
                OCR_PREHEAT_INTERVAL: 10 * 60 * 1000, // 預熱間隔（毫秒）

                // 銀行卡號配置
                BANK_CODES: {
                    國泰世華: "40637634",
                    中國信託: "424162",
                },

                // 排除關鍵字
                EXCLUDE_KEYWORDS: ["輪椅", "身障", "障礙", "Restricted", "遮蔽", "視線不完整"],
            };
            this.config = this.loadConfig();
        }

        loadConfig() {
            const config = { ...this.defaultConfig };

            // 從 GM 儲存中載入設定
            Object.keys(this.defaultConfig).forEach((key) => {
                const stored = GM_getValue(`tx_config_${key}`, null);
                if (stored !== null) {
                    try {
                        config[key] = JSON.parse(stored);
                    } catch (e) {
                        console.error(`載入設定 ${key} 失敗:`, e);
                    }
                }
            });

            return config;
        }

        saveConfig() {
            Object.keys(this.config).forEach((key) => {
                GM_setValue(`tx_config_${key}`, JSON.stringify(this.config[key]));
            });
        }

        get(key) {
            return this.config[key];
        }

        set(key, value) {
            this.config[key] = value;
            this.saveConfig();
        }

        resetToDefault() {
            this.config = { ...this.defaultConfig };
            this.saveConfig();
        }
    }

    const configManager = new ConfigManager();
    const CONFIG = new Proxy(configManager.config, {
        get: (target, prop) => configManager.get(prop),
        set: (target, prop, value) => {
            configManager.set(prop, value);
            return true;
        },
    });

    // ==================== 初始化樣式 ====================
    GM_addStyle(`
        /* 增強提交按鈕樣式 */
        .tx-enhanced-submit {
            font-size: 24px !important;
            height: 100px !important;
            width: 100% !important;
            margin: 4px !important;
        }
        
        /* 控制台樣式 */
        .tx-console {
            position: fixed !important;
            bottom: 75px !important;
            left: 10px !important;
            padding: 10px 14px !important;
            text-align: center !important;
            z-index: 9999 !important;
            color: white !important;
            cursor: pointer !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.3) !important;
            transition: all 0.3s ease !important;
            min-width: 100px !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        
        .tx-console-auto {
            background-color: #28a745 !important;
            border: 2px solid #1e7e34 !important;
        }
        
        .tx-console-auto:hover {
            background-color: #218838 !important;
            transform: translateY(-2px) !important;
        }
        
        .tx-console-manual {
            background-color: #dc3545 !important;
            border: 2px solid #c82333 !important;
        }
        
        .tx-console-manual:hover {
            background-color: #c82333 !important;
            transform: translateY(-2px) !important;
        }
        
        /* 日期選擇按鈕樣式 */
        .tx-date-button {
            padding: 2px 6px !important;
            margin: 2px !important;
            border: 1px solid #ccc !important;
        }
        
        .tx-date-button-selected {
            background-color: #007bff !important;
            color: #fff !important;
        }
        
        /* 隱藏活動標題 */
        .tx-hidden {
            display: none !important;
        }

        /* 控制面板樣式 */
        .tx-control-panel {
            background: white !important;
            border: 2px solid #333 !important;
            border-radius: 15px !important;
            padding: 0 !important;
            box-shadow: 0 4px 30px rgba(0,0,0,0.3) !important;
            width: 800px !important;
            max-width: 95vw !important;
            max-height: 85vh !important;
            font-family: Arial, sans-serif !important;
            color: #333 !important;
            display: flex !important;
            flex-direction: column !important;
        }

        .tx-control-panel-header {
            padding: 20px 20px 0 20px !important;
            border-radius: 15px 15px 0 0 !important;
            flex-shrink: 0 !important;
            position: relative !important;
        }

        .tx-control-panel-close {
            position: absolute !important;
            top: 15px !important;
            right: 15px !important;
            width: 30px !important;
            height: 30px !important;
            border: none !important;
            background: #dc3545 !important;
            color: white !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            font-size: 18px !important;
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
        }

        .tx-control-panel-close:hover {
            background: #c82333 !important;
            transform: scale(1.1) !important;
        }

        .tx-control-panel-content {
            padding: 0 20px 20px 20px !important;
            overflow-y: auto !important;
            flex: 1 !important;
            border-radius: 0 0 15px 15px !important;
        }

        .tx-control-panel-content::-webkit-scrollbar {
            width: 8px !important;
        }

        .tx-control-panel-content::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 0 0 13px 0 !important;
        }

        .tx-control-panel-content::-webkit-scrollbar-thumb {
            background: #c1c1c1 !important;
            border-radius: 4px !important;
        }

        .tx-control-panel-content::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1 !important;
        }

        .tx-control-panel-header h2 {
            margin: 0 0 20px 0 !important;
            color: #007bff !important;
            text-align: center !important;
            border-bottom: 2px solid #007bff !important;
            padding-bottom: 10px !important;
        }

        .tx-control-section {
            margin-bottom: 20px !important;
            padding: 15px !important;
            border: 1px solid #ddd !important;
            border-radius: 5px !important;
            background: #f9f9f9 !important;
        }

        .tx-control-section h3 {
            margin: 0 0 15px 0 !important;
            color: #555 !important;
            font-size: 16px !important;
        }

        .tx-control-row {
            display: flex !important;
            flex-direction: column !important;
            margin-bottom: 15px !important;
        }

        .tx-control-label {
            margin-bottom: 5px !important;
            font-weight: bold !important;
            color: #333 !important;
        }

        .tx-control-input {
            width: 100% !important;
            padding: 8px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
        }

        .tx-control-textarea {
            width: 100% !important;
            min-height: 80px !important;
            padding: 8px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            font-family: monospace !important;
            font-size: 12px !important;
            resize: vertical !important;
            box-sizing: border-box !important;
        }

        .tx-control-select {
            width: 100% !important;
            padding: 8px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
        }

        .tx-control-buttons {
            text-align: center !important;
            margin-top: 20px !important;
            border-top: 1px solid #ddd !important;
            padding-top: 15px !important;
        }

        .tx-control-button {
            padding: 10px 20px !important;
            margin: 0 10px !important;
            border: none !important;
            border-radius: 5px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: bold !important;
        }

        .tx-control-button-save {
            background: #28a745 !important;
            color: white !important;
        }

        .tx-control-button-save:hover {
            background: #218838 !important;
        }

        .tx-control-button-reset {
            background: #dc3545 !important;
            color: white !important;
        }

        .tx-control-button-reset:hover {
            background: #c82333 !important;
        }

        .tx-control-button-cancel {
            background: #6c757d !important;
            color: white !important;
        }

        .tx-control-button-cancel:hover {
            background: #5a6268 !important;
        }

        .tx-control-help {
            font-size: 12px !important;
            color: #666 !important;
            font-style: italic !important;
            margin-top: 5px !important;
            line-height: 1.4 !important;
            word-wrap: break-word !important;
        }

        /* 控制面板按鈕 */
        .tx-panel-button {
            position: fixed !important;
            bottom: 10px !important;
            left: 10px !important;
            padding: 12px 16px !important;
            background: #007bff !important;
            color: white !important;
            border: 2px solid #0056b3 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            z-index: 9998 !important;
            font-size: 16px !important;
            font-weight: bold !important;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.3) !important;
            transition: all 0.3s ease !important;
            min-width: 80px !important;
        }

        .tx-panel-button:hover {
            background: #0056b3 !important;
            transform: translateY(-2px) !important;
        }

        .tx-panel-button:active {
            transform: translateY(-1px) !important;
        }

        /* 遮罩樣式 */
        .tx-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
    `);

    // ==================== 應用狀態管理 ====================
    class AppState {
        constructor() {
            this.isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
            this.session = this._detectSession();
            this.flags = this._initializeFlags();
            this.countdownInterval = null;
            this.isConsoleInitialized = false;
        }

        _detectSession() {
            const url = window.location.href;
            if (url.includes("activity/detail/")) return "d";
            if (url.includes("activity/game/")) return "g";
            if (url.includes("ticket/verify/")) return "v";
            if (url.includes("ticket/area/")) return "a";
            if (url.includes("ticket/ticket/")) return "t";
            if (url.includes("ticket/checkout/")) return "c";
            return "";
        }

        _initializeFlags() {
            return {
                isSelectArea: false,
                isSelect2Button: false,
                isClickBuyTicket: false,
                isOcr: false,
                isClickPayType: false,
                isSubmit: false,
                isListenOrder: false,
                isGetCaptcha: false,
            };
        }

        setFlag(flagName, value) {
            if (this.flags.hasOwnProperty(flagName)) {
                this.flags[flagName] = value;
            }
        }

        getFlag(flagName) {
            return this.flags[flagName] || false;
        }

        toggleAutoMode() {
            this.isAutoMode = !this.isAutoMode;
            localStorage.setItem("autoMode", this.isAutoMode ? 1 : 0);
            return this.isAutoMode;
        }
    }

    // ==================== DOM 工具類 ====================
    class DOMUtils {
        static $(selector, context = document) {
            return context.querySelector(selector);
        }

        static $$(selector, context = document) {
            return context.querySelectorAll(selector);
        }

        static createElement(tag, attributes = {}) {
            const element = document.createElement(tag);

            Object.entries(attributes).forEach(([key, value]) => {
                if (key === "onclick" && typeof value === "function") {
                    element.onclick = value;
                } else if (key === "className") {
                    element.className = value;
                } else {
                    element[key] = value;
                }
            });

            return element;
        }

        static removeElements(selector) {
            this.$$(selector).forEach((element) => element.remove());
        }

        static isElementExcluded(element) {
            const text = element.textContent;

            // 檢查排除關鍵字
            if (CONFIG.EXCLUDE_KEYWORDS.some((keyword) => text.includes(keyword))) {
                return true;
            }

            // 檢查剩餘數量
            const remainFont = this.$("font", element);
            if (remainFont) {
                const remainCount = parseInt(remainFont.textContent.replace("剩餘 ", ""), 10);
                if (remainCount < CONFIG.BUY_COUNT) {
                    return true;
                }
            }

            return false;
        }
    }

    // ==================== OCR 服務類 ====================
    class OCRService {
        constructor() {
            this.isProcessing = false;
            this.lastPreheatTime = parseInt(localStorage.getItem("triggerOcrTime") || 0);
        }

        async preheatOCR() {
            const now = Date.now();
            if (now - this.lastPreheatTime < CONFIG.OCR_PREHEAT_INTERVAL) {
                console.log("[OCR] preheatOCR - OCR 無需預熱 (間隔未到)");
                return;
            }

            localStorage.setItem("triggerOcrTime", now.toString());

            // 測試用的預設圖片數據
            const testImageData =
                "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";

            try {
                appState.setFlag("isGetCaptcha", false);
                await this.getCaptcha(CONFIG.OCR_API_URL, testImageData);
                console.log("[OCR] preheatOCR - ✓ OCR 預熱完成");
            } catch (error) {
                console.error("[OCR] preheatOCR - ✗ OCR 預熱失敗:", error);
            }
        }

        extractImageFromCanvas() {
            const img = DOMUtils.$("#TicketForm_verifyCode-image");
            
            if (!img) {
                console.warn("[OCR] 圖片元素不存在 - #TicketForm_verifyCode-image");
                return "";
            }
            
            if (!img.complete) {
                console.warn("[OCR] 圖片還未加載完成 (complete=false)");
                return "";
            }

            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                console.warn("[OCR] 圖片尺寸無效 - width:", img.naturalWidth, "height:", img.naturalHeight);
                return "";
            }

            try {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                context.drawImage(img, 0, 0);
                const imageData = canvas.toDataURL();
                
                if (!imageData) {
                    console.error("[OCR] canvas.toDataURL() 返回空值");
                    return "";
                }

                const base64Data = imageData.split(",")[1];
                console.log("[OCR] Base64 數據提取成功，長度:", base64Data ? base64Data.length : 0);
                return base64Data || "";
            } catch (error) {
                console.error("[OCR] 提取圖片數據失敗:", error);
                return "";
            }
        }

        async processCaptcha(startTime = null, delayMs = 100) {
            // 初始化開始時間
            if (startTime === null) {
                startTime = Date.now();
                console.log("[OCR] processCaptcha - 開始處理驗證碼，超時時間限制: 10秒");
            }

            const elapsedMs = Date.now() - startTime;
            const maxWaitMs = 10000; // 10 秒超時
            const currentAttempt = Math.floor(elapsedMs / 100) + 1;

            console.log("[OCR] processCaptcha - 嘗試 #" + currentAttempt + " (已耗時: " + elapsedMs + "ms)");
            
            const imageData = this.extractImageFromCanvas();
            
            if (!imageData) {
                // 檢查是否是因為圖片未加載
                const img = DOMUtils.$("#TicketForm_verifyCode-image");
                if (img && !img.complete && elapsedMs < maxWaitMs) {
                    const nextDelay = Math.min(delayMs + 100, 300); // 每次增加 100ms，最多 300ms
                    console.warn("[OCR] 圖片未加載完成，將在 " + nextDelay + "ms 後重試 (剩餘時間: " + (maxWaitMs - elapsedMs) + "ms)");
                    // 等待圖片加載完成後重試
                    setTimeout(() => {
                        this.processCaptcha(startTime, nextDelay);
                    }, nextDelay);
                    return;
                }
                
                if (elapsedMs >= maxWaitMs) {
                    console.error("[OCR] 已超過 10 秒超時時間，放棄 OCR 處理");
                } else {
                    console.warn("[OCR] 無法提取圖片數據，放棄 OCR 處理");
                }
                // 重置標志位，允許下次重試
                appState.setFlag("isOcr", false);
                return;
            }

            try {
                appState.setFlag("isGetCaptcha", false);
                await this.getCaptcha(CONFIG.OCR_API_URL, imageData);
            } catch (error) {
                console.error("[OCR] 處理驗證碼失敗:", error);
                // 失敗時重置標志位，允許下次重試
                appState.setFlag("isOcr", false);
            }
        }

        async getCaptcha(url, imageData) {
            if (this.isProcessing) {
                console.warn("[OCR] OCR 已在處理中，跳過本次請求");
                return;
            }
            
            console.log("[OCR] getCaptcha - 發送 OCR 請求到:", url);
            this.isProcessing = true;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify({ image_data: imageData }),
                    onload: (response) => {
                        this.isProcessing = false;
                        console.log("[OCR] 收到 OCR 回應，狀態碼:", response.status);
                        this._handleCaptchaResponse(url, response);
                        resolve(response);
                    },
                    onerror: (error) => {
                        this.isProcessing = false;
                        console.error("[OCR] OCR API 請求失敗:", url, error);
                        reject(error);
                    },
                });
            });
        }

        _handleCaptchaResponse(url, response) {
            console.log("[OCR] 回應內容:", response.responseText);
            appState.setFlag("isOcr", false);

            if (response.status === 200) {
                try {
                    const result = JSON.parse(response.responseText);
                    const answer = result.answer;

                    if (answer && answer.length === 4) {
                        if (!appState.getFlag("isGetCaptcha")) {
                            appState.setFlag("isGetCaptcha", true);
                            console.log("[OCR] ✓ 識別成功:", answer);
                            this._fillCaptchaInput(answer);
                        } else {
                            console.log("[OCR] 結果未使用 (已有驗證碼):", answer);
                        }
                    } else if (!appState.getFlag("isGetCaptcha")) {
                        appState.setFlag("isGetCaptcha", true);
                        console.log("[OCR] ⚠️ 識別格式錯誤，觸發重新整理驗證碼");
                        this._refreshCaptcha(url);
                    }
                } catch (error) {
                    console.error("[OCR] 解析 OCR 回應失敗:", error);
                    // 解析失敗時重置標志位，允許重試
                    appState.setFlag("isOcr", false);
                }
            } else {
                console.error("[OCR] HTTP 錯誤 - 狀態碼:", response.status, "錯誤:", response.statusText, "內容:", response.responseText);
                // HTTP 錯誤時也重置標志位
                appState.setFlag("isOcr", false);
            }
        }

        _fillCaptchaInput(code) {
            const input = DOMUtils.$("#TicketForm_verifyCode");
            if (input) {
                input.value = code;
                input.focus();
                // 觸發 input 事件以確保頁面能正確處理
                input.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
                console.error("[OCR] 找不到驗證碼輸入框 - #TicketForm_verifyCode");
            }
        }

        _refreshCaptcha(url) {
            const imgCaptcha = DOMUtils.$("#TicketForm_verifyCode-image");
            if (!imgCaptcha) {
                console.error("[OCR] _refreshCaptcha - 找不到驗證碼圖片元素");
                return;
            }

            console.log("[OCR] _refreshCaptcha - 觸發驗證碼刷新");
            imgCaptcha.click();
            const originalSrc = imgCaptcha.src;
            let refreshTimeout = false;

            const checkInterval = setInterval(() => {
                if (originalSrc !== imgCaptcha.src) {
                    clearInterval(checkInterval);
                    console.log("[OCR] _refreshCaptcha - 驗證碼圖片已更新，重新啟動 OCR 驗證碼識別");
                    
                    // 使用 processCaptcha 的重試機制，等待新圖片加載完成並發送 OCR
                    appState.setFlag("isGetCaptcha", false);
                    this.processCaptcha();
                }
            }, 100);

            // 防止無限等待
            setTimeout(() => {
                if (!refreshTimeout) {
                    refreshTimeout = true;
                    clearInterval(checkInterval);
                    console.warn("[OCR] _refreshCaptcha - 驗證碼刷新超時 (5秒)");
                }
            }, 5000);
        }
    }

    // ==================== 票務處理類 ====================
    class TicketHandler {
        constructor() {
            this.ocrService = new OCRService();
        }

        // 處理活動詳情頁面
        handleActivityDetail() {
            this._clickBuyTicketButton();

            if (appState.isAutoMode) {
                this._listenForGameOrders();
            }
        }

        // 處理遊戲列表頁面
        handleGameList() {
            this.handleActivityDetail(); // 使用相同邏輯
        }

        // 處理驗證碼頁面
        handleVerification() {
            const promoDesc = DOMUtils.$(".promo-desc");
            if (!promoDesc) return;

            const textContent = promoDesc.textContent;

            // 檢查銀行卡號需求
            for (const [bankName, code] of Object.entries(CONFIG.BANK_CODES)) {
                if (textContent.includes(bankName)) {
                    if (
                        (bankName === "國泰世華" && textContent.includes("卡號前8碼")) ||
                        (bankName === "中國信託" && textContent.includes("卡號前6碼"))
                    ) {
                        this._setCheckCodeAndSubmit(code);
                        break;
                    }
                }
            }
        }

        // 處理座位選擇頁面
        handleAreaSelection() {
            if (appState.isAutoMode && !appState.getFlag("isSelectArea")) {
                appState.setFlag("isSelectArea", true);
                const success = this._selectOptimalArea();
                if (!success) {
                    // 如果選擇失敗，稍後重試
                    setTimeout(() => {
                        appState.setFlag("isSelectArea", false);
                    }, 100);
                }
            }
            this._convertSelectToButtons();
            this._hideSoldOutSeats();
        }

        // 處理訂單確認頁面
        handleTicketConfirmation() {
            this._agreeToTerms();
            this._selectTicketQuantity();
            this._handleCaptchaInput();
        }

        // 處理結帳頁面
        handleCheckout() {
            this._selectPaymentMethod();
        }

        // 私有方法
        _clickBuyTicketButton() {
            const buyButton = DOMUtils.$('a[href^="/activity/game/"]');
            if (buyButton && !appState.getFlag("isClickBuyTicket")) {
                appState.setFlag("isClickBuyTicket", true);
                buyButton.click();
            }
        }

        _listenForGameOrders() {
            const gameList = DOMUtils.$("#gameList table tbody");
            if (gameList && !appState.getFlag("isSubmit") && !appState.getFlag("isListenOrder")) {
                appState.setFlag("isListenOrder", true);
                const interval = setInterval(() => {
                    if (this._processGameOrders(gameList)) {
                        clearInterval(interval);
                    }
                }, 400);
            }
        }

        _processGameOrders(gameList) {
            if (!gameList) return false;

            const gameRows = DOMUtils.$$("tr", gameList);

            // 嘗試按照指定順序點擊
            for (const indexValue of CONFIG.BUY_DATE_INDEXES) {
                // 空值視為隨機
                if (indexValue === "" || indexValue === null || indexValue === undefined) {
                    return this._clickRandomGameButton(gameList);
                }
                
                const index = parseInt(indexValue) - 1;
                if (index >= gameRows.length || index < 0) {
                    return this._clickRandomGameButton(gameList);
                }

                const gameButton = DOMUtils.$("button", gameRows[index]);
                if (gameButton && !appState.getFlag("isSubmit")) {
                    appState.setFlag("isSubmit", true);
                    gameButton.click();
                    return true;
                }
            }

            return false;
        }

        _clickRandomGameButton(gameList) {
            const gameButtons = DOMUtils.$$("button", gameList);
            if (gameButtons.length > 0) {
                const randomIndex = Math.floor(Math.random() * gameButtons.length);
                gameButtons[randomIndex].click();
                return true;
            }
            return false;
        }

        _setCheckCodeAndSubmit(code) {
            const checkCodeInput = DOMUtils.$(".greyInput[name=checkCode]");
            if (checkCodeInput) {
                checkCodeInput.value = code;
                UIManager.autoSubmit();
            }
        }

        _selectOptimalArea() {
            const groups = DOMUtils.$$(".zone-label");
            const selectedGroups = this._getSelectedGroups(groups);

            if (selectedGroups.length > 0) {
                for (const groupId of selectedGroups) {
                    const areaElements = DOMUtils.$$(`#${groupId} li a`);
                    console.log(`處理群組 ${groupId}:`, areaElements);
                    if (this._selectAreaSeat(areaElements)) return true;
                }
                return false;
            } else {
                return this._selectAreaSeat(DOMUtils.$$(".area-list li a"));
            }
        }

        _getSelectedGroups(groups) {
            const selectedGroups = [];
            if (groups.length > 0 && CONFIG.BUY_AREA_GROUPS.length > 0 && CONFIG.BUY_AREA_GROUPS[0] !== "") {
                CONFIG.BUY_AREA_GROUPS.forEach((buyGroup) => {
                    groups.forEach((group) => {
                        if (group.textContent.includes(buyGroup)) {
                            const groupId = group.getAttribute("for") || group.id;
                            if (groupId) selectedGroups.push(groupId);
                        }
                    });
                });
            }
            return selectedGroups;
        }

        _selectAreaSeat(elements) {
            if (elements.length === 0) return false;

            const randomizedElements = Array.from(elements).sort(() => Math.random() - 0.5);

            for (const seatPattern of CONFIG.BUY_AREA_SEATS) {
                if (appState.getFlag("isSubmit")) break;

                const keywords = seatPattern.split(" ").filter((k) => k);

                for (const element of randomizedElements) {
                    if (DOMUtils.isElementExcluded(element)) continue;

                    const isMatch = keywords.length === 0 || keywords.every((keyword) => element.textContent.includes(keyword));

                    if (!appState.getFlag("isSubmit") && isMatch) {
                        appState.setFlag("isSubmit", true);
                        element.click();
                        return true;
                    }
                }
            }
            return false;
        }

        _convertSelectToButtons() {
            const select = DOMUtils.$("#gameId");
            if (select && !appState.getFlag("isSelect2Button")) {
                appState.setFlag("isSelect2Button", true);

                const title = DOMUtils.$(".activityT.title");
                if (title) title.classList.add("tx-hidden");

                const fragment = document.createDocumentFragment();
                const options = DOMUtils.$$("option", select);

                options.forEach((option) => {
                    const button = DOMUtils.createElement("button", {
                        textContent: this._extractDateText(option.textContent),
                        className: option.selected ? "tx-date-button tx-date-button-selected" : "tx-date-button",
                        onclick: () => {
                            select.value = option.value;
                            select.dispatchEvent(new Event("change", { bubbles: true }));
                        },
                    });

                    fragment.appendChild(button);
                });

                select.before(fragment);
            }
        }

        _extractDateText(text) {
            const dateMatch = text.match(/\d{4}\/\d{2}\/\d{2} \(\S+\)/);
            return dateMatch ? dateMatch[0] : text;
        }

        _hideSoldOutSeats() {
            DOMUtils.$$("li").forEach((li) => {
                if (li.textContent.includes("已售完")) {
                    li.remove();
                }
            });
        }

        _agreeToTerms() {
            const agreeCheckbox = DOMUtils.$("#TicketForm_agree");
            if (agreeCheckbox) {
                agreeCheckbox.checked = true;
            }
        }

        _selectTicketQuantity() {
            const ticketPriceSelect = DOMUtils.$('[id^="TicketForm_ticketPrice_"]');
            if (ticketPriceSelect) {
                const options = DOMUtils.$$("option", ticketPriceSelect);
                const hasDesiredCount = Array.from(options).some((o) => o.value == CONFIG.BUY_COUNT);
                ticketPriceSelect.value = hasDesiredCount ? CONFIG.BUY_COUNT : options[options.length - 1].value;
            }
        }

        _handleCaptchaInput() {
            const captchaInput = DOMUtils.$("#TicketForm_verifyCode");
            
            if (captchaInput) {
                
                if (appState.isAutoMode && !appState.getFlag("isOcr")) {
                    console.log("[訂單] 開始 OCR 驗證碼識別");
                    appState.setFlag("isOcr", true);
                    this.ocrService.processCaptcha();
                } else if (!appState.isAutoMode) {
                    console.log("[訂單] 非自動模式，跳過 OCR");
                } else if (appState.getFlag("isOcr")) {
                    console.log("[訂單] OCR 已在進行中，跳過本次觸發");
                }

                captchaInput.focus();
                captchaInput.addEventListener("input", (e) => {
                    if (e.target.value.length >= 4) {
                        UIManager.autoSubmit();
                    }
                });
            } else {
                console.error("[訂單] 找不到驗證碼輸入框 - #TicketForm_verifyCode");
            }
        }

        _selectPaymentMethod() {
            const paymentMethods = {
                A: "#CheckoutForm_paymentId_54", // ATM
                C: "#CheckoutForm_paymentId_53", // 信用卡
            };

            const selector = paymentMethods[CONFIG.PAY_TYPE];
            if (selector && !appState.getFlag("isClickPayType")) {
                const paymentRadio = DOMUtils.$(selector);
                if (paymentRadio) {
                    appState.setFlag("isClickPayType", true);
                    paymentRadio.click();
                }
            }
        }
    }

    // ==================== 控制面板類 ====================
    class ControlPanelManager {
        constructor() {
            this.panel = null;
            this.overlay = null;
        }

        showPanel() {
            if (this.panel) {
                this.panel.remove();
            }
            if (this.overlay) {
                this.overlay.remove();
            }

            // 檢查並自動填入啟動時間
            this._checkAndSetExecuteTime();

            // 創建遮罩
            this.overlay = DOMUtils.createElement("div", {
                className: "tx-overlay",
            });

            this.panel = this._createPanel();
            this.overlay.appendChild(this.panel);
            document.body.appendChild(this.overlay);
            this._populateValues();

            // 點擊遮罩關閉面板
            this.overlay.addEventListener("click", (e) => {
                if (e.target === this.overlay) {
                    this._safeHidePanel();
                }
            });
        }

        hidePanel() {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        }

        // 檢查設定值是否有變更
        _hasConfigChanged() {
            if (!this.panel) return false;

            try {
                // 獲取目前表單的值
                const currentValues = this._getCurrentFormValues();
                
                // 比較與原始配置的差異
                return (
                    currentValues.buyDateIndexes !== CONFIG.BUY_DATE_INDEXES.join(",") ||
                    currentValues.areaGroups !== CONFIG.BUY_AREA_GROUPS.join(",") ||
                    currentValues.areaSeats !== CONFIG.BUY_AREA_SEATS.join(",") ||
                    currentValues.buyCount !== CONFIG.BUY_COUNT.toString() ||
                    currentValues.payType !== CONFIG.PAY_TYPE ||
                    currentValues.executeTime !== CONFIG.EXECUTE_TIME ||
                    currentValues.bankCodes !== JSON.stringify(CONFIG.BANK_CODES, null, 2) ||
                    currentValues.excludeKeywords !== CONFIG.EXCLUDE_KEYWORDS.join(",")
                );
            } catch (error) {
                console.error("檢查設定變更時發生錯誤:", error);
                return false;
            }
        }

        // 獲取目前表單的值
        _getCurrentFormValues() {
            return {
                buyDateIndexes: this.panel.querySelector("#tx-buy-date-indexes").value,
                areaGroups: this.panel.querySelector("#tx-area-groups").value,
                areaSeats: this.panel.querySelector("#tx-area-seats").value,
                buyCount: this.panel.querySelector("#tx-buy-count").value,
                payType: this.panel.querySelector("#tx-pay-type").value,
                executeTime: this.panel.querySelector("#tx-execute-time").value,
                bankCodes: this.panel.querySelector("#tx-bank-codes").value,
                excludeKeywords: this.panel.querySelector("#tx-exclude-keywords").value
            };
        }

        // 安全關閉面板（檢查是否有未儲存的變更）
        _safeHidePanel() {
            if (this._hasConfigChanged()) {
                const confirmed = confirm("有設定值尚未儲存，請確認是否儲存？");
                if (confirmed) {
                    this._saveConfig();
                    return;
                }
                // 如果用戶選擇取消，不關閉面板
                return false;
            }
            this.hidePanel();
            return true;
        }

        _checkAndSetExecuteTime() {
            const currentExecuteTime = CONFIG.EXECUTE_TIME;
            
            // 如果啟動時間為空或已過期，自動填入當下時間
            if (!currentExecuteTime || currentExecuteTime.trim() === "") {
                this._setCurrentTime();
                return;
            }

            try {
                const executeTime = new Date(currentExecuteTime);
                const now = new Date();
                
                // 如果時間已過期，自動填入當下時間
                if (executeTime <= now) {
                    this._setCurrentTime();
                }
            } catch (e) {
                // 如果時間格式錯誤，也自動填入當下時間
                console.warn("啟動時間格式錯誤，自動設定為當前時間:", e);
                this._setCurrentTime();
            }
        }

        _setCurrentTime() {
            const now = new Date();
            // 格式化為 YYYY-MM-DDTHH:mm:ss (datetime-local 格式)
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            const timeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            configManager.set('EXECUTE_TIME', timeString);
        }

        _createPanel() {
            const panel = DOMUtils.createElement("div", {
                className: "tx-control-panel",
            });

            panel.innerHTML = `
                <div class="tx-control-panel-header">
                    <h2>⚙️ 設定</h2>
                    <button class="tx-control-panel-close" id="tx-panel-close">×</button>
                </div>
                <div class="tx-control-panel-content">
                    <div class="tx-control-section">
                        <h3>📋 購票設定</h3>
                        <div class="tx-control-row">
                            <label class="tx-control-label">場次順序:</label>
                            <input type="text" id="tx-buy-date-indexes" class="tx-control-input" placeholder="1,：代表選第一場>隨機">
                            <div class="tx-control-help">以逗號分隔：1=第一場，2=第二場，-1=隨機</div>
                        </div>
                        <div class="tx-control-row">
                            <label class="tx-control-label">座位群組:</label>
                            <input type="text" id="tx-area-groups" class="tx-control-input" placeholder="2388,1388,">
                            <div class="tx-control-help">依價位或區域分組，以逗號分隔：空白=隨機</div>
                            <div class="tx-control-help">Ex.2388,1388,：先選2388>1388>隨機</div>
                        </div>
                        <div class="tx-control-row">
                            <label class="tx-control-label">座位關鍵字:</label>
                            <input type="text" id="tx-area-seats" class="tx-control-input" placeholder="205 2388,204,">
                            <div class="tx-control-help">以逗號分隔：空格=同時包含，空白=隨機</div>
                            <div class="tx-control-help">Ex.205 2388,204,：先選205及2388皆有的座位>204>隨機</div>
                        </div>
                        <div class="tx-control-row">
                            <label class="tx-control-label">排除關鍵字:</label>
                            <input type="text" id="tx-exclude-keywords" class="tx-control-input" placeholder="輪椅,身障,障礙,Restricted,遮蔽,視線不完整">
                            <div class="tx-control-help">包含這些關鍵字的座位將被排除，以逗號分隔</div>
                        </div>
                        <div class="tx-control-row">
                            <label class="tx-control-label">購買張數:</label>
                            <input type="number" id="tx-buy-count" class="tx-control-input" min="1" max="6" value="2">
                            <div class="tx-control-help">若此數量無法選擇則自動選最大值</div>
                        </div>
                        <div class="tx-control-row">
                            <label class="tx-control-label">付款方式:</label>
                            <select id="tx-pay-type" class="tx-control-select">
                                <option value="A">ATM 轉帳</option>
                                <option value="C">信用卡</option>
                            </select>
                        </div>
                    </div>

                    <div class="tx-control-section">
                        <h3>⏰ 執行時間</h3>
                        <div class="tx-control-row">
                            <label class="tx-control-label">啟動時間:(過期則立即啟動)</label>
                            <input type="datetime-local" id="tx-execute-time" class="tx-control-input" step="1">
                            <div class="tx-control-help">格式: YYYY-MM-DD HH:mm:ss，若時間已過則立即執行，空白=立即執行</div>
                        </div>
                    </div>

                    <div class="tx-control-section">
                        <h3>🏦 銀行設定</h3>
                        <div class="tx-control-row">
                            <label class="tx-control-label">銀行卡號:</label>
                            <textarea id="tx-bank-codes" class="tx-control-textarea" placeholder='{"國泰世華": "40637634", "中國信託": "424162"}'></textarea>
                            <div class="tx-control-help">JSON 格式，銀行名稱對應卡號</div>
                        </div>
                    </div>

                    <div class="tx-control-buttons">
                        <button class="tx-control-button tx-control-button-save" id="tx-save-config">💾 儲存設定</button>
                        <button class="tx-control-button tx-control-button-reset" id="tx-reset-config">🔄 重設為預設</button>
                        <button class="tx-control-button tx-control-button-cancel" id="tx-cancel-config">❌ 取消</button>
                    </div>
                </div>
            `;

            this._bindEvents(panel);
            return panel;
        }

        _bindEvents(panel) {
            panel.querySelector("#tx-save-config").addEventListener("click", () => {
                this._saveConfig();
            });

            panel.querySelector("#tx-reset-config").addEventListener("click", () => {
                if (confirm("確定要重設為預設值嗎？")) {
                    configManager.resetToDefault();
                    alert("設定已重設，即將重整頁面。");
                    window.location.reload(true);
                }
            });

            panel.querySelector("#tx-cancel-config").addEventListener("click", () => {
                this._safeHidePanel();
            });

            // 關閉按鈕事件
            panel.querySelector("#tx-panel-close").addEventListener("click", () => {
                this._safeHidePanel();
            });
        }

        _populateValues() {
            if (!this.panel) return;

            // 購票設定
            this.panel.querySelector("#tx-buy-date-indexes").value = CONFIG.BUY_DATE_INDEXES.join(",");
            this.panel.querySelector("#tx-area-groups").value = CONFIG.BUY_AREA_GROUPS.join(",");
            this.panel.querySelector("#tx-area-seats").value = CONFIG.BUY_AREA_SEATS.join(",");
            this.panel.querySelector("#tx-buy-count").value = CONFIG.BUY_COUNT;
            this.panel.querySelector("#tx-pay-type").value = CONFIG.PAY_TYPE;

            // 執行時間
            this.panel.querySelector("#tx-execute-time").value = CONFIG.EXECUTE_TIME;

            // 銀行設定
            this.panel.querySelector("#tx-bank-codes").value = JSON.stringify(CONFIG.BANK_CODES, null, 2);

            // 排除設定
            this.panel.querySelector("#tx-exclude-keywords").value = CONFIG.EXCLUDE_KEYWORDS.join(",");
        }

        _saveConfig() {
            try {
                // 購票設定
                const buyDateIndexesInput = this.panel.querySelector("#tx-buy-date-indexes").value;
                const areaGroupsInput = this.panel.querySelector("#tx-area-groups").value;
                const areaSeatsInput = this.panel.querySelector("#tx-area-seats").value;

                // 檢查字串末尾是否有逗號，若無則顯示警告
                const fieldsToCheck = [
                    { name: "BUY_DATE_INDEXES", value: buyDateIndexesInput, displayName: "場次優先順序" },
                    { name: "BUY_AREA_GROUPS", value: areaGroupsInput, displayName: "座位群組" },
                    { name: "BUY_AREA_SEATS", value: areaSeatsInput, displayName: "座位優先順序" }
                ];

                const warningFields = [];
                for (const field of fieldsToCheck) {
                    if (field.value.trim() && !field.value.trim().endsWith(",")) {
                        warningFields.push(field.displayName);
                    }
                }

                if (warningFields.length > 0) {
                    const fieldList = warningFields.map(field => `• ${field}`).join('\n');
                    const confirmMessage = `⚠️ 警告！\n\n以下欄位未以逗號結尾，代表您並未打算將『至少有票』作為最終備案：\n${fieldList}\n\n請確認是否繼續儲存設定？`;
                    if (!confirm(confirmMessage)) {
                        return;
                    }
                }

                const buyDateIndexes = buyDateIndexesInput
                    .split(",")
                    .map((s) => {
                        const trimmed = s.trim();
                        if (trimmed === "") return "";
                        const parsed = parseInt(trimmed);
                        return isNaN(parsed) ? "" : parsed;
                    })
                    .filter((item) => item !== undefined && item !== null);

                const areaGroups = areaGroupsInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length >= 0);
                const areaSeats = areaSeatsInput
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length >= 0);
                const buyCount = parseInt(this.panel.querySelector("#tx-buy-count").value);
                const payType = this.panel.querySelector("#tx-pay-type").value;

                // 執行時間
                const executeTime = this.panel.querySelector("#tx-execute-time").value;

                // 銀行設定
                const bankCodes = JSON.parse(this.panel.querySelector("#tx-bank-codes").value);

                // 排除設定
                const excludeKeywords = this.panel
                    .querySelector("#tx-exclude-keywords")
                    .value.split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);

                // 進階設定，不可修改
                const ocrApi = configManager.defaultConfig.OCR_API_URL;
                const ocrInterval = configManager.defaultConfig.OCR_PREHEAT_INTERVAL;

                // 驗證並儲存
                if (buyDateIndexes.length === 0) buyDateIndexes.push("");
                if (areaGroups.length === 0) areaGroups.push("");
                if (areaSeats.length === 0) areaSeats.push("");
                if (isNaN(buyCount) || buyCount < 1) throw new Error("購買張數必須大於 0");
                if (!["A", "C"].includes(payType)) throw new Error("付款方式無效");

                // 更新設定
                configManager.set("BUY_DATE_INDEXES", buyDateIndexes);
                configManager.set("BUY_AREA_GROUPS", areaGroups);
                configManager.set("BUY_AREA_SEATS", areaSeats);
                configManager.set("BUY_COUNT", buyCount);
                configManager.set("PAY_TYPE", payType);
                configManager.set("EXECUTE_TIME", executeTime);
                configManager.set("BANK_CODES", bankCodes);
                configManager.set("EXCLUDE_KEYWORDS", excludeKeywords);
                configManager.set("OCR_API_URL", ocrApi);
                configManager.set("OCR_PREHEAT_INTERVAL", ocrInterval);

                window.location.reload(true);
            } catch (error) {
                alert("儲存失敗：" + error.message);
            }
        }
    }
    class UIManager {
        static enhanceSubmitButton() {
            const submit = DOMUtils.$("button[type=submit], #submitButton");
            if (submit) {
                submit.classList.add("tx-enhanced-submit");

                // 將按鈕移到父容器的最前面
                const parent = submit.parentNode;
                if (parent) {
                    parent.prepend(submit);
                }
            }
        }

        static removeAds() {
            DOMUtils.removeElements("#ad-footer");
        }

        static closeAlerts() {
            const closeButton = DOMUtils.$("button.close-alert");
            if (closeButton) {
                closeButton.click();
            }
        }

        static autoSubmit() {
            const submit = DOMUtils.$("button[type=submit], #submitButton");
            if (submit && !appState.getFlag("isSubmit")) {
                appState.setFlag("isSubmit", true);
                submit.click();
            }
        }

        static initializeConsole() {
            if (appState.isConsoleInitialized) return;
            appState.isConsoleInitialized = true;

            const isLoggedIn = !!DOMUtils.$(".user-name");
            const consoleDiv = this._createConsoleDiv();

            this._updateConsoleText(consoleDiv, appState.isAutoMode, isLoggedIn);

            consoleDiv.addEventListener("click", () => {
                const newAutoMode = appState.toggleAutoMode();
                this._updateConsoleText(consoleDiv, newAutoMode, isLoggedIn, true);
            });

            // 創建控制面板按鈕
            this._createControlPanelButton();
            
            // 如果是自動模式且已登入，檢查是否需要開始倒數計時
            if (appState.isAutoMode && isLoggedIn && CONFIG.EXECUTE_TIME && CONFIG.EXECUTE_TIME.length > 0) {
                try {
                    const executeTime = new Date(CONFIG.EXECUTE_TIME);
                    const now = new Date();
                    
                    // 如果啟動時間在未來，開始倒數計時
                    if (!isNaN(executeTime.getTime()) && executeTime > now) {
                        console.log(`初始化時檢測到未來啟動時間，開始倒數計時: ${CONFIG.EXECUTE_TIME}`);
                        this._startCountdown(consoleDiv);
                    }
                } catch (e) {
                    console.error('初始化檢查啟動時間失敗:', e);
                }
            }
        }

        static _createControlPanelButton() {
            // 避免重複創建
            if (DOMUtils.$("#tx-panel-button")) return;

            const button = DOMUtils.createElement("button", {
                id: "tx-panel-button",
                className: "tx-panel-button",
                textContent: "⚙️ 設定",
                onclick: () => {
                    if (window.txApp && window.txApp.controlPanel) {
                        window.txApp.controlPanel.showPanel();
                    }
                },
            });

            document.body.appendChild(button);
        }

        static _createConsoleDiv() {
            const div = DOMUtils.createElement("div", {
                id: "divConsole",
                className: "tx-console",
            });

            document.body.appendChild(div);
            return div;
        }

        static _updateConsoleText(consoleDiv, isAutoMode, isLoggedIn, isClick = false) {
            console.log(`自動模式: ${isAutoMode}, 切換模式: ${isClick}`);

            if (isAutoMode) {
                consoleDiv.className = "tx-console tx-console-auto";
                if (isLoggedIn) {
                    consoleDiv.innerHTML = "<span>🤖</span><span>自動</span>";
                    if (isClick) {
                        if (CONFIG.EXECUTE_TIME && CONFIG.EXECUTE_TIME.length > 0) {
                            this._startCountdown(consoleDiv);
                        } else {
                            window.location.reload(true);
                        }
                    }
                } else {
                    consoleDiv.innerHTML = "<span>🤖</span><span>未登入</span>";
                    if (isClick) {
                        const loginBtn = DOMUtils.$(".account-login a");
                        if (loginBtn) loginBtn.click();
                    }
                }
            } else {
                consoleDiv.className = "tx-console tx-console-manual";
                consoleDiv.innerHTML = isLoggedIn ? "<span>💪</span><span>手動</span>" : "<span>💪</span><span>未登入</span>";
                if (isClick && appState.countdownInterval) {
                    clearInterval(appState.countdownInterval);
                }
            }
        }

        static _startCountdown(consoleDiv) {
            const executeTimeStr = CONFIG.EXECUTE_TIME;
            console.log("開始倒數:", executeTimeStr);

            if (!executeTimeStr) {
                window.location.reload(true);
                return;
            }

            // 解析日期時間字串 (YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DDTHH:mm:ss)
            const executeTime = new Date(executeTimeStr);
            
            // 檢查日期是否有效
            if (isNaN(executeTime.getTime())) {
                console.error("時間格式錯誤，應為 YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DDTHH:mm:ss");
                window.location.reload(true);
                return;
            }

            const now = new Date();
            let diff = executeTime - now;

            // 如果設定時間已過，則立即執行
            if (diff <= 0) {
                console.log("設定時間已過，立即執行");
                window.location.reload(true);
                return;
            }

            let seconds = Math.floor(diff / 1000);
            appState.countdownInterval = setInterval(() => {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(appState.countdownInterval);
                    window.location.reload(true);
                } else {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;

                    if (hours > 0) {
                        consoleDiv.innerHTML = `<span>🤖</span><span>倒數 ${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}</span>`;
                    } else if (minutes > 0) {
                        consoleDiv.innerHTML = `<span>🤖</span><span>倒數 ${minutes}:${secs.toString().padStart(2, "0")}</span>`;
                    } else {
                        consoleDiv.innerHTML = `<span>🤖</span><span>倒數 ${secs} 秒</span>`;
                    }
                }
            }, 1000);
        }
    }

    // ==================== 主應用程式 ====================
    class TixCraftBot {
        constructor() {
            this.ticketHandler = new TicketHandler();
            this.ocrService = new OCRService();
            this.controlPanel = new ControlPanelManager();
            this.observer = null;
        }

        init() {
            this._setupKeyboardListeners();
            this._setupMutationObserver();
            this._registerMenuCommands();
            this.ocrService.preheatOCR();
            this._processPageUpdates();
        }

        _registerMenuCommands() {
            GM_registerMenuCommand("🎛️ 購票設定", () => {
                this.controlPanel.showPanel();
            });

            GM_registerMenuCommand("🔄 重新載入頁面", () => {
                window.location.reload(true);
            });
        }

        _setupKeyboardListeners() {
            document.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    UIManager.autoSubmit();
                }
            });
        }

        _setupMutationObserver() {
            this.observer = new MutationObserver((mutations) => {
                this._handleMutations(mutations);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        _handleMutations(mutations) {
            mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                    // 對於詳情頁和遊戲頁，持續監聽
                    if (appState.session !== "d" && appState.session !== "g") {
                        this.observer.disconnect();
                    }

                    this._processPageUpdates();
                }
            });
        }

        _processPageUpdates() {
            // 初始化控制台
            UIManager.initializeConsole();

            // 移除廣告和關閉提醒
            UIManager.removeAds();
            UIManager.closeAlerts();

            // 根據頁面類型處理
            this._handleCurrentPage();

            // 優化 UI
            UIManager.enhanceSubmitButton();
        }

        _handleCurrentPage() {
            switch (appState.session) {
                case "d": // 活動詳情頁
                    this.ticketHandler.handleActivityDetail();
                    break;
                case "g": // 遊戲列表頁
                    this.ticketHandler.handleGameList();
                    break;
                case "v": // 驗證頁
                    this.ticketHandler.handleVerification();
                    break;
                case "a": // 座位選擇頁
                    this.ticketHandler.handleAreaSelection();
                    break;
                case "t": // 訂單確認頁
                    this.ticketHandler.handleTicketConfirmation();
                    break;
                case "c": // 結帳頁
                    this.ticketHandler.handleCheckout();
                    break;
                default:
                    console.log("未識別的頁面類型");
            }
        }
    }

    // ==================== 應用程式初始化 ====================
    const appState = new AppState();
    const app = new TixCraftBot();

    // 將 app 實例暴露到全域以供控制面板按鈕使用
    window.txApp = app;

    // 啟動應用程式
    app.init();
})();
