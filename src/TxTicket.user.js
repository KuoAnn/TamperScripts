// ==UserScript==
// @name         TxTicket
// @namespace    http://tampermonkey.net/
// @version      1.0.7
// @description  強化UI/勾選同意條款/銀行辨識/選取購票/點選立即購票/選擇付款方式/alt+↓=切換日期/Enter送出/關閉提醒/移除廣告/執行倒數
// @author       KuoAnn
// @match        https://tixcraft.com/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=tixcraft.com
// @connect      *
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==
// 個人參數
const BUY_DATE_INDEXS = [-1]; // 場次優先順序：1=第一場 2=第二場... 負數=隨機 (搶票瞬間因無法確認售完，基本上就是選第一順位)
const BUY_AREA_GROUPS = ["", "", ""]; // 座位群組(通常是價位)：""=全部 (座位會被鎖定在此群內；安全機制：若查無群組則預設全選)
const BUY_AREA_SEATS = [""]; // 座位優先順序；""=隨機 空白分隔=AND邏輯 (需注意是否和座位群組互斥)
const BUY_COUNT = 2; // 購買張數，若無則選擇最大值
const PAY_TYPE = "A"; // 付款方式：A=ATM, C=信用卡
const EXECUTE_TIME = "2024/10/10 23:31:30"; // 啟動時間：yyyy/MM/dd HH:mm:ss，"" OR 重整頁面=立即執行

// 系統參數(勿動)
let _isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
let _countdownInterval = null;
let _isSetConsole = false;
let _session = "";
let _isSelectArea = false;
let _isSelect2Button = false;
let _isClickBuyTicket = false;
let _isOcr = false;
let _isClickPayType = false;
let _isSubmit = false;
let _isListenOrder = false;
let _isGetCaptcha = false;

// 取得當前網址
const triggerUrl = window.location.href;
if (triggerUrl.includes("activity/detail/")) {
    _session = "d";
} else if (triggerUrl.includes("activity/game/")) {
    _session = "g";
} else if (triggerUrl.includes("ticket/verify/")) {
    _session = "v";
} else if (triggerUrl.includes("ticket/area/")) {
    _session = "a";
} else if (triggerUrl.includes("ticket/ticket/")) {
    _session = "t";
} else if (triggerUrl.includes("ticket/checkout/")) {
    _session = "c";
}

(function () {
    ("use strict");
    const observer = new MutationObserver((mo) => {
        mo.forEach((mutation) => {
            if (mutation.type === "childList") {
                if (_session != "d" && _session != "g") {
                    observer.disconnect();
                }

                // 自動模式提示
                SetConsole();

                // 預啟動 OCR 服務
                Preheat_ocr();

                const ad = document.getElementById("ad-footer");
                if (ad) {
                    ad.remove();
                }

                // 自動關閉提醒
                const closeAlert = document.querySelector("button.close-alert");
                if (closeAlert) {
                    closeAlert.click();
                }

                switch (_session) {
                    case "d":
                    case "g":
                        // 活動頁
                        // 點選立即購票
                        const buyTicket = document.querySelector('a[href^="/activity/game/"]');
                        if (buyTicket && !_isClickBuyTicket) {
                            _isClickBuyTicket = true;
                            buyTicket.click();
                        }

                        if (_isAutoMode) {
                            const gameList = document.querySelector("#gameList table tbody");
                            if (gameList && !_isSubmit && !_isListenOrder) {
                                _isListenOrder = true;
                                const listenInterval = setInterval(() => {
                                    console.log("interval");
                                    const updatedGameList = document.querySelector("#gameList table tbody");
                                    if (updatedGameList) {
                                        const isOrderSuccessful = goOrder(updatedGameList);
                                        const isAutoModeEnabled = localStorage.getItem("autoMode") === "1";
                                        if (isOrderSuccessful || !isAutoModeEnabled) {
                                            clearInterval(listenInterval);
                                        } else {
                                            console.log("重新點選立即購票");
                                            buyTicket.click();
                                        }
                                    }
                                }, 400);
                            }
                        }

                        break;
                    case "v":
                        // 輸入驗證碼：
                        const promoDesc = document.querySelector(".promo-desc");

                        function setCheckCodeAndSubmit(code) {
                            const checkCodeInput = document.querySelector(".greyInput[name=checkCode]");
                            if (checkCodeInput) {
                                checkCodeInput.value = code;
                                autoSubmit();
                            }
                        }

                        if (promoDesc) {
                            const textContent = promoDesc.textContent;
                            if (textContent.includes("國泰世華") && textContent.includes("卡號前8碼")) {
                                setCheckCodeAndSubmit("40637634");
                            } else if (textContent.includes("中國信託") && textContent.includes("卡號前6碼")) {
                                setCheckCodeAndSubmit("431195");
                            }
                        }
                        break;
                    case "a":
                        // 自動選位
                        if (_isAutoMode && !_isSelectArea) {
                            _isSelectArea = true;
                            const isOk = selectArea();
                            if (!isOk) {
                                setTimeout(() => {
                                    window.location.reload();
                                }, 100);
                            }
                        }
                        // 選單按鈕化
                        select2Button();
                        // 隱藏已售完
                        removeSoldOut();
                        break;
                    case "t":
                        // 確認訂單
                        agreeToTerms();
                        selectTicketQuantity();
                        handleCaptchaInput();

                        // 勾選同意條款
                        function agreeToTerms() {
                            const ticketAgree = document.getElementById("TicketForm_agree");
                            if (ticketAgree) {
                                ticketAgree.checked = true;
                            }
                        }

                        // 選取購票張數
                        function selectTicketQuantity() {
                            const ticketPrice = document.querySelector('[id^="TicketForm_ticketPrice_"]');
                            if (ticketPrice) {
                                const options = ticketPrice.querySelectorAll("option");
                                const hasBuyCount = Array.from(options).some((o) => o.value == BUY_COUNT);
                                ticketPrice.value = hasBuyCount ? BUY_COUNT : options[options.length - 1].value;
                            }
                        }

                        // 輸入圖形驗證碼
                        function handleCaptchaInput() {
                            const captchaInput = document.getElementById("TicketForm_verifyCode");
                            if (captchaInput) {
                                if (_isAutoMode && !_isOcr) {
                                    _isOcr = true;
                                    setCaptcha();
                                }

                                captchaInput.focus();
                                captchaInput.addEventListener("input", (e) => {
                                    if (e.target.value.length == 4) {
                                        autoSubmit();
                                    }
                                });
                            }
                        }
                        break;
                    case "c":
                        // 付款
                        function selectPaymentMethod(elementId) {
                            const paymentRadio = document.getElementById(elementId);
                            if (!_isClickPayType && paymentRadio) {
                                _isClickPayType = true;
                                paymentRadio.click();
                            }
                        }

                        if (PAY_TYPE == "A") {
                            // 選擇 ATM 付款
                            selectPaymentMethod("CheckoutForm_paymentId_54");
                        } else if (PAY_TYPE == "C") {
                            // 選擇信用卡付款
                            selectPaymentMethod("CheckoutForm_paymentId_36");
                        }
                        break;
                }

                // 共用優化 UI
                largerSubmit();
            }
        });

        function select2Button() {
            const select = document.querySelector("#gameId");
            if (select && !_isSelect2Button) {
                _isSelect2Button = true;
                const title = document.querySelector(".activityT.title");
                if (title) {
                    title.style.display = "none";
                }

                const fragment = document.createDocumentFragment();
                const selectOptions = select.querySelectorAll("option");

                selectOptions.forEach((option) => {
                    const b = document.createElement("button");
                    const dateText = option.textContent.match(/\d{4}\/\d{2}\/\d{2} \(\S+\)/);
                    b.textContent = dateText ? dateText[0] : option.textContent;
                    b.onclick = () => {
                        select.value = option.value;
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                    };
                    setButtonStyle(b, option.selected);
                    fragment.appendChild(b);
                });

                select.before(fragment);
            }

            function setButtonStyle(button, isSelected) {
                button.style.padding = "2px 6px";
                button.style.margin = "2px";
                button.style.border = "1px solid #ccc";
                if (isSelected) {
                    button.style.backgroundColor = "#007bff";
                    button.style.color = "#fff";
                }
            }
        }

        function selectArea() {
            const groups = document.querySelectorAll(".zone-label");
            const selectedGroups = getSelectedGroups(groups);

            if (selectedGroups.length > 0) {
                for (const groupId of selectedGroups) {
                    const areaElements = document.querySelectorAll(`#${groupId} li a`);
                    console.log(groupId, areaElements);
                    if (selectAreaSeat(areaElements)) return true;
                }
                return false;
            } else {
                return selectAreaSeat(document.querySelectorAll(".area-list li a"));
            }

            function getSelectedGroups(groups) {
                const selectedGroups = [];
                if (groups.length > 0 && BUY_AREA_GROUPS.length > 0 && BUY_AREA_GROUPS[0] !== "") {
                    BUY_AREA_GROUPS.forEach((buyGroup) => {
                        groups.forEach((group) => {
                            if (group.textContent.includes(buyGroup)) {
                                const dataId = group.getAttribute("data-id");
                                if (dataId) selectedGroups.push(dataId);
                            }
                        });
                    });
                }
                return selectedGroups;
            }

            function selectAreaSeat(elements) {
                if (elements.length > 0) {
                    const randomElements = Array.from(elements).sort(() => Math.random() - 0.5);

                    for (const seat of BUY_AREA_SEATS) {
                        if (_isSubmit) break;

                        const buyAreaKeys = seat.split(" ");
                        for (const element of randomElements) {
                            if (isExcluded(element)) continue;

                            const isAllMatch = buyAreaKeys.every((key) => element.textContent.includes(key));
                            if (!_isSubmit && isAllMatch) {
                                _isSubmit = true;
                                console.log("pick", element.textContent);
                                element.click();
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            function isExcluded(element) {
                const text = element.textContent;
                const excludeKeywords = ["輪椅", "身障", "障礙", "Restricted", "遮蔽", "視線不完整"];
                if (excludeKeywords.some((keyword) => text.includes(keyword))) {
                    return true;
                }

                const remainFont = element.querySelector("font");
                if (remainFont) {
                    const remainCount = parseInt(remainFont.textContent.replace("剩餘 ", ""), 10);
                    if (remainCount < BUY_COUNT) {
                        return true;
                    }
                }

                return false;
            }
        }

        function goOrder(gameList) {
            if (!gameList) return false;

            const gameRows = gameList.querySelectorAll("tr");

            const clickRandomGameButton = () => {
                const gameButtons = gameList.querySelectorAll("button");
                if (gameButtons.length > 0) {
                    const randomIndex = Math.floor(Math.random() * gameButtons.length);
                    gameButtons[randomIndex].click();
                    return true;
                }
                return false;
            };

            for (const index of BUY_DATE_INDEXS.map((i) => i - 1)) {
                if (index >= gameRows.length || index < 0) {
                    return clickRandomGameButton();
                }

                const gameButton = gameRows[index]?.querySelector("button");
                if (gameButton && !_isSubmit) {
                    _isSubmit = true;
                    gameButton.click();
                    return true;
                }
            }

            return false;
        }

        function Preheat_ocr() {
            // 檢查前次發動時間
            const lastTime = localStorage.getItem("triggerOcrTime");
            const now = Date.now();
            if (lastTime && now - parseInt(lastTime, 10) < 10 * 60 * 1000) {
                console.log("Preheat_ocr...skip");
                return;
            }
            localStorage.setItem("triggerOcrTime", now.toString());

            // captcha=piqi
            const image_data =
                "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";

            try {
                _isGetCaptcha = false;
                getCaptcha("https://asia-east1-futureminer.cloudfunctions.net/ocr", image_data);

                console.log("Preheat_ocr");
            } catch (error) {
                console.error("Error:", error);
            }
        }

        function get_ocr_image() {
            const img = document.querySelector("#TicketForm_verifyCode-image");
            if (img) {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                context.drawImage(img, 0, 0);
                const img_data = canvas.toDataURL();
                return img_data ? img_data.split(",")[1] : "";
            }
            return "";
        }

        function setCaptcha() {
            const image_data = get_ocr_image();
            if (image_data) {
                try {
                    _isGetCaptcha = false;
                    getCaptcha("https://asia-east1-futureminer.cloudfunctions.net/ocr", image_data);
                } catch (error) {
                    console.error("Error:", error);
                }
            }
        }

        function getCaptcha(url, image_data) {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                headers: {
                    "Content-Type": "application/json",
                },
                data: JSON.stringify({ image_data }),
                onload: function (r) {
                    console.log(url, r.responseText);
                    _isOcr = false;
                    if (r.status == 200) {
                        const answer = JSON.parse(r.responseText).answer;
                        if (answer.length == 4) {
                            if (!_isGetCaptcha) {
                                _isGetCaptcha = true;
                                console.log(url + " return " + answer);
                                const verifyCodeInput = document.getElementById("TicketForm_verifyCode");
                                if (verifyCodeInput) {
                                    verifyCodeInput.value = answer;
                                    autoSubmit();
                                }
                            } else {
                                console.log(url + " unuse " + answer);
                            }
                        } else if (!_isGetCaptcha) {
                            _isGetCaptcha = true;
                            console.log(url + " retry");
                            refreshCaptcha(url);
                        }
                    } else {
                        console.error(url + " Fail", r.statusText + "|" + r.responseText);
                    }
                },
                onerror: function (error) {
                    console.error(url + " Error:", error);
                },
            });
        }

        function refreshCaptcha(url) {
            const imgCaptcha = document.getElementById("TicketForm_verifyCode-image");
            if (imgCaptcha) {
                imgCaptcha.click();
                const src = imgCaptcha.src;
                console.log("src", src);
                const interval = setInterval(() => {
                    if (src != imgCaptcha.src) {
                        console.log("src changed", imgCaptcha.src);
                        const image_data = get_ocr_image();
                        if (image_data) {
                            clearInterval(interval);
                            _isGetCaptcha = false;
                            getCaptcha(url, image_data);
                        } else {
                            console.log("image_data is empty");
                        }
                    }
                }, 100);
            }
        }

        function largerSubmit() {
            const submit = document.querySelector("button[type=submit],#submitButton");
            if (submit) {
                Object.assign(submit.style, {
                    fontSize: "24px",
                    height: "100px",
                    width: "100%",
                    margin: "4px",
                });

                const submitParent = submit.parentNode;
                if (submitParent) {
                    submitParent.prepend(submit);
                }
            }
        }

        function removeSoldOut() {
            document.querySelectorAll("li").forEach((li) => {
                if (li.textContent.includes("已售完")) {
                    li.remove();
                }
            });
        }

        function SetConsole() {
            if (_isSetConsole) {
                return;
            }
            _isSetConsole = true;
            const isLogin = !!document.querySelector(".user-name");

            const divConsole = createConsoleElement();
            setDivConsoleText(divConsole, _isAutoMode, isLogin);

            divConsole.addEventListener("click", () => {
                let isAutoMode = (localStorage.getItem("autoMode") || 0) == 1;
                localStorage.setItem("autoMode", isAutoMode ? 0 : 1);
                setDivConsoleText(divConsole, isAutoMode, isLogin, true);
            });

            function createConsoleElement() {
                const div = document.createElement("div");
                document.body.appendChild(div);
                div.id = "divConsole";
                Object.assign(div.style, {
                    position: "fixed",
                    top: "0",
                    left: "0",
                    padding: "10px",
                    textAlign: "center",
                    zIndex: "9999",
                    color: "white",
                    cursor: "pointer",
                });
                return div;
            }

            function countdown() {
                console.log("countdown:", EXECUTE_TIME);
                const now = new Date();
                const executeDate = new Date(EXECUTE_TIME);
                let diff = executeDate - now;
                if (diff > 0) {
                    let seconds = Math.floor(diff / 1000);
                    _countdownInterval = setInterval(() => {
                        seconds--;
                        if (seconds <= 0) {
                            clearInterval(_countdownInterval);
                            window.location.reload(true);
                        } else {
                            divConsole.textContent = `🤖 ${seconds} 秒`;
                        }
                    }, 1000);
                } else {
                    window.location.reload(true);
                }
            }

            function setDivConsoleText(divConsole, isAutoMode, isLogin, isToggle = false) {
                console.log("isAutoMode=" + isAutoMode, "isToggle=" + isToggle);
                if (isToggle) {
                    isAutoMode = !isAutoMode;
                }
                if (isAutoMode) {
                    divConsole.style.backgroundColor = "green";
                    if (isLogin) {
                        divConsole.textContent = "🤖";
                        if (isToggle) {
                            if (EXECUTE_TIME && EXECUTE_TIME.length > 0) {
                                countdown();
                            } else {
                                window.location.reload(true);
                            }
                        }
                    } else {
                        divConsole.textContent = "🤖 未登入";
                        if (isToggle) {
                            const loginBtn = document.querySelector(".account-login a");
                            if (loginBtn) {
                                loginBtn.click();
                            }
                        }
                    }
                } else {
                    divConsole.style.backgroundColor = "red";
                    divConsole.textContent = !isLogin ? "💪 未登入" : "💪";
                    if (isToggle && _countdownInterval != null) {
                        clearInterval(_countdownInterval);
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            autoSubmit();
        }
    });
})();

function autoSubmit() {
    const submit = document.querySelector("button[type=submit],#submitButton");
    if (submit && !_isSubmit) {
        _isSubmit = true;
        submit.click();
    }
}
