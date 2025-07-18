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

(function () {
    "use strict";

    /**
     * 勾選同意條款 checkbox
     * @returns {void}
     */
    const CHECKBOX_SELECTOR = 'span.verify input[type="checkbox"]';
    // 成功狀態 flag
    let applyInfoFetched = false;
    let debounceTimer = null;
    let lastUrl = window.location.href;

    // act_no_data 快取 map，使用 GM_setValue/GM_getValue
    const ACTNO_CACHE_KEY = 'act_no_data';

    /**
     * 勾選同意條款 checkbox，並處理例外狀況
     * @returns {void}
     */
    function checkAgreementBox() {
        try {
            const checkbox = document.querySelector(CHECKBOX_SELECTOR);
            if (!checkbox) {
                return;
            }
            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } catch (err) {
            console.error('[checkAgreementBox] 執行失敗', err);
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
            console.warn('[getActNoFromUrl] 無法取得 act_no，hash:', hash);
            return null;
        } catch (err) {
            console.error('[getActNoFromUrl] 執行失敗', err);
            return null;
        }
    }

    /**
     * 取得申請資訊，並於 console 顯示結果
     * 強化快取、錯誤處理、API 回應驗證與註解
     * @returns {void}
     */
    function fetchApplyInfo() {
        let actNo = getActNoFromUrl();
        if (!actNo) {
            console.warn('[fetchApplyInfo] actNo 不存在，略過 API 呼叫');
            return;
        }
        // 先查詢問卷資料快取
        fetchQuestionnaireData(actNo).then((data) => {
            let queNo = data && data.que_no ? data.que_no : 0;
            // 構建查詢字串
            const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC12/checkApply?act_no=${actNo}&que_no=${queNo}`;
            console.info(`[fetchApplyInfo] 發查申請資訊 API: ${url}`);
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    headers: { Accept: 'application/json' },
                    onload: function (response) {
                        try {
                            if (!response || typeof response.responseText !== 'string') {
                                console.error('[fetchApplyInfo] API 回應為空或格式錯誤');
                                return;
                            }
                            const json = JSON.parse(response.responseText);
                            if (json && typeof json === "object" && json.hasOwnProperty("returnCode")) {
                                applyInfoFetched = true;
                                console.info("[fetchApplyInfo] 申請資訊:", json);
                            } else {
                                console.warn("[fetchApplyInfo] 回應格式非預期:", response.responseText);
                            }
                        } catch (e) {
                            console.error('[fetchApplyInfo] 回應解析失敗', e, response && response.responseText);
                        }
                    },
                    onerror: function (err) {
                        console.error('[fetchApplyInfo] API 請求失敗', err);
                    },
                });
            } catch (err) {
                console.error('[fetchApplyInfo] GM_xmlhttpRequest 執行失敗', err);
            }
        });
    }

    /**
     * 取得問卷資料，快取於 GM_setValue
     * @param {string} actNo 活動編號
     * @returns {Promise<object|null>} 回傳 data 物件或 null
     */
    function fetchQuestionnaireData(actNo) {
        return new Promise((resolve) => {
            if (!actNo) return resolve(null);
            // 先檢查快取（同步取得值）
            const cache = GM_getValue(ACTNO_CACHE_KEY, {});
            if (cache && cache[actNo]) {
                resolve(cache[actNo]);
                return;
            }
            // 無快取則查詢 API
            const url = `https://agent2.cathaylife.com.tw/PDAC/api/DTPDAC06/getQuestionnaireData?act_no=${actNo}`;
            console.info(`[fetchQuestionnaireData] 查詢問卷 API: ${url}`);
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: { Accept: 'application/json' },
                onload: function (response) {
                    try {
                        if (!response || typeof response.responseText !== 'string') {
                            console.error('[fetchQuestionnaireData] API 回應為空或格式錯誤');
                            resolve(null);
                            return;
                        }
                        const json = JSON.parse(response.responseText);
                        if (json && json.returnCode === 0 && Array.isArray(json.data) && json.data.length > 0) {
                            // 快取資料（同步取得舊值，然後同步設定新值）
                            const oldCache = GM_getValue(ACTNO_CACHE_KEY, {});
                            const newCache = { ...oldCache, [actNo]: json.data[0] };
                            GM_setValue(ACTNO_CACHE_KEY, newCache);
                            resolve(json.data[0]);
                        } else {
                            console.warn('[fetchQuestionnaireData] 回應格式非預期:', response.responseText);
                            resolve(null);
                        }
                    } catch (e) {
                        console.error('[fetchQuestionnaireData] 回應解析失敗', e, response && response.responseText);
                        resolve(null);
                    }
                },
                onerror: function (err) {
                    console.error('[fetchQuestionnaireData] API 請求失敗', err);
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
                console.log('[observerCallback] URL 變化，重設 flag');
            }
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('[MutationObserver] DOM 變化');
                checkAgreementBox();
                if (!applyInfoFetched) fetchApplyInfo();
            }, 120);
        } catch (err) {
            console.error('[observerCallback] 執行失敗', err);
        }
    }

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // 初始執行一次
    checkAgreementBox();
    fetchApplyInfo();
})();
