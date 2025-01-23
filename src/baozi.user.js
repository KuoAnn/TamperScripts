// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TampermonkeyUserscripts/raw/refs/heads/main/src/Baozi.user.js
// @updateURL    https://github.com/KuoAnn/TampermonkeyUserscripts/raw/refs/heads/main/src/Baozi.user.js
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

    document.addEventListener("keydown", function (e) {
        if (e.key === "a") {
            const links = document.querySelectorAll(".next_chapter a");
            links.forEach((link) => {
                if (link.textContent.includes("上一")) {
                    link.click();
                }
            });
        } else if (e.key === "d") {
            const links = document.querySelectorAll(".next_chapter a");
            links.forEach((link) => {
                if (link.textContent.includes("下一")) {
                    link.click();
                }
            });
        } else if (e.key === "w") {
            window.scrollBy({
                top: -window.innerHeight * 0.92,
                behavior: "smooth",
            });
        } else if (e.key === "s") {
            window.scrollBy({
                top: window.innerHeight * 0.92,
                behavior: "smooth",
            });
        }
    });
})();
