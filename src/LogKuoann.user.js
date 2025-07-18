// ==UserScript==
// @name         log.kuoann
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://log.kuoann.com/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=datalust.co
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/LogKuoann.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/LogKuoann.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * 取得帳號密碼，若未設定則提示用戶設定
 * @returns {{userName: string, password: string}}
 */
function getCredentials() {
    const userName = GM_getValue("userName", "");
    const password = GM_getValue("password", "");
    return { userName, password };
}

/**
 * 設定帳號密碼
 */
function setCredentials() {
    const userName = prompt("請輸入帳號：", GM_getValue("userName", ""));
    if (userName !== null) GM_setValue("userName", userName);
    const password = prompt("請輸入密碼：", GM_getValue("password", ""));
    if (password !== null) GM_setValue("password", password);
    alert("帳密已更新，請重新整理頁面。");
}

GM_registerMenuCommand("設定帳密", setCredentials);

(function () {
    const { userName, password } = getCredentials();
    if (userName === "" || password === "") {
        alert("請先透過 Tampermonkey 選單設定帳密");
        return;
    }

    /**
     * 輸入文字到 Angular input 元素
     * @param {HTMLInputElement} ele - 欲輸入的 input 元素
     * @param {string} text - 欲填入的文字
     */
    const inputNgText = function (ele, text) {
        ele.focus();
        ele.value = text;
        ele.blur();
        ele.dispatchEvent(new Event("input", { bubbles: true }));
    };

    /**
     * 監聽 DOM 變化，自動填入帳號密碼並提交表單
     * 加強錯誤處理，避免潛在例外
     */
    const observer = new MutationObserver((mutationsList) => {
        try {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    const eleUserName = document.querySelector("[label=Username] input");
                    const elePassword = document.querySelector("[label=Password] input");
                    if (eleUserName && elePassword) {
                        observer.disconnect(); // 偵測到後停止監聽
                        inputNgText(eleUserName, userName);
                        inputNgText(elePassword, password);
                        const submitBtn = document.querySelector("button[type=submit]");
                        if (submitBtn) {
                            setTimeout(() => {
                                submitBtn.click();
                            }, 200);
                        } else {
                            console.warn("未找到提交按鈕");
                        }
                        break;
                    }
                }
            }
        } catch (err) {
            console.error("MutationObserver 錯誤：", err);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
