// ==UserScript==
// @name         The Key Auto Login
// @namespace    https://admin.hypercore.com.tw/*
// @version      1.26.0408.1
// @description  自動填入帳號密碼並登入 Hypercore 後台管理系統,自動選擇 THE KEY YOGA 台北古亭館,檢查會員遲到取消紀錄並顯示上課清單(滿版彈窗),支援黃牌簽到/取消操作,場館切換 modal 新增快速切換按鈕,會籍狀態 badge 顯示,一鍵解除 No show 停權功能,會員查詢電話輸入支援 Google Sheets 模糊搜尋(透過個人 Google 帳號 OAuth 存取),設定介面改為動態彈窗輸入
// @author       KuoAnn
// @match        https://admin.hypercore.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypercore.com.tw
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        unsafeWindow
// @connect      admin.hypercore.com.tw
// @connect      sheets.googleapis.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// ==/UserScript==

(function () {
	"use strict";

	const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
	const GOOGLE_SHEET_CACHE_MAX_AGE = 15 * 60 * 1000;
	const GOOGLE_ACCESS_TOKEN_REFRESH_BUFFER = 5 * 60 * 1000;
	const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
	const googleSheetState = {
		sheetId: "",
		clientId: "",
		email: "",
		accessToken: "",
		accessTokenExpire: 0,
		cachedData: null,
		cachedDataTime: 0,
		initialized: false,
	};
	let googleSheetDataLoadingPromise = null;
	let googleIdentityScriptPromise = null;

	function normalizeGoogleSheetRecords(records) {
		if (!Array.isArray(records)) return null;

		return records
			.map((record) => ({
				name: (record?.name || "").toString().trim(),
				phone: (record?.phone || "").toString().trim(),
			}))
			.filter((record) => record.name && record.phone);
	}

	function countGoogleSheetRecords(records) {
		return Array.isArray(records) ? records.length : 0;
	}

	function normalizePhoneForSearch(value) {
		return (value || "").toString().replace(/\D/g, "");
	}

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
		.booking-list-table tr:nth-child(even) { background: #e6f3ff; }
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
		.settings-modal {
			display: none;
			position: fixed;
			z-index: 10000;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			overflow: auto;
			background-color: rgba(0, 0, 0, 0.5);
		}
		.settings-modal-content {
			background-color: #fefefe;
			margin: 10px auto;
			padding: 30px;
			border: 1px solid #888;
			border-radius: 8px;
			width: 90%;
			max-width: 500px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
		}
		.settings-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
			border-bottom: 2px solid #007bff;
			padding-bottom: 10px;
		}
		.settings-modal-header h3 {
			margin: 0;
			color: #333;
			font-size: 20px;
		}
		.settings-modal-close {
			color: #aaa;
			font-size: 28px;
			font-weight: bold;
			cursor: pointer;
			transition: color 0.2s;
		}
		.settings-modal-close:hover,
		.settings-modal-close:focus {
			color: #000;
		}
		.settings-form-group {
			margin-bottom: 20px;
		}
		.settings-form-group label {
			display: block;
			margin-bottom: 8px;
			font-weight: 500;
			color: #333;
			font-size: 14px;
		}
		.settings-form-group input,
		.settings-form-group textarea {
			width: 100%;
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: 14px;
			box-sizing: border-box;
			font-family: inherit;
		}
		.settings-form-group textarea {
			min-height: 100px;
			resize: vertical;
		}
		.settings-form-group input:focus,
		.settings-form-group textarea:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
		}
		.settings-form-hint {
			margin-top: 6px;
			font-size: 12px;
			color: #666;
			line-height: 1.5;
		}
		.settings-form-actions {
			display: flex;
			gap: 10px;
			justify-content: flex-end;
			margin-top: 25px;
		}
		.settings-btn {
			padding: 10px 20px;
			border: none;
			border-radius: 4px;
			font-size: 14px;
			cursor: pointer;
			transition: all 0.2s;
			font-weight: 500;
		}
		.settings-btn-primary {
			background-color: #007bff;
			color: white;
		}
		.settings-btn-primary:hover {
			background-color: #0056b3;
		}
		.settings-btn-secondary {
			background-color: #6c757d;
			color: white;
		}
		.settings-btn-secondary:hover {
			background-color: #5a6268;
		}
	`);

	async function refreshGoogleSheetState() {
		const [sheetId, clientId, email, accessToken, accessTokenExpire, cachedData, cachedDataTime] = await Promise.all([
			GM_getValue("google_sheet_id", ""),
			GM_getValue("google_oauth_client_id", ""),
			GM_getValue("thekey_email", ""),
			GM_getValue("google_access_token", ""),
			GM_getValue("google_access_token_expire", 0),
			GM_getValue("google_sheet_cache", ""),
			GM_getValue("google_sheet_cache_time", 0),
		]);

		googleSheetState.sheetId = (sheetId || "").trim();
		googleSheetState.clientId = (clientId || "").trim();
		googleSheetState.email = (email || "").trim();
		googleSheetState.accessToken = accessToken || "";
		googleSheetState.accessTokenExpire = Number(accessTokenExpire) || 0;
		googleSheetState.cachedDataTime = Number(cachedDataTime) || 0;
		googleSheetState.cachedData = null;

		if (cachedData) {
			try {
				const parsedCachedData = JSON.parse(cachedData);
				const normalizedRecords = normalizeGoogleSheetRecords(parsedCachedData);

				if (normalizedRecords) {
					googleSheetState.cachedData = normalizedRecords;
				} else {
					console.warn("Google Sheets 舊版快取格式已失效，將重新抓取完整資料");
					googleSheetState.cachedDataTime = 0;
				}
			} catch (err) {
				console.warn("Google Sheets 快取格式錯誤，已忽略舊快取:", err);
			}
		}

		googleSheetState.initialized = true;
		return googleSheetState;
	}

	async function clearGoogleSheetCache() {
		googleSheetState.accessToken = "";
		googleSheetState.accessTokenExpire = 0;
		googleSheetState.cachedData = null;
		googleSheetState.cachedDataTime = 0;
		googleSheetDataLoadingPromise = null;

		await Promise.all([
			GM_setValue("google_sheet_cache", ""),
			GM_setValue("google_sheet_cache_time", 0),
			GM_setValue("google_access_token", ""),
			GM_setValue("google_access_token_expire", 0),
		]);
	}

	/**
	 * 顯示統一設定彈窗 (包含帳號密碼與 Google Sheets OAuth 設定)
	 */
	async function showSettingsModal() {
		// 取得目前儲存的值
		const currentEmail = await GM_getValue("thekey_email", "");
		const currentPassword = await GM_getValue("thekey_password", "");
		const currentSheetId = await GM_getValue("google_sheet_id", "");
		const currentGoogleClientId = await GM_getValue("google_oauth_client_id", "");
		const currentFuzzyUsers = await GM_getValue("fuzzy_search_usernames", "蔡嘉如,lulu");

		// 建立 modal
		const modal = document.createElement("div");
		modal.className = "settings-modal";
		modal.innerHTML = `
			<div class="settings-modal-content">
				<div class="settings-modal-header">
					<h3>設定</h3>
					<span class="settings-modal-close">&times;</span>
				</div>
				<div class="settings-form-group">
					<label for="settings-email">帳號 (Email)</label>
					<input type="email" id="settings-email" value="${currentEmail}" placeholder="請輸入帳號">
				</div>
				<div class="settings-form-group">
					<label for="settings-password">密碼</label>
					<input type="password" id="settings-password" value="${currentPassword}" placeholder="請輸入密碼">
				</div>
				<div class="settings-form-group">
					<label for="settings-sheet-id">Google Sheet ID</label>
					<input type="text" id="settings-sheet-id" value="${currentSheetId}" placeholder="請輸入 Google Sheet ID">
					<div class="settings-form-hint">請確認上方「帳號 (Email)」對此 Sheet 有檢視權限。</div>
				</div>
				<div class="settings-form-group">
					<label for="settings-google-client-id">Google OAuth Client ID</label>
					<input type="text" id="settings-google-client-id" value="${currentGoogleClientId}" placeholder="請輸入 Web application 類型的 OAuth Client ID">
					<div class="settings-form-hint">Google 會使用上方「帳號 (Email)」作為登入提示。首次使用模糊搜尋時會跳出授權視窗。</div>
				</div>
				<div class="settings-form-group">
					<label for="settings-fuzzy-users">啟用模糊搜尋使用者 (以逗號分隔)</label>
					<input type="text" id="settings-fuzzy-users" value="${currentFuzzyUsers}" placeholder="例如: 蔡嘉如,lulu (不計大小寫)">
				</div>
				<div class="settings-form-actions">
					<button class="settings-btn settings-btn-secondary" id="settings-cancel">取消</button>
					<button class="settings-btn settings-btn-primary" id="settings-save">儲存</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// 顯示 modal
		modal.style.display = "block";

		// 關閉按鈕事件
		const closeBtn = modal.querySelector(".settings-modal-close");
		const cancelBtn = modal.querySelector("#settings-cancel");
		const saveBtn = modal.querySelector("#settings-save");

		const closeModal = () => {
			modal.style.display = "none";
			setTimeout(() => modal.remove(), 300);
		};

		closeBtn.addEventListener("click", closeModal);
		cancelBtn.addEventListener("click", closeModal);

		// 點擊背景關閉
		modal.addEventListener("click", (event) => {
			if (event.target === modal) closeModal();
		});

		// 儲存按鈕事件
		saveBtn.addEventListener("click", async () => {
			const email = modal.querySelector("#settings-email").value.trim();
			const password = modal.querySelector("#settings-password").value.trim();
			const sheetId = modal.querySelector("#settings-sheet-id").value.trim();
			const googleClientId = modal.querySelector("#settings-google-client-id").value.trim();
			const fuzzyUsers = modal.querySelector("#settings-fuzzy-users").value.trim();

			// 基本驗證 (帳號密碼必填)
			if (!email || !password) {
				alert("帳號和密碼不能為空！");
				return;
			}

			// 儲存帳號密碼
			await GM_setValue("thekey_email", email);
			await GM_setValue("thekey_password", password);

			// 儲存 Google Sheets 設定 (允許為空)
			await GM_setValue("google_sheet_id", sheetId);
			await GM_setValue("google_oauth_client_id", googleClientId);
			// 儲存模糊搜尋啟用使用者 (支援多筆 , 隔開)
			await GM_setValue("fuzzy_search_usernames", fuzzyUsers);

			const googleSettingsChanged = email !== currentEmail || sheetId !== currentSheetId || googleClientId !== currentGoogleClientId;
			if (googleSettingsChanged) {
				await clearGoogleSheetCache();
			}

			window.location.reload();
			closeModal();
		});

		// Enter 鍵儲存 (僅限非 textarea)
		modal.addEventListener("keypress", (event) => {
			if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
				saveBtn.click();
			}
		});
	}

	/**
	 * 註冊 Tampermonkey 選單命令
	 */
	function registerMenuCommands() {
		GM_registerMenuCommand("設定", () => {
			showSettingsModal();
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

	function getGoogleIdentityApi() {
		const pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
		const googleIdentity = pageWindow.google;
		if (!googleIdentity?.accounts?.oauth2) {
			throw new Error("Google OAuth 元件尚未載入，請重新整理頁面後再試");
		}
		return googleIdentity;
	}

	function loadGoogleIdentityScript() {
		if (googleIdentityScriptPromise) {
			return googleIdentityScriptPromise;
		}

		googleIdentityScriptPromise = new Promise((resolve, reject) => {
			const pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
			if (pageWindow.google?.accounts?.oauth2) {
				resolve(pageWindow.google);
				return;
			}

			const existingScript = document.querySelector(`script[src^="${GOOGLE_IDENTITY_SCRIPT_URL}"]`);
			if (existingScript) {
				existingScript.addEventListener("load", () => resolve(pageWindow.google), { once: true });
				existingScript.addEventListener("error", () => reject(new Error("Google OAuth 元件載入失敗")), { once: true });
				return;
			}

			const script = document.createElement("script");
			script.src = GOOGLE_IDENTITY_SCRIPT_URL;
			script.async = true;
			script.defer = true;
			script.onload = () => resolve(pageWindow.google);
			script.onerror = () => reject(new Error("Google OAuth 元件載入失敗"));
			(document.head || document.documentElement).appendChild(script);
		});

		return googleIdentityScriptPromise;
	}

	async function getGoogleUserAccessToken(interactive = false) {
		if (!googleSheetState.initialized) {
			await refreshGoogleSheetState();
		}

		if (googleSheetState.accessToken && Date.now() < googleSheetState.accessTokenExpire - GOOGLE_ACCESS_TOKEN_REFRESH_BUFFER) {
			return googleSheetState.accessToken;
		}

		if (!interactive) {
			return null;
		}

		if (!googleSheetState.clientId) {
			throw new Error("請先在設定中填入 Google OAuth Client ID");
		}

		if (!googleSheetState.email) {
			throw new Error("請先在設定中填入帳號 (Email)，Google 會使用它作為登入提示");
		}

		console.log("正在向 Google 取得使用者 Access Token...");
		await loadGoogleIdentityScript();
		const googleIdentity = getGoogleIdentityApi();

		return new Promise((resolve, reject) => {
			const tokenClient = googleIdentity.accounts.oauth2.initTokenClient({
				client_id: googleSheetState.clientId,
				scope: GOOGLE_SHEETS_SCOPE,
				login_hint: googleSheetState.email,
				callback: async (tokenResponse) => {
					try {
						if (!tokenResponse || tokenResponse.error || !tokenResponse.access_token) {
							const message = tokenResponse?.error_description || tokenResponse?.error || "Google OAuth 未回傳 access token";
							reject(new Error(message));
							return;
						}

						const expiresIn = Number(tokenResponse.expires_in) || 3600;
						googleSheetState.accessToken = tokenResponse.access_token;
						googleSheetState.accessTokenExpire = Date.now() + expiresIn * 1000;

						await Promise.all([
							GM_setValue("google_access_token", googleSheetState.accessToken),
							GM_setValue("google_access_token_expire", googleSheetState.accessTokenExpire),
						]);

						console.log("成功取得 Google 使用者 Access Token");
						resolve(googleSheetState.accessToken);
					} catch (err) {
						reject(err);
					}
				},
				error_callback: (error) => {
					const message = error?.type ? `Google OAuth 失敗: ${error.type}` : "Google OAuth 失敗";
					reject(new Error(message));
				},
			});

			tokenClient.requestAccessToken({
				prompt: "",
				login_hint: googleSheetState.email,
			});
		});
	}

	/**
	 * 使用個人 Google 帳號 OAuth 讀取 Google Sheets 資料
	 * @param {{interactive?: boolean}} [options] 載入選項
	 * @returns {Promise<Object|null>} 姓名電話對應物件 {姓名: 電話, ...} 或 null
	 */
	async function fetchGoogleSheetData(options = {}) {
		const { interactive = false } = options;

		try {
			if (!googleSheetState.initialized) {
				await refreshGoogleSheetState();
			}

			if (!googleSheetState.sheetId) {
				console.warn("Google Sheets 設定不完整，請先設定 Sheet ID");
				return null;
			}

			if (googleSheetState.cachedData && Date.now() - googleSheetState.cachedDataTime < GOOGLE_SHEET_CACHE_MAX_AGE) {
				console.log("使用快取的 Google Sheets 資料");
				return googleSheetState.cachedData;
			}

			const accessToken = await getGoogleUserAccessToken(interactive);
			if (!accessToken) {
				console.warn("目前沒有可用的 Google Access Token，等待使用者在首次搜尋時授權");
				return null;
			}

			const sheetName = "TK MB LOG";
			const range = `${sheetName}!C:D`;
			const url = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetState.sheetId}/values/${encodeURIComponent(range)}`;

			console.log(`正在使用個人 Google 帳號 ${googleSheetState.email} 讀取 Google Sheets 資料...`);

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
								if (response.status === 401) {
									googleSheetState.accessToken = "";
									googleSheetState.accessTokenExpire = 0;
									await Promise.all([
										GM_setValue("google_access_token", ""),
										GM_setValue("google_access_token_expire", 0),
									]);
								}

								let errorMessage = `Google Sheets API 請求失敗 (${response.status})`;
								if (response.status === 403) {
									errorMessage = `Google 帳號 ${googleSheetState.email || "(未設定)"} 沒有此 Sheet 的檢視權限，請確認共用設定`;
								} else if (response.status === 401) {
									errorMessage = "Google 授權已失效，請重新輸入搜尋關鍵字以重新授權";
								}

								console.error("Google Sheets API 請求失敗:", response.statusText, response.responseText);
								reject(new Error(errorMessage));
								return;
							}

							const data = JSON.parse(response.responseText);
							if (!data.values || data.values.length === 0) {
								console.warn("Google Sheets 沒有資料");
								resolve(null);
								return;
							}

							const records = [];
							for (let i = 1; i < data.values.length; i++) {
								const row = data.values[i];
								if (row.length < 2) continue;

								const name = (row[0] || "").toString().trim();
								const phone = (row[1] || "").toString().trim();

								if (name && phone) {
									records.push({ name, phone });
								}
							}

							console.log(`成功取得 ${records.length} 筆姓名電話資料（已排除標題列）`);

							googleSheetState.cachedData = records;
							googleSheetState.cachedDataTime = Date.now();
							await Promise.all([
								GM_setValue("google_sheet_cache", JSON.stringify(records)),
								GM_setValue("google_sheet_cache_time", googleSheetState.cachedDataTime),
							]);

							resolve(records);
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

	async function ensureGoogleSheetDataLoaded(interactive = false) {
		if (googleSheetState.cachedData && Date.now() - googleSheetState.cachedDataTime < GOOGLE_SHEET_CACHE_MAX_AGE) {
			return googleSheetState.cachedData;
		}

		if (!googleSheetDataLoadingPromise) {
			googleSheetDataLoadingPromise = fetchGoogleSheetData({ interactive }).finally(() => {
				googleSheetDataLoadingPromise = null;
			});
		}

		return googleSheetDataLoadingPromise;
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
	 * 點擊管理按鈕並等待表單載入,取得 merge_id
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
	 * 執行解除 No show 停權 - 透過點擊頁面上的按鈕
	 * @returns {Promise<boolean>} 是否成功點擊按鈕
	 */
	async function cancelNoShow() {
		return new Promise(async (resolve, reject) => {
			try {
				// 先取得 merge_id
				const mergeId = await getMergeIdFromNoShowRow();

				if (!mergeId) {
					console.error("無法取得 merge_id");
					reject(new Error("無法取得 merge_id"));
					return;
				}

				console.log(`已取得 merge_id: ${mergeId}, 準備點擊解除按鈕`);

				// 等待「解除 No show 停權」按鈕出現並點擊
				// 使用更精確的選擇器,確保選到的是頁面上的按鈕,而不是腳本產生的按鈕
				waitForElement(".form-actions .cancel_no_show", () => {
					const cancelButton = document.querySelector(".form-actions .cancel_no_show");
					if (cancelButton) {
						console.log("找到「解除 No show 停權」按鈕,準備點擊");
						cancelButton.click();
						resolve(true);
					} else {
						console.error("找不到「解除 No show 停權」按鈕");
						reject(new Error("找不到「解除 No show 停權」按鈕"));
					}
				});
			} catch (err) {
				console.error("cancelNoShow 執行失敗:", err);
				reject(err);
			}
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
				console.log("開始執行解除 No show 停權...");
				await cancelNoShow();
				console.log("已點擊「解除 No show 停權」按鈕");

				// 等待一段時間讓系統處理,然後重新載入頁面
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
				// 場館名稱（移除 'THE KEY YOGA '）
				const venueName = (record.location_name || "").replace("THE KEY YOGA ", "");
				// 教室名稱（移除 '教室'）
				const roomName = (record.room_name || "").replace(/教室/g, "");

				const rowClass = record.status_name === "late_cancel" ? "late-cancel-row" : record.status_name === "no_show" ? "no-show-row" : "";

				// 日期/時間格式 MM/dd (一) HH:mm
				let mmdd = record.class_day;
				let weekday = "";
				if (/^\d{4}-\d{2}-\d{2}$/.test(record.class_day)) {
					const parts = record.class_day.split("-");
					mmdd = `${parts[1]}/${parts[2]}`;
					weekday = getWeekdayInChinese(record.class_day);
				}
				const hhmm = record.class_time.substring(0, 5);
				const dateTime = `${mmdd} (${weekday}) ${hhmm}`;

				// 黃牌狀態顯示操作按鈕
				const actionButtons =
					record.status_name === "late_cancel" || record.status_name === "no_show"
						? `<br><div class="action-buttons">
						   <button class="action-btn action-btn-checkin" data-book-id="${record.book_id}" data-action="check_in">補簽</button>
						   <button class="action-btn action-btn-cancel" data-book-id="${record.book_id}" data-action="punished">黃牌不罰</button>
					   </div>`
						: "";

				return `<tr class="${rowClass}">
				   <td class="${statusClass}">${statusText}${actionButtons}</td>
				   <td>${dateTime}</td>
				   <td>${record.class_name}</td>
				   <td>${record.coach_name}</td>
				   <td>${roomName}</td>
				   <td>${venueName}</td>
			   </tr>`;
			})
			.join("");

		return `<div class="booking-list-container">
			   <table class="booking-list-table">
				   <thead><tr>
					   <th>狀態</th>
					   <th>時間</th>
					   <th>課程</th>
					   <th>教練</th>
					   <th>教室</th>
					   <th>場館</th>
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
	 * @param {Array<{name: string, phone: string}>} records 姓名電話資料
	 * @returns {Array<{name: string, phone: string}>} 搜尋結果陣列
	 */
	function fuzzySearch(keyword, records) {
		if (!keyword || !Array.isArray(records)) return [];

		const normalizedKeyword = keyword.trim().toLowerCase();
		if (!normalizedKeyword) return [];

		const normalizedKeywordPhone = normalizePhoneForSearch(keyword);
		const results = [];
		for (const record of records) {
			const name = (record?.name || "").toString();
			const phone = (record?.phone || "").toString();
			const normalizedPhone = phone.toLowerCase();
			const normalizedPhoneDigits = normalizePhoneForSearch(phone);

			if (
				name.toLowerCase().includes(normalizedKeyword) ||
				normalizedPhone.includes(normalizedKeyword) ||
				(normalizedKeywordPhone && normalizedPhoneDigits.includes(normalizedKeywordPhone))
			) {
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
				// 自動觸發查詢 submit
				const form = inputElement.closest("form");
				if (form) {
					// 顯示 loading 狀態
					const submitBtn = form.querySelector("#submitBtn");
					if (submitBtn) {
						submitBtn.querySelector(".default-text").style.display = "none";
						submitBtn.querySelector(".loading-text").style.display = "inline-block";
					}
					// 觸發 submit
					form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
				}
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
			await refreshGoogleSheetState();

			let namePhoneRecords = googleSheetState.cachedData;
			let totalCount = countGoogleSheetRecords(namePhoneRecords);
			let authErrorMessage = "";

			function setPhoneInputPlaceholder(message = "") {
				const phoneInput = document.querySelector('input[name="search_phone"]');
				if (!phoneInput) return;

				if (message) {
					phoneInput.placeholder = message;
					return;
				}

				if (totalCount > 0) {
					phoneInput.placeholder = `請輸入姓名或電話 (共 ${totalCount} 筆搜尋)`;
					return;
				}

				phoneInput.placeholder = "請輸入姓名或電話 (首次使用會要求 Google 授權)";
			}

			async function ensureSearchData(interactive = false) {
				const data = await ensureGoogleSheetDataLoaded(interactive);
				if (!data) {
					return null;
				}

				namePhoneRecords = data;
				totalCount = countGoogleSheetRecords(namePhoneRecords);
				authErrorMessage = "";
				console.log(`已載入 ${totalCount} 筆姓名電話資料`);
				setPhoneInputPlaceholder();
				return namePhoneRecords;
			}

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
				setPhoneInputPlaceholder(authErrorMessage);

				let debounceTimer = null;

				phoneInput.addEventListener("input", async (event) => {
					const keyword = event.target.value;

					// 清除之前的計時器
					if (debounceTimer) {
						clearTimeout(debounceTimer);
					}

					if (!keyword || keyword.trim() === "") {
						clearFuzzySearchBadges();
						setPhoneInputPlaceholder(authErrorMessage);
						return;
					}

					if (!namePhoneRecords) {
						try {
							setPhoneInputPlaceholder("Google 授權中，請完成授權後再搜尋...");
							const loadedData = await ensureSearchData(true);
							if (!loadedData) {
								authErrorMessage = "無法取得 Google Sheets 資料";
								setPhoneInputPlaceholder(authErrorMessage);
								clearFuzzySearchBadges();
								return;
							}
						} catch (err) {
							authErrorMessage = err.message || "Google 授權失敗";
							console.error("載入 Google Sheets 資料失敗:", err);
							setPhoneInputPlaceholder(authErrorMessage);
							clearFuzzySearchBadges();
							alert(authErrorMessage);
							return;
						}
					}

					// 設定新的計時器 (100ms 防抖)
					debounceTimer = setTimeout(() => {
						if (!keyword || keyword.trim() === "") {
							clearFuzzySearchBadges();
							return;
						}

						const results = fuzzySearch(keyword, namePhoneRecords);
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
			void ensureSearchData(false);
		} catch (err) {
			console.error("初始化會員查詢模糊搜尋失敗:", err);
		}
	}

	/**
	 * 檢查當前使用者是否為指定姓名
	 * @param {string} targetName 目標姓名
	 * @returns {boolean} 是否為目標使用者
	 */
	function isTargetUser(targetNames) {
		const userNameElement = document.querySelector("#notifications-dropdown-toggle .navbar_staff_name");
		if (!userNameElement) return false;

		const userName = userNameElement.textContent.trim();
		console.log(`當前使用者: ${userName}`);

		const normalizedUserName = userName.toLowerCase();
		if (Array.isArray(targetNames)) {
			return targetNames.some((t) => (t || '').toString().toLowerCase() === normalizedUserName);
		}
		return (targetNames || '').toString().toLowerCase() === normalizedUserName;
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

		// 檢查使用者身份，若為設定的目標使用者則啟動模糊搜尋功能 (支援多筆，以逗號分隔，不計大小寫)
		waitForElement("#notifications-dropdown-toggle", () => {
			(async () => {
				try {
					const raw = (await GM_getValue("fuzzy_search_usernames", "蔡嘉如,lulu")) || "";
					const targets = raw.split(",").map((s) => s.trim()).filter(Boolean);
					if (targets.length > 0 && isTargetUser(targets)) {
						console.log("偵測到目標使用者，啟動模糊搜尋功能");
						initMemberSearchFuzzySearch();
					} else {
						console.log("非目標使用者，不啟動模糊搜尋功能");
					}
				} catch (err) {
					console.error("檢查目標使用者失敗:", err);
				}
			})();
		});
	})();
})();
