// ==UserScript==
// @name         Eyny
// @namespace    https://*.eyny.com/*
// @version      1.0.2
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://*.eyny.com/*
// @match        https://*.eyny.com/member.php?mod=logging*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=16&domain=www.eyny.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js
// ==/UserScript==
const user = "";
const pswd = "";

(function () {
    "use strict";

    if (user === "" || pswd === "") {
        alert("請設定帳密");
        return;
    }

    if (document.getElementsByName("submit").length > 0 && document.getElementsByName("submit")[0].value.indexOf("Yes, I am.") > -1) {
        document.getElementsByName("submit")[0].click();
    }

    if (window.location.href.indexOf("member.php?mod=logging") > 0) {
        waitForElement('form[name="login"]', fillForm);
    }

    function fillForm() {
        let usernameField = document.querySelector('input[name="username"]');
        if (usernameField) usernameField.value = user;

        let passwordField = document.querySelector('input[type="password"]');
        if (passwordField) passwordField.value = pswd;

        let securityQuestionSelect = document.querySelector('select[name="questionid"]');
        if (securityQuestionSelect) {
            securityQuestionSelect.value = "1"; // "1" corresponds to "母親的名字"

            let event = new Event("change");
            securityQuestionSelect.dispatchEvent(event);
        }

        setTimeout(() => {
            let answerField = document.querySelector('input[name="answer"]');
            if (answerField) {
                answerField.value = "123";

                let loginButton = document.querySelector('button[name="loginsubmit"]');
                if (loginButton) loginButton.click();
            }
        }, 1000); // Wait for 1000ms to ensure the field has appeared
    }

    function waitForElement(selector, callback) {
        if (document.querySelector(selector)) {
            callback();
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }
})();
