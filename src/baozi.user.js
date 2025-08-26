// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.10
// @description  包子漫畫：簡化介面、已讀紀錄、鍵盤控制翻頁 (W:上 S:下 A/←:上一話 D/→:下一話 F:全螢幕)、手機觸控翻頁
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @match        https://www.baozimh.com/comic/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_addElement
// ==/UserScript==

GM_addStyle(`
  .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}
  .alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}
  #__nuxt{padding:0}
  .clearReadBtn{margin-left:6px;max-height:42px;}
`);
const alertMQ = [];
const alertDiv = GM_addElement(document.body, "div", { class: "alertContainer" });
const alert = (str, timeout) => {
    const msg = GM_addElement(alertDiv, "div", { class: "alertMessage", textContent: str });
    alertMQ.push(msg);
    if (alertMQ.length > 10) {
        const old = alertMQ.shift();
        alertDiv.contains(old) && alertDiv.removeChild(old);
    }
    setTimeout(() => alertDiv.contains(msg) && alertDiv.removeChild(msg), timeout > 0 ? timeout : 3000);
};

let loader,
    _isLoaded = false;

(function () {
    "use strict";
    const hostname = window.location.hostname;
    if (hostname === "www.twmanga.com") {
        saveLastRead();
        addHotkey();
    } else if (hostname === "www.baozimh.com") {
        loader = setInterval(handleLoader, 500);
    }

    function saveLastRead() {
        const url = window.location.href;
        const regex = /comic\/chapter\/([^\/]+)\/(\d+)_(\d+)(?:_(\d+))?.html/;
        const match = url.match(regex);
        if (!match) {
            console.error(`URL 格式不正確\n${url}`);
            return;
        }
        const key = match[1];
        const value = { ss: match[2], cs: match[3] };
        console.log("saveLastRead:", key, value);
        alert(`已讀 ${value.ss}-${value.cs}`, 5000);
        const reads = GM_getValue(key) ? JSON.parse(GM_getValue(key)) : [];
        if (!reads.some((ele) => ele.ss === value.ss && ele.cs === value.cs)) {
            reads.push(value);
            GM_setValue(key, JSON.stringify(reads));
        }
        console.log("Final LastRead:", GM_getValue(key));
    }

    function showLastRead() {
        const url = window.location.href;
        try {
            const key = new URL(url).pathname.split("/").pop();
            const lastRead = GM_getValue(key);
            console.log("showLastRead:", key, lastRead);
            if (lastRead) {
                JSON.parse(lastRead).forEach((value) => {
                    document
                        .querySelectorAll(`a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`)
                        .forEach((ele) => (ele.style.backgroundColor = "#ffd706"));
                });
                const addBookshelf = document.querySelector(".action-buttons");
                const btn = GM_addElement(addBookshelf, "button", { class: "clearReadBtn", textContent: "清除閱讀紀錄" });
                btn.addEventListener("click", () => {
                    const titleEle = document.querySelector(".comics-detail__title");
                    const comicTitle = titleEle?.textContent?.replace(/\n/g, "").trim() || "";
                    if (comicTitle && confirm(`確定要清除 ${comicTitle} 的閱讀紀錄嗎？`)) {
                        GM_deleteValue(key);
                        alert("已清除閱讀紀錄");
                        window.location.reload();
                    }
                });
            } else {
                alert("無閱讀紀錄");
            }
        } catch (error) {
            console.error(`showLastRead Error: ${error}\n${url}`);
            alert(`showLastRead Error: ${error}`);
        }
    }

    function addHotkey() {
        const clickNext = () => document.querySelector("a#next-chapter")?.click();
        const clickPrev = () => document.querySelector("a#prev-chapter")?.click();
        const autoNextPage = () => {
            if (window.innerHeight + window.scrollY + 10 >= document.body.offsetHeight) clickNext();
        };
        const autoPrevPage = () => {
            if (window.scrollY <= 10) clickPrev();
        };

        // 裝置觸控支援，螢幕上下預留 50px 不動作
        document.addEventListener("click", (e) => {
            if (window.innerWidth < 800) {
                const clickX = e.clientX;
                const clickY = e.clientY;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const leftZone = screenWidth * 0.3;
                const rightZone = screenWidth * 0.7;
                // 上下預留 50px 不觸發
                if (clickY < 50 || clickY > screenHeight - 50) return;

                if (clickX < leftZone) {
                    window.scrollBy({ top: -window.innerHeight * 0.98, behavior: "smooth" });
                    autoPrevPage();
                } else if (clickX > rightZone) {
                    window.scrollBy({ top: window.innerHeight * 0.98, behavior: "smooth" });
                    autoNextPage();
                }
            }
        });

        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "w":
                    window.scrollBy({ top: -window.innerHeight * 0.9, behavior: "smooth" });
                    autoPrevPage();
                    break;
                case "s":
                    window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
                    autoNextPage();
                    break;
                case " ":
                case "PageDown":
                    autoNextPage();
                    break;
                case "PageUp":
                    autoPrevPage();
                    break;
                case "a":
                    clickPrev();
                    break;
                case "d":
                    clickNext();
                    break;
                case "f":
                    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                    break;
            }
        });
        document.addEventListener("wheel", (e) => {
            e.deltaY > 0 ? autoNextPage() : autoPrevPage();
        });
    }

    function handleLoader() {
        if (!_isLoaded && document.querySelectorAll(".section-title").length) {
            _isLoaded = true;
            clearInterval(loader);
            console.log("Loaded");
            rmEles(".l-content", "猜你喜歡");
            rmEles(".footer");
            rmEles(".recommend");
            rmEles(".addthis-box");
            document.querySelectorAll("button").forEach((btn) => btn.textContent.includes("查看全部") && btn.click());
            document.querySelectorAll(".section-title").forEach((sectionTitle) => {
                if (sectionTitle.textContent.indexOf("最新章節") > -1) {
                    sortCapters(sectionTitle.nextElementSibling);
                } else if (sectionTitle.textContent.includes("章節目錄")) {
                    const chapterItems = document.querySelector("#chapter-items");
                    const chaptersOther = document.querySelector("#chapters_other_list");
                    chaptersOther && chaptersOther.querySelectorAll(":scope > div").forEach((chapter) => chapterItems.appendChild(chapter));
                    sortCapters(chapterItems);
                }
            });
            showLastRead();
        }
    }

    function rmEles(selector, text) {
        document.querySelectorAll(selector).forEach((ele) => {
            if (!text || ele.textContent.includes(text)) ele.remove();
        });
    }

    function sortCapters(eleChapters) {
        const chapters = Array.from(eleChapters.querySelectorAll(":scope > div")).sort((a, b) => {
            const numA = parseFloat(a.textContent.match(/(\d+(\.\d+)?)/)?.[0] || 0);
            const numB = parseFloat(b.textContent.match(/(\d+(\.\d+)?)/)?.[0] || 0);
            return numB - numA;
        });
        eleChapters.innerHTML = "";
        chapters.forEach((chapter) => eleChapters.appendChild(chapter));
    }
})();
