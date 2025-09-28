# 油猴腳本 API 中文參考

本文整理了大部分 Tampermonkey 油猴腳本 API 的使用方法，並且附上了每個方法的代碼範例。除此之外您可以安裝[油猴腳本 API 範例腳本](https://github.com/examplecode/user-script-example)在支持用戶腳本的流覽器中進行測試。

> 提示 文檔中介紹的 API 支持及參數以[X 流覽器](https://www.xbext.com)的內置腳本管理器為准,其他的腳本管理器可能會存在細微的差別。

## 中繼資料

中繼資料通常放置在整個腳本的開頭，主要起到對腳本的一些描述，參數設定，聲明，包括腳本名稱、簡介、作者、版本號、運行方式、所依賴的庫檔聲明等。

下面是一個腳本的中繼資料聲明的例子。

```javascript
// ==UserScript==
// @name         Say hello
// @namespace    com.example.hello
// @version      0.1
// @description  When you open the site example.com it says "HELLO"
// @author       You
// @match        www.example.com
// ==/UserScript==
```

| 中繼資料標記 | 描述                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| @name        | 腳本的名稱                                                                                                           |
| @namespace   | 腳本的的名字空間，可以是一個唯一標識或則網址                                                                         |
| @description | 腳本的簡介，描述腳本的用法及功能等                                                                                   |
| @icon        | 為腳本定制一個圖示，顯示在腳本清單以及流覽器擴展功能表中的圖示。可以是一個 url 圖示資源或者 Base64 編碼的 Data URI。 |
| @author      | 腳本的作者姓名或昵稱                                                                                                 |
| @version     | 當前腳本的版本號                                                                                                     |
| @match       | 定義腳本的作用域，只在匹配的網址或功能變數名稱才執行腳本，此標記在中繼資料中可以有多行聲明                           |
| @include     | 和@match 類似，用來描述腳本的作用域，可以在中繼資料中存在多行聲明。                                                  |
| @exclude     | 用於排除一些 URL, 即使@match 和@incluide 已經指定匹配，可以在中繼資料中存在多行聲明。                                |
| @require     | 該腳本執行前，需要依賴協力廠商的庫，可以在中繼資料中存在多行聲明                                                     |
| @resource    | 該腳本執行需要依賴的一些資源檔，如 css,文本，圖片資源等，可以在中繼資料中存在多行聲明                                |
| @run-at      | 指定腳本的執行時機，不同的應用場景可能需要不同的執行時機 ,其中@run-at 的取值可以參見下表                             |
| @grant       | 在中繼資料中聲明使用那些 API 函數                                                                                    |

中繼資料標記@run-at 的取值如下

| 取值           | 描述                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| document-start | 指定腳本在 DOM 樹開始的時候執行，需要腳本儘早執行的時候添加此聲明。            |
| document-end   | 指定腳本在 DOM 資料載入完畢的時候執行                                          |
| document-idle  | 頁面載入完畢的時候執行。當中繼資料沒有@run-at 聲明時，腳本默認在此時機執行     |
| main-menu      | X 流覽器的擴展聲明，表示此腳本不自動執行，使用者通過主功能表擴展選項手動執行。 |
| context-menu   | X 流覽器擴展聲明,表示此腳本不自動執行，使用者通過長按功能表的擴展選項執行      |
| tool-menu      | X 流覽器擴展聲明，表示此腳本不自動執行，使用者通過頁面工具功能表的擴展選項執行 |

## 油猴 API

### GM_addStyle

#### 描述

為頁面添加樣式一段 CSS 樣式。

#### 語法

```javascript
function GM_addStyle (cssString)
```

#### 參數

| 名稱      | 類型 | 描述       |
| --------- | ---- | ---------- |
| cssString | 字串 | 字串樣式表 |

#### 範例

```javascript
GM.addStyle('#note{color: white; background: #3385ff!important;border-bottom: 1px solid #2d7');
```

### GM_addElement

#### 描述

增加一個頁面元素，可以指定父節點，不指定父節點其節點為根項目。

#### 語法

```javascript
function GM_addElement(tagName, attributes)
```

或者

```javascript
function GM_addElement(parentNode,tagName, attributes)
```

#### 參數

| 名稱       | 類型 | 描述             |
| ---------- | ---- | ---------------- |
| tagName    | 字串 | 元素名稱         |
| attributes | 物件 | 屬性名稱/數值對  |
| parentNode | 物件 | 新建元素的父節點 |

#### 範例

```javascript
GM_addElement('script', {
	textContent: 'window.foo = "bar";',
});

GM_addElement('script', {
	src: 'https://example.com/script.js',
	type: 'text/javascript',
});

GM_addElement(document.getElementsByTagName('div')[0], 'img', {
	src: 'https://example.com/image.png',
});

GM_addElement(shadowDOM, 'style', {
	textContent: 'div { color: black; };',
});
```

### GM_setValue

#### 描述

通過指定的鍵值保存資料到流覽器本機存放區中。

#### 語法

```javascript
function GM_setValue(name,value)
```

#### 參數

| 名稱  | 類型     | 描述                                       |
| ----- | -------- | ------------------------------------------ |
| name  | 字串     | 字串鍵值                                   |
| value | 任意類型 | 可以是整數、字串、布林類型、物件等任意資料 |

#### 範例

```javascript
GM_setValue('foo', 'bar');
GM_setValue('count', 100);
GM_setValue('active', true);
GM_setValue('data', {
	name: 'Andy',
	age: 18,
});
```

### GM_getValue

#### 描述

從流覽器的本機存放區獲取一個值。

#### 語法

```javascript
function GM_getValue(name, defaultValue)
```

#### 參數

| 名稱         | 類型     | 描述                                       |
| ------------ | -------- | ------------------------------------------ |
| name         | 字串     | 字串鍵值                                   |
| defaultValue | 任意類型 | 可選項，如果鍵值從沒有被設置過，返回預設值 |

#### 返回值

如果鍵值被設置過，返回當初設置的資料類型。

#### 範例

```javascript
GM_setValue('foo', 'bar');
GM_setValue('count', 100);
GM_setValue('active', true);
GM_setValue('data', {
	name: 'Andy',
	age: 18,
});

var info = `foo = ${GM_getValue('foo')}
          count = ${GM_getValue('count')}
          active = ${GM_getValue('active')}
          data.name =  ${GM_getValue('data').name}`;
alert(info);
```

### GM_listValues

#### 描述

返回使用所以 GM_setValue 設置的鍵值列表。

#### 語法

```javascript
function GM_listValues()
```

#### 範例

```javascript
GM_setValue('foo', 'bar');
GM_setValue('count', 100);
GM_setValue('active', true);
GM_setValue('data', {
	name: 'Andy',
	age: 18,
});
alert(GM_listValues());
```

### GM_deleteValue

#### 描述

刪除通過 GM_setValue 方法設置的鍵值。

#### 語法

```javascript
function GM_deleteValue(name)
```

#### 參數

| 名稱 | 類型 | 描述     |
| ---- | ---- | -------- |
| name | 字串 | 字串鍵值 |

#### 範例

```javascript
GM_deleteValue('foo');
```

```javascript
let keys = GM_listValues();
for (let key of keys) {
	GM_deleteValue(key);
}
```

### GM_addValueChangeListener

#### 描述

用來監聽通過 GM_setValue 設置的鍵值對的改變

#### 語法

```javascript
function GM_addValueChangeListener(name,callback);

```

#### 參數

| 名稱     | 類型     | 描述                         |
| -------- | -------- | ---------------------------- |
| name     | 字串     | 字串鍵值                     |
| callback | 回呼函數 | 當指定的鍵值改變時回檔此函數 |

##### callback 參數列表

-   **name** - 字串類型，鍵值名稱
-   **oldValue** - 任意類型 ，以前的鍵值
-   **newValue** - 任意類型 ，新的鍵值。
-   **remote** - 布林類型，來自當前標籤的回檔還是垮標籤的回檔（目前沒有實現跨標籤回檔）

#### 返回值

返回監聽的回呼函數的 id,用於以後通過 GM_removeValueChangeListener 方法刪除回呼函數。

#### 範例

```javascript
listener_id = GM_addValueChangeListener('foo', function (name, old_value, new_value, remote) {
	alert('Value Changed:' + name + ':' + old_value + '=>' + new_value);
});
```

### GM_removeValueChangeListener

#### 描述

用來刪除通過 GM_addValueChangeListener 添加的監聽回檔

#### 語法

```javascript
function GM_removeValueChangeListener(listener_id);

```

#### 參數

| 名稱        | 類型        | 描述                                           |
| ----------- | ----------- | ---------------------------------------------- |
| listener_id | 回呼函數 Id | GM_removeValueChangeListener 返回的回呼函數 id |

#### 範例

```javascript
GM_removeValueChangeListener(listener_id);
```

### GM_notification

#### 描述

顯示一條通知消息

#### 語法

```javascript
function GM_notification(details)
```

或者

```javascript
function GM_notification(text, title, image, onclick )
```

#### 參數

| 名稱    | 類型     | 描述                                                   |
| ------- | -------- | ------------------------------------------------------ |
| details | 物件     | 一個包含 text 欄位和 ondone,onclick 回呼函數欄位的對象 |
| text    | 字串     | 文本內容                                               |
| title   | 字串     | 參數為了相容，手機端目前未實現                         |
| Image   | 物件     | 參數為了相容，手機端目前未實現                         |
| onclick | 回呼函數 | 當使用者點擊了確定按鈕的回呼函數                       |

#### 範例

```javascript
GM_notification('Hello!');

GM.notification({
	text: 'This is a message with callback',
	onclick: function () {
		alert('you click message ok button');
	},
	ondone: function () {
		alert('message bar closed');
	},
});

GM_notification('Hello', '', '', function () {
	alert('you click message ok button');
});
```

### GM_setClipboard

#### 描述

寫入字串資料到剪貼板

#### 語法

```
function GM_setClipboard(data)
```

#### 參數

| 名稱 | 類型 | 描述     |
| ---- | ---- | -------- |
| data | 字串 | 字串內容 |

#### 範例

```javascript
GM_setClipboard('this is test data');
```

### GM_registerMenuCommand

#### 描述

註冊一個功能表選項，功能表選項會顯示在 X 流覽器的頁面工具功能表中。

#### 語法

```javascript
    function GM_registerMenuCommand(title,callback)
```

#### 參數

| 名稱     | 類型     | 描述                         |
| -------- | -------- | ---------------------------- |
| title    | 字串     | 功能表名稱                   |
| callback | 回呼函數 | 點擊功能表項目執行的回呼函數 |

#### 返回值

返回功能表項目的命令 ID, 登出功能表的時候會用到

#### 範例

```javascript
GM_registerMenuCommand('click me', function () {
	alert('You click menu item');
});
```

### GM_unregisterMenuCommand

#### 描述

註銷之前註冊的功能表項目

#### 語法

```javascript
function GM_unregisterMenuCommand(commandId)
```

#### 參數

| 名稱      | 類型 | 描述                |
| --------- | ---- | ------------------- |
| commandId | 字串 | 功能表項目的命令 id |

#### 範例

```javascript
GM_unregisterMenuCommand(commandId);
```

### GM_openInTab

#### 描述

在新標籤中打開一個頁面

#### 語法

```javascript
function GM_openInTab(url,background)
```

#### 參數

| 名稱       | 類型     | 描述                            |
| ---------- | -------- | ------------------------------- |
| url        | 字串     | 新標籤頁面的網址                |
| background | 布林類型 | 是否在後臺打開標籤,默認為 false |

#### 範例

```javascript
GM_openInTab('https://www.example.com');
GM_openInTab('https://www.example.com', true);
```

### GM_download

#### 描述

調用流覽器的默認下載器進行下載

#### 語法

```javascript
function GM_download(url,name)
```

或者

```javascript
function GM_download(detail)
```

#### 參數

| 名稱   | 類型 | 描述                 |
| ------ | ---- | -------------------- |
| url    | 字串 | 要下載資源的網址     |
| name   | 字串 | 下載檔案保存的名稱   |
| detail | 物件 | 通過物件配置下載參數 |

##### detail 參數屬性清單

-   **url** - 字串類型，表示要下載的網址
-   **name** - 字串類型，下載檔案保存的名稱
-   **hedaers** - 對象類型，HTTP 請求頭
-   **onload** - 回呼函數，下載完成.
-   **onerror** - 回呼函數，下載出錯
-   **tag** - 字串 ,下載檔案打上標籤，X 流覽器的實現是相同 tag 的資源保存在以標籤命名的目錄。

#### 範例

```javascript
GM_download('https://www.xbext.com/download/xbrowser-release.apk');
```

```javascript
//指定下載保存檔案名稱
GM_download("https://www.xbext.com/download/xbrowser-release.apk,"xbrowser.apk")
```

```javascript
let urls = [
	'https://www.dundeecity.gov.uk/sites/default/files/publications/civic_renewal_forms.zip',
	'https://www.dundeecity.gov.uk/sites/default/files/publications/civic_renewal_forms.zip',
	'https://www.dundeecity.gov.uk/sites/default/files/publications/civic_renewal_forms.zip',
];
var i = 0;
for (let url of urls) {
	GM_download({
		url: `${url}`,
		name: `test-file${++i}.zip`,
		headers: {
			Referer: 'https://www.example.com/',
		},
		onload: function () {
			console.log('download completed !');
		},
		tag: 'test-file' /* 此屬性為 x的擴展，在下載目錄中創建名字為tag的子目錄中統一保存 */,
	});
}
```

### GM_getResourceText

#### 描述

獲取中繼資料標記@resource 指向資源的文本內容。

#### 語法

```javascript
function GM_getResourceText(name)
```

#### 參數

| 名稱 | 類型 | 描述                                       |
| ---- | ---- | ------------------------------------------ |
| name | 字串 | 標記@resource 定義的用於引用資源的鍵值名稱 |

#### 範例

```javascript
// @resource     main-content https://www.example.com/res/main-content.txt
var text = GM_getResourceText('main-content');
```

#### 返回值

返回資源 URL 的文本內容。

### GM_getResourceURL

#### 描述

獲取中繼資料標記@resource 指向資源的內容， 內容以 Base64 編碼，格式為 Data URI 格式。

#### 語法

```javascript
function GM_getResourceURL(name)
```

#### 參數

| 名稱 | 類型 | 描述                                       |
| ---- | ---- | ------------------------------------------ |
| name | 字串 | 標記@resource 定義的用於引用資源的鍵值名稱 |

#### 範例

```javascript
var img = document.querySelector('#avatar');
//@resource     avatar01 https://api.multiavatar.com/avatar01.svg
img.src = GM_getResourceURL('avatar01');
```

#### 返回值

返回以 Base64 編碼的 Data URI。

### GM_xmlhttpRequest

#### 描述

這個方法類似於[XMLHttpRequest](http://developer.mozilla.org/en/docs/XMLHttpRequest) 物件, 不同的是此方法支持跨域請求，突破了物件[同源訪問策略](https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript),使用起來更加靈活。

#### 語法

```javascript
function GM_xmlhttpRequest(details)
```

#### 參數

這個方法只有物件類型的參數 details ，物件的屬性清單和含義如下：

| 名稱    | 類型 | 描述                       |
| ------- | ---- | -------------------------- |
| details | 物件 | 包含一系列屬性作為控制參數 |

##### details 屬性說明

-   **method** - Http 請求方法，GET、POST、HEAD 等。
-   **url** - 字串，目標請求 URL。
-   **headers** - 可選項，字串，HTTP 協定頭，User-Agent，Referer 等。
-   **data** - 可選項，字串，通過 POST 方法發送的資料
-   **responseType** - 可選項，字串，設置回應類型，可以為 arraybuffer, blob, json 和 stream 之一。
-   **onabort**- 可選項，回呼函數，當 HTTP 請求被終止時調用。
-   **onerror**- 可選項，回呼函數，HTTP 請求出現異常時被調用
-   **onloadstart** - 可選項，回呼函數，HTTP 請求開始被調用
-   **onreadystatechange** - 可選項，回呼函數，HTTP 請求狀態變化被調用
-   **onload** - 可選項，回呼函數，當 HTTP 請求完成時被調用，回呼函數參數攜帶的幾個屬性如下
    -   **finalUrl** - HTTP 最終請求的 URL 位址，比如最後重定向的網址。
    -   **readyState** - 資料狀態
    -   **status** - HTTP 請求狀態
    -   **statusText** - HTTP 請求狀態文本
    -   **responseHeaders** - HTTP 回應頭
    -   **response** - HTTP 回應返回的物件類型資料，當 _details.responseType_ 被設置返回相應類型的對象。
    -   **responseText** - 返回文本類型的資料

#### 範例

```javascript
//發起一個get請求
GM_xmlhttpRequest({
	method: 'GET',
	url: 'http://www.example.com/',
	onload: function (response) {
		alert(response.responseText);
	},
});
```

```javascript
//發起一個post請求
GM.xmlHttpRequest({
	method: 'POST',
	url: 'https://www.example.net/login',
	data: 'username=johndoe&password=xyz123',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
	onload: function (response) {
		if (response.responseText.indexOf('Logged in as') > -1) {
			location.href = 'http://www.example.net/dashboard';
		}
	},
});
```

### urlchange

這是擴展的一個事件函數，常用于單頁面應用監聽流覽器 url 變化。

#### 範例

```javascript
window.addEventListener('urlchange', () => {
	alert('urlchange');
});
//當頁面跳轉到一個新的錨點會觸發urlchange事件
window.location = '#test';
```

### GM_cookie

#### 描述

該方法可以突破流覽器對 Cookie 的跨域限制，對某個網站下的 Cookie 進行操作，包括獲取、設置、刪除 Cookie。此方法存在安全隱患，可能會導致使用者隱私資訊洩露。目前主要為了相容一些腳本，暫時支持這個方法，後續可能會限制這個方法的使用。

#### 語法

```javascript
function GM_cookie(action,details,callback)
```

#### 參數

| 名稱     | 類型     | 描述                                   |
| -------- | -------- | -------------------------------------- |
| action   | 字串     | 對 Cookie 的操作方式 [list,set,delete] |
| details  | 物件     | 包含一系列屬性作為參數                 |
| callback | 回呼函數 | 返回對 Cookie 操作的結果               |

##### action 可選項

-   **list** - 獲取某個功能變數名稱下的 Cookies 列表
-   **set** - 設置某個功能變數名稱下的 Cookie
-   **delete** - 刪除某個功能變數名稱下的 Cookie

##### details 屬性說明

-   **url** - 頁面網址
-   **domain** - Cookie 功能變數名稱。
-   **name** - 字串，Cookie 鍵值
-   **value** -字串，Cookie 內容。

#### 範例

獲取某個功能變數名稱下的 Cookies 列表

```javascript
GM_cookie(
	'list',
	{
		url: 'https://www.example.com',
	},
	function (result) {
		console.log(result);
	}
);
```

刪除某個功能變數名稱下的 Cookie

```javascript
GM_cookie(
	'delete',
	{
		url: 'https://www.example.com',
		name: 'test',
	},
	function (result) {
		console.log(result);
	}
);
```

設置某個功能變數名稱下的 Cookie

```javascript
GM_cookie(
	'set',
	{
		url: 'https://www.example.com',
		name: 'test',
		value: 'test',
	},
	function (result) {
		console.log(result);
	}
);
```

> 為了相容一些其它腳本 GM_cookie 函數同時也支援下面的調用方式

```javascript
//獲取某個功能變數名稱下的cookies
GM_cookie.list(
	{
		url: 'https://www.example.com',
	},
	function (result) {
		console.log(result);
	}
);

//設置某個功能變數名稱下的Cookie
GM_cookie.set(
	{
		url: 'https://www.example.com',
		name: 'test',
		value: 'test',
	},
	function (result) {
		console.log(result);
	}
);

//刪除某個功能變數名稱下的Cookie
GM_cookie.delete(
	{
		url: 'https://www.example.com',
		name: 'test',
	},
	function (result) {
		console.log(result);
	}
);
```

### GM_info

這是一個物件，用來保存每個腳本的相關環境變數，比如腳本的版本、作者、介紹等，物件屬性清單如下：

-   **script** - 物件類型，包含下面一些屬性。
    -   **author** - 腳本作者
    -   **name** - 腳本名稱
    -   **description** - 腳本介紹
    -   **version** - 版本
    -   **copyright** - 版權資訊
    -   **includes** - 陣列類型，包含匹配頁面的清單
    -   **matches** - 陣列類型，和 includes 類似，包含匹配頁面的清單
    -   **excludes** -陣列類型，排除匹配網址列表
    -   **resources** - 陣列類型，所有資源清單
-   **version** - 腳本管理器的版本
-   **scriptHandler** - 腳本管理器的名稱
-   **scriptMetaStr** - 腳本管理器中繼資料字串

#### 範例

```javascript
var info =
	'Script Name: ' +
	GM_info.script.name +
	'\nVersion: ' +
	GM_info.script.version +
	'\nVersion: ' +
	GM_info.script.version +
	'\nScriptHandler: ' +
	GM_info.scriptHandler +
	'\nScript Handler Version : ' +
	GM_info.version;

alert(info);
```

## 參考資料

-   https://www.tampermonkey.net/documentation.php
-   https://wiki.greasespot.net/Greasemonkey_Manual:API
