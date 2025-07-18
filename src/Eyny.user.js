// ==UserScript==
// @name         Eyny 自動登入腳本
// @namespace    https://*.eyny.com/*
// @version      1.0.3
// @description  自動填入帳號密碼並登入 Eyny 論壇，支援安全提問自動填答。
// @author       KuoAnn
// @match        https://*.eyny.com/*
// @match        https://*.eyny.com/member.php?mod=logging*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @icon         https://www.google.com/s2/favicons?sz=16&domain=www.eyny.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js
// ==/UserScript==
(function () {
    "use strict";

    // 註冊 Tampermonkey 選單命令，設定帳號密碼
    GM_registerMenuCommand("設定 Eyny 帳號", async function () {
        const input = prompt("請輸入 Eyny 帳號：", await GM_getValue("eyny_user", ""));
        if (input !== null) {
            await GM_setValue("eyny_user", input);
            alert("帳號已儲存！");
        }
    });
    GM_registerMenuCommand("設定 Eyny 密碼", async function () {
        const input = prompt("請輸入 Eyny 密碼：", await GM_getValue("eyny_pswd", ""));
        if (input !== null) {
            await GM_setValue("eyny_pswd", input);
            alert("密碼已儲存！");
        }
    });

    /**
     * 檢查帳號密碼是否已設定，若未設定則提示用戶
     * @returns {Promise<boolean>} 是否已設定帳密
     */
    async function isCredentialSet() {
        const user = await GM_getValue("eyny_user", "");
        const pswd = await GM_getValue("eyny_pswd", "");
        if (!user || !pswd) {
            alert("請先透過 Tampermonkey 選單設定帳密");
            return false;
        }
        return true;
    }

    /**
     * 自動點擊確認按鈕（如遇到 Yes, I am.）
     */
    function autoConfirm() {
        const submitBtn = document.querySelector('input[name="submit"]');
        if (submitBtn && submitBtn.value.includes("Yes, I am.")) {
            submitBtn.click();
        }
    }

    /**
     * 等待指定元素出現後執行 callback，最多嘗試 50 次避免無限遞迴
     * @param {string} selector CSS 選擇器
     * @param {Function} callback 執行函式
     * @param {number} [retry=0] 重試次數
     */
    function waitForElement(selector, callback, retry = 0) {
        const el = document.querySelector(selector);
        if (el) {
            callback();
        } else if (retry < 50) {
            setTimeout(() => waitForElement(selector, callback, retry + 1), 100);
        } else {
            console.error(`waitForElement: 超過最大重試次數，未找到元素 ${selector}`);
        }
    }

    /**
     * 填寫登入表單並自動送出
     */
    async function fillForm() {
        try {
            const user = await GM_getValue("eyny_user", "");
            const pswd = await GM_getValue("eyny_pswd", "");
            const usernameField = document.querySelector('input[name="username"]');
            if (!usernameField) throw new Error("找不到帳號欄位");
            usernameField.value = user;

            const passwordField = document.querySelector('input[type="password"]');
            if (!passwordField) throw new Error("找不到密碼欄位");
            passwordField.value = pswd;

            const securityQuestionSelect = document.querySelector('select[name="questionid"]');
            if (securityQuestionSelect) {
                securityQuestionSelect.value = "1"; // "1" = 母親的名字
                securityQuestionSelect.dispatchEvent(new Event("change"));
            }

            setTimeout(() => {
                try {
                    const answerField = document.querySelector('input[name="answer"]');
                    if (!answerField) throw new Error("找不到安全提問答案欄位");
                    answerField.value = "123";

                    const loginButton = document.querySelector('button[name="loginsubmit"]');
                    if (!loginButton) throw new Error("找不到登入按鈕");
                    loginButton.click();
                } catch (err) {
                    console.error("登入表單送出失敗:", err);
                    alert("登入表單送出失敗: " + err.message);
                }
            }, 1000);
        } catch (err) {
            console.error("填寫登入表單失敗:", err);
            alert("填寫登入表單失敗: " + err.message);
        }
    }

    // 主流程
    (async function main() {
        if (window.location.href.includes("member.php?mod=logging")) {
            if (!(await isCredentialSet())) return;
            autoConfirm();
            waitForElement('form[name="login"]', fillForm);
        } else {
            autoConfirm();
        }
    })();
})();
