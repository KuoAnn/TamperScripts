// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  包子漫畫內透過鍵盤控制翻頁，W: 上滾，S: 下滾，A: 上一頁，D: 下一頁
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @match        https://www.baozimh.com/comic/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(".alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}");
GM_addStyle(".alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}");

let _isLoaded = false;
let loader;
let messages = [];

// override alert
const alertContainer = document.createElement("div");
alertContainer.className = "alertContainer";
document.body.appendChild(alertContainer);

const alert = (function () {
    return function (str) {
        var message = document.createElement("div");
        message.className = "alertMessage";
        message.innerText = str;
        alertContainer.appendChild(message);
        messages.push(message);

        if (messages.length > 20) {
            var oldMessage = messages.shift();
            if (alertContainer.contains(oldMessage)) {
                alertContainer.removeChild(oldMessage);
            }
        }

        setTimeout(function () {
            if (alertContainer.contains(message)) {
                alertContainer.removeChild(message);
            }
        }, 3333);
    };
})();

(function () {
    "use strict";

    if (window.location.hostname === "www.baozimh.com") {
        console.log("trigger");
        loader = setInterval(() => {
            handleLoader();
        }, 500);
    }

    // hotkey
    const handleKeydown = (e) => {
        const links = document.querySelectorAll(".next_chapter a");
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

    function handleLoader() {
        const sectionTitles = document.querySelectorAll(".section-title");
        if (sectionTitles && !_isLoaded) {
            _isLoaded = true;
            clearInterval(loader);
            console.log("Loaded");

            sectionTitles.forEach((sectionTitle) => {
                if (sectionTitle.textContent.indexOf("最新章節") > -1) {
                    // console.log("優化最新章節");
                    // sortCapters(sectionTitle.nextElementSibling);
                } else if (sectionTitle.textContent.indexOf("章節目錄") > -1) {
                    console.log("優化章節目錄");
                    console.log("將其他章節加入章節目錄");
                    const chapterItems = document.querySelector("#chapter-items");
                    const chapters_other_list = document.querySelector("#chapters_other_list");
                    if (chapters_other_list) {
                        // 將其他章節加入章節目錄
                        const otherList = chapters_other_list.querySelectorAll(":scope > div");
                        otherList.forEach((chapter) => {
                            chapterItems.appendChild(chapter);
                        });
                    }
                    sortCapters(chapterItems);
                }
            });
        }
    }

    function sortCapters(eleChapters) {
        let chapters = eleChapters.querySelectorAll(":scope > div");
        chapters = Array.from(chapters).sort((a, b) => {
            try {
                const numA = parseFloat(a.textContent.match(/(\d+(\.\d+)?)/)[0]);
                const numB = parseFloat(b.textContent.match(/(\d+(\.\d+)?)/)[0]);
                return numB - numA;
            } catch (error) {
                const errMsg = `Sort Error: ${error} ${a.textContent}|${b.textContent}`;
                alert(errMsg);
                console.error(errMsg);
                // 預設反序
                return a > b ? 1 : -1;
            }
        });

        // 清空原有的章節並重新加入反序後的章節
        eleChapters.innerHTML = "";
        Array.from(chapters).forEach((chapter) => {
            eleChapters.appendChild(chapter);
        });
    }
})();
