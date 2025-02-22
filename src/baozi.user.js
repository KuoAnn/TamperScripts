// ==UserScript==
// @name         Baozi
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  包子漫畫內透過鍵盤控制翻頁，W: 上滾，S: 下滾，A: 上一頁，D: 下一頁
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @match        https://www.baozimh.com/comic/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

GM_addStyle(".alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}");
GM_addStyle(".alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}");
GM_addStyle("#__nuxt{padding:0}");
GM_addStyle(".clearReadBtn{margin-left:6px;max-height:42px;}");

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

        if (messages.length > 3) {
            var oldMessage = messages.shift();
            if (alertContainer.contains(oldMessage)) {
                alertContainer.removeChild(oldMessage);
            }
        }

        setTimeout(function () {
            if (alertContainer.contains(message)) {
                alertContainer.removeChild(message);
            }
        }, 3000);
    };
})();

(function () {
    "use strict";

    const hostname = window.location.hostname;
    switch (hostname) {
        case "www.twmanga.com":
            addHotkey();
            saveLastRead();
            break;
        case "www.baozimh.com":
            loader = setInterval(() => {
                handleLoader();
            }, 500);
            break;
    }

    function saveLastRead() {
        const url = window.location.href;
        try {
            const regex = /comic\/chapter\/([^\/]+)\/(\d+)_(\d+)(?:_(\d+))?.html/;
            const match = url.match(regex);

            if (match) {
                const key = match[1];
                const value = {
                    ss: match[2],
                    cs: match[3],
                };
                console.log("saveLastRead: ", key, value);
                const lastRead = GM_getValue(key);
                if (lastRead) {
                    const lastReadArr = Array.from(JSON.parse(lastRead));
                    const isExist = lastReadArr.some((ele) => ele.ss === value.ss && ele.cs === value.cs);
                    if (!isExist) {
                        lastReadArr.push(value);
                        GM_setValue(key, JSON.stringify(lastReadArr));
                    }
                } else {
                    GM_setValue(key, JSON.stringify([value]));
                }

                console.log("Final LastRead: ", GM_getValue(key));
            } else {
                console.error(`URL 格式不正確\n${url}`);
            }
        } catch (error) {
            console.error(`saveLastRead Error: ${error}\n${url}`);
            alert(`saveLastRead Error: ${error}`);
        }
    }

    function showLastRead() {
        const url = window.location.href;
        try {
            const urlObj = new URL(url);
            const key = urlObj.pathname.split("/").pop();
            const lastRead = GM_getValue(key);
            console.log("showLastRead: ", key, lastRead);
            if (lastRead) {
                const values = JSON.parse(lastRead);
                Array.from(values).forEach((value) => {
                    const lastReadEleA = document.querySelectorAll(
                        `a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`
                    );
                    if (lastReadEleA) {
                        lastReadEleA.forEach((ele) => {
                            ele.style.backgroundColor = "lightgray";
                        });
                    }
                });

                // add clear GM_deleteValue button
                const clearReadBtn = document.createElement("button");
                clearReadBtn.textContent = "清除已讀";
                clearReadBtn.className = "clearReadBtn";
                clearReadBtn.onclick = () => {
                    GM_deleteValue(key);
                    alert("已清除紀錄");
                    window.location.reload();
                };
                // append clearBtn next to .add_bookshelf
                const addBookshelf = document.querySelector(".add_bookshelf");
                if (addBookshelf) {
                    addBookshelf.parentNode.appendChild(clearReadBtn);
                }
            }
        } catch (error) {
            console.error(`showLastRead Error: ${error}\n${url}`);
            alert(`showLastRead Error: ${error}`);
        }
    }

    function addHotkey() {
        console.log("add hotkey");
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
    }

    function handleLoader() {
        const sectionTitles = document.querySelectorAll(".section-title");
        if (sectionTitles && !_isLoaded) {
            _isLoaded = true;
            clearInterval(loader);
            console.log("Loaded");
            // remove useless elements
            rmEles(".l-content", "猜你喜歡");
            rmEles(".footer");
            rmEles(".recommend");
            rmEles(".addthis-box");
            // click button which text contains "查看全部"
            const viewAllBtns = document.querySelectorAll("button");
            viewAllBtns.forEach((btn) => {
                if (btn.textContent.indexOf("查看全部") > -1) {
                    btn.click();
                }
            });

            sectionTitles.forEach((sectionTitle) => {
                if (sectionTitle.textContent.indexOf("最新章節") > -1) {
                    // console.log("優化最新章節");
                    // sortCapters(sectionTitle.nextElementSibling);
                } else if (sectionTitle.textContent.indexOf("章節目錄") > -1) {
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

            showLastRead();
        }
    }

    function rmEles(selector, text) {
        const eles = document.querySelectorAll(selector);
        try {
            if (eles) {
                eles.forEach((ele) => {
                    if (text) {
                        if (ele.textContent.indexOf(text) > -1) {
                            ele.remove();
                        }
                    } else {
                        ele.remove();
                    }
                });
            }
        } catch (error) {
            console.error(`Remove Error: ${error}`);
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
