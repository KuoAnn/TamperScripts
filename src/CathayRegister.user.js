// ==UserScript==
// @name         大家來報報 輔助報名
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @author       KuoAnn
// @description  自動勾選同意條款並取得申請資訊，強化錯誤處理與安全性
// @match        https://agent2.cathaylife.com.tw/PDAC/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cathaylife.com.tw
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      agent2.cathaylife.com.tw
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayRegister.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayRegister.user.js
// ==/UserScript==

GM_addStyle(`
    .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}
    .alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}
    .cathay-btn{position:fixed;right:20px;z-index:1000;padding:10px 16px;margin-bottom:5px;border-radius:5px;border:none;font-weight:500;cursor:pointer;transition:all 0.3s ease;box-shadow:0 2px 5px rgba(0,0,0,0.2);}
    .cathay-btn:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.3);}
    .cathay-btn-check{top:10px;background-color:#4CAF50;color:white;}
    .cathay-btn-check:hover{background-color:#45a049;}
    .cathay-btn-save{top:60px;background-color:#2196F3;color:white;}
    .cathay-btn-save:hover{background-color:#0b7dda;}
    .cathay-btn-read{top:110px;background-color:#ff9800;color:white;}
    .cathay-btn-read:hover{background-color:#e68a00;}
  `);
const alertMQ = [];
const alertDiv = GM_addElement(document.body, "div", { class: "alertContainer" });
const pageAlert = (text, type = "", ...otherMsgs) => {
    let $msg;
    if (type === "error") {
        console.error(text, ...otherMsgs);
        $msg = GM_addElement(alertDiv, "div", { class: "alertMessage", style: "color:red", textContent: text, "data-alert": "1" });
    } else if (type === "warn") {
        console.warn(text, ...otherMsgs);
        $msg = GM_addElement(alertDiv, "div", { class: "alertMessage", style: "color:orange", textContent: text, "data-alert": "1" });
    } else {
        console.log(text, ...otherMsgs);
        $msg = GM_addElement(alertDiv, "div", { class: "alertMessage", textContent: text, "data-alert": "1" });
    }
    alertMQ.push($msg);
    if (alertMQ.length > 15) {
        const old = alertMQ.shift();
        alertDiv.contains(old) && alertDiv.removeChild(old);
    }
    setTimeout(() => alertDiv.contains($msg) && alertDiv.removeChild($msg), 6666);
};

(function () {
    "use strict";

    // 成功狀態 flag
    let applyInfoFetched = false;
    let debounceTimer = null;
    let lastUrl = window.location.href;

    /**
     * 勾選同意條款 checkbox，並處理例外狀況
     * @returns {void}
     */
    function checkAgreementBox() {
        try {
            const checkbox = document.querySelector('span.verify input[type="checkbox"]');
            if (!checkbox) {
                return;
            }
            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event("change", { bubbles: true }));
            }
        } catch (err) {
            pageAlert("[checkAgreementBox] 執行失敗", "error", err);
        }
    }

    /**
     * 解析 URL hash 取得 act_no 參數，強化正則與安全性
     * @returns {string|null} 活動編號
     */
    function getActNoFromUrl() {
        try {
            const hash = window.location.hash;
            // 支援 act_no 在 query/hash 任意位置，且只取數字
            const match = hash.match(/(?:[?&#]act_no=)(\d+)/);
            if (match && match[1]) {
                return match[1];
            }
            console.log("[getActNoFromUrl] 無法取得 act_no，hash:", hash);
        } catch (err) {
            pageAlert("[getActNoFromUrl] 執行失敗", "error", err);
        }
        return null;
    }

    /**
     * 取得申請資訊，並於 console 顯示結果
     * - 強化快取、錯誤處理、API 回應驗證與註解
     * - 拆分小型函式，提升可讀性與維護性
     * @returns {void}
     */
    function fetchApplyInfo() {
        const actNo = getActNoFromUrl();
        if (!actNo) {
            console.log("[fetchApplyInfo] actNo 不存在，略過 API 呼叫");
            return;
        }
        fetchQuestionnaireData(actNo)
            .then((data) => {
                const queNo = data?.que_no || 0;
                const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC12/checkApply?act_no=${actNo}&que_no=${queNo}`;
                pageAlert(`[checkApply] 查詢報名資訊 act_no=${actNo}&que_no=${queNo}`);
                return sendCheckApplyRequest(url);
            })
            .catch((err) => {
                pageAlert("[fetchApplyInfo] 問卷資料查詢失敗", "error", err);
            });
    }

    /**
     * 發送報名資訊查詢 API 請求
     * @param {string} url API 請求網址
     * @returns {void}
     */
    function sendCheckApplyRequest(url) {
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { Accept: "application/json" },
                onload: handleCheckApplyResponse,
                onerror: function (err) {
                    pageAlert("[fetchApplyInfo] API 請求失敗", "error", err);
                },
            });
        } catch (err) {
            pageAlert("[fetchApplyInfo] GM_xmlhttpRequest 執行失敗", "error", err);
        }
    }

    /**
     * 處理報名資訊 API 回應
     * @param {object} response GM_xmlhttpRequest 回傳物件
     * @returns {void}
     */
    function handleCheckApplyResponse(response) {
        try {
            if (!response || typeof response.responseText !== "string") {
                pageAlert("[fetchApplyInfo] API 回應為空或格式錯誤", "error", err);
                return;
            }
            const json = JSON.parse(response.responseText);
            if (json && typeof json === "object" && Object.prototype.hasOwnProperty.call(json, "returnCode")) {
                applyInfoFetched = true;
                console.log("[fetchApplyInfo] 申請資訊:", json);
            } else {
                pageAlert("[fetchApplyInfo] 回應格式非預期", "error");
                console.warn("[fetchApplyInfo] 回應格式非預期:", response.responseText);
            }
        } catch (e) {
            pageAlert("[fetchApplyInfo] 回應解析失敗", "error", e, response && response.responseText);
        }
    }

    /**
     * 取得問卷資料，直接查詢 API
     * @param {string} actNo 活動編號
     * @returns {Promise<object|null>} 回傳 data 物件或 null
     */
    function fetchQuestionnaireData(actNo) {
        return new Promise((resolve) => {
            if (!actNo) return resolve(null);
            // 直接查詢 API
            const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC06/getQuestionnaireData?act_no=${actNo}`;
            pageAlert(`[getQuestionnaireData] 查詢問卷 act_no=${actNo}`);
            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { Accept: "application/json" },
                onload: function (response) {
                    try {
                        if (!response || typeof response.responseText !== "string") {
                            pageAlert("[fetchQuestionnaireData] API 回應為空或格式錯誤", "error");
                            resolve(null);
                            return;
                        }
                        const json = JSON.parse(response.responseText);
                        if (json && json.returnCode === 0 && Array.isArray(json.data) && json.data.length > 0) {
                            resolve(json.data[0]);
                        } else {
                            pageAlert("[fetchQuestionnaireData] 回應格式非預期", "error", response.responseText);
                            resolve(null);
                        }
                    } catch (e) {
                        pageAlert("[fetchQuestionnaireData] 回應解析失敗", "error", e, response && response.responseText);
                        resolve(null);
                    }
                },
                onerror: function (err) {
                    pageAlert("[fetchQuestionnaireData] API 請求失敗", "error", err);
                    resolve(null);
                },
            });
        });
    }

    /**
     * DOM 監聽回呼，優化防抖與 flag 管理
     * @returns {void}
     */
    function observerCallback(mutationsList) {
        try {
            // 檢查是否僅有 alertMessage 變動
            if (mutationsList && Array.isArray(mutationsList)) {
                const onlyAlert = mutationsList.every(m =>
                    Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).every(
                        n => n.nodeType === 1 && n.matches && n.matches('.alertMessage[data-alert="1"]')
                    )
                );
                if (onlyAlert && mutationsList.length > 0) return;
            }
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                applyInfoFetched = false;
                lastUrl = currentUrl;
                console.log("[observerCallback] URL 變化，重設 flag");
            }
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log("[MutationObserver] DOM 變化");
                checkAgreementBox();
                if (!applyInfoFetched) fetchApplyInfo();
            }, 120);
        } catch (err) {
            pageAlert("[observerCallback] 執行失敗", "error", err);
        }
    }

    // === 搶課按鈕與互動 ===
    let robotTimer = null;
    let robotTargetTime = null;
    let robotKeywords = "";
    const robotBtn = GM_addElement(document.body, "button", {
        class: "cathay-btn cathay-btn-check",
        style: "bottom:20px;right:20px;left:auto;top:auto;background:#4CAF50;min-width:100px;",
        textContent: "🤖 搶課",
    });

    function showPromptAndValidate() {
        // 1. 輸入報名時間
        let timeStr = "";
        while (true) {
            timeStr = prompt("請輸入報名時間 (格式: HHmm，例如 0930 代表上午9:30)\n請勿輸入冒號或其他符號。", "");
            if (timeStr === null) return false; // 使用者取消
            if (/^\d{4}$/.test(timeStr)) {
                const hh = parseInt(timeStr.slice(0, 2), 10);
                const mm = parseInt(timeStr.slice(2, 4), 10);
                if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) break;
            }
            pageAlert("格式錯誤！請輸入4位數字 (HHmm)，如 0930 代表上午9:30。", "error");
        }
        // 2. 輸入關鍵字
        let keywords = "";
        while (true) {
            keywords = prompt(
                "請輸入搶課順序關鍵字（多個以逗號分隔，空白作為'且'的邏輯子），若都沒有的話則預設搶第一個\n\nEx: '正取 上午,正取,備取'\n1. 先搶有出現'正取'及'上午'文字的課程\n2. 依次搶'正取','備取'\n都沒有則搶第一個",
                ""
            );
            if (keywords === null) return false;
            break;
        }
        robotKeywords = keywords;
        // 計算目標時間
        const now = new Date();
        const target = new Date(now);
        target.setHours(parseInt(timeStr.slice(0, 2), 10), parseInt(timeStr.slice(2, 4), 10), 0, 0);
        // 若目標時間已過，則自動加一天
        if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
        robotTargetTime = target;
        startCountdown();
        return true;
    }

    function startCountdown() {
        if (robotTimer) clearInterval(robotTimer);
        updateBtnCountdown();
        robotTimer = setInterval(updateBtnCountdown, 1000);
    }
    function updateBtnCountdown() {
        if (!robotTargetTime) return;
        const now = new Date();
        let diff = Math.floor((robotTargetTime.getTime() - now.getTime()) / 1000);
        if (diff < 0) diff = 0;
        robotBtn.textContent = `🚀 倒數 ${diff} 秒`;
        robotBtn.style.backgroundColor = "#f44336";
        if (diff === 0 && robotTimer) {
            clearInterval(robotTimer);
            robotBtn.textContent = "🤖 搶課";
            pageAlert("倒數結束，開始自動搶課！\n關鍵字: " + robotKeywords);
            autoRegister();
        }
    }
    robotBtn.addEventListener("click", () => {
        observer.disconnect(); // 停止監聽
        if (robotTimer) clearInterval(robotTimer);
        robotBtn.textContent = "🤖 搶課";
        showPromptAndValidate();
    });

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // 初始執行一次
    checkAgreementBox();
    fetchApplyInfo();

    function matchSessionByKeywords(sessions, keywords) {
        if (!Array.isArray(sessions) || sessions.length === 0) return null;
        if (!keywords) return sessions[0];
        const keywordGroups = keywords.split(",").map((k) => k.trim().split(/\s+/));
        for (const group of keywordGroups) {
            const found = sessions.find((s) => group.every((kw) => s.act_show_nm.includes(kw)));
            if (found) return found;
        }
        return sessions[0];
    }

    function autoRegister() {
        const actNo = getActNoFromUrl();
        if (!actNo) {
            pageAlert("[autoRegister] 無法取得 act_no", "error");
            return;
        }
        fetchQuestionnaireData(actNo).then((data) => {
            const queNo = data?.que_no || 0;
            const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC12/checkApply?act_no=${actNo}&que_no=${queNo}`;
            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { Accept: "application/json" },
                onload: function (response) {
                    try {
                        const json = JSON.parse(response.responseText);
                        if (json.returnCode === 0 && json.data && Array.isArray(json.data.sessions) && json.data.sessions.length > 0) {
                            if (json.data.ansQueNo) {
                                pageAlert("[autoRegister] 需填問卷，進入手動流程");
                                manualRegister();
                                return;
                            }
                            const session = matchSessionByKeywords(json.data.sessions, robotKeywords);
                            if (!session) {
                                pageAlert("[autoRegister] 無可用課程", "error");
                                manualRegister();
                                return;
                            }
                            const postData = {
                                ansStr: "",
                                que_no: queNo,
                                session_check: session.act_show_no,
                                act_no: actNo + "",
                            };
                            GM_xmlhttpRequest({
                                method: "POST",
                                url: "https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC12/saveSignUp",
                                headers: { "Content-Type": "application/json", Accept: "application/json" },
                                data: JSON.stringify(postData),
                                onload: function (res) {
                                    try {
                                        const r = JSON.parse(res.responseText);
                                        if (r.returnCode === 0) {
                                            pageAlert("[autoRegister] 報名成功！" + (r.data || ""));
                                            // 報名成功後自動點擊「課程查詢」按鈕
                                            const queryBtn = Array.from(document.querySelectorAll("a")).find((a) => {
                                                const span = a.querySelector("span");
                                                return span && span.textContent.trim() === "課程查詢";
                                            });
                                            if (queryBtn) {
                                                queryBtn.click();
                                                pageAlert("[autoRegister] 已自動點擊「課程查詢」按鈕");
                                            } else {
                                                pageAlert("[autoRegister] 找不到「課程查詢」按鈕", "error");
                                            }
                                        } else {
                                            pageAlert(`[autoRegister] 報名失敗: ${r.msg || ""}`, "error");
                                            manualRegister();
                                        }
                                    } catch (e) {
                                        pageAlert("[autoRegister] 報名回應解析失敗", "error");
                                        manualRegister();
                                    }
                                },
                                onerror: function () {
                                    pageAlert("[autoRegister] 報名 API 請求失敗", "error");
                                    manualRegister();
                                },
                            });
                        } else {
                            pageAlert("[autoRegister] 無可報名課程", "error");
                            manualRegister();
                        }
                    } catch (e) {
                        pageAlert("[autoRegister] checkApply 回應解析失敗", "error");
                        manualRegister();
                    }
                },
                onerror: function () {
                    pageAlert("[autoRegister] checkApply API 請求失敗", "error");
                    manualRegister();
                },
            });
        });
    }

    function manualRegister() {
        // 自動點擊「我要報名」按鈕
        const btn = Array.from(document.querySelectorAll("a")).find((a) => a.textContent && a.textContent.includes("我要報名"));
        if (btn) {
            btn.click();
            pageAlert("[manualRegister] 已自動點擊「我要報名」按鈕");
        } else {
            pageAlert("[manualRegister] 找不到「我要報名」按鈕", "error");
        }
    }
})();
