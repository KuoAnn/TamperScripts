// ==UserScript==
// @name         Cathay wifi
// @namespace    https://github.com/KuoAnn/TamperScripts
// @version      1.0.3
// @description  自動填寫國泰 wifi 登入表單
// @author       KuoAnn
// @match        https://w3.cathaylife.com.tw/eai/ZPWeb/login.jsp
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * 取得帳號密碼，若尚未設定則提示用戶設定
 * @returns {{userName: string, password: string}}
 */
async function getCredentials() {
    let userName = await GM_getValue("CathayWifi_userName", "");
    let password = await GM_getValue("CathayWifi_password", "");

    if (!userName) {
        userName = prompt("請輸入帳號", "");
        if (userName !== null && userName !== "") {
            await GM_setValue("CathayWifi_userName", userName);
        } else {
            return null;
        }
    }
    if (!password) {
        password = prompt("請輸入密碼", "");
        if (password !== null && password !== "") {
            await GM_setValue("CathayWifi_password", password);
        } else {
            return null;
        }
    }
    return { userName, password };
}

function setCredentials() {
    const userName = prompt("請輸入帳號", "");
    console.log("[CathayWifi] 設定帳號密碼: 帳號=", userName);
    if (userName !== null) GM_setValue("CathayWifi_userName", userName);
    const password = prompt("請輸入密碼", "");
    console.log("[CathayWifi] 設定帳號密碼: 密碼=", password ? "***" : "(空)");
    if (password !== null) GM_setValue("CathayWifi_password", password);
}

GM_registerMenuCommand("設定帳號密碼", setCredentials);

(async function () {
    "use strict";
    const credentials = await getCredentials();
    console.log("[CathayWifi] 主程式: credentials=", credentials);
    if (!credentials) return;
    // 60秒內只會觸發一次，避免密碼錯誤時重複觸發
    const key = "CathayWifi_lastTime";
    const lastTime = await GM_getValue(key, 0);
    console.log("[CathayWifi] 主程式: 上次執行時間=", lastTime, "目前=", Date.now());
    if (lastTime && Date.now() - lastTime < 60 * 1000) {
        console.log("[CathayWifi] 主程式: 因間隔限制跳過執行");
        return;
    }
    await GM_setValue(key, Date.now());
    console.log("[CathayWifi] 主程式: 已設定上次執行時間");

    const chker = setInterval(() => {
        const eleUserName = document.querySelector("#UID");
        const elePassword = document.querySelector("#KEY");
        console.log("[CathayWifi] 表單偵測: 帳號欄位=", !!eleUserName, "密碼欄位=", !!elePassword);
        if (eleUserName && elePassword) {
            clearInterval(chker);
            eleUserName.value = credentials.userName;
            elePassword.value = credentials.password;
            const e = new Event("input", { bubbles: true });
            elePassword.dispatchEvent(e);
            console.log("[CathayWifi] 表單偵測: 已填入並觸發 input 事件");
            setTimeout(() => {
                document.getElementById("btnLogin").click();
                console.log("[CathayWifi] 表單偵測: 已點擊登入按鈕");
            }, 200);
        }
    }, 1000);
})();
