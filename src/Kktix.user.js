// ==UserScript==
// @name         kktix
// @namespace    http://tampermonkey.net/
// @version      1.25.527.1318
// @description  try to take over the world!
// @author       You
// @match        https://kktix.com/events/*/registrations/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kktix.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @grant        none
// ==/UserScript==

const config = {
    keyword: ["1700"],
    qty: 1,
    member_code: "VEZ9XJ",
};
let step = 0;

(function () {
    "use strict";

    const observer = new MutationObserver(() => {
        console.log("偵測到 DOM 變更");
        handlePage();
    });

    function shouldAutoRefresh(statusElements) {
        const refreshClasses = ["register-status-OUT_OF_STOCK", "register-status-REGISTRATION_CLOSED", "register-status-CLOSED"];
        return statusElements.some((el) => refreshClasses.some((cls) => el.classList.contains(cls)));
    }

    function clearPage() {
        document.querySelectorAll(".img-wrapper, .footer").forEach((el) => el.remove());
    }

    function clearTicketUnits() {
        document.querySelectorAll(".ticket-unit").forEach((row) => {
            const text = row.textContent;
            if (text.includes("暫無票券") || text.includes("已售完") || text.includes("輪椅席")) {
                row.remove();
            }
            const match = text.match(/剩\s*(\d+)\s*張/);
            if (match) {
                const remain = parseInt(match[1], 10);
                if (remain > 0 && remain < config.qty) {
                    row.remove();
                }
            }
        });
    }

    function autoCheckAgreeTerms() {
        const agreeTerms = document.getElementById("person_agree_terms");
        if (agreeTerms && !agreeTerms.checked) {
            agreeTerms.click();
        }
    }

    function autoFillMemberCode() {
        document.querySelectorAll("input[type='text'][ng-if=\"oq.type == 'member_code'\"]").forEach((input) => {
            console.log("填入會員代碼:", config.member_code);
            input.value = config.member_code;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }

    function selectTicketByKeyword() {
        const keywords = config.keyword;
        const qty = config.qty;
        const ticketUnits = Array.from(document.querySelectorAll(".ticket-unit"));
        // 將 ticket-unit 文字內容做前處理（去除逗號、去除多餘空白）
        const getText = (el) => el.textContent.replace(/,/g, "").replace(/\s+/g, " ").trim();
        // 依序比對每個 keyword
        let matchedUnits = [];
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i].trim();
            if (keyword === "") {
                matchedUnits = ticketUnits;
            } else {
                const andWords = keyword.split(" ").filter(Boolean);
                matchedUnits = ticketUnits.filter((el) => {
                    const text = getText(el);
                    return andWords.every((word) => text.includes(word));
                });
            }
            if (matchedUnits.length > 0) break;
        }
        if (matchedUnits.length === 0) return;
        // 隨機選一個
        const selected = matchedUnits[Math.floor(Math.random() * matchedUnits.length)];
        // 標記背景色
        selected.style.backgroundColor = "yellow";
        // 找到 input 並填入數量
        const input = selected.querySelector("input[type='text'][ng-model='ticketModel.quantity']");
        if (input) {
            // 觸發所有 Angular 事件
            input.value = qty;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("blur", { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "0" }));
            input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "0" }));
        }
    }

    function checkAndClickNext() {
        // 檢查是否有任一票券已填寫數量
        const qtyInputs = document.querySelectorAll("input[type='text'][ng-model='ticketModel.quantity']");
        const qtyFilled = Array.from(qtyInputs).some(input => Number(input.value) > 0);
        // 檢查會員代碼（如有 input）
        const memberInput = document.querySelector("input[type='text'][ng-if=\"oq.type == 'member_code'\"]");
        const memberFilled = !memberInput || (memberInput.value && memberInput.value.trim() !== "");
        // 檢查同意條款
        const agreeTerms = document.getElementById("person_agree_terms");
        const agreeChecked = agreeTerms && agreeTerms.checked;
        if (qtyFilled && memberFilled && agreeChecked) {
            const nextBtn = document.querySelector(".register-new-next-button-area button.btn-primary");
            if (nextBtn && !nextBtn.disabled) {
                setTimeout(() => {
                    nextBtn.click();
                    console.log("已自動點擊下一步");
                }, 200);
            }
        }
    }

    function handlePage() {
        const statusElements = Array.from(document.querySelectorAll(".register-status")).filter((el) => !el.classList.contains("hide"));

        if (shouldAutoRefresh(statusElements)) {
            console.log("不給買，將自動重新整理頁面");
            setTimeout(() => location.reload(), 200);
            return;
        }

        clearPage();
        const inStock = statusElements.some((el) => el.classList.contains("register-status-IN_STOCK"));
        if (inStock) {
            clearTicketUnits();

            if (document.querySelectorAll(".ticket-unit").length === 0) {
                console.log("所有票券均不符合條件，將自動重新整理頁面");
                setTimeout(() => location.reload(), 200);
                return;
            }

            autoCheckAgreeTerms();
            observer.disconnect();

            if (step === 0) {
                step = 1;
                console.log("第一步：選擇票券");
                selectTicketByKeyword();
            }
            autoFillMemberCode();
            checkAndClickNext();
        }
    }

    // 初始執行一次
    handlePage();

    observer.observe(document.body, { childList: true, subtree: true });
})();
