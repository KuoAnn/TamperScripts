// ==UserScript==
// @name         Cathay Auto Learn
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk
// @downloadURL  https://github.com/KuoAnn/TampermonkeyUserscripts/raw/refs/heads/main/src/CathayLearn.user.js
// @updateURL    https://github.com/KuoAnn/TampermonkeyUserscripts/raw/refs/heads/main/src/CathayLearn.user.js
// @grant        none
// ==/UserScript==
(function () {
    const TIMEOUT_SECOND = 300;
    const WAIT_TIME_SECOND = 15;

    ("use strict");
    let countdownInterval;
    const body = document.querySelector("body");
    const countdownRow = document.createElement("div");
    setStyles(countdownRow, {
        textAlign: "center",
        position: "fixed",
        width: "100%",
        top: "0",
        color: "#eee",
        backgroundColor: "red",
    });
    body.prepend(countdownRow);

    const countdownText = document.createElement("span");
    countdownText.innerText = "";
    countdownRow.appendChild(countdownText);

    // 取消按鈕
    const cancelBtn = document.createElement("a");
    setStyles(cancelBtn, {
        color: "#eee",
        backgroundColor: "red",
        cursor: "pointer",
        textDecoration: "underline",
    });
    cancelBtn.innerText = "取消";
    cancelBtn.onclick = function () {
        clearInterval(onloadInterval);
        if (countdownInterval) clearInterval(countdownInterval);
        countdownRow.remove();
    };
    countdownRow.appendChild(cancelBtn);

    var countdownSec = 0;
    var totalSec = 0;
    var waitTime = WAIT_TIME_SECOND;
    const onloadInterval = setInterval(() => {
        try {
            const contentIframe = document.querySelector("iframe#content");
            if (contentIframe && contentIframe.contentWindow) {
                const playContentIframe = contentIframe.contentWindow.document.querySelector("iframe#playContent");
                if (playContentIframe && playContentIframe.contentWindow) {
                    const contentVideoIframe = playContentIframe.contentWindow.document.querySelector("iframe#Content");
                    if (contentVideoIframe && contentVideoIframe.contentWindow) {
                        const video = contentVideoIframe.contentWindow.document.querySelector("video");

                        const duration = video.duration;
                        countdownSec = Math.round(duration);
                        totalSec = countdownSec;
                    }
                }
            }
        } catch (error) {
            console.log("onLoadInterval error: " + error);
        }

        if (countdownSec > 0) {
            AutoLearn();
        } else if (waitTime <= 0) {
            // 超過等待時間，使用預設時間
            countdownSec = TIMEOUT_SECOND;
            totalSec = countdownSec;
            AutoLearn();
        } else {
            waitTime--;
            console.log("Wait video loding for " + waitTime);
        }
    }, 1000);

    function setStyles(element, styles) {
        for (const property in styles) {
            element.style[property] = styles[property];
        }
    }

    function AutoLearn() {
        clearInterval(onloadInterval);
        window.resizeTo(400, 400);
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        const windowWidth = window.outerWidth;
        const windowHeight = window.outerHeight;
        // 計算右下角座標
        const rightX = screenWidth - windowWidth;
        const bottomY = screenHeight - windowHeight;
        // 移動視窗到右下角
        window.moveTo(rightX, bottomY);
        
        var endDate = new Date();
        endDate.setSeconds(endDate.getSeconds() + countdownSec);
        console.log("Countdown to: " + endDate);

        countdownInterval = setInterval(function () {
            // re-count countdownSec from endDate
            countdownSec = Math.round((endDate - new Date()) / 1000);
            if (countdownSec > 0) {
                countdownText.innerText = --countdownSec + "/" + totalSec;
            } else {
                const iframeBanner = document.querySelector("iframe#banner");
                if (iframeBanner) {
                    var x = iframeBanner.contentWindow.document.querySelectorAll("button");
                    x[x.length - 1].click();
                }
            }
        }, 1000);
    }
})();
