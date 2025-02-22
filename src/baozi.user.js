// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  包子漫畫內透過鍵盤控制翻頁，W: 上滾，S: 下滾，A: 上一頁，D: 下一頁
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        none
// ==/UserScript==

// 系統參數
let _isLoaded = false;
let _isSubmit = false;

(function () {
    "use strict";

    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                console.log("Mutated");
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleKeydown = (e) => {
        const links = document.querySelectorAll(".next_chapter a");
        console.log(e.key)
        switch (e.key) {
            case "w":
                window.scrollBy({
                    top: -window.innerHeight * 0.92,
                    behavior: "smooth",
                });
                break;
            case "s":
                window.scrollBy({
                    top: window.innerHeight * 0.92,
                    behavior: "smooth",
                });
                break;
            case "a":
                links.forEach((link) => {
                    if (link.textContent.includes("上一")) {
                        link.click();
                    }
                });
                break;
            case "d":
                links.forEach((link) => {
                    if (link.textContent.includes("下一")) {
                        link.click();
                    }
                });
                break;
        }
    };

    document.addEventListener("keydown", handleKeydown);
})();
