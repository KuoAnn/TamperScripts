// ==UserScript==
// @name         Cathay card event register
// @namespace    https://www.cathaybk.com.tw/promotion/CreditCard/Event
// @version      1.0.6
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://www.cathaybk.com.tw/promotion*
// @connect      maxbot.dropboxlike.com
// @icon         https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayCardEvent.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayCardEvent.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_addElement
// ==/UserScript==

GM_addStyle(`
  .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}
  .alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}
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

// 個人參數
const USER_ID_KEY = "userId";
const USER_BIRTH_KEY = "userBirth";

// 系統參數
const CAPTCHA_API_URL = "http://maxbot.dropboxlike.com:16888/ocr";
const CAPTCHA_INPUT_SELECTOR = "#Captcha";
const CAPTCHA_IMAGE_SELECTOR = "#captchaIcon";
const CAPTCHA_REFRESH_SELECTOR = "#captcha-refresh";
const SUBMIT_SELECTOR = "input[type='submit']";
let _captchaBase64 = "";
let _isLoaded = false;

(function () {
    "use strict";

    const getUserData = (key, promptMessage) => {
        let value = localStorage.getItem(key);
        if (value == null) {
            value = prompt(promptMessage);
            while (!value) {
                value = prompt(promptMessage);
            }
            localStorage.setItem(key, value);
        }
        return value;
    };

    const USER_ID = getUserData(USER_ID_KEY, "身分證字號:");
    const USER_BIRTH = getUserData(USER_BIRTH_KEY, "生日 (YYYYMMDD):");
    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                console.log("Mutated");

                const captchaImage = document.querySelector(CAPTCHA_IMAGE_SELECTOR);
                if (!_isLoaded && captchaImage) {
                    _isLoaded = true;

                    const idInput = document.querySelector(".input-element#ID");
                    if (idInput) {
                        idInput.value = USER_ID;
                    }

                    const birthInput = document.querySelector(".input-element#BirthDate");
                    if (birthInput) {
                        birthInput.value = USER_BIRTH;
                    }

                    const checkAgree = document.querySelector(".checkbox#CheckAgreement");
                    if (checkAgree) {
                        checkAgree.checked = true;
                    }

                    if (captchaImage) {
                        _captchaBase64 = getCaptchaImage(captchaImage);
                        if (_captchaBase64) {
                            setCaptchaAndSubmit(_captchaBase64, "#Captcha");
                        }
                    }
                }

                const registerBtns = document.querySelectorAll(".btn.btn-sign");
                if (!_isLoaded && registerBtns.length > 0) {
                    _isLoaded = true;
                    console.log("Register Loaded");
                    registerBtns.forEach((btn) => {
                        var cid = btn.getAttribute("data-campaign-id");
                        if (cid) {
                            try {
                                btn.click();

                                var title = btn.closest(".tr").querySelector(".td.wtitle a").textContent.replace("\r\n", "").trim();
                                alert("註冊 " + title);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                }
            }
        });

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

        const attack = function (campaignId) {
            if (campaignId) {
                alert(`Attack ${campaignId}`);
                const form = $("#form-hidden");
                const token = form.find('input[name="__RequestVerificationToken"]').val();

                $.ajax({
                    url: form[0].action,
                    type: form[0].method,
                    cache: false,
                    data: `CampaignId=${campaignId}&__RequestVerificationToken=${token}`,
                    dataType: "json",
                    success: function (response) {
                        if (response) {
                            alert(response.signResultText);

                            if (response.signResult > 1) {
                                // re-attack
                                attack(campaignId);
                            }

                            switch (response.signResult) {
                                case 0:
                                case 1:
                                    alert(`<h1 style='color:green'>SUCCESS! SN=${response.signUpNumber}</h1>`);
                                    break;
                                case 9001:
                                    alert("Full");
                                    break;
                                case 9998:
                                    alert("Rush Hour");
                                    break;
                                case 9999:
                                    alert("Busy");
                                    break;
                                default:
                                    alert("Unknown result");
                            }
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401) {
                            alert("error: xhr=401");
                        } else if (IsHotTime) {
                            alert("error: Rush Hour");
                        } else {
                            alert("error: Busy");
                        }
                    },
                });
            }
        };
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
