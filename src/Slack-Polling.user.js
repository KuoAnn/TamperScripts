// ==UserScript==
// @name         Slack pulling
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  try to take over the world!
// @author       KuoAnn
// @match        https://app.slack.com/client/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=slack.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Slack-Polling.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Slack-Polling.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setInterval(function () {
        var x = document.getElementsByClassName("p-message_pane__degraded_banner__reload_cta");
        if (x.length > 0) {
            console.log('pulling...')
            x[0].click();
        }
    }, 35000)
})();