// ==UserScript==
// @name         Baozi Comic Reader
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  包子漫畫增強閱讀器：簡化介面、智能閱讀紀錄管理、多種快捷操作、自動翻頁功能
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @match        https://www.baozimh.com/comic/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * Baozi Comic Reader - 包子漫畫增強閱讀器
 * 提供簡化介面、閱讀紀錄管理、快捷操作等功能
 * 
 * 功能特色：
 * - 智能閱讀進度管理
 * - 多種快捷鍵操作 (W/S 滾動, A/D 翻章, F 全螢幕)
 * - 自動翻頁與滑輪支援
 * - 移動裝置觸控操作
 * - 介面清理與章節排序
 */

(function() {
    'use strict';

    // ---------------------------------------------------------------------------
    // Constants & Configuration
    // ---------------------------------------------------------------------------
    const CONFIG = {
        BOTTOM_TOLERANCE: 100,
        BOTTOM_DETECT_THRESHOLD: 1,
        MAX_ALERT_MESSAGES: 10,
        DEFAULT_ALERT_TIMEOUT: 3000,
        SCROLL_PERCENTAGE: 0.9,
        MOBILE_BREAKPOINT: 1000,
        MOBILE_SCROLL_AMOUNT: 900,
        CHAPTER_SORT_PATTERN: /(\d+(?:\.\d+)?)/,
        URL_PATTERN: /comic\/chapter\/([^\/]+)\/(\d+)_(\d+)(?:_(\d+))?\.html/
    };

    const SELECTORS = {
        NEXT_CHAPTER: 'a#next-chapter',
        PREV_CHAPTER: 'a#prev-chapter',
        SECTION_TITLES: '.section-title',
        CHAPTER_ITEMS: '#chapter-items',
        CHAPTERS_OTHER: '#chapters_other_list',
        ACTION_BUTTONS: '.action-buttons',
        CLEAR_READ_BTN: '.clearReadBtn',
        COMICS_TITLE: '.comics-detail__title'
    };

    // ---------------------------------------------------------------------------
    // Styling
    // ---------------------------------------------------------------------------
    GM_addStyle(`
        .alertContainer {
            position: fixed;
            top: 6px;
            left: 6px;
            z-index: 9999;
            pointer-events: none;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .alertMessage {
            background: rgba(94, 39, 0, 0.78);
            color: #fff;
            padding: 4px 8px;
            margin: 4px;
            border-radius: 5px;
            pointer-events: auto;
            font-size: 13px;
            line-height: 1.4;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        #__nuxt {
            padding: 0;
        }
        
        .clearReadBtn {
            margin: 8px;
            max-height: 42px;
            cursor: pointer;
            background: #007cba;
            color: white;
            border: 1px solid #005a8b;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        
        .clearReadBtn:hover {
            background: #005a8b;
        }
        
        .swapClickBtn {
            position: fixed;
            top: 6px;
            right: 6px;
            z-index: 10000;
            background: #c95000;
            color: #fff;
            border: none;
            padding: 6px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            cursor: pointer;
            opacity: 0.88;
            transition: all 0.2s;
        }
        
        .swapClickBtn:hover {
            opacity: 1;
        }
        
        .swapClickBtn:active {
            transform: scale(0.95);
        }
        
        @media (min-width: ${CONFIG.MOBILE_BREAKPOINT}px) {
            .swapClickBtn {
                display: none;
            }
        }
        
        .read-chapter {
            background-color: #ffd706 !important;
            position: relative;
        }
        
        .read-chapter::after {
            content: "✓";
            position: absolute;
            top: 2px;
            right: 4px;
            color: #333;
            font-weight: bold;
            font-size: 12px;
        }
    `);

    // ---------------------------------------------------------------------------
    // Global Variables
    // ---------------------------------------------------------------------------
    const alertQueue = [];
    let alertDiv;
    let loader;
    let isLoaded = false;

    // ---------------------------------------------------------------------------
    // Utility Functions
    // ---------------------------------------------------------------------------
    
    /**
     * 安全的 JSON 解析
     * @param {string} raw - 要解析的 JSON 字串
     * @param {*} defaultValue - 解析失敗時的預設值
     * @returns {*} 解析結果或預設值
     */
    function safeJSONParse(raw, defaultValue = null) {
        if (raw == null) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.warn('JSON parse error:', error);
            return defaultValue;
        }
    }

    /**
     * 安全的元素選取
     * @param {string} selector - CSS 選擇器
     * @param {Element} parent - 父元素，預設為 document
     * @returns {Element|null} 找到的元素或 null
     */
    function safeQuerySelector(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`Query selector error for "${selector}":`, error);
            return null;
        }
    }

    /**
     * 安全的多元素選取
     * @param {string} selector - CSS 選擇器
     * @param {Element} parent - 父元素，預設為 document
     * @returns {NodeList} 找到的元素列表
     */
    function safeQuerySelectorAll(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.warn(`Query selector all error for "${selector}":`, error);
            return [];
        }
    }

    /**
     * 防抖函數
     * @param {Function} func - 要執行的函數
     * @param {number} wait - 等待時間（毫秒）
     * @returns {Function} 防抖後的函數
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 節流函數
     * @param {Function} func - 要執行的函數
     * @param {number} limit - 時間間隔（毫秒）
     * @returns {Function} 節流後的函數
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ---------------------------------------------------------------------------
    // Storage Management
    // ---------------------------------------------------------------------------
    
    /**
     * 取得儲存的閱讀紀錄陣列
     * @param {string} key - 儲存鍵值
     * @returns {Array} 閱讀紀錄陣列
     */
    function getStoredReads(key) {
        const stored = GM_getValue(key);
        return safeJSONParse(stored, []);
    }

    /**
     * 儲存閱讀紀錄陣列
     * @param {string} key - 儲存鍵值
     * @param {Array} array - 要儲存的陣列
     */
    function setStoredReads(key, array) {
        if (!Array.isArray(array)) {
            console.error('Invalid array for setStoredReads:', array);
            return;
        }
        GM_setValue(key, JSON.stringify(array));
    }

    /**
     * 清除儲存的閱讀紀錄
     * @param {string} key - 儲存鍵值
     */
    function clearStoredReads(key) {
        GM_deleteValue(key);
    }

    // ---------------------------------------------------------------------------
    // Alert System
    // ---------------------------------------------------------------------------
    
    /**
     * 初始化提醒系統
     */
    function initAlertSystem() {
        try {
            alertDiv = GM_addElement(document.body, "div", { class: "alertContainer" });
        } catch (error) {
            console.error('Failed to initialize alert system:', error);
        }
    }

    /**
     * 顯示暫時訊息
     * @param {string} message - 訊息內容
     * @param {number} timeout - 顯示時間（毫秒）
     */
    function showAlert(message, timeout = CONFIG.DEFAULT_ALERT_TIMEOUT) {
        if (!alertDiv) {
            console.warn('Alert system not initialized, falling back to console:', message);
            return;
        }

        try {
            const msg = GM_addElement(alertDiv, "div", { 
                class: "alertMessage", 
                textContent: message 
            });
            
            alertQueue.push(msg);
            
            // 限制最大訊息數量
            while (alertQueue.length > CONFIG.MAX_ALERT_MESSAGES) {
                const old = alertQueue.shift();
                if (old && alertDiv.contains(old)) {
                    old.remove();
                }
            }
            
            // 自動移除訊息
            setTimeout(() => {
                if (alertDiv && alertDiv.contains(msg)) {
                    msg.remove();
                    const index = alertQueue.indexOf(msg);
                    if (index > -1) {
                        alertQueue.splice(index, 1);
                    }
                }
            }, timeout);
        } catch (error) {
            console.error('Alert display error:', error, 'Message:', message);
        }
    }

    // ---------------------------------------------------------------------------
    // Reading Progress Management
    // ---------------------------------------------------------------------------
    
    /**
     * 記錄目前閱讀章節 (twmanga)
     */
    function saveLastRead() {
        const url = window.location.href;
        const match = url.match(CONFIG.URL_PATTERN);
        
        if (!match) {
            console.error('URL 格式不正確:', url);
            showAlert('無法解析章節資訊', 2000);
            return;
        }

        const key = match[1];
        const readData = { 
            ss: match[2], 
            cs: match[3],
            timestamp: Date.now(),
            url: url
        };
        
        showAlert(`已讀 ${readData.ss}-${readData.cs}`, 3500);
        
        try {
            const reads = getStoredReads(key);
            const existingIndex = reads.findIndex(item => 
                item.ss === readData.ss && item.cs === readData.cs
            );
            
            if (existingIndex === -1) {
                reads.push(readData);
                setStoredReads(key, reads);
            } else {
                // 更新時間戳記
                reads[existingIndex].timestamp = readData.timestamp;
                reads[existingIndex].url = readData.url;
                setStoredReads(key, reads);
            }
        } catch (error) {
            console.error('Save read progress error:', error);
            showAlert('儲存進度失敗', 2000);
        }
    }

    /**
     * 顯示已讀章節標示並提供清除按鈕 (baozimh)
     */
    function showLastRead() {
        const url = window.location.href;
        try {
            const key = new URL(url).pathname.split("/").pop();
            if (!key) {
                showAlert('無法取得漫畫識別碼', 2000);
                return;
            }
            
            const lastRead = getStoredReads(key);
            if (lastRead.length === 0) {
                showAlert('無閱讀紀錄', 1500);
                return;
            }
            
            // 標示已讀章節
            lastRead.forEach((value) => {
                const links = safeQuerySelectorAll(`a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`);
                links.forEach((ele) => {
                    ele.classList.add('read-chapter');
                });
            });
            
            // 新增清除按鈕
            const btnWrap = safeQuerySelector(SELECTORS.ACTION_BUTTONS);
            if (btnWrap && !safeQuerySelector(SELECTORS.CLEAR_READ_BTN, btnWrap)) {
                const btn = GM_addElement(btnWrap, "button", { 
                    class: "clearReadBtn", 
                    textContent: "清除閱讀紀錄" 
                });
                
                btn.addEventListener("click", handleClearReads);
            }
            
            showAlert(`已標示 ${lastRead.length} 個已讀章節`, 2000);
        } catch (error) {
            console.error('Show last read error:', error);
            showAlert(`顯示閱讀紀錄失敗: ${error.message}`, 3000);
        }
    }

    /**
     * 處理清除閱讀紀錄
     */
    function handleClearReads() {
        try {
            const url = window.location.href;
            const key = new URL(url).pathname.split("/").pop();
            const titleEle = safeQuerySelector(SELECTORS.COMICS_TITLE);
            const comicTitle = titleEle?.textContent?.replace(/\n/g, "").trim() || "此漫畫";
            
            if (confirm(`確定要清除 ${comicTitle} 的閱讀紀錄嗎？`)) {
                clearStoredReads(key);
                showAlert("已清除閱讀紀錄");
                
                // 移除視覺標示
                const readChapters = safeQuerySelectorAll('.read-chapter');
                readChapters.forEach(chapter => {
                    chapter.classList.remove('read-chapter');
                });
            }
        } catch (error) {
            console.error('Clear reads error:', error);
            showAlert('清除失敗', 2000);
        }
    }

    // ---------------------------------------------------------------------------
    // Navigation & Interaction
    // ---------------------------------------------------------------------------
    
    /**
     * 點擊下一章
     */
    function clickNext() {
        const nextBtn = safeQuerySelector(SELECTORS.NEXT_CHAPTER);
        if (nextBtn) {
            nextBtn.click();
        } else {
            showAlert('已是最後一章', 1500);
        }
    }

    /**
     * 點擊上一章
     */
    function clickPrev() {
        const prevBtn = safeQuerySelector(SELECTORS.PREV_CHAPTER);
        if (prevBtn) {
            prevBtn.click();
        } else {
            showAlert('已是第一章', 1500);
        }
    }

    /**
     * 檢查是否在文件底部
     */
    function isAtDocumentBottom() {
        const scrollBottom = window.innerHeight + window.scrollY;
        const docHeight = Math.max(
            document.body.scrollHeight, 
            document.documentElement.scrollHeight
        );
        return scrollBottom + CONFIG.BOTTOM_TOLERANCE >= docHeight;
    }

    /**
     * 檢查是否在文件頂部
     */
    function isAtDocumentTop() {
        return window.scrollY <= 10;
    }

    /**
     * 平滑滾動
     */
    function smoothScroll(amount) {
        window.scrollBy({ 
            top: amount, 
            behavior: "smooth" 
        });
    }

    /**
     * 切換全螢幕模式
     */
    function toggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                showAlert('退出全螢幕', 1000);
            } else {
                document.documentElement.requestFullscreen();
                showAlert('進入全螢幕', 1000);
            }
        } catch (error) {
            console.error('Fullscreen toggle error:', error);
            showAlert('全螢幕切換失敗', 2000);
        }
    }

    // ---------------------------------------------------------------------------
    // Auto Page Navigation
    // ---------------------------------------------------------------------------
    
    let bottomDetectCount = 0;

    const autoNextPage = throttle(() => {
        if (isAtDocumentBottom()) {
            bottomDetectCount++;
            showAlert(`即將前往下一章... (${bottomDetectCount}/${CONFIG.BOTTOM_DETECT_THRESHOLD})`, 1000);
            
            if (bottomDetectCount >= CONFIG.BOTTOM_DETECT_THRESHOLD) {
                bottomDetectCount = 0;
                clickNext();
            }
        } else {
            bottomDetectCount = 0; // 離開底部重置計數
        }
    }, 500);

    const autoPrevPage = debounce(() => {
        if (isAtDocumentTop()) {
            clickPrev();
        }
    }, 300);

    // ---------------------------------------------------------------------------
    // Event Handlers
    // ---------------------------------------------------------------------------
    
    /**
     * 鍵盤事件處理器
     */
    function handleKeydown(event) {
        // 避免在輸入框中觸發快捷鍵
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case "w":
            case "W":
            case "PageUp":
                event.preventDefault();
                smoothScroll(-window.innerHeight * CONFIG.SCROLL_PERCENTAGE);
                autoPrevPage();
                break;

            case "s":
            case "S":
            case " ":
            case "PageDown":
                event.preventDefault();
                smoothScroll(window.innerHeight * CONFIG.SCROLL_PERCENTAGE);
                autoNextPage();
                break;

            case "a":
            case "A":
            case "ArrowLeft":
                event.preventDefault();
                clickPrev();
                break;

            case "d":
            case "D":
            case "ArrowRight":
                event.preventDefault();
                clickNext();
                break;

            case "f":
            case "F":
                event.preventDefault();
                toggleFullscreen();
                break;
        }
    }

    /**
     * 滑鼠滾輪事件處理器
     */
    const handleWheel = throttle((event) => {
        if (event.deltaY > 0) {
            autoNextPage();
        } else {
            autoPrevPage();
        }
    }, 200);

    /**
     * 點擊事件處理器（移動裝置）
     */
    function handleClick(event) {
        if (window.innerWidth < CONFIG.MOBILE_BREAKPOINT) {
            smoothScroll(CONFIG.MOBILE_SCROLL_AMOUNT);
            autoNextPage();
        }
    }

    /**
     * 添加鍵盤/滑輪/觸控操作邏輯 (twmanga)
     */
    function addHotkey() {
        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleKeydown);
        document.addEventListener("wheel", handleWheel, { passive: true });
    }

    // ---------------------------------------------------------------------------
    // UI Cleanup
    // ---------------------------------------------------------------------------
    
    /**
     * 移除符合選擇器的元素
     * @param {string} selector - CSS 選擇器
     * @param {string} textFilter - 可選的文字過濾條件
     */
    function removeElements(selector, textFilter = null) {
        const elements = safeQuerySelectorAll(selector);
        elements.forEach((element) => {
            try {
                if (!textFilter || (element.textContent && element.textContent.includes(textFilter))) {
                    element.remove();
                }
            } catch (error) {
                console.warn('Remove element error:', error);
            }
        });
    }

    /**
     * 章節排序：以文字中第一組數字作為排序依據（降序）
     * @param {Element} container - 章節容器元素
     */
    function sortChapters(container) {
        if (!container) return;
        
        try {
            const items = Array.from(container.querySelectorAll(":scope > div"));
            if (items.length === 0) return;
            
            const fragment = document.createDocumentFragment();
            
            items
                .map((element) => ({
                    element,
                    number: parseFloat(element.textContent.match(CONFIG.CHAPTER_SORT_PATTERN)?.[1] || "0")
                }))
                .sort((a, b) => b.number - a.number)
                .forEach(({ element }) => fragment.appendChild(element));
            
            container.innerHTML = "";
            container.appendChild(fragment);
        } catch (error) {
            console.error('Sort chapters error:', error);
        }
    }

    // ---------------------------------------------------------------------------
    // Site-specific Handlers
    // ---------------------------------------------------------------------------
    
    /**
     * 初始載入處理 (baozimh)
     */
    function handleLoader() {
        if (isLoaded) return;
        
        const sectionTitles = safeQuerySelectorAll(SELECTORS.SECTION_TITLES);
        if (sectionTitles.length === 0) return; // DOM 尚未載入
        
        isLoaded = true;
        clearInterval(loader);
        
        try {
            // 清理不需要的元素
            removeElements(".l-content", "猜你喜歡");
            removeElements(".footer");
            removeElements(".recommend");
            removeElements(".addthis-box");
            
            // 展開「查看全部」按鈕
            const viewAllButtons = safeQuerySelectorAll("button");
            viewAllButtons.forEach((btn) => {
                if (btn.textContent?.includes("查看全部")) {
                    btn.click();
                }
            });
            
            // 處理章節排序與合併
            sectionTitles.forEach((sectionTitle) => {
                const text = sectionTitle.textContent || "";
                if (text.includes("最新章節")) {
                    sortChapters(sectionTitle.nextElementSibling);
                } else if (text.includes("章節目錄")) {
                    const chapterItems = safeQuerySelector(SELECTORS.CHAPTER_ITEMS);
                    const chaptersOther = safeQuerySelector(SELECTORS.CHAPTERS_OTHER);
                    
                    if (chapterItems && chaptersOther) {
                        const otherChapters = chaptersOther.querySelectorAll(":scope > div");
                        otherChapters.forEach((chapter) => chapterItems.appendChild(chapter));
                    }
                    
                    if (chapterItems) {
                        sortChapters(chapterItems);
                    }
                }
            });
            
            showLastRead();
            showAlert('頁面載入完成', 1500);
        } catch (error) {
            console.error('Handle loader error:', error);
            showAlert('初始化失敗', 2000);
        }
    }

    /**
     * 處理 TWManga 站點
     */
    function handleTwmanga() {
        try {
            saveLastRead();
            addHotkey();
        } catch (error) {
            console.error('TWManga handler error:', error);
            showAlert('TWManga 初始化失敗', 2000);
        }
    }

    /**
     * 處理 Baozimh 站點
     */
    function handleBaozimh() {
        try {
            loader = setInterval(handleLoader, 500);
        } catch (error) {
            console.error('Baozimh handler error:', error);
            showAlert('Baozimh 初始化失敗', 2000);
        }
    }

    /**
     * 添加用戶選單命令
     */
    function addUserMenuCommands() {
        GM_registerMenuCommand('清除所有閱讀紀錄', () => {
            if (confirm('確定要清除所有漫畫的閱讀紀錄嗎？此操作無法復原！')) {
                try {
                    // 這裡需要實作清除所有儲存資料的邏輯
                    // 由於 Tampermonkey 沒有提供列出所有 key 的功能，
                    // 我們只能在這裡提供清除當前漫畫紀錄的功能
                    const url = window.location.href;
                    if (url.includes('baozimh.com')) {
                        const key = new URL(url).pathname.split("/").pop();
                        if (key) {
                            clearStoredReads(key);
                            showAlert('已清除當前漫畫的閱讀紀錄');
                            location.reload();
                        }
                    }
                } catch (error) {
                    console.error('Clear all reads error:', error);
                    showAlert('清除失敗', 2000);
                }
            }
        });
        
        GM_registerMenuCommand('顯示快捷鍵說明', () => {
            const helpText = `
快捷鍵說明：
• W/S: 上下滾動
• A/←: 上一章
• D/→: 下一章  
• F: 切換全螢幕
• Space/PageDown: 自動下一章
• PageUp: 自動上一章

移動裝置：
• 點擊螢幕: 向下滾動
• 滾輪: 自動翻頁
            `.trim();
            alert(helpText);
        });
    }

    // ---------------------------------------------------------------------------
    // Main Execution
    // ---------------------------------------------------------------------------
    
    /**
     * 主要初始化函數
     */
    function initialize() {
        try {
            // 初始化提醒系統
            initAlertSystem();
            
            // 添加用戶選單
            addUserMenuCommands();
            
            // 根據站點執行對應邏輯
            const hostname = window.location.hostname;
            
            if (hostname === "www.twmanga.com") {
                handleTwmanga();
            } else if (hostname === "www.baozimh.com") {
                handleBaozimh();
            } else {
                console.warn('Unsupported hostname:', hostname);
            }
            
        } catch (error) {
            console.error('Initialization error:', error);
            // 即使初始化失敗，也嘗試顯示錯誤訊息
            if (typeof showAlert === 'function') {
                showAlert('腳本初始化失敗', 3000);
            }
        }
    }

    // 確保 DOM 載入完成後才執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
