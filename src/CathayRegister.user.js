// ==UserScript==
// @name         大家來報報 輔助報名
// @namespace    http://tampermonkey.net/
// @version      1.0.3
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
const alert = (text, type = "", timeout = 6666) => {
    let $msg;
    if (type === "error") {
        $msg = GM_addElement(alertDiv, "div", { class: "alertMessage", style: "color:red", textContent: text });
    } else {
        console.log(text);
        $msg = GM_addElement(alertDiv, "div", { class: "alertMessage", textContent: text });
    }
    alertMQ.push($msg);
    if (alertMQ.length > 10) {
        const old = alertMQ.shift();
        alertDiv.contains(old) && alertDiv.removeChild(old);
    }
    setTimeout(() => alertDiv.contains($msg) && alertDiv.removeChild($msg), timeout);
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
            alert("[checkAgreementBox] 執行失敗", "error");
            console.error("[checkAgreementBox] 執行失敗", err);
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
            alert("[getActNoFromUrl] 無法取得 act_no，請確認 URL 格式", "error");
            console.warn("[getActNoFromUrl] 無法取得 act_no，hash:", hash);
            return null;
        } catch (err) {
            alert("[getActNoFromUrl] 執行失敗", "error");
            console.error("[getActNoFromUrl] 執行失敗", err);
            return null;
        }
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
            alert("[fetchApplyInfo] 無法取得 act_no，略過 API 呼叫", "error");
            console.warn("[fetchApplyInfo] actNo 不存在，略過 API 呼叫");
            return;
        }
        fetchQuestionnaireData(actNo)
            .then((data) => {
                const queNo = data?.que_no || 0;
                const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC12/checkApply?act_no=${actNo}&que_no=${queNo}`;
                alert(`[checkApply] 查詢報名資訊 act_no=${actNo}&que_no=${queNo}`);
                return sendCheckApplyRequest(url);
            })
            .catch((err) => {
                alert("[fetchApplyInfo] 問卷資料查詢失敗", "error");
                console.error("[fetchApplyInfo] 問卷資料查詢失敗", err);
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
                    alert("[fetchApplyInfo] API 請求失敗", "error");
                    console.error("[fetchApplyInfo] API 請求失敗", err);
                },
            });
        } catch (err) {
            alert("[fetchApplyInfo] GM_xmlhttpRequest 執行失敗", "error");
            console.error("[fetchApplyInfo] GM_xmlhttpRequest 執行失敗", err);
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
                alert("[fetchApplyInfo] API 回應為空或格式錯誤", "error");
                console.error("[fetchApplyInfo] API 回應為空或格式錯誤");
                return;
            }
            const json = JSON.parse(response.responseText);
            if (json && typeof json === "object" && Object.prototype.hasOwnProperty.call(json, "returnCode")) {
                applyInfoFetched = true;
                console.log("[fetchApplyInfo] 申請資訊:", json);
            } else {
                alert("[fetchApplyInfo] 回應格式非預期", "error");
                console.warn("[fetchApplyInfo] 回應格式非預期:", response.responseText);
            }
        } catch (e) {
            alert("[fetchApplyInfo] 回應解析失敗", "error");
            console.error("[fetchApplyInfo] 回應解析失敗", e, response && response.responseText);
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
            alert(`[getQuestionnaireData] 查詢問卷 act_no=${actNo}`);
            GM_xmlhttpRequest({
                method: "GET",
                url,
                headers: { Accept: "application/json" },
                onload: function (response) {
                    try {
                        if (!response || typeof response.responseText !== "string") {
                            alert("[fetchQuestionnaireData] API 回應為空或格式錯誤", "error");
                            console.error("[fetchQuestionnaireData] API 回應為空或格式錯誤");
                            resolve(null);
                            return;
                        }
                        const json = JSON.parse(response.responseText);
                        if (json && json.returnCode === 0 && Array.isArray(json.data) && json.data.length > 0) {
                            resolve(json.data[0]);
                        } else {
                            alert("[fetchQuestionnaireData] 回應格式非預期", "error");
                            console.warn("[fetchQuestionnaireData] 回應格式非預期:", response.responseText);
                            resolve(null);
                        }
                    } catch (e) {
                        alert("[fetchQuestionnaireData] 回應解析失敗", "error");
                        console.error("[fetchQuestionnaireData] 回應解析失敗", e, response && response.responseText);
                        resolve(null);
                    }
                },
                onerror: function (err) {
                    alert("[fetchQuestionnaireData] API 請求失敗", "error");
                    console.error("[fetchQuestionnaireData] API 請求失敗", err);
                    resolve(null);
                },
            });
        });
    }

    /**
     * DOM 監聽回呼，優化防抖與 flag 管理
     * @returns {void}
     */
    function observerCallback() {
        try {
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
            alert("[observerCallback] 執行失敗", "error");
            console.error("[observerCallback] 執行失敗", err);
        }
    }

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // 初始執行一次
    checkAgreementBox();
    fetchApplyInfo();
})();
