// ==UserScript==
// @name         kktix
// @namespace    http://tampermonkey.net/
// @version      2025-05-25
// @description  try to take over the world!
// @author       You
// @match        https://kktix.com/events/*/registrations/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kktix.com
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    function cleanUp() {
        document.querySelectorAll(".img-wrapper, .footer, .img-wrapper").forEach((el) => el.remove());

        // 找出具有 .register-status 但沒有 .hide 的元素
        const visibleRegisterStatusEls = Array.from(document.querySelectorAll(".register-status")).filter((el) => !el.classList.contains("hide"));
        // 檢查這些元素是否有包含指定 class
        const targetClasses = ["register-status-OUT_OF_STOCK", "register-status-REGISTRATION_CLOSED", "register-status-CLOSED"];
        const shouldRefresh = visibleRegisterStatusEls.some((el) => targetClasses.some((cls) => el.classList.contains(cls)));
        if (shouldRefresh) {
            console.log("Detected registration status that requires a refresh.");
            setTimeout(() => location.reload(), 200);
        }

        document.querySelectorAll(".ticket-unit").forEach((row) => {
            const text = row.textContent;
            if (text.includes("暫無票券") || text.includes("已售完")) row.remove();
        });
        if (document.querySelectorAll(".ticket-unit").length === 0) {
            //setTimeout(() => location.reload(), 200);
        }

        // 自動勾選同意條款 checkbox，改用 click 以支援 Angular
        var agreeTerms = document.getElementById("person_agree_terms");
        if (agreeTerms && !agreeTerms.checked) {
            agreeTerms.click();
        }
    }

    // 初始執行一次
    cleanUp();

    // 當畫面發生變更時自動執行
    var observer = new MutationObserver(function (mutationsList, observer) {
        console.log("Mutation detected, cleaning up...");
        cleanUp();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
