// ==UserScript==
// @name         Cathay wifi
// @namespace    https://github.com/KuoAnn/TamperScripts
// @version      1.0.2
// @description  自動填寫國泰 wifi 登入表單
// @author       KuoAnn
// @match        https://w3.cathaylife.com.tw/eai/ZPWeb/login.jsp
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * 取得帳號密碼，若尚未設定則提示用戶設定
 * @returns {{userName: string, password: string}}
 */
async function getCredentials() {
    const userName = await GM_getValue("CathayWifi_userName", "");
    const password = await GM_getValue("CathayWifi_password", "");
    if (!userName || !password) {
        GM_notification({text: "請先設定帳號密碼（Tampermonkey選單）", title: "CathayWifi"});
        return null;
    }
    return { userName, password };
}

function setCredentials() {
    const userName = prompt("請輸入帳號", "");
    if (userName !== null) GM_setValue("CathayWifi_userName", userName);
    const password = prompt("請輸入密碼", "");
    if (password !== null) GM_setValue("CathayWifi_password", password);
    GM_notification({text: "已儲存帳號密碼", title: "CathayWifi"});
}

GM_registerMenuCommand("設定帳號密碼", setCredentials);

(async function () {
    "use strict";
    const credentials = await getCredentials();
    if (!credentials) return;
    // 60秒內只會觸發一次，避免密碼錯誤時重複觸發
    const key = "CathayWifi_lastTime";
    const lastTime = await GM_getValue(key, 0);
    if (lastTime && Date.now() - lastTime < 60 * 1000) {
        return;
    }
    await GM_setValue(key, Date.now());

    const chker = setInterval(() => {
        const eleUserName = document.querySelector("#UID");
        const elePassword = document.querySelector("#KEY");
        if (eleUserName && elePassword) {
            clearInterval(chker);
            eleUserName.value = credentials.userName;
            elePassword.value = credentials.password;
            const e = new Event("input", { bubbles: true });
            elePassword.dispatchEvent(e);
            setTimeout(() => {
                document.getElementById("btnLogin").click();
            }, 200);
        }
    }, 1000);
})();
