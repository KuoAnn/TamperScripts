// ==UserScript==
// @name         TxTicket
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  強化UI/勾選同意條款/銀行辨識/選取購票/點選立即購票/選擇付款方式/alt+↓=切換日期/Enter送出/關閉提醒/移除廣告/執行倒數/控制面板設定/進階設定固定預設值/場次空值視為隨機/儲存時逗號檢查
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
                EXECUTE_TIME: "", // 啟動時間：HH:mm:ss，""=立即執行

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
            top: 0 !important;
            left: 0 !important;
            padding: 10px !important;
            text-align: center !important;
            z-index: 9999 !important;
            color: white !important;
            cursor: pointer !important;
        }
        
        .tx-console-auto {
            background-color: green !important;
        }
        
        .tx-console-manual {
            background-color: red !important;
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
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: white !important;
            border: 2px solid #333 !important;
            border-radius: 10px !important;
            padding: 20px !important;
            z-index: 10000 !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
            max-width: 90vw !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            font-family: Arial, sans-serif !important;
            color: #333 !important;
        }

        .tx-control-panel h2 {
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
            top: 50px !important;
            left: 0 !important;
            padding: 10px 15px !important;
            background: #007bff !important;
            color: white !important;
            border: none !important;
            border-radius: 0 8px 8px 0 !important;
            cursor: pointer !important;
            z-index: 9998 !important;
            font-size: 14px !important;
            font-weight: bold !important;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.3) !important;
            transition: all 0.3s ease !important;
        }

        .tx-panel-button:hover {
            background: #0056b3 !important;
            transform: translateX(5px) !important;
        }

        .tx-panel-button:active {
            transform: translateX(3px) !important;
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
                console.log("OCR 預熱跳過 - 時間間隔過短");
                return;
            }

            localStorage.setItem("triggerOcrTime", now.toString());

            // 測試用的預設圖片數據
            const testImageData =
                "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";

            try {
                appState.setFlag("isGetCaptcha", false);
                await this.getCaptcha(CONFIG.OCR_API_URL, testImageData);
                console.log("OCR 預熱完成");
            } catch (error) {
                console.error("OCR 預熱失敗:", error);
            }
        }

        extractImageFromCanvas() {
            const img = DOMUtils.$("#TicketForm_verifyCode-image");
            if (!img) return "";

            try {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                context.drawImage(img, 0, 0);
                const imageData = canvas.toDataURL();
                return imageData ? imageData.split(",")[1] : "";
            } catch (error) {
                console.error("提取圖片數據失敗:", error);
                return "";
            }
        }

        async processCaptcha() {
            const imageData = this.extractImageFromCanvas();
            if (!imageData) return;

            try {
                appState.setFlag("isGetCaptcha", false);
                await this.getCaptcha(CONFIG.OCR_API_URL, imageData);
            } catch (error) {
                console.error("處理驗證碼失敗:", error);
            }
        }

        async getCaptcha(url, imageData) {
            if (this.isProcessing) return;
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
                        this._handleCaptchaResponse(url, response);
                        resolve(response);
                    },
                    onerror: (error) => {
                        this.isProcessing = false;
                        console.error(`${url} 請求失敗:`, error);
                        reject(error);
                    },
                });
            });
        }

        _handleCaptchaResponse(url, response) {
            console.log(`${url} 回應:`, response.responseText);
            appState.setFlag("isOcr", false);

            if (response.status === 200) {
                try {
                    const result = JSON.parse(response.responseText);
                    const answer = result.answer;

                    if (answer && answer.length === 4) {
                        if (!appState.getFlag("isGetCaptcha")) {
                            appState.setFlag("isGetCaptcha", true);
                            console.log(`${url} 識別結果: ${answer}`);
                            this._fillCaptchaInput(answer);
                        } else {
                            console.log(`${url} 結果未使用: ${answer}`);
                        }
                    } else if (!appState.getFlag("isGetCaptcha")) {
                        appState.setFlag("isGetCaptcha", true);
                        console.log(`${url} 重試識別`);
                        this._refreshCaptcha(url);
                    }
                } catch (error) {
                    console.error("解析 OCR 回應失敗:", error);
                }
            } else {
                console.error(`${url} HTTP 錯誤:`, response.statusText, response.responseText);
            }
        }

        _fillCaptchaInput(code) {
            const input = DOMUtils.$("#TicketForm_verifyCode");
            if (input) {
                input.value = code;
                input.focus();
                // 觸發 input 事件以確保頁面能正確處理
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }

        _refreshCaptcha(url) {
            const imgCaptcha = DOMUtils.$("#TicketForm_verifyCode-image");
            if (!imgCaptcha) return;

            imgCaptcha.click();
            const originalSrc = imgCaptcha.src;

            const checkInterval = setInterval(() => {
                if (originalSrc !== imgCaptcha.src) {
                    clearInterval(checkInterval);
                    console.log("驗證碼已刷新:", imgCaptcha.src);

                    const newImageData = this.extractImageFromCanvas();
                    if (newImageData) {
                        appState.setFlag("isGetCaptcha", false);
                        this.getCaptcha(url, newImageData);
                    }
                }
            }, 100);

            // 防止無限等待
            setTimeout(() => {
                clearInterval(checkInterval);
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
                    appState.setFlag("isOcr", true);
                    this.ocrService.processCaptcha();
                }

                captchaInput.focus();
                captchaInput.addEventListener("input", (e) => {
                    if (e.target.value.length >= 4) {
                        UIManager.autoSubmit();
                    }
                });
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
        }

        showPanel() {
            if (this.panel) {
                this.panel.remove();
            }

            this.panel = this._createPanel();
            document.body.appendChild(this.panel);
            this._populateValues();
        }

        hidePanel() {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
        }

        _createPanel() {
            const panel = DOMUtils.createElement("div", {
                className: "tx-control-panel",
            });

            panel.innerHTML = `
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
                        <label class="tx-control-label">啟動時間:(需設定開票"前"啟動)</label>
                        <input type="time" id="tx-execute-time" class="tx-control-input" step="1">
                        <div class="tx-control-help">格式: HH:mm:ss，若當前時間已過則視為明天，空白=立即執行</div>
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
                this.hidePanel();
            });

            // 點擊面板外區域關閉
            panel.addEventListener("click", (e) => {
                if (e.target === panel) {
                    this.hidePanel();
                }
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
                    const confirmMessage = `⚠️ 警告！\n\n以下欄位未以逗號結尾，代表您不打算以"至少有票"為最終備案：\n${fieldList}\n\n請確認是否儲存設定？`;
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

                alert("設定已儲存！即將重整頁面");
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

        static _updateConsoleText(consoleDiv, isAutoMode, isLoggedIn, isToggled = false) {
            console.log(`自動模式: ${isAutoMode}, 切換: ${isToggled}`);

            if (isToggled) {
                isAutoMode = !isAutoMode;
            }

            if (isAutoMode) {
                consoleDiv.className = "tx-console tx-console-auto";
                if (isLoggedIn) {
                    consoleDiv.textContent = "🤖";
                    if (isToggled) {
                        if (CONFIG.EXECUTE_TIME && CONFIG.EXECUTE_TIME.length > 0) {
                            this._startCountdown(consoleDiv);
                        } else {
                            window.location.reload(true);
                        }
                    }
                } else {
                    consoleDiv.textContent = "🤖 未登入";
                    if (isToggled) {
                        const loginBtn = DOMUtils.$(".account-login a");
                        if (loginBtn) loginBtn.click();
                    }
                }
            } else {
                consoleDiv.className = "tx-console tx-console-manual";
                consoleDiv.textContent = isLoggedIn ? "💪" : "💪 未登入";
                if (isToggled && appState.countdownInterval) {
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

            // 解析時間字串 (HH:mm:ss)
            const timeParts = executeTimeStr.split(":");
            if (timeParts.length !== 3) {
                console.error("時間格式錯誤，應為 HH:mm:ss");
                window.location.reload(true);
                return;
            }

            const now = new Date();
            const executeTime = new Date();
            executeTime.setHours(parseInt(timeParts[0], 10));
            executeTime.setMinutes(parseInt(timeParts[1], 10));
            executeTime.setSeconds(parseInt(timeParts[2], 10));
            executeTime.setMilliseconds(0);

            // 如果設定時間已過，則設為明天同一時間
            if (executeTime <= now) {
                executeTime.setDate(executeTime.getDate() + 1);
            }

            let diff = executeTime - now;

            if (diff > 0) {
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
                            consoleDiv.textContent = `🤖 ${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                        } else if (minutes > 0) {
                            consoleDiv.textContent = `🤖 ${minutes}:${secs.toString().padStart(2, "0")}`;
                        } else {
                            consoleDiv.textContent = `🤖 ${secs} 秒`;
                        }
                    }
                }, 1000);
            } else {
                window.location.reload(true);
            }
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
