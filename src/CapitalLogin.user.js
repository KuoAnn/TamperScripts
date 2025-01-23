// ==UserScript==
// @name         Capital Login
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://tradeweb.capital.com.tw/
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.capitalfund.com.tw/
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CapitalLogin.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CapitalLogin.user.js
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

(function () {
    "use strict";

    if (ACCOUNT === "" || PASSWORD === "") {
        alert("請設定帳密");
        return;
    }

    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                console.log("Mutated");

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

                const captchaImage = document.querySelector(CAPTCHA_IMAGE_SELECTOR);
                if (!_isSubmit && captchaImage) {
                    _isSubmit = true;

                    if (captchaImage) {
                        _captchaBase64 = getCaptchaImage(captchaImage);
                        if (_captchaBase64) {
                            setCaptchaAndSubmit(_captchaBase64, "#Captcha");
                        }
                    }
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function getCaptchaImage() {
        const element = document.querySelector(CAPTCHA_IMAGE_SELECTOR);
        if (element) {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = element.naturalHeight;
            canvas.width = element.naturalWidth;
            context.drawImage(element, 0, 0);
            const img_data = canvas.toDataURL();
            return img_data ? img_data.split(",")[1] : "";
        }
        return "";
    }

    function setCaptchaAndSubmit(image_data) {
        GM_xmlhttpRequest({
            method: "POST",
            url: CAPTCHA_API_URL,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ image_data: image_data }),
            onload: function (r) {
                console.log(r.responseText);
                if (r.status == 200) {
                    let answer = JSON.parse(r.responseText).answer;
                    // auto guess
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
                const image_data = getCaptchaImage();
                if (image_data !== "" && _captchaBase64 && image_data !== _captchaBase64) {
                    clearInterval(interval);
                    setCaptchaAndSubmit(image_data);
                }
            }, 1000);
        }
    }
})();
