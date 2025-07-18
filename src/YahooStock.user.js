// ==UserScript==
// @name         Yahoo Stock
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Yahoo Stock close subscription banner
// @author       KuoAnn
// @match        https://tw.stock.yahoo.com/quote/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=yahoo.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/YahooStock.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/YahooStock.user.js
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    let timer = setInterval(function () {
        var ele = document.querySelector("#subscription-banner button");
        if (ele != null && ele != undefined) {
            document.querySelector("#subscription-banner button").click();
            clearInterval(timer);
        }
    }, 500);
})();
