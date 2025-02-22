// ==UserScript==
// @name         Capital Login
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://tradeweb.capital.com.tw/
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.capitalfund.com.tw/
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CapitalLogin.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CapitalLogin.user.js
// @connect      maxbot.dropboxlike.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==
// 個人參數
const ACCOUNT = "";
const PASSWORD = "";

// 系統參數
const CAPTCHA_API_URL = "http://maxbot.dropboxlike.com:16888/ocr";
const CAPTCHA_INPUT_SELECTOR = "#validateCode";
const CAPTCHA_IMAGE_SELECTOR = "#imgCode";
const CAPTCHA_REFRESH_SELECTOR = "#imgCode";
const SUBMIT_SELECTOR = "#login-btn";
let _captchaBase64 = "";
let _isLoaded = false;
let _isSubmit = false;

const alert = (function () {
    var alertContainer = document.createElement("div");
    alertContainer.style.position = "fixed";
    alertContainer.style.top = "6px";
    alertContainer.style.left = "6px";
    alertContainer.style.zIndex = "9999";
    alertContainer.style.pointerEvents = "none";
    document.body.appendChild(alertContainer);

    var messages = [];

    return function (str) {
        var message = document.createElement("div");
        message.style.background = "rgba(94, 39, 0, 0.7)";
        message.style.color = "white";
        message.style.padding = "4px";
        message.style.margin = "4px";
        message.style.borderRadius = "5px";
        message.style.pointerEvents = "auto";
        message.style.fontSize = "14px";
        message.innerText = str;

        alertContainer.appendChild(message);
        let currentTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
        messages.push(`${currentTime} ${message}`);

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
        }, 5000);
    };
})();

(function () {
    "use strict";

    if (ACCOUNT === "" || PASSWORD === "") {
        alert("請設定帳密");
        return;
    }

    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });

    function handleMutations(mutations) {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                console.log("Mutated");
                handleLogin();
                handleCaptcha();
            }
        });
    }

    function handleLogin() {
        const accountInput = document.querySelector("#account");
        if (accountInput) {
            accountInput.value = ACCOUNT;
        }

        const passwordInput = document.querySelector("#pass");
        if (passwordInput) {
            passwordInput.value = PASSWORD;
        }

        const loginBtn = document.querySelector(".login-btn");
        if (!_isLoaded && loginBtn) {
            _isLoaded = true;
            loginBtn.click();
        }
    }

    function handleCaptcha() {
        const captchaImage = document.querySelector(CAPTCHA_IMAGE_SELECTOR);
        if (!_isSubmit && captchaImage) {
            _isSubmit = true;
            _captchaBase64 = getCaptchaImage(captchaImage);
            if (_captchaBase64) {
                setCaptchaAndSubmit(_captchaBase64, "#Captcha");
            }
        }
    }

    function getCaptchaImage(element) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = element.naturalHeight;
        canvas.width = element.naturalWidth;
        context.drawImage(element, 0, 0);
        const img_data = canvas.toDataURL();
        return img_data ? img_data.split(",")[1] : "";
    }

    function setCaptchaAndSubmit(image_data) {
        alert("Start OCR");

        GM_xmlhttpRequest({
            method: "POST",
            url: CAPTCHA_API_URL,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ image_data: image_data }),
            onload: function (r) {
                alert(r.responseText);
                if (r.status == 200) {
                    let answer = JSON.parse(r.responseText).answer;
                    answer = answer.replace(/[gq]/g, "9");
                    if (answer && answer.match(/^\d{4}$/)) {
                        const captchaInput = document.querySelector(CAPTCHA_INPUT_SELECTOR);
                        if (captchaInput) {
                            captchaInput.value = answer;
                            const submitButton = document.querySelector(SUBMIT_SELECTOR);
                            if (submitButton) {
                                submitButton.click();
                            }
                        }
                    } else {
                        refreshCaptcha();
                    }
                } else {
                    console.error(" Fail", r.statusText + "|" + r.responseText);
                }
            },
            onerror: function (error) {
                console.error(" Error:", error);
            },
        });
    }

    function refreshCaptcha() {
        const imgCaptcha = document.querySelector(CAPTCHA_REFRESH_SELECTOR);
        if (imgCaptcha) {
            console.log("Refresh Captcha");
            imgCaptcha.click();

            const interval = setInterval(() => {
                const image_data = getCaptchaImage(document.querySelector(CAPTCHA_IMAGE_SELECTOR));
                if (image_data !== "" && _captchaBase64 && image_data !== _captchaBase64) {
                    clearInterval(interval);
                    setCaptchaAndSubmit(image_data);
                }
            }, 1000);
        }
    }
})();
