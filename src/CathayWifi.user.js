// ==UserScript==
// @name         Cathay wifi
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  try to take over the world!
// @match        https://w3.cathaylife.com.tw/eai/ZPWeb/login.jsp
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js
// @grant        none
// ==/UserScript==
const userName = "";
const password = "";

(function () {
    "use strict";

    if (!userName || !password) {
        alert("請先設定帳號密碼");
        return;
    }

    // 60秒內只會觸發一次，避免密碼錯誤時重複觸發
    const key = "CathayWifi";
    const lastTime = localStorage.getItem(key);
    if (lastTime && Date.now() - lastTime < 60 * 1000) {
        return;
    }
    localStorage.setItem(key, Date.now());

    const chker = setInterval(() => {
        const eleUserName = document.querySelector("#UID");
        const elePassword = document.querySelector("#KEY");
        if (eleUserName && elePassword) {
            clearInterval(chker);
            eleUserName.value = userName;
            elePassword.value = password;
            const e = new Event("input", { bubbles: true });
            elePassword.dispatchEvent(e);
            setTimeout(() => {
                document.getElementById("btnLogin").click();
            }, 200);
        }
    }, 1000);
})();
