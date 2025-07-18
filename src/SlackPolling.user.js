// ==UserScript==
// @name         Slack Polling
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  會定期偵測 Slack 訊息面板是否出現「重新整理」按鈕，若出現則自動點擊。
// @author       KuoAnn
// @match        https://app.slack.com/client/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=slack.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/SlackPolling.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/SlackPolling.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /** 輪詢間隔（毫秒） */
    const pollingInterval = 35000;
    /** 目標按鈕的 class 名稱 */
    const reloadBtnClass = 'p-message_pane__degraded_banner__reload_cta';
    let pollingTimer = null;
    let isPolling = false;

    /**
     * 嘗試自動點擊 Slack 訊息面板的「重新整理」按鈕
     */
    function tryReload() {
        try {
            const btn = document.querySelector(`.${reloadBtnClass}`);
            if (btn) {
                console.log('[Slack Polling] pulling...');
                btn.click();
            }
        } catch (err) {
            console.error('[Slack Polling] polling error:', err);
        }
    }

    /**
     * 啟動 polling
     */
    function startPolling() {
        if (!isPolling) {
            pollingTimer = setInterval(tryReload, pollingInterval);
            isPolling = true;
            console.log('[Slack Polling] polling started');
        }
    }

    /**
     * 停止 polling
     */
    function stopPolling() {
        if (isPolling && pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
            isPolling = false;
            console.log('[Slack Polling] polling stopped');
        }
    }

    // 預設啟動 polling
    startPolling();

    // 可用於測試：window.startSlackPolling / window.stopSlackPolling
    window.startSlackPolling = startPolling;
    window.stopSlackPolling = stopPolling;
})();