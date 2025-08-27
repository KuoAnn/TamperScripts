// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.13
// @description  包子漫畫：簡化介面、閱讀紀錄標示/清除、鍵盤 (W/S 上下捲動 A/← 上一話 D/→ 下一話 F 全螢幕)、滑輪自動翻頁、手機螢幕左右點擊翻頁
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
// ==/UserScript==

// ---------------------------------------------------------------------------
// Style & UI helpers
// ---------------------------------------------------------------------------
GM_addStyle(`
  .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}
  .alertMessage{background:rgba(94,39,0,0.78);color:#fff;padding:4px 8px;margin:4px;border-radius:5px;pointer-events:auto;font-size:13px;line-height:1.4;box-shadow:0 2px 4px rgba(0,0,0,.3);}
  #__nuxt{padding:0}
  .clearReadBtn{margin-left:6px;max-height:42px;cursor:pointer;}
`);

const alertQueue = [];
const alertDiv = GM_addElement(document.body, "div", { class: "alertContainer" });
/**
 * 顯示暫時訊息 (最多同時保留 10 則)
 * @param {string} message
 * @param {number} [timeout=3000]
 */
function alert(message, timeout = 3000) {
    try {
        const msg = GM_addElement(alertDiv, "div", { class: "alertMessage", textContent: message });
        alertQueue.push(msg);
        if (alertQueue.length > 10) {
            const old = alertQueue.shift();
            old && alertDiv.contains(old) && old.remove();
        }
        setTimeout(() => alertDiv.contains(msg) && msg.remove(), timeout);
    } catch (err) {
        // 在極少數 append 失敗時仍至少把訊息輸出
        console.warn("Alert fallback:", message, err);
    }
}

// Loader ticker (僅在 baozimh 站點使用)
let loader, _isLoaded = false;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------
const JSONSafeParse = (raw, def = null) => {
    if (raw == null) return def;
    try { return JSON.parse(raw); } catch { return def; }
};

/** 取得儲存的閱讀紀錄陣列 */
const getStoredReads = (key) => JSONSafeParse(GM_getValue(key), []);

/** 寫入閱讀紀錄陣列 */
const setStoredReads = (key, arr) => GM_setValue(key, JSON.stringify(arr));

(function () {
    "use strict";
    const hostname = window.location.hostname;
    if (hostname === "www.twmanga.com") {
        saveLastRead();      // 記錄本章進度
        addHotkey();         // 鍵盤與滑輪/觸控支援
        showDeviceInfo();    // 提示裝置資訊
    } else if (hostname === "www.baozimh.com") {
        // 首頁/漫畫目錄站點：整理介面 + 顯示歷史閱讀
        loader = setInterval(handleLoader, 500);
    }

    /** 裝置資訊提示 */
    function showDeviceInfo() {
        try {
            const w = window.innerWidth;
            const device = w < 760 ? "手機" : w < 1024 ? "平板" : "電腦";
            alert(`裝置: ${device} (${w}px)`, 4000);
        } catch (e) {
            console.error("showDeviceInfo error", e);
        }
    }

    /** 紀錄目前閱讀章節 (twmanga) */
    function saveLastRead() {
        const url = window.location.href;
        const regex = /comic\/chapter\/([^\/]+)\/(\d+)_(\d+)(?:_(\d+))?\.html/;
        const match = url.match(regex);
        if (!match) {
            console.error(`URL 格式不正確\n${url}`);
            return;
        }
        const key = match[1];
        const value = { ss: match[2], cs: match[3] };
        alert(`已讀 ${value.ss}-${value.cs}`, 3500);
        const reads = getStoredReads(key);
        if (!reads.some((ele) => ele.ss === value.ss && ele.cs === value.cs)) {
            reads.push(value);
            setStoredReads(key, reads);
        }
    }

    /** 將已讀章節標示並提供清除按鈕 (baozimh) */
    function showLastRead() {
        const url = window.location.href;
        try {
            const key = new URL(url).pathname.split("/").pop();
            if (!key) return;
            const lastRead = getStoredReads(key);
            if (lastRead.length) {
                lastRead.forEach((value) => {
                    document
                        .querySelectorAll(`a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`)
                        .forEach((ele) => (ele.style.backgroundColor = "#ffd706"));
                });
                const btnWrap = document.querySelector(".action-buttons");
                if (btnWrap && !btnWrap.querySelector('.clearReadBtn')) {
                    const btn = GM_addElement(btnWrap, "button", { class: "clearReadBtn", textContent: "清除閱讀紀錄" });
                    btn.addEventListener("click", () => {
                        const titleEle = document.querySelector(".comics-detail__title");
                        const comicTitle = titleEle?.textContent?.replace(/\n/g, "").trim() || "";
                        if (comicTitle && confirm(`確定要清除 ${comicTitle} 的閱讀紀錄嗎？`)) {
                            GM_deleteValue(key);
                            alert("已清除閱讀紀錄");
                            window.location.reload();
                        }
                    });
                }
            } else {
                alert("無閱讀紀錄");
            }
        } catch (error) {
            console.error(`showLastRead Error: ${error}\n${url}`);
            alert(`showLastRead Error: ${error}`);
        }
    }

    /** 鍵盤/滑輪/觸控操作邏輯 (twmanga) */
    function addHotkey() {
        const clickNext = () => document.querySelector("a#next-chapter")?.click();
        const clickPrev = () => document.querySelector("a#prev-chapter")?.click();

        // 連續偵測在底部 N 次才觸發下一章，避免快速滑動誤觸
        const BOTTOM_TOLERANCE = 100;
        const BOTTOM_DETECT_THRESHOLD = 1;
        let bottomDetectCount = 0;

        const atDocumentBottom = () => {
            const scrollBottom = window.innerHeight + window.scrollY;
            const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            return (scrollBottom + BOTTOM_TOLERANCE >= docHeight);
        };
        const autoNextPage = () => {
            if (atDocumentBottom()) {
                bottomDetectCount++;
                alert(`即將前往下一章... (${bottomDetectCount}/${BOTTOM_DETECT_THRESHOLD})`);
                if (bottomDetectCount >= BOTTOM_DETECT_THRESHOLD) {
                    bottomDetectCount = 0;
                    clickNext();
                }
            } else {
                bottomDetectCount = 0; // 中途離開底部即重置
            }
        };
        const autoPrevPage = () => { if (window.scrollY <= 10) clickPrev(); };

        // 手機/平板點擊區域翻頁 (上下 50px 保留)
        document.addEventListener("click", (e) => {
            if (window.innerWidth < 1000) {
                const { clientX: x, clientY: y } = e;
                const w = window.innerWidth, h = window.innerHeight;
                if (y < 50 || y > h - 50) return; // 上下緩衝
                if (x < w * 0.3) {
                    window.scrollBy({ top: -900, behavior: "smooth" });
                    autoPrevPage();
                } else if (x > w * 0.7) {
                    window.scrollBy({ top: 900, behavior: "smooth" });
                    autoNextPage();
                }
            }
        });

        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "w":
                    window.scrollBy({ top: -window.innerHeight * 0.9, behavior: "smooth" });
                    autoPrevPage();
                    break;
                case "s":
                    window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
                    autoNextPage();
                    break;
                case " ":
                case "PageDown":
                    autoNextPage();
                    break;
                case "PageUp":
                    autoPrevPage();
                    break;
                case "a":
                    clickPrev();
                    break;
                case "d":
                    clickNext();
                    break;
                case "f":
                    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                    break;
            }
        });

        // 滑輪方向自動判斷是否換章
        document.addEventListener("wheel", (e) => { e.deltaY > 0 ? autoNextPage() : autoPrevPage(); }, { passive: true });
    }

    /** 初始載入處理 (baozimh) */
    function handleLoader() {
        if (_isLoaded) return;
        const sectionTitles = document.querySelectorAll('.section-title');
        if (!sectionTitles.length) return; // 尚未載入 DOM
        _isLoaded = true;
        clearInterval(loader);

        // 移除干擾元素
        rmEles(".l-content", "猜你喜歡");
        rmEles(".footer");
        rmEles(".recommend");
        rmEles(".addthis-box");

        // 展開「查看全部」按鈕
        document.querySelectorAll("button").forEach((btn) => btn.textContent?.includes("查看全部") && btn.click());

        // 章節排序與合併
        sectionTitles.forEach((sectionTitle) => {
            const text = sectionTitle.textContent || "";
            if (text.includes("最新章節")) {
                sortCapters(sectionTitle.nextElementSibling);
            } else if (text.includes("章節目錄")) {
                const chapterItems = document.querySelector("#chapter-items");
                const chaptersOther = document.querySelector("#chapters_other_list");
                if (chapterItems && chaptersOther) {
                    chaptersOther.querySelectorAll(":scope > div").forEach((c) => chapterItems.appendChild(c));
                }
                chapterItems && sortCapters(chapterItems);
            }
        });
        showLastRead();
        showDeviceInfo();
    }

    /** 移除符合 selector (且可選擇包含文字) 的元素 */
    function rmEles(selector, text) {
        document.querySelectorAll(selector).forEach((ele) => {
            try {
                if (!text || (ele.textContent && ele.textContent.includes(text))) ele.remove();
            } catch { /* ignore */ }
        });
    }

    /**
     * 章節排序：以文字中第一組浮點數 / 整數作為排序依據 (降冪)
     * 避免 innerHTML 重繪造成事件遺失，逐一 append
     */
    function sortCapters(eleChapters) {
        if (!eleChapters) return;
        const numberPattern = /(\d+(?:\.\d+)?)/;
        const items = Array.from(eleChapters.querySelectorAll(":scope > div"));
        const frag = document.createDocumentFragment();
        items
            .map((el) => ({ el, n: parseFloat(el.textContent.match(numberPattern)?.[1] || '0') }))
            .sort((a, b) => b.n - a.n)
            .forEach(({ el }) => frag.appendChild(el));
        eleChapters.innerHTML = "";
        eleChapters.appendChild(frag);
    }
})();
