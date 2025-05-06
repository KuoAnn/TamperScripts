// ==UserScript==
// @name         國泰自我學習網
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.0.5
// @description  國泰自我學習網
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @connect      *
// @grant        GM_addStyle
// @grant        GM_addElement
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// @icon         https://www.cathaysec.com.tw/cathaysec/assets/img/home/news_icon_csc.png
// ==/UserScript==
GM_addStyle(`
  .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}
  .alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}
`);
const alertMQ = [];
const alertDiv = GM_addElement(document.body, "div", { class: "alertContainer" });
const alert = (str, type = "", timeout = 3333) => {
    let msg;
    if (type === "error") {
        msg = GM_addElement(alertDiv, "div", { class: "alertMessage", style: "color:red", textContent: str });
    } else {
        msg = GM_addElement(alertDiv, "div", { class: "alertMessage", textContent: str });
    }
    alertMQ.push(msg);
    if (alertMQ.length > 10) {
        const old = alertMQ.shift();
        alertDiv.contains(old) && alertDiv.removeChild(old);
    }
    setTimeout(() => alertDiv.contains(msg) && alertDiv.removeChild(msg), timeout);
};

(function () {
    const TIMEOUT_SECOND = 300;
    const LOAD_TIME_SECOND = 15;
    ("use strict");

    // 初始化狀態變數
    let countdownInterval;
    let countdownSec = 0;
    let totalSec = 0;
    let loadTime = LOAD_TIME_SECOND;

    // 建立倒數計時UI
    const body = document.querySelector("body");
    const countdownRow = createCountdownRow();
    const countdownText = countdownRow.querySelector("span");

    // 主要監控間隔
    const onloadInterval = setInterval(() => {
        try {
            // 檢查影片元素
            const videos = tryGetElements("video");
            const button = tryGetButtonByText("測驗開始");
            if (videos?.length > 0) {
                initVideo(videos[0]);
            } else if (button) {
                clearInterval(onloadInterval);
                alert("測驗開始");
                button.click();
                hideCountdownRow();
                createAutoAnswerButton();
                return;
            }
        } catch (error) {
            alert(error.message, "error");
            console.error("[onLoadInterval] error:", error);
        }

        // 檢查是否開始倒數或等待影片載入
        if (countdownSec > 0) {
            clearInterval(onloadInterval);
            waitToNextPage();
        } else if (loadTime <= 0) {
            clearInterval(onloadInterval);
            alert(`載入超過等待時間，使用預設等待時間 ${TIMEOUT_SECOND} 秒`);
            countdownSec = TIMEOUT_SECOND;
            totalSec = countdownSec;
            waitToNextPage();
        } else {
            loadTime--;
            alert(`等待載入 ${loadTime} seconds`);
        }
    }, 1000);

    function createCountdownRow() {
        const r = document.createElement("div");
        setStyles(r, {
            textAlign: "center",
            position: "fixed",
            width: "100%",
            top: "0",
            color: "#eee",
            backgroundColor: "red",
        });
        r.appendChild(document.createElement("span"));
        r.appendChild(createCancelButton());
        body.prepend(r);
        return r;
    }

    function createCancelButton() {
        const button = document.createElement("a");
        setStyles(button, {
            color: "#eee",
            backgroundColor: "red",
            cursor: "pointer",
            textDecoration: "underline",
        });
        button.innerText = "取消載入";
        button.onclick = () => {
            clearInterval(onloadInterval);
            if (countdownInterval) clearInterval(countdownInterval);
            hideCountdownRow();
        };
        return button;
    }

    function hideCountdownRow() {
        countdownRow.remove();
    }

    function initVideo(video) {
        const duration = video.duration;
        countdownSec = Math.round(duration) + 5; // 多等待 5 秒
        totalSec = countdownSec;
        alert(`Detect video countdown=${countdownSec}s, totalSec=${totalSec}s`);
        video.click();
        video.play();
        video.muted = !video.muted;
        alert("Auto play");
    }

    function setStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    function waitToNextPage() {
        const endDate = new Date(Date.now() + countdownSec * 1000);
        alert("Countdown to:", endDate);

        countdownInterval = setInterval(() => {
            countdownSec = Math.round((endDate - Date.now()) / 1000);

            if (countdownSec > 0) {
                countdownText.innerText = `${--countdownSec}/${totalSec}`;
            } else {
                clearInterval(countdownInterval);
                goToNextPage();
            }
        }, 1000);
    }

    function goToNextPage() {
        const iframeBanner = document.querySelector("iframe#banner");
        if (iframeBanner?.contentWindow?.document) {
            const buttons = iframeBanner.contentWindow.document.querySelectorAll("button");
            if (buttons.length > 0) buttons[buttons.length - 1].click();
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
            tryClickButton("完成", () => tryClickButton("確認", () => tryClickButton("全部", () => alert("請手動點擊「再測驗一次」按鈕"))));
        });
    }

    function tryGetElements(selector) {
        try {
            const getDeepestDocument = (doc, iframeSelectors = ["iframe#content", "iframe#playContent", "iframe#Content"]) => {
                if (!doc || iframeSelectors.length === 0) return doc;

                const iframeSelector = iframeSelectors[0];
                const iframe = doc.querySelector(iframeSelector);

                if (!iframe) {
                    return doc;
                }

                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                    return doc;
                }

                return getDeepestDocument(iframeDoc, iframeSelectors.slice(1));
            };

            const deepestDoc = getDeepestDocument(document);
            const elements = deepestDoc.querySelectorAll(selector);
            return elements?.length > 0 ? elements : null;
        } catch (error) {
            alert(`[tryGetElements] error: ${error.message}`, "error");
            console.error(`[tryGetElements] error:`, error);
            return null;
        }
    }

    function tryGetButtonByText(text) {
        const buttons = tryGetElements("button");
        if (!buttons || buttons.length === 0) return null;

        return Array.from(buttons).find((btn) => btn.innerText.includes(text)) || null;
    }

    function tryClickButton(buttonText, nextFunc, retryCount = 10) {
        const clickWithDelay = (btn) => {
            alert(`找到按鈕 "${buttonText}"，將在 1 秒後自動點擊`);
            setTimeout(() => {
                btn.click();
                if (typeof nextFunc === "function") nextFunc();
            }, 1000);
        };

        const button = tryGetButtonByText(buttonText);
        if (button) {
            clickWithDelay(button);
            return;
        }

        alert(`找不到按鈕 "${buttonText}"，將嘗試重新尋找，最多 ${retryCount} 次`);
        let attempts = 0;
        const retryInterval = setInterval(() => {
            const foundButton = tryGetButtonByText(buttonText);

            if (foundButton) {
                clickWithDelay(foundButton);
                clearInterval(retryInterval);
            } else if (++attempts >= retryCount) {
                alert(`已嘗試 ${retryCount} 次仍找不到按鈕 "${buttonText}"，請手動點擊`);
                clearInterval(retryInterval);
            }
        }, 500);
    }
})();
