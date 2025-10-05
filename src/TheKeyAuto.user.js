// ==UserScript==
// @name         The Key Auto Login
// @namespace    https://admin.hypercore.com.tw/*
// @version      1.25.1005.1224
// @description  自動填入帳號密碼並登入 Hypercore 後台管理系統,自動選擇 THE KEY YOGA 台北古亭館,檢查會員遲到取消紀錄並顯示上課清單(滿版彈窗),支援黃牌簽到/取消操作,場館切換 modal 新增快速切換按鈕,會籍狀態 badge 顯示,一鍵解除 No show 停權功能,會員查詢電話輸入支援 Google Sheets 模糊搜尋(透過 Service Account 存取)
// @author       KuoAnn
// @match        https://admin.hypercore.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypercore.com.tw
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_addElement
// @connect      admin.hypercore.com.tw
// @connect      sheets.googleapis.com
// @connect      oauth2.googleapis.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// ==/UserScript==

(function () {
	"use strict";

	// 加入表格樣式
	GM_addStyle(`
		.booking-list-table {
			width: 100%;
			margin-top: 12px;
			border-collapse: collapse;
			background: white;
			box-shadow: 0 1px 3px rgba(0,0,0,0.12);
		}
		.booking-list-table th,
		.booking-list-table td {
			padding: 10px;
			text-align: center;
			border: 1px solid #ddd;
			font-size: 14px;
		}
		.booking-list-table th {
			background-color: #f5f5f5;
			font-weight: bold;
			color: #333;
			text-align: center;
		}
		.booking-list-table tr:hover {
			background-color: #f9f9f9;
		}
		.booking-list-table .status-late_cancel {
			background-color: #fff9c4 !important;
			color: #c62828;
			font-weight: bold;
		}
		.booking-list-table tr.late-cancel-row {
			background-color: #fff9c4 !important;
		}
		.booking-list-table tr.no-show-row {
			background-color: #ffcdd2 !important;
		}
		.booking-list-table .status-check_in {
			color: #2e7d32;
		}
		.booking-list-table .status-reserved {
			color: #1565c0;
		}
		.booking-list-container {
			margin-top: 12px;
		}
		.booking-list-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 10px;
			margin-top: 6px;
			color: #333;
			cursor: pointer;
			text-decoration: underline;
			color: #007bff;
		}
		.booking-list-title:hover {
			color: #0056b3;
		}
		.booking-modal {
			display: none;
			position: fixed;
			z-index: 9999;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			overflow: auto;
			background-color: rgba(0,0,0,0.7);
		}
		.booking-modal-content {
			background-color: #fefefe;
			margin: 2% auto;
			padding: 20px;
			border: 1px solid #888;
			width: 95%;
			max-width: 1400px;
			border-radius: 8px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.3);
			max-height: 90vh;
			overflow-y: auto;
		}
		.booking-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
			border-bottom: 2px solid #007bff;
			padding-bottom: 10px;
		}
		.booking-modal-header h2 {
			margin: 0;
			color: #333;
			font-size: 24px;
		}
		.booking-modal-close {
			color: #aaa;
			font-size: 32px;
			font-weight: bold;
			cursor: pointer;
			transition: color 0.2s;
		}
		.booking-modal-close:hover,
		.booking-modal-close:focus {
			color: #000;
		}
		.action-buttons {
			display: flex;
			gap: 8px;
			flex-direction: row;
			justify-content: center;
		}
		.action-btn {
			padding: 6px 12px;
			border: none;
			border-radius: 4px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s;
			font-weight: 500;
		}
		.action-btn:hover {
			opacity: 0.8;
			transform: translateY(-1px);
		}
		.action-btn:active {
			transform: translateY(0);
		}
		.action-btn-checkin {
			background-color: #4caf50;
			color: white;
		}
		.action-btn-checkin:hover {
			background-color: #45a049;
		}
		.action-btn-cancel {
			background-color: #ff9800;
			color: white;
		}
		.action-btn-cancel:hover {
			background-color: #fb8c00;
		}
		.action-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
		.quick-location-buttons {
			margin-top: 10px;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}
		.quick-location-btn {
			padding: 8px 16px;
			background-color: #5d8fc2;
			color: white;
			border: none;
			border-radius: 4px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s;
			font-weight: 500;
		}
		.quick-location-btn:hover {
			background-color: #0056b3;
			transform: translateY(-1px);
		}
		.quick-location-btn:active {
			transform: translateY(0);
		}
		.membership-status-badge {
			display: inline-block;
			padding: 4px 12px;
			margin-left: 10px;
			border-radius: 12px;
			font-size: 13px;
			font-weight: 500;
			color: white;
		}
		.membership-status-badge.status-active {
			background-color: #4caf50;
		}
		.membership-status-badge.status-suspended {
			background-color: #b4461c;
		}
		.membership-status-badge.status-default {
			background-color: #9e9e9e;
		}
		.cancel-no-show-container {
			margin-top: 8px;
			margin-bottom: 8px;
		}
		.cancel-no-show-container .btn {
			font-size: 13px;
		}
		.fuzzy-search-badge-container {
			margin-top: 8px;
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		.fuzzy-search-badge {
			display: inline-block;
			padding: 6px 12px;
			background-color: #007bff;
			color: white;
			border-radius: 4px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s;
			border: none;
		}
		.fuzzy-search-badge:hover {
			background-color: #0056b3;
			transform: translateY(-1px);
		}
		.fuzzy-search-badge:active {
			transform: translateY(0);
		}
	`);

	/**
	 * 註冊 Tampermonkey 選單命令,設定帳號與密碼
	 */
	function registerMenuCommands() {
		GM_registerMenuCommand("設定帳密", async () => {
			const email = prompt("請輸入帳號 (Email):", await GM_getValue("thekey_email", ""));
			if (email !== null) await GM_setValue("thekey_email", email);

			const password = prompt("請輸入密碼:", await GM_getValue("thekey_password", ""));
			if (password !== null) await GM_setValue("thekey_password", password);

			if (email !== null || password !== null) {
				alert("帳號與密碼已儲存!");
			}
		});

		GM_registerMenuCommand("設定 Google Sheets Service Account", async () => {
			const sheetId = prompt("請輸入 Google Sheet ID:", await GM_getValue("google_sheet_id", ""));
			if (sheetId !== null) await GM_setValue("google_sheet_id", sheetId);

			const clientEmail = prompt("請輸入 Service Account Email:", await GM_getValue("google_service_account_email", ""));
			if (clientEmail !== null) await GM_setValue("google_service_account_email", clientEmail);

			const privateKey = prompt(
				"請輸入 Service Account Private Key (完整 PEM 格式，包含 BEGIN/END):",
				await GM_getValue("google_service_account_private_key", "")
			);
			if (privateKey !== null) await GM_setValue("google_service_account_private_key", privateKey);

			if (sheetId !== null || clientEmail !== null || privateKey !== null) {
				alert("Google Sheets Service Account 設定已儲存!");
				// 清除快取，下次會重新取得資料
				await GM_setValue("google_sheet_cache", null);
				await GM_setValue("google_sheet_cache_time", null);
				await GM_setValue("google_access_token", null);
				await GM_setValue("google_access_token_expire", null);
			}
		});
	}

	/**
	 * 檢查帳號密碼是否已設定,若未設定則提示用戶輸入
	 * @returns {Promise<{email: string, password: string}|null>} 帳密物件或 null
	 */
	async function getCredentials() {
		let email = await GM_getValue("thekey_email", "");
		let password = await GM_getValue("thekey_password", "");

		// 若查無帳密則自動跳出 prompt
		if (!email) {
			email = prompt("請輸入帳號 (Email):", email);
			if (email === null) return null;
			await GM_setValue("thekey_email", email);
		}

		if (!password) {
			password = prompt("請輸入密碼:", password);
			if (password === null) return null;
			await GM_setValue("thekey_password", password);
		}

		if (!email || !password) {
			alert("帳號或密碼不能為空");
			return null;
		}

		return { email, password };
	}

	/**
	 * 等待指定元素出現後執行 callback
	 * @param {string} selector CSS 選擇器
	 * @param {Function} callback 執行函式
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=50] 最大重試次數
	 */
	function waitForElement(selector, callback, retry = 0, maxRetry = 50) {
		const el = document.querySelector(selector);
		if (el) {
			callback();
		} else if (retry < maxRetry) {
			setTimeout(() => waitForElement(selector, callback, retry + 1, maxRetry), 100);
		} else {
			console.error(`waitForElement: 超過最大重試次數,未找到元素 ${selector}`);
		}
	}

	/**
	 * 等待指定元素出現且有值後執行 callback
	 * @param {string} selector CSS 選擇器
	 * @param {Function} callback 執行函式
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=50] 最大重試次數
	 */
	function waitForElementWithValue(selector, callback, retry = 0, maxRetry = 50) {
		const el = document.querySelector(selector);
		if (el && el.value && el.value.trim() !== "") {
			callback();
		} else if (retry < maxRetry) {
			setTimeout(() => waitForElementWithValue(selector, callback, retry + 1, maxRetry), 100);
		} else {
			console.error(`waitForElementWithValue: 超過最大重試次數,未找到有值的元素 ${selector}`);
		}
	}

	/**
	 * Base64 URL 編碼（用於 JWT）
	 * @param {string} str 要編碼的字串
	 * @returns {string} Base64 URL 編碼後的字串
	 */
	function base64UrlEncode(str) {
		return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	/**
	 * 將 ArrayBuffer 轉換為 Base64 URL 編碼
	 * @param {ArrayBuffer} buffer ArrayBuffer
	 * @returns {string} Base64 URL 編碼後的字串
	 */
	function arrayBufferToBase64Url(buffer) {
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return base64UrlEncode(binary);
	}

	/**
	 * 將 PEM 格式的私鑰轉換為 CryptoKey
	 * @param {string} pemKey PEM 格式的私鑰
	 * @returns {Promise<CryptoKey>} CryptoKey 物件
	 */
	async function importPrivateKey(pemKey) {
		const pemHeader = "-----BEGIN PRIVATE KEY-----";
		const pemFooter = "-----END PRIVATE KEY-----";
		let pemContents = pemKey.trim();

		// 先將 \n 字面字串轉換為實際換行符
		pemContents = pemContents.replace(/\\n/g, "\n");

		// 只移除 header/footer，保留 base64 內容的換行
		if (pemContents.startsWith(pemHeader) && pemContents.endsWith(pemFooter)) {
			pemContents = pemContents.replace(pemHeader, "").replace(pemFooter, "").trim();
		}
		// 合併所有換行，得到純 base64 字串
		pemContents = pemContents.replace(/[\r\n]/g, "");

		// Base64 解碼
		const binaryDer = atob(pemContents);
		const bytes = new Uint8Array(binaryDer.length);
		for (let i = 0; i < binaryDer.length; i++) {
			bytes[i] = binaryDer.charCodeAt(i);
		}

		return await crypto.subtle.importKey(
			"pkcs8",
			bytes.buffer,
			{
				name: "RSASSA-PKCS1-v1_5",
				hash: "SHA-256",
			},
			false,
			["sign"]
		);
	}

	/**
	 * 建立 JWT (JSON Web Token) 用於 Google Service Account 認證
	 * @param {string} clientEmail Service Account Email
	 * @param {string} privateKey Service Account Private Key (PEM 格式)
	 * @returns {Promise<string>} JWT token
	 */
	async function createJWT(clientEmail, privateKey) {
		const now = Math.floor(Date.now() / 1000);
		const expiry = now + 3600; // 1 小時後過期

		// JWT Header
		const header = {
			alg: "RS256",
			typ: "JWT",
		};

		// JWT Payload
		const payload = {
			iss: clientEmail,
			scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
			aud: "https://oauth2.googleapis.com/token",
			exp: expiry,
			iat: now,
		};

		// 編碼 header 和 payload
		const encodedHeader = base64UrlEncode(JSON.stringify(header));
		const encodedPayload = base64UrlEncode(JSON.stringify(payload));
		const unsignedToken = `${encodedHeader}.${encodedPayload}`;

		// 使用私鑰簽章
		const cryptoKey = await importPrivateKey(privateKey);
		const encoder = new TextEncoder();
		const data = encoder.encode(unsignedToken);
		const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, data);

		// 組合完整的 JWT
		const encodedSignature = arrayBufferToBase64Url(signature);
		return `${unsignedToken}.${encodedSignature}`;
	}

	/**
	 * 使用 Service Account JWT 取得 Google OAuth2 Access Token
	 * @returns {Promise<string|null>} Access Token 或 null
	 */
	async function getServiceAccountAccessToken() {
		try {
			const clientEmail = await GM_getValue("google_service_account_email", "");
			const privateKey = await GM_getValue("google_service_account_private_key", "");

			if (!clientEmail || !privateKey) {
				console.warn("Service Account 設定不完整，請先設定 Email 和 Private Key");
				return null;
			}

			// 檢查快取的 access token
			const cachedToken = await GM_getValue("google_access_token", "");
			const tokenExpire = await GM_getValue("google_access_token_expire", 0);
			const now = Date.now();

			// 如果 token 還有效（提前 5 分鐘更新）
			if (cachedToken && now < tokenExpire - 5 * 60 * 1000) {
				console.log("使用快取的 Access Token");
				return cachedToken;
			}

			console.log("正在取得新的 Access Token...");

			// 建立 JWT
			const jwt = await createJWT(clientEmail, privateKey);

			// 向 Google OAuth2 交換 access token
			const tokenUrl = "https://oauth2.googleapis.com/token";
			const body = new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: jwt,
			});

			return new Promise((resolve, reject) => {
				GM_xmlhttpRequest({
					method: "POST",
					url: tokenUrl,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					data: body.toString(),
					onload: async (response) => {
						try {
							if (response.status !== 200) {
								console.error("取得 Access Token 失敗:", response.statusText, response.responseText);
								reject(new Error(response.statusText));
								return;
							}

							const data = JSON.parse(response.responseText);
							const accessToken = data.access_token;
							const expiresIn = data.expires_in || 3600; // 預設 1 小時

							// 儲存 token 和過期時間
							await GM_setValue("google_access_token", accessToken);
							await GM_setValue("google_access_token_expire", Date.now() + expiresIn * 1000);

							console.log("成功取得 Access Token");
							resolve(accessToken);
						} catch (err) {
							console.error("處理 Access Token 回應失敗:", err);
							reject(err);
						}
					},
					onerror: (error) => {
						console.error("取得 Access Token 請求錯誤:", error);
						reject(error);
					},
				});
			});
		} catch (err) {
			console.error("getServiceAccountAccessToken 失敗:", err);
			return null;
		}
	}

	/**
	 * 從 Google Sheets API 讀取資料
	 * @returns {Promise<Object|null>} 姓名電話對應物件 {姓名: 電話, ...} 或 null
	 */
	async function fetchGoogleSheetData() {
		try {
			const sheetId = await GM_getValue("google_sheet_id", "");

			if (!sheetId) {
				console.warn("Google Sheets 設定不完整，請先設定 Sheet ID");
				return null;
			}

			// 檢查快取
			const cacheTime = await GM_getValue("google_sheet_cache_time", 0);
			const now = Date.now();
			const cacheMaxAge = 15 * 60 * 1000; // 15 分鐘

			if (now - cacheTime < cacheMaxAge) {
				const cachedData = await GM_getValue("google_sheet_cache", null);
				if (cachedData) {
					console.log("使用快取的 Google Sheets 資料");
					return JSON.parse(cachedData);
				}
			}

			// 取得 Access Token
			const accessToken = await getServiceAccountAccessToken();
			if (!accessToken) {
				console.error("無法取得 Access Token");
				return null;
			}

			// 取得資料
			const sheetName = "TK MB LOG";
			const range = `${sheetName}!C:D`;
			const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

			console.log("正在從 Google Sheets API 取得資料...");

			return new Promise((resolve, reject) => {
				GM_xmlhttpRequest({
					method: "GET",
					url: url,
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
					onload: async (response) => {
						try {
							if (response.status !== 200) {
								console.error("Google Sheets API 請求失敗:", response.statusText, response.responseText);
								reject(new Error(response.statusText));
								return;
							}

							const data = JSON.parse(response.responseText);
							if (!data.values || data.values.length === 0) {
								console.warn("Google Sheets 沒有資料");
								resolve(null);
								return;
							}

							// 將資料轉換為 {姓名: 電話} 物件，排除第一列（標題列）
							const namePhoneMap = {};
							for (let i = 1; i < data.values.length; i++) {
								const row = data.values[i];
								if (row.length < 2) continue;

								const name = (row[0] || "").toString().trim();
								const phone = (row[1] || "").toString().trim();

								// 忽略空值
								if (name && phone) {
									namePhoneMap[name] = phone;
								}
							}

							console.log(`成功取得 ${Object.keys(namePhoneMap).length} 筆姓名電話資料（已排除標題列）`);

							// 儲存快取
							await GM_setValue("google_sheet_cache", JSON.stringify(namePhoneMap));
							await GM_setValue("google_sheet_cache_time", Date.now());

							resolve(namePhoneMap);
						} catch (err) {
							console.error("處理 Google Sheets 資料失敗:", err);
							reject(err);
						}
					},
					onerror: (error) => {
						console.error("Google Sheets API 請求錯誤:", error);
						reject(error);
					},
				});
			});
		} catch (err) {
			console.error("fetchGoogleSheetData 失敗:", err);
			return null;
		}
	}

	/**
	 * 填寫登入表單並自動送出
	 */
	async function fillLoginForm() {
		try {
			const credentials = await getCredentials();
			if (!credentials) return;

			const { email, password } = credentials;

			// 填入帳號密碼
			const emailField = document.querySelector('input[name="email"]');
			const passwordField = document.querySelector('input[name="password"]');

			if (!emailField) throw new Error("找不到帳號欄位");
			if (!passwordField) throw new Error("找不到密碼欄位");

			emailField.value = email;
			passwordField.value = password;

			// 選擇館別: THE KEY YOGA 台北古亭館 (location_id=117)
			const locationSelect = document.querySelector('select[name="location_id"]');
			if (locationSelect) {
				locationSelect.value = "117";
				locationSelect.dispatchEvent(new Event("change"));
			} else {
				console.warn("找不到館別選擇欄位");
			}

			// 點擊登入按鈕
			setTimeout(() => {
				const loginButton = document.querySelector("button.sign_in");
				if (!loginButton) {
					console.error("找不到登入按鈕");
					alert("點擊登入按鈕失敗: 找不到登入按鈕");
					return;
				}
				loginButton.click();
				console.log("已自動點擊登入按鈕");
			}, 500);
		} catch (err) {
			console.error("填寫登入表單失敗:", err);
			alert("填寫登入表單失敗: " + err.message);
		}
	}

	/**
	 * 檢查當前頁面的查詢參數 m 是否為 login 或 logout
	 * @returns {boolean} 是否為登入或登出頁面
	 */
	function isLoginPage() {
		const urlParams = new URLSearchParams(window.location.search);
		const m = urlParams.get("m");
		return m === "login" || m === "logout";
	}

	/**
	 * 檢查當前頁面是否為會員詳細頁面 (c=member&m=detail&account=...)
	 * @returns {boolean} 是否為會員詳細頁面且有 account 參數
	 */
	function isMemberDetailPage() {
		const urlParams = new URLSearchParams(window.location.search);
		const c = urlParams.get("c");
		const m = urlParams.get("m");
		const account = urlParams.get("account");
		return c === "member" && m === "detail" && !!account;
	}

	/**
	 * 從頁面取得會員電話號碼
	 * @returns {Promise<string|null>} 會員電話號碼或 null
	 */
	async function getMemberPhone() {
		return new Promise((resolve) => {
			waitForElement("a#phone.phone", () => {
				const phoneElement = document.querySelector("a#phone.phone");
				if (phoneElement && phoneElement.textContent.trim()) {
					resolve(phoneElement.textContent.trim());
				} else {
					console.error("找不到會員電話號碼");
					resolve(null);
				}
			});
		});
	}

	/**
	 * 從頁面取得會籍狀態
	 * @returns {Promise<{text: string, badgeClass: string}|null>} 會籍狀態物件或 null
	 */
	async function getMembershipStatus() {
		return new Promise((resolve) => {
			// 等待會籍表格載入
			waitForElement("#member_package .package_list table tbody tr", () => {
				// 嘗試找到會籍狀態欄位
				const statusCell = document.querySelector("#member_package .package_list table tbody tr td:nth-child(3)");
				if (statusCell) {
					const statusText = statusCell.textContent.trim();
					let badgeClass = "status-default";

					// 根據狀態文字決定 badge 樣式
					if (statusText === "使用中") {
						badgeClass = "status-active";
					} else if (statusText.includes("No show 停權中") || statusText.includes("停權中")) {
						badgeClass = "status-suspended";
					}

					let displayText = statusText;
					if (statusText.includes("No show 停權中")) {
						displayText = "停權中";
					}
					resolve({ text: displayText, badgeClass: badgeClass });
				} else {
					console.log("找不到會籍狀態欄位");
					resolve(null);
				}
			});
		});
	}

	/**
	 * 點擊「管理」按鈕並等待表單載入,取得 merge_id
	 * @returns {Promise<string|null>} merge_id 或 null
	 */
	async function getMergeIdFromNoShowRow() {
		return new Promise((resolve) => {
			// 尋找會籍狀態為 "No show 停權中" 的那一列
			const rows = document.querySelectorAll("#member_package .package_list table tbody tr");
			let tradeButton = null;

			for (const row of rows) {
				const statusCell = row.querySelector("td:nth-child(3)");
				if (statusCell && statusCell.textContent.trim().includes("No show 停權中")) {
					// 找到對應的管理按鈕
					tradeButton = row.querySelector("button.trade_bar");
					break;
				}
			}

			if (!tradeButton) {
				console.error("找不到 No show 停權中的管理按鈕");
				resolve(null);
				return;
			}

			console.log("找到管理按鈕,準備點擊");
			// 點擊管理按鈕
			tradeButton.click();

			// 等待表單載入並取得 merge_id (使用 waitForElementWithValue 等待欄位有值)
			waitForElementWithValue('#member_package .search_form [name="merge_id"]', () => {
				const mergeIdInput = document.querySelector('#member_package .search_form [name="merge_id"]');
				if (mergeIdInput && mergeIdInput.value) {
					const mergeId = mergeIdInput.value;
					console.log("成功取得 merge_id:", mergeId);
					resolve(mergeId);
				} else {
					console.error("找不到 merge_id 或值為空");
					resolve(null);
				}
			});
		});
	}

	/**
	 * 建立「解除 No show 停權」按鈕
	 * @returns {HTMLElement|null} 按鈕元素或 null
	 */
	function createCancelNoShowButton() {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "btn btn-danger btn-xs cancel_no_show";
		button.textContent = "解除";
		button.style.marginLeft = "8px";

		// 綁定點擊事件
		button.addEventListener("click", async function () {
			// 確認視窗
			if (!window.confirm("確定要解除 No show 停權嗎?")) {
				return;
			}

			// 禁用按鈕防止重複點擊
			button.disabled = true;
			button.textContent = "處理中...";

			try {
				// 點擊管理按鈕並等待表單載入,取得 merge_id
				console.log("開始取得 merge_id...");
				const mergeId = await getMergeIdFromNoShowRow();

				if (!mergeId) {
					alert("無法取得會籍 ID,請重新整理頁面後再試");
					button.disabled = false;
					button.textContent = "解除";
					return;
				}

				console.log(`執行解除 No show 停權: merge_id=${mergeId}`);
				const response = await cancelNoShow(mergeId);
				console.log("API 回應:", response);

				// 根據回應顯示訊息
				if (response && response.message === "success") {
					alert("解除停權成功");
					window.location.reload();
				} else {
					const message = response && response.message ? response.message : "未知錯誤";
					alert(`解除停權失敗：${message}`);
					button.disabled = false;
					button.textContent = "解除";
				}
			} catch (err) {
				console.error("解除停權失敗:", err);
				alert(`解除停權失敗：${err.message}`);
				button.disabled = false;
				button.textContent = "解除";
			}
		});

		return button;
	}

	/**
	 * 呼叫 API 取得會員預約課程清單
	 * @param {string} account 會員帳號(電話號碼)
	 * @returns {Promise<Object|null>} API 回應資料或 null
	 */
	async function getBookList(account) {
		return new Promise((resolve) => {
			const now = Date.now();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 2); // endDate 改為當天+2
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - 45); // 查詢最近一個半月

			const startDay = startDate.toISOString().split("T")[0];
			const endDay = endDate.toISOString().split("T")[0];

			const params = new URLSearchParams({
				c: "memberStatistics",
				m: "getBookList",
				random: now.toString(),
				sEcho: "1",
				iColumns: "13",
				sColumns: ",,,,,,,,,,,,",
				iDisplayStart: "0",
				iDisplayLength: "25",
				mDataProp_0: "status_name",
				bSortable_0: "false",
				mDataProp_1: "class_day",
				bSortable_1: "false",
				mDataProp_2: "class_time",
				bSortable_2: "false",
				mDataProp_3: "location_name",
				bSortable_3: "false",
				mDataProp_4: "class_name",
				bSortable_4: "false",
				mDataProp_5: "coach_name",
				bSortable_5: "false",
				mDataProp_6: "room_name",
				bSortable_6: "false",
				mDataProp_7: "position",
				bSortable_7: "false",
				mDataProp_8: "trade_no",
				bSortable_8: "false",
				mDataProp_9: "membership_name",
				bSortable_9: "false",
				mDataProp_10: "period",
				bSortable_10: "false",
				mDataProp_11: "executor",
				bSortable_11: "false",
				mDataProp_12: "12",
				bSortable_12: "false",
				iSortCol_0: "0",
				sSortDir_0: "asc",
				iSortingCols: "1",
				account: account,
				start_day: startDay,
				end_day: endDay,
				_: now.toString(),
			});

			const url = `https://admin.hypercore.com.tw/?${params.toString()}`;

			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: function (response) {
					try {
						const data = JSON.parse(response.responseText);
						resolve(data);
					} catch (err) {
						console.error("解析 API 回應失敗:", err);
						resolve(null);
					}
				},
				onerror: function (err) {
					console.error("API 請求失敗:", err);
					resolve(null);
				},
			});
		});
	}

	/**
	 * 執行黃牌動作 - 簽到或取消
	 * @param {string} bookId 預約編號
	 * @param {string} actionType 動作類型: "check_in" 或 "punished"
	 * @returns {Promise<Object>} API 回應資料
	 */
	async function setBookAction(bookId, actionType) {
		return new Promise((resolve, reject) => {
			const now = Date.now();
			const url = `https://admin.hypercore.com.tw/?c=sign&m=setBook&random=${now}`;

			// 建立 FormData
			const formData = new URLSearchParams();
			formData.append("book_id", bookId);
			formData.append("action_type", actionType);

			GM_xmlhttpRequest({
				method: "POST",
				url: url,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				data: formData.toString(),
				onload: function (response) {
					try {
						const data = JSON.parse(response.responseText);
						resolve(data);
					} catch (err) {
						console.error("解析 setBook API 回應失敗:", err);
						reject(err);
					}
				},
				onerror: function (err) {
					console.error("setBook API 請求失敗:", err);
					reject(err);
				},
			});
		});
	}

	/**
	 * 執行解除 No show 停權
	 * @param {string} mergeId 會籍 ID (從 data-trade_id 取得)
	 * @returns {Promise<Object>} API 回應資料
	 */
	async function cancelNoShow(mergeId) {
		return new Promise((resolve, reject) => {
			const now = Date.now();
			const url = `https://admin.hypercore.com.tw/?c=member&m=cancelNoShow&random=${now}`;

			// 建立 FormData
			const formData = new URLSearchParams();
			formData.append("merge_id", mergeId);

			GM_xmlhttpRequest({
				method: "POST",
				url: url,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				data: formData.toString(),
				onload: function (response) {
					try {
						const data = JSON.parse(response.responseText);
						resolve(data);
					} catch (err) {
						console.error("解析 cancelNoShow API 回應失敗:", err);
						reject(err);
					}
				},
				onerror: function (err) {
					console.error("cancelNoShow API 請求失敗:", err);
					reject(err);
				},
			});
		});
	}

	/**
	 * 取得星期幾的中文名稱
	 * @param {string} dateStr 日期字串 YYYY-MM-DD
	 * @returns {string} 星期幾的中文 (一~日)
	 */
	function getWeekdayInChinese(dateStr) {
		const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
		return weekdays[new Date(dateStr).getDay()];
	}

	/**
	 * 建立預約清單表格 HTML
	 * @param {Object} data API 回應資料
	 * @returns {string} 表格 HTML 字串
	 */
	function createBookListTable(data) {
		if (!data || !data.aaData || !Array.isArray(data.aaData) || data.aaData.length === 0) {
			return '<div class="booking-list-container"><p>無預約紀錄</p></div>';
		}

		// 狀態名稱對應
		const statusMap = {
			reserved: "📅預約中",
			check_in: "✅簽到",
			late_cancel: "⚠️黃牌",
			punished: "🟨黃牌不罰",
			cancel: "❌取消",
			waiting: "😢候補",
			no_show: "😞缺席",
		};

		const rows = data.aaData
			.map((record) => {
				const statusClass = `status-${record.status_name}`;
				const statusText = statusMap[record.status_name] || record.status_name;
				// 處理場館名稱，移除 'THE KEY YOGA '
				const locationName = (record.location_name || "").replace("THE KEY YOGA ", "");
				const roomName = (record.room_name || "").replace(/教室/g, "");

				const rowClass = record.status_name === "late_cancel" ? "late-cancel-row" : record.status_name === "no_show" ? "no-show-row" : "";

				// 日期/時間格式 MM/dd (一)<br>HH:mm
				let mmdd = record.class_day;
				let weekday = "";
				if (/^\d{4}-\d{2}-\d{2}$/.test(record.class_day)) {
					const parts = record.class_day.split("-");
					mmdd = `${parts[1]}/${parts[2]}`;
					weekday = getWeekdayInChinese(record.class_day);
				}

				const hhmm = record.class_time.substring(0, 5);
				const dateTime = `${mmdd} (${weekday})<br>${hhmm}`;

				// 黃牌狀態顯示操作按鈕
				const actionButtons =
					record.status_name === "late_cancel"
						? `<br><div class="action-buttons">
					<button class="action-btn action-btn-checkin" data-book-id="${record.book_id}" data-action="check_in">補簽</button>
					<button class="action-btn action-btn-cancel" data-book-id="${record.book_id}" data-action="punished">黃牌不罰</button>
				</div>`
						: "";

				// 教室欄位格式: 場館名稱<br>教室名稱
				const locationRoom = `${locationName}<br>${roomName}`;

				return `<tr class="${rowClass}">
				<td class="${statusClass}">${statusText}${actionButtons}</td>
				<td>${dateTime}</td>
				<td>${record.class_name}<br>${record.coach_name}</td>
				<td>${locationRoom}</td>
			</tr>`;
			})
			.join("");

		return `<div class="booking-list-container">
			<table class="booking-list-table">
				<thead><tr>
					<th>狀態</th>
					<th>日期</th>
					<th>課程</th>
					<th>教室</th>
				</tr></thead>
				<tbody>${rows}</tbody>
			</table>
		</div>`;
	}

	/**
	 * 將預約清單表格插入到頁面 (彈窗模式)
	 * @param {Object} data API 回應資料
	 * @param {Object} membershipStatus 會籍狀態物件 {text, badgeClass}
	 */
	function insertBookListTable(data, membershipStatus) {
		// 尋找會員資訊區塊
		const memberProfileSection = document.getElementById("member_profile_info");
		if (!memberProfileSection) {
			console.error("找不到 #member_profile_info");
			return;
		}

		// 找到第二個 col-md-6
		const colMd6List = memberProfileSection.querySelectorAll(".col-md-6");
		if (colMd6List.length < 2) {
			console.error("找不到第二個 .col-md-6");
			return;
		}

		const targetCol = colMd6List[1];
		// 移除舊的 booking-list-title
		targetCol.querySelectorAll(".booking-list-title").forEach((e) => e.remove());

		// 計算總筆數
		const totalCount = data?.aaData?.length || 0;

		// 建立只顯示 badge 的容器
		const titleDiv = document.createElement("div");
		titleDiv.className = "booking-list-title";

		if (membershipStatus?.text) {
			const badge = document.createElement("span");
			badge.className = `membership-status-badge ${membershipStatus.badgeClass}`;
			badge.textContent = membershipStatus.text;

			if (membershipStatus.text === "停權中") {
				const cancelButton = createCancelNoShowButton();
				if (cancelButton) badge.appendChild(cancelButton);
			}
			titleDiv.appendChild(badge);
		}

		// 取得查詢日期區間
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 2);
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 45);
		const pad = (n) => n.toString().padStart(2, "0");
		const dateRangeText = `${pad(startDate.getMonth() + 1)}/${pad(startDate.getDate())}~${pad(endDate.getMonth() + 1)}/${pad(endDate.getDate())}`;

		// 建立彈窗
		const modal = document.createElement("div");
		modal.className = "booking-modal";
		modal.innerHTML = `
			<div class="booking-modal-content">
				<div class="booking-modal-header">
					<h2>上課紀錄 (${dateRangeText})...共 ${totalCount} 筆</h2>
					<span class="booking-modal-close">&times;</span>
				</div>
				${createBookListTable(data)}
			</div>
		`;

		// 只在 badge 本身被點擊時顯示彈窗，排除解除按鈕
		titleDiv.addEventListener("click", (e) => {
			const cancelBtn = titleDiv.querySelector(".cancel_no_show");
			if (cancelBtn && (e.target === cancelBtn || cancelBtn.contains(e.target))) return;
			modal.style.display = "block";
		});

		// 點擊關閉按鈕或背景時關閉彈窗
		modal.querySelector(".booking-modal-close").addEventListener("click", () => {
			modal.style.display = "none";
		});

		modal.addEventListener("click", (event) => {
			if (event.target === modal) modal.style.display = "none";
		});

		// 插入到第二個 col-md-6 的最下方
		targetCol.appendChild(titleDiv);
		document.body.appendChild(modal);
		console.log("預約清單已插入到會員資訊區塊 (彈窗模式)");
		bindActionButtonEvents();
	}

	/**
	 * 綁定動作按鈕的點擊事件
	 */
	function bindActionButtonEvents() {
		// 使用事件委派方式處理所有動作按鈕
		document.addEventListener("click", async function (event) {
			const target = event.target;
			// 檢查是否點擊了動作按鈕
			if (!target.classList.contains("action-btn")) return;

			const bookId = target.getAttribute("data-book-id");
			const actionType = target.getAttribute("data-action");

			if (!bookId || !actionType) {
				console.error("缺少 book_id 或 action_type");
				return;
			}

			// 防止重複點擊
			if (target.disabled) return;

			// 確認視窗
			const confirmMsg =
				actionType === "check_in"
					? "請確認是否進行補簽 (扣課)？"
					: actionType === "punished"
					? "請確認是否進行黃牌不懲罰 (不扣課)？"
					: "請確認是否執行此操作？";

			if (!window.confirm(confirmMsg)) return;

			// 禁用所有同列的按鈕
			const row = target.closest("tr");
			const allButtons = row.querySelectorAll(".action-btn");
			allButtons.forEach((btn) => (btn.disabled = true));

			try {
				console.log(`執行動作: bookId=${bookId}, actionType=${actionType}`);
				const response = await setBookAction(bookId, actionType);
				console.log("API 回應:", response);

				// 根據回應顯示訊息
				if (response?.message === "success") {
					const actionText = actionType === "check_in" ? "簽到" : "取消";
					alert(`${actionText}成功`);
					window.location.reload();
				} else {
					const message = response?.message || "未知錯誤";
					alert(`操作失敗：${message}`);
					allButtons.forEach((btn) => (btn.disabled = false));
				}
			} catch (err) {
				console.error("執行動作失敗:", err);
				alert(`操作失敗：${err.message}`);
				allButtons.forEach((btn) => (btn.disabled = false));
			}
		});
	}

	/**
	 * 處理會員詳細頁面 - 檢查遲到取消紀錄並顯示預約清單
	 */
	async function handleMemberDetailPage() {
		try {
			console.log("偵測到會員詳細頁面,開始檢查遲到取消紀錄");

			const phone = await getMemberPhone();
			if (!phone) {
				console.error("無法取得會員電話號碼");
				return;
			}

			console.log("會員電話:", phone);

			const data = await getBookList(phone);
			if (!data) {
				console.error("無法取得會員預約清單");
				return;
			}

			console.log("成功取得會員預約清單", data);

			// 取得會籍狀態
			const membershipStatus = await getMembershipStatus();
			if (membershipStatus) {
				console.log("會籍狀態:", membershipStatus);
			}

			// 插入預約清單表格到頁面,並傳入會籍狀態
			insertBookListTable(data, membershipStatus);
		} catch (err) {
			console.error("處理會員詳細頁面失敗:", err);
		}
	}

	/**
	 * 模糊搜尋姓名或電話
	 * @param {string} keyword 搜尋關鍵字
	 * @param {Object} namePhoneMap 姓名電話對應物件
	 * @returns {Array<{name: string, phone: string}>} 搜尋結果陣列
	 */
	function fuzzySearch(keyword, namePhoneMap) {
		if (!keyword || !namePhoneMap) return [];

		const normalizedKeyword = keyword.trim().toLowerCase();
		if (!normalizedKeyword) return [];

		const results = [];
		for (const [name, phone] of Object.entries(namePhoneMap)) {
			if (name.toLowerCase().includes(normalizedKeyword) || phone.toLowerCase().includes(normalizedKeyword)) {
				results.push({ name, phone });
			}
		}

		return results;
	}

	/**
	 * 清除所有模糊搜尋的 badge
	 */
	function clearFuzzySearchBadges() {
		const container = document.querySelector(".fuzzy-search-badge-container");
		if (container) {
			container.remove();
		}
	}

	/**
	 * 顯示模糊搜尋結果 badge
	 * @param {Array<{name: string, phone: string}>} results 搜尋結果
	 * @param {HTMLElement} inputElement 輸入框元素
	 */
	function showFuzzySearchBadges(results, inputElement) {
		clearFuzzySearchBadges();

		if (!results || results.length === 0) return;

		const searchInputArea = document.querySelector("#search_input_area");
		if (!searchInputArea) return;

		// 建立 badge 容器
		const container = GM_addElement(searchInputArea, "div", {
			class: "fuzzy-search-badge-container",
		});

		// 建立每個 badge
		results.forEach((result) => {
			const badge = GM_addElement(container, "button", {
				class: "fuzzy-search-badge",
				textContent: `${result.name} ${result.phone}`,
			});

			badge.addEventListener("click", () => {
				// 填入電話到 input 欄位
				inputElement.value = result.phone;
				// 清除所有 badge
				clearFuzzySearchBadges();
			});
		});

		console.log(`顯示 ${results.length} 筆模糊搜尋結果`);
	}

	/**
	 * 初始化會員查詢模糊搜尋功能
	 */
	async function initMemberSearchFuzzySearch() {
		try {
			console.log("初始化會員查詢模糊搜尋功能...");

			// 取得 Google Sheets 資料
			const namePhoneMap = await fetchGoogleSheetData();
			if (!namePhoneMap) {
				console.warn("無法取得 Google Sheets 資料，模糊搜尋功能未啟用");
				return;
			}

			const totalCount = Object.keys(namePhoneMap).length;
			console.log(`已載入 ${totalCount} 筆姓名電話資料`);

			// 顯示資料總數於 input placeholder
			function setPhoneInputPlaceholder() {
				const phoneInput = document.querySelector('input[name="search_phone"]');
				if (phoneInput) {
					phoneInput.placeholder = `請輸入姓名或電話 (共 ${totalCount} 筆搜尋)`;
				}
			}
			// 初始設置 placeholder
			setPhoneInputPlaceholder();

			// 等待會員查詢 modal 出現
			function setupFuzzySearch(retry = 0) {
				const phoneInput = document.querySelector('input[name="search_phone"]');
				if (!phoneInput) {
					if (retry < 100) {
						setTimeout(() => setupFuzzySearch(retry + 1), 200);
					}
					return;
				}

				// 避免重複綁定
				if (phoneInput.dataset.fuzzySearchBound === "true") return;
				phoneInput.dataset.fuzzySearchBound = "true";

				console.log("找到電話輸入欄位，綁定模糊搜尋事件");

				let debounceTimer = null;

				phoneInput.addEventListener("input", (event) => {
					const keyword = event.target.value;

					// 清除之前的計時器
					if (debounceTimer) {
						clearTimeout(debounceTimer);
					}

					// 設定新的計時器 (100ms 防抖)
					debounceTimer = setTimeout(() => {
						if (!keyword || keyword.trim() === "") {
							clearFuzzySearchBadges();
							return;
						}

						const results = fuzzySearch(keyword, namePhoneMap);
						showFuzzySearchBadges(results, phoneInput);
					}, 100);
				});

				// 當輸入框失去焦點且值為空時，清除 badge
				phoneInput.addEventListener("blur", () => {
					setTimeout(() => {
						if (!phoneInput.value || phoneInput.value.trim() === "") {
							clearFuzzySearchBadges();
						}
					}, 200);
				});

				console.log("模糊搜尋功能已啟用");
			}

			// 監聽 DOM 變化，當 modal 出現時設定模糊搜尋
			const observer = new MutationObserver(() => {
				const modal = document.querySelector("#memberSearchModal");
				if (modal && modal.style.display !== "none") {
					setupFuzzySearch();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			// 立即檢查一次
			setupFuzzySearch();
		} catch (err) {
			console.error("初始化會員查詢模糊搜尋失敗:", err);
		}
	}

	/**
	 * 檢查當前使用者是否為指定姓名
	 * @param {string} targetName 目標姓名
	 * @returns {boolean} 是否為目標使用者
	 */
	function isTargetUser(targetName) {
		const userNameElement = document.querySelector("#notifications-dropdown-toggle .navbar_staff_name");
		if (!userNameElement) return false;

		const userName = userNameElement.textContent.trim();
		console.log(`當前使用者: ${userName}`);

		return userName === targetName;
	}

	/**
	 * 監聽場館切換 modal 並添加快速切換按鈕
	 */
	function addQuickLocationButtons() {
		function tryInsertButtons(retry = 0) {
			const form = document.querySelector("#editor-location");
			if (!form) return;

			const locationSelect = form.querySelector("select#location_id");
			if (!locationSelect) {
				if (retry < 50) setTimeout(() => tryInsertButtons(retry + 1), 100);
				return;
			}

			// 避免重複插入
			if (form.querySelector(".quick-location-buttons")) return;

			if (locationSelect.options.length === 0) {
				if (retry < 50) setTimeout(() => tryInsertButtons(retry + 1), 100);
				return;
			}

			const yogaOptions = Array.from(locationSelect.options).filter((option) => option.text.includes("THE KEY YOGA"));

			if (yogaOptions.length === 0) return;

			const buttonContainer = document.createElement("div");
			buttonContainer.className = "quick-location-buttons";

			yogaOptions.forEach((option) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "quick-location-btn";
				btn.textContent = option.text.replace("THE KEY YOGA ", "");
				btn.setAttribute("data-location-id", option.value);

				btn.addEventListener("click", () => {
					locationSelect.value = option.value;
					locationSelect.dispatchEvent(new Event("change"));
					setTimeout(() => {
						const confirmBtn = form.querySelector("button#change_store");
						if (confirmBtn) confirmBtn.click();
					}, 100);
				});

				buttonContainer.appendChild(btn);
			});

			locationSelect.parentNode.appendChild(buttonContainer);
			console.log("已添加快速切換場館按鈕");
		}

		waitForElement("#editor-location", () => tryInsertButtons());
	}

	// 主流程
	registerMenuCommands();

	(async function main() {
		if (isLoginPage()) {
			console.log("偵測到登入/登出頁面,啟動自動登入");
			waitForElement("form#login_form", fillLoginForm);
		} else if (isMemberDetailPage()) {
			console.log("偵測到會員詳細頁面,啟動遲到取消紀錄檢查");
			handleMemberDetailPage();
		}

		addQuickLocationButtons();

		// 檢查使用者身份，若為蔡嘉如則啟動模糊搜尋功能
		waitForElement("#notifications-dropdown-toggle", () => {
			if (isTargetUser("蔡嘉如")) {
				console.log("偵測到目標使用者，啟動模糊搜尋功能");
				initMemberSearchFuzzySearch();
			} else {
				console.log("非目標使用者，不啟動模糊搜尋功能");
			}
		});
	})();
})();
