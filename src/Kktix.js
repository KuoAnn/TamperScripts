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
    ("use strict");

    // 當畫面發生變更時自動執行
    var observer = new MutationObserver(function () {
        console.log("Mutated");
        execute();
    });

    function execute() {
        document.querySelectorAll(".img-wrapper, .footer, .img-wrapper").forEach((el) => el.remove());

        // 找出具有 .register-status 但沒有 .hide 的元素
        const visibleRegisterStatusEls = Array.from(document.querySelectorAll(".register-status")).filter((el) => !el.classList.contains("hide"));
        // 檢查這些元素是否有包含指定 class
        const targetClasses = ["register-status-OUT_OF_STOCK", "register-status-REGISTRATION_CLOSED", "register-status-CLOSED"];
        const shouldRefresh = visibleRegisterStatusEls.some((el) => targetClasses.some((cls) => el.classList.contains(cls)));
        if (shouldRefresh) {
            console.log("偵測到需重整的報名狀態，將自動重整頁面");
            setTimeout(() => location.reload(), 200);
            return;
        }

        const ticketUnits = visibleRegisterStatusEls.filter((el) => el.classList.contains("register-status-IN_STOCK"));
        if (ticketUnits.length > 0) {
            document.querySelectorAll(".ticket-unit").forEach((row) => {
                const text = row.textContent;
                if (text.includes("暫無票券") || text.includes("已售完")) row.remove();
                const match = text.match(/剩\s*(\d+)\s*張/);
                if (match) {
                    const remain = parseInt(match[1], 10);
                    if (remain > 0 && remain < config.qty) {
                        row.remove();
                    }
                }
            });
            if (document.querySelectorAll(".ticket-unit").length === 0) {
                console.log("所有票券均不符合條件，將自動重整頁面");
                setTimeout(() => location.reload(), 200);
                return;
            }

            // 自動勾選同意條款
            var agreeTerms = document.getElementById("person_agree_terms");
            if (agreeTerms && !agreeTerms.checked) {
                agreeTerms.click();
            }

            // 自動填入會員代碼
            document.querySelectorAll("input[type='text'][ng-if=\"oq.type == 'member_code'\"]").forEach(function (input) {
                console.log("填入會員代碼:", config.member_code);
                input.value = config.member_code;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                observer.disconnect();
            });
        }
    }

    // 初始執行一次
    execute();

    observer.observe(document.body, { childList: true, subtree: true });
})();
