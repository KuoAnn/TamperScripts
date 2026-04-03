# Tamperscripts

收集各種實用的 Tampermonkey userscript，涵蓋自動登入、頁面優化等功能。

## 使用方式

### 1. 安裝 Tampermonkey

請依您的瀏覽器選擇對應的官方商店連結安裝。

| Chrome | Edge | Firefox | Safari |
| --- | --- | --- | --- |
| <a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149382-8ffa83d5-8561-4dc9-929f-96cde2f6ed43.png" alt="Chrome" style="width:48px"></a> | <a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-TW" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149387-9e173b2c-b5f1-40bf-bdaf-c2f0d2bb5a6d.png" alt="Edge" style="width:48px"></a> | <a href="https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149390-50010c13-e3c8-4dc9-a120-e267fbcc1e73.png" alt="Firefox" style="width:48px"></a> | <a href="https://apps.apple.com/us/app/tampermonkey/id1482490089" target="_blank"><img src="https://user-images.githubusercontent.com/88981/220149393-374714eb-0d9e-4fe3-88d0-8195382cfe42.png" alt="Safari" style="width:48px"></a> |

### 2. 啟用開發人員模式與允許使用者腳本

> **注意：** Tampermonkey 需要瀏覽器開啟「開發人員模式」並允許「使用者腳本」才能正常運作。

- **Chrome / Edge**：前往 `chrome://extensions` 或 `edge://extensions`，右上角開啟「開發人員模式」。
- **Firefox**：前往 `about:addons`，點選右上「齒輪」→「偵錯附加元件」。
- **Safari**：於「偏好設定」中啟用「開發」選單。

若出現「允許使用者腳本」提示，請依指示啟用。

### 3. 安裝 Userscript

點擊下方表格中的 <img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="install" width="20"/> 安裝圖示，Tampermonkey 會自動跳出安裝頁面，點選「Install」即完成。

![Tampermonkey Userscript installation](https://user-images.githubusercontent.com/88981/125022420-3baca180-e0af-11eb-9d37-7abad8bf96fa.jpg)

## 安裝

### 自動登入

| 安裝 | 名稱 | 說明 |
| --- | --- | --- |
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CapitalLogin.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Capital Login" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.capitalfund.com.tw/" alt="icon" width="16"/> Capital Login|群益自動登入，支援驗證碼自動辨識|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/Eyny.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Eyny" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=www.eyny.com" alt="icon" width="16"/> Eyny|Eyny 論壇自動填入帳密並登入，支援安全提問自動填答|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/LogKuoann.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Log Kuoann" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=datalust.co" alt="icon" width="16"/> Log Kuoann|LogKuoann 自動登入，支援帳密自訂|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/VDIAutoLogin.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="VDI Login" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=cloud.vmwarehorizon.com" alt="icon" width="16"/> VDI Login|VDI Web Client 自動登入，支援多站點|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayWifi.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Wifi" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk" alt="icon" width="16"/> Cathay Wifi|國泰 wifi 自動填寫登入表單|

### 頁面優化

| 安裝 | 名稱 | 說明 |
| --- | --- | --- |
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Baozi" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=twmanga.com" alt="icon" width="16"/> Baozi|包子漫畫站簡化介面、已讀記錄、鍵盤控制翻頁|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/ComicRead.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="ComicRead" width="32"/></a>| 📗 ComicRead|漫畫站點增強閱讀體驗（雙頁、翻譯、歷史、自動簽到、解鎖等多功能）|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Kktix" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=64&domain=kktix.com" alt="icon" width="16"/> Kktix|KKTIX 報名自動化（自動倒數、票券偵測、頁面清理、搶票輔助）|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/TxTicket.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="TxTicket" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=tixcraft.com" alt="icon" width="16"/> TxTicket|TxTicket 報名輔助，強化 UI、選位、付款流程|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/SlackPolling.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="SlackPolling" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=slack.com" alt="icon" width="16"/> SlackPolling|Slack 自動偵測訊息面板，出現「重新整理」自動點擊|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayCardEvent.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Card Event" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk" alt="icon" width="16"/> Cathay Card Event|國泰信用卡活動自動登錄，支援驗證碼辨識|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayLearn.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="Cathay Learn" width="32"/></a>| <img src="https://www.cathaysec.com.tw/cathaysec/assets/img/home/news_icon_csc.png" alt="icon" width="16"/> Cathay Learn|國泰自我學習網自動化輔助，支援多種操作|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="The Key Auto" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=hypercore.com.tw" alt="icon" width="16"/> The Key Auto|The Key 後台友善功能|
|<a href="https://github.com/KuoAnn/TamperScripts/raw/main/src/CathayRegister.user.js" target="_blank"><img src="https://user-images.githubusercontent.com/88981/169986095-a54f32bd-55a6-4de8-bad6-aa3b1874ce07.png" alt="CathayRegister" width="32"/></a>| <img src="https://www.google.com/s2/favicons?sz=16&domain=https://www.cathaybk.com.tw%2fcathaybk" alt="icon" width="16"/> Cathay 大家來報報|自動勾選同意條款並取得申請資訊，強化錯誤處理與安全性|

## Reference

- [Tampermonkey • Documentation](https://www.tampermonkey.net/documentation.php)
  - [@run-at](https://www.tampermonkey.net/documentation.php#_run_at)
- [Will 保哥 Github](https://github.com/doggy8088/TamperScripts)
