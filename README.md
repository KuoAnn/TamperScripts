# Tamperscripts

## How to use

1. 安裝 Tampermonkey 擴充套件：
   - 請依據您的瀏覽器選擇下方官方商店連結安裝。

    | Google<br>Chrome | Microsoft<br>Edge | Mozilla<br>Firefox | Apple<br>Safari |
    | --- | --- | --- | --- |
    | <a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149382-8ffa83d5-8561-4dc9-929f-96cde2f6ed43.png" alt="Chrome" style="width:48px"></a> | <a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-TW" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149387-9e173b2c-b5f1-40bf-bdaf-c2f0d2bb5a6d.png" alt="Edge" style="width:48px"></a> | <a href="https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149390-50010c13-e3c8-4dc9-a120-e267fbcc1e73.png" alt="Firefox" style="width:48px"></a> | <a href="https://apps.apple.com/us/app/tampermonkey/id1482490089" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149393-374714eb-0d9e-4fe3-88d0-8195382cfe42.png" alt="Safari" style="width:48px"></a>|

2. 開啟開發人員模式（如遇安裝權限問題或需安裝本地腳本）
   - Google Chrome / Microsoft Edge：
     1. 在瀏覽器網址列輸入 `chrome://extensions` 或 `edge://extensions` 並進入擴充功能頁面。
     2. 右上角開啟「開發人員模式」開關。
     3. 若需安裝本地腳本，可將 `.user.js` 檔案拖曳至此頁面。
   - Mozilla Firefox：
     1. 在網址列輸入 `about:addons` 進入附加元件管理頁。
     2. 點選右上「齒輪」圖示，選擇「安裝附加元件」或「偵錯附加元件」以進行進階操作。
   - Apple Safari：
     1. 於 Safari 偏好設定中啟用「開發」選單。
     2. 進入「開發」選單可進行進階擴充功能管理。
   - 若遇到「允許使用者腳本」或「Developer Mode」選項，請依提示啟用，以確保 Tampermonkey 能正常安裝與執行 userscript。

3. 安裝 Userscript：
   - 點擊下方「安裝圖示」或 `.user.js` 連結，瀏覽器會自動啟動 Tampermonkey 安裝頁面，點選「Install」即可完成。
   - 若遇到安裝提示未跳出，請確認 Tampermonkey 已啟用，或手動複製腳本內容至 Tampermonkey Dashboard 新增腳本。

    ![Tampermonkey Userscript installation](https://user-images.githubusercontent.com/88981/125022420-3baca180-e0af-11eb-9d37-7abad8bf96fa.jpg)

4. 管理 Userscript：
   - 點擊瀏覽器右上 Tampermonkey 圖示，選擇「Dashboard」可查看所有已安裝腳本。
   - 可在 Dashboard 編輯、啟用/停用、移除腳本，或設定腳本執行條件。
   - 支援腳本同步、匯入/匯出、標籤分類等進階功能。

5. 疑難排解與進階設定：
   - 若遇到腳本無法執行、安裝失敗、權限問題，請參考官方 FAQ 或 Documentation。
   - 進階用戶可於 Dashboard 設定同步、匯入/匯出、標籤分類等功能。

- 官方文件：[Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- 常見問題：[Tampermonkey FAQ](https://www.tampermonkey.net/faq.php)

## Install

| Install | Name | Memo |
| --- | --- | --- |
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Baozi" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=twmanga.com" alt="icon" width="16"/> Baozi|包子漫畫鍵盤操作|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CapitalLogin.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Capital Login" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.capitalfund.com.tw/" alt="icon" width="16"/> Capital Login|群益自動登入|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayCardEvent.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Card Event" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk" alt="icon" width="16"/> Cathay Card Event|國泰卡片活動登錄|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayLearn.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Learn" width="32"/></a>| <img src="https://www.cathaysec.com.tw/cathaysec/assets/img/home/news_icon_csc.png" alt="icon" width="16"/> Cathay Learn|國泰自我學習網|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Wifi" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk" alt="icon" width="16"/> Cathay Wifi|Cathay Wifi 自動登入|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/ComicRead.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="ComicRead" width="32"/></a>| <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAACBUExURUxpcWB9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i////198il17idng49DY3PT297/K0MTP1M3X27rHzaCxupmstbTByK69xOfr7bfFy3WOmqi4wPz9/X+XomSBjqW1vZOmsN/l6GmFkomeqe7x8vn6+kv+1vUAAAAOdFJOUwDsAoYli9zV+lIqAZEDwV05SQAAAUZJREFUOMuFk+eWgjAUhGPBiLohjZACUqTp+z/gJkqJy4rzg3Nn+MjhwB0AANjv4BEtdITBHjhtQ4g+CIZbC4Qb9FGb0J4P0YrgCezQqgIA14EDGN8fYz+f3BGMASFkTJ+GDAYMUSONzrFL7SVvjNQIz4B9VERRmV0rbJWbrIwidnsd6ACMlEoip3uad3X2HJmqb3gCkkJELwk5DExRDxA6HnKaDEPSsBnAsZoANgJaoAkg12IJqBiPACImXQKF9IDULIHUkOk7kDpeAMykHqCEWACy8ACdSM7LGSg5F3HtAU1rrkaK9uGAshXS2lZ5QH/nVhmlD8rKlmbO3ZsZwLe8qnpdxJRnLaci1X1V5R32fjd5CndVkfYdGpy3D+htU952C/ypzPtdt3JflzZYBy7fi/O1euvl/XH1Pp+Cw3/1P1xOZwB+AWMcP/iw0AlKAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC" alt="icon" width="16"/> ComicRead|漫畫站點增強閱讀體驗（雙頁、翻譯、歷史、自動簽到、解鎖等多功能）|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Eyny" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=www.eyny.com" alt="icon" width="16"/> Eyny|Eyny 論壇自動登入|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Kktix" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=64&domain=kktix.com" alt="icon" width="16"/> Kktix|KKTIX 報名自動化（自動倒數、票券偵測、頁面清理、搶票輔助）|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/LogKuoann.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Log Kuoann" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=datalust.co" alt="icon" width="16"/> Log Kuoann|LogKuoann 自動登入|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/Slack-Polling.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Slack-Polling" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=slack.com" alt="icon" width="16"/> Slack-Polling|Slack Auto Polling|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="TxTicket" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=tixcraft.com" alt="icon" width="16"/> TxTicket|TxTicket 報名輔助|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/VDIAutoLogin.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="VDI Login" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=cloud.vmwarehorizon.com" alt="icon" width="16"/> VDI Login|VDI Web Client 自動登入|

## Reference

- [Tampermonkey • Documentation](https://www.tampermonkey.net/documentation.php)
  - [@run-at](https://www.tampermonkey.net/documentation.php#_run_at)
- [Will 保哥 Github](https://github.com/doggy8088/TamperScripts)
