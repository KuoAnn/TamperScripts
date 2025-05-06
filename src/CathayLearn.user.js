// ==UserScript==
// @name         國泰自我學習網
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.0.5
// @description  國泰自我學習網
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @connect      *
// @grant        none
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// @icon         https://www.cathaysec.com.tw/cathaysec/assets/img/home/news_icon_csc.png
// ==/UserScript==
(function () {
    const TIMEOUT_SECOND = 300;
    const LOAD_TIME_SECOND = 15;
    ("use strict");
    let countdownInterval;
    let countdownSec = 0;
    let totalSec = 0;
    let loadTime = LOAD_TIME_SECOND;
    const body = document.querySelector("body");
    const countdownRow = createCountdownRow();
    body.prepend(countdownRow);
    const countdownText = document.createElement("span");
    countdownText.innerText = "";
    countdownRow.appendChild(countdownText);
    const cancelBtn = createCancelButton();
    countdownRow.appendChild(cancelBtn);
    const onloadInterval = setInterval(() => {
        try {
            const video = tryGetElements("video");
            if (video && video.length > 0) {
                initVideo(video[0]);
            }
            tryClickButton("測驗開始", () => {
                console.log("測驗開始");
                clearInterval(onloadInterval);
                hideCancelButton();
                createAutoAnswerButton();
            });
        } catch (error) {
            console.error("onLoadInterval error:", error);
        }
        if (countdownSec > 0) {
            AutoLearn();
        } else if (loadTime <= 0) {
            countdownSec = TIMEOUT_SECOND;
            totalSec = countdownSec;
            AutoLearn();
        } else {
            loadTime--;
            console.log(`Wait video loading for ${loadTime} seconds`);
        }
    }, 1000);
    function createCountdownRow() {
        const row = document.createElement("div");
        setStyles(row, {
            textAlign: "center",
            position: "fixed",
            width: "100%",
            top: "0",
            color: "#eee",
            backgroundColor: "red",
        });
        return row;
    }
    function createCancelButton() {
        const button = document.createElement("a");
        setStyles(button, {
            color: "#eee",
            backgroundColor: "red",
            cursor: "pointer",
            textDecoration: "underline",
        });
        button.innerText = "取消";
        button.onclick = () => {
            clearInterval(onloadInterval);
            if (countdownInterval) clearInterval(countdownInterval);
            hideCancelButton();
        };
        return button;
    }
    function hideCancelButton() {
        countdownRow.remove();
    }
    function initVideo(video) {
        const duration = video.duration;
        countdownSec = Math.round(duration) + 10; // 多等待 10 秒
        totalSec = countdownSec;
        console.log(`Detect video countdown=${countdownSec}s, totalSec=${totalSec}s`);
        video.click();
        video.play();
        video.muted = !video.muted;
        console.log("Auto play");
    }
    function setStyles(element, styles) {
        for (const property in styles) {
            element.style[property] = styles[property];
        }
    }
    function AutoLearn() {
        clearInterval(onloadInterval);
        // moveToBottomRight();
        const endDate = new Date();
        endDate.setSeconds(endDate.getSeconds() + countdownSec);
        console.log("Countdown to:", endDate);
        countdownInterval = setInterval(() => {
            countdownSec = Math.round((endDate - new Date()) / 1000);
            if (countdownSec > 0) {
                countdownText.innerText = `${--countdownSec}/${totalSec}`;
            } else {
                goToNextPage();
            }
        }, 1000);
    }
    function moveToBottomRight() {
        window.resizeTo(400, 400);
        const rightX = screen.width - window.outerWidth;
        const bottomY = screen.height - window.outerHeight;
        window.moveTo(rightX, bottomY);
    }
    function goToNextPage() {
        const iframeBanner = document.querySelector("iframe#banner");
        if (iframeBanner) {
            const buttons = iframeBanner.contentWindow.document.querySelectorAll("button");
            if (buttons.length > 0) {
                buttons[buttons.length - 1].click();
            }
        }
    }
    function createAutoAnswerButton() {
        const submitAllButton = document.createElement("button");
        submitAllButton.textContent = "✅ 看答案";
        Object.assign(submitAllButton.style, {
            position: "fixed",
            top: "10px",
            right: "20px",
            zIndex: "1000",
            padding: "8px 16px",
        });
        document.body.prepend(submitAllButton);
        submitAllButton.addEventListener("click", function () {
            const radioGroups = tryGetElements("mat-radio-group");
            if (radioGroups) {
                radioGroups.forEach((group) => {
                    const firstRadio = group.querySelector('mat-radio-button:first-child input[type="radio"]');
                    if (firstRadio) {
                        firstRadio.click();
                    }
                });
            }
            const checkboxes = tryGetElements("mat-checkbox");
            if (checkboxes) {
                checkboxes.forEach((checkbox) => {
                    const firstCheckbox = checkbox.querySelector('input[type="checkbox"]');
                    if (firstCheckbox && !firstCheckbox.checked) {
                        firstCheckbox.click();
                    }
                });
            }
            
            const step3 = () => {
                console.log("step3");
                console.log("請手動點擊「再測驗一次」按鈕");
            };
            const step2 = () => {
                console.log("step2");
                tryClickButton("全部", step3);
            };
            const step1 = () => {
                console.log("step1");
                tryClickButton("確認", step2);
            };
            tryClickButton("完成", step1);
        })();
    }
    function tryGetElements(selector) {
        try {
            // 使用遞迴方式查找最深層的 document
            const getDeepestDocument = (doc, iframeSelectors = ['iframe#content', 'iframe#playContent', 'iframe#Content']) => {
                if (!doc || iframeSelectors.length === 0) return doc;
                
                try {
                    const iframeSelector = iframeSelectors[0];
                    const iframe = doc.querySelector(iframeSelector);
                    
                    if (!iframe) {
                        console.log(`找不到 ${iframeSelector}`);
                        return doc;
                    }
                    
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!iframeDoc) {
                        console.log(`無法存取 ${iframeSelector} 的 document 物件`);
                        return doc;
                    }
                    
                    return getDeepestDocument(iframeDoc, iframeSelectors.slice(1));
                } catch (err) {
                    console.error(`存取 iframe 時發生錯誤: ${err.message}`);
                    return doc;
                }
            };
            
            // 獲取最深層的 document
            const deepestDoc = getDeepestDocument(document);
            
            // 在最深層的 document 中查詢元素
            const elements = deepestDoc.querySelectorAll(selector);
            return elements?.length > 0 ? elements : null;
        } catch (error) {
            console.error(`tryGetElements error: ${error.message}`);
            return null;
        }
    }
    function tryGetButtonByText(text) {
        const buttons = tryGetElements("button");
        if (buttons && buttons.length > 0) {
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].innerText.includes(text)) {
                    return buttons[i];
                }
            }
        }
        return null;
    }
    function tryClickButton(buttonText, nextFunc, retryCount = 10) {
        const clickButtonWithDelay = (button, delay = 1000) => {
            console.log(`找到按鈕 "${buttonText}"，將在 ${delay / 1000} 秒後自動點擊`);
            setTimeout(() => {
                button.click();
                if (typeof nextFunc === "function") {
                    nextFunc();
                }
            }, delay);
        };
        const retryFindButton = () => {
            console.log(`找不到按鈕 "${buttonText}"，將嘗試重新尋找，最多 ${retryCount} 次`);
            let attempts = 0;
            const retryInterval = setInterval(() => {
                const button = tryGetButtonByText(buttonText);
                if (button) {
                    clickButtonWithDelay(button);
                    clearInterval(retryInterval);
                } else if (++attempts >= retryCount) {
                    console.log(`已嘗試 ${retryCount} 次仍找不到按鈕 "${buttonText}"，請手動點擊`);
                    clearInterval(retryInterval);
                }
            }, 500);
        };
        const button = tryGetButtonByText(buttonText);
        button ? clickButtonWithDelay(button) : retryFindButton();
    }
})();
