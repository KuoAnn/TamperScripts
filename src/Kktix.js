// ==UserScript==
// @name         kktix
// @namespace    http://tampermonkey.net/
// @version      1.25.525.1416
// @description  try to take over the world!
// @author       You
// @match        https://kktix.com/events/*/registrations/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kktix.com
// @grant        none
// ==/UserScript==

const config = {
    qty: 1,
    member_code: "VEZ9XJ",
};

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
            if (text.includes("暫無票券") || text.includes("已售完")) {
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
            observer.disconnect();
        });
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
            autoFillMemberCode();
        }
    }

    // 初始執行一次
    handlePage();

    observer.observe(document.body, { childList: true, subtree: true });
})();
