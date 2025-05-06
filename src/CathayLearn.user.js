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
// @downloadURL  https://pialm01.cathaybk.intra.uwccb/tfs/DefaultCollection/MIDNTSTK01-NewMMB/_apis/git/repositories/mb-test-tool/items?versionDescriptor.version=dev&path=%2Fsrc%2Fmain%2Fjs%2FCathayLearn%2FCathayLearn.user.js
// @updateURL    https://pialm01.cathaybk.intra.uwccb/tfs/DefaultCollection/MIDNTSTK01-NewMMB/_apis/git/repositories/mb-test-tool/items?versionDescriptor.version=dev&path=%2Fsrc%2Fmain%2Fjs%2FCathayLearn%2FCathayLearn.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.cathaylife.com.tw
// ==/UserScript==
(function () {
    const TIMEOUT_SECOND = 300,
        LOAD_TIME_SECOND = 15;
    let countdownInterval,
        countdownSec = 0,
        totalSec = 0,
        loadTime = LOAD_TIME_SECOND;
    const body = document.body,
        countdownRow = createElement("div", {
            textAlign: "center",
            position: "fixed",
            width: "100%",
            top: "0",
            color: "#eee",
            backgroundColor: "red",
        });
    body.prepend(countdownRow);
    const countdownText = createElement("span", {});
    countdownRow.append(
        countdownText,
        createElement("a", { color: "#eee", backgroundColor: "red", cursor: "pointer", textDecoration: "underline" }, "取消", () => {
            clearInterval(onloadInterval);
            if (countdownInterval) clearInterval(countdownInterval);
            countdownRow.remove();
        })
    );
    const onloadInterval = setInterval(() => {
        try {
            const video = tryGetElements("video")[0];
            if (video) initVideo(video);
            tryClickButton("測驗開始", () => {
                console.log("測驗開始");
                clearInterval(onloadInterval);
                countdownRow.remove();
                createAutoAnswerButton();
            });
        } catch (error) {
            console.error("onLoadInterval error:", error);
        }
        if (countdownSec > 0) AutoLearn();
        else if (loadTime-- <= 0) (countdownSec = totalSec = TIMEOUT_SECOND), AutoLearn();
        else console.log(`Wait video loading for ${loadTime} seconds`);
    }, 1000);
    function createElement(tag, styles, text, onClick) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        if (text) el.innerText = text;
        if (onClick) el.onclick = onClick;
        return el;
    }
    function initVideo(video) {
        countdownSec = totalSec = Math.round(video.duration) + 10;
        console.log(`Detect video countdown=${countdownSec}s, totalSec=${totalSec}s`);
        video.play();
        video.muted = !video.muted;
        console.log("Auto play");
    }
    function AutoLearn() {
        clearInterval(onloadInterval);
        const endDate = new Date(Date.now() + countdownSec * 1000);
        console.log("Countdown to:", endDate);
        countdownInterval = setInterval(() => {
            countdownSec = Math.round((endDate - Date.now()) / 1000);
            countdownSec > 0 ? (countdownText.innerText = `${--countdownSec}/${totalSec}`) : goToNextPage();
        }, 1000);
    }
    function goToNextPage() {
        const iframeBanner = document.querySelector("iframe#banner");
        if (iframeBanner) {
            const buttons = iframeBanner.contentWindow.document.querySelectorAll("button");
            if (buttons.length) buttons[buttons.length - 1].click();
        }
    }
    function createAutoAnswerButton() {
        const button = createElement(
            "button",
            { position: "fixed", top: "10px", right: "20px", zIndex: "1000", padding: "8px 16px" },
            ":白色勾勾: 看答案"
        );
        document.body.prepend(button);
        button.addEventListener("click", () => {
            tryGetElements("mat-radio-group").forEach((group) => group.querySelector('mat-radio-button:first-child input[type="radio"]')?.click());
            tryGetElements("mat-checkbox").forEach((checkbox) => {
                const input = checkbox.querySelector('input[type="checkbox"]');
                if (input && !input.checked) input.click();
            });
            ["完成", "確認", "全部"].reduce(
                (next, text) => () => tryClickButton(text, next),
                () => {}
            )();
        });
    }
    function tryGetElements(selector) {
        let parent = document;
        try {
            ["iframe#content", "iframe#playContent", "iframe#Content"].forEach((id) => {
                const frame = parent.querySelector(id);
                if (frame) parent = frame.contentDocument || frame.contentWindow.document;
            });
        } catch (error) {
            console.error("tryGetElement error:", error);
        }
        return parent.querySelectorAll(selector) || [];
    }
    function tryClickButton(buttonText, nextFunc, retryCount = 10) {
        const button = [...tryGetElements("button")].find((btn) => btn.innerText.includes(buttonText));
        if (button) setTimeout(() => (button.click(), nextFunc?.()), 1000);
        else if (retryCount > 0) setTimeout(() => tryClickButton(buttonText, nextFunc, retryCount - 1), 500);
        else console.log(`找不到按鈕 "${buttonText}"，請手動點擊`);
    }
})();
