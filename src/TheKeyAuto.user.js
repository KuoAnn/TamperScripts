// ==UserScript==
// @name         The Key Auto Login
// @namespace    https://admin.hypercore.com.tw/*
// @version      1.26.0910.5
// @description  自動填入帳號密碼並登入 Hyperwell(原 Hypercore) 後台管理系統,登入後自動切換至 THE KEY YOGA 台北古亭館,導覽列切換場館改為古亭/松仁/林口三顆一鍵切換按鈕,檢查會員遲到取消紀錄並顯示上課清單(滿版彈窗),支援黃牌簽到/取消操作,場館切換 modal 新增快速切換按鈕,會籍狀態 badge 顯示,會員查詢電話輸入支援 Google Sheets 模糊搜尋(透過個人 Google 帳號 OAuth 存取),設定介面改為動態彈窗輸入
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

	// 登入後預設場館: THE KEY YOGA 台北古亭館 (站方預設為松仁館)
	const TARGET_LOCATION_NAME = "古亭";
	const PENDING_LOCATION_SWITCH_KEY = "thekey_pending_location_switch";

	// 導覽列快速切換的三個場館,順序即顯示順序。以場館名稱關鍵字比對下拉選項,不寫死 location_id
	const NAV_LOCATIONS = ["古亭", "松仁", "林口"];

	/**
	 * 站方 2026 改版 (Hypercore -> Hyperwell) 後的 DOM 對照表。
	 * 每個項目都是候選清單,由新到舊依序嘗試,舊選擇器保留以相容尚未改版的環境。
	 */
	const SELECTORS = {
		// 導覽列使用者姓名 (舊: #notifications-dropdown-toggle .navbar_staff_name)
		staffName: [
			"#navbar-user-menu-toggle .navbar_staff_name",
			"#navbar-user-menu-toggle-mobile .navbar_staff_name",
			".navbar_staff_name",
			"#notifications-dropdown-toggle .navbar_staff_name",
		],
		// 會員摘要區塊插入點 (舊: #member_profile_info .col-md-6:nth-of-type(2))
		bookListAnchor: [
			"#member_profile_info .member-summary-actions",
			"#member_profile_info .member-summary-footer",
			"#member_profile_info .member-summary-column",
			"#member_profile_info .widget-body",
		],
		// 場館切換下拉 (舊: select#location_id;新 id 為 switch_store_location_id)
		locationSelect: ['select[name="location_id"]', "select#switch_store_location_id", "select#location_id"],
		// 會籍列的狀態欄 (舊: td:nth-child(3);新版整列改為單一卡片)
		packageStatus: [".member-package-card-status", "td:nth-child(3)"],
	};

	/**
	 * 依候選清單依序尋找元素
	 * @param {string[]} selectors 候選 CSS 選擇器
	 * @param {ParentNode} [root=document] 搜尋根節點
	 * @returns {Element|null}
	 */
	function queryFirst(selectors, root = document) {
		for (const selector of selectors) {
			const el = root.querySelector(selector);
			if (el) return el;
		}
		return null;
	}

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
	// 預先建立的 Google token client (見 prepareGoogleTokenClient 的說明)
	let googleTokenClient = null;
	let googleTokenClientKey = "";
	let googleTokenPending = null;

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

	function hasFreshGoogleSheetCache() {
		return !!(googleSheetState.cachedData && Date.now() - googleSheetState.cachedDataTime < GOOGLE_SHEET_CACHE_MAX_AGE);
	}

	// 樣式一律取自站方 Bootstrap 3 主題的實際 token,避免腳本插入的元件與原站風格不一致
	GM_addStyle(`
		:root {
			/* 站方主題色 (取自 .btn-* / .label-* 的 computed style) */
			--tk-primary: #5d8fc2;
			--tk-primary-border: #4a82bb;
			--tk-danger: #dd5826;
			--tk-danger-border: #ca4e20;
			--tk-warning: #f0b518;
			--tk-warning-border: #e0a70f;
			--tk-success: #64bd63;
			--tk-success-border: #52b551;
			--tk-muted: #999999;
			/* 中性色 */
			--tk-text: #555555;
			--tk-surface: #ffffff;
			--tk-surface-alt: #fafbfc;
			--tk-surface-head: #f8f8f8;
			--tk-border: #e8eaed;
			--tk-input-border: #d6dcea;
			--tk-input-text: #2f3b52;
			/* 由主題色調出的列底色 */
			--tk-warning-soft: #fdf4dc;
			--tk-danger-soft: #fbe7de;
			/* 圓角與陰影 */
			--tk-radius: 4px;
			--tk-radius-sm: 3px;
			--tk-radius-label: 2.75px;
			--tk-radius-input: 2px;
			--tk-radius-modal: 6px;
			--tk-shadow-modal: 0 5px 15px rgba(0, 0, 0, 0.5);
			--tk-shadow-card: 0 1px 0 rgba(0, 0, 0, 0.03);
		}
		.booking-list-table {
			width: 100%;
			margin-top: 12px;
			border-collapse: collapse;
			background: var(--tk-surface);
			box-shadow: var(--tk-shadow-card);
		}
		.booking-list-table th,
		.booking-list-table td {
			padding: 10px;
			text-align: center;
			border: 1px solid var(--tk-border);
			font-size: 14px;
			color: var(--tk-text);
			font-weight: 300;
		}
		.booking-list-table th {
			background-color: var(--tk-surface-head);
			font-weight: 600;
			color: var(--tk-text);
			text-align: center;
		}
		.booking-list-table tr:nth-child(even) {
			background: var(--tk-surface-alt);
		}
		.booking-list-table tr:hover {
			background-color: #f2f5f9;
		}
		.booking-list-table .status-late_cancel {
			background-color: var(--tk-warning-soft) !important;
			color: var(--tk-warning-border);
			font-weight: 600;
		}
		.booking-list-table tr.late-cancel-row {
			background-color: var(--tk-warning-soft) !important;
		}
		.booking-list-table tr.no-show-row {
			background-color: var(--tk-danger-soft) !important;
		}
		.booking-list-table .status-check_in {
			color: var(--tk-success-border);
		}
		.booking-list-table .status-reserved {
			color: var(--tk-primary-border);
		}
		.booking-list-container {
			margin-top: 12px;
		}
		.booking-list-title {
			margin-top: 6px;
			margin-bottom: 10px;
			cursor: pointer;
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
			/* 對齊站方 .modal-backdrop: #000 @ .5 */
			background-color: rgba(0, 0, 0, 0.5);
		}
		.booking-modal-content {
			background-color: var(--tk-surface);
			margin: 2% auto;
			padding: 20px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			width: 95%;
			max-width: 1400px;
			border-radius: var(--tk-radius-modal);
			box-shadow: var(--tk-shadow-modal);
			max-height: 90vh;
			overflow-y: auto;
		}
		.booking-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
			border-bottom: 1px solid #e5e5e5;
			padding-bottom: 15px;
		}
		.booking-modal-header h2 {
			margin: 0;
			/* 對齊站方 .modal-title: 18px / 300 */
			color: var(--tk-text);
			font-size: 18px;
			font-weight: 300;
		}
		/* 對齊站方 .close */
		.booking-modal-close,
		.settings-modal-close {
			color: #000;
			opacity: 0.2;
			font-size: 21px;
			font-weight: 700;
			line-height: 1;
			text-shadow: 0 1px 0 #fff;
			cursor: pointer;
			transition: opacity 0.15s;
		}
		.booking-modal-close:hover,
		.booking-modal-close:focus,
		.settings-modal-close:hover,
		.settings-modal-close:focus {
			opacity: 0.5;
		}
		.action-buttons {
			display: flex;
			gap: 6px;
			flex-direction: row;
			justify-content: center;
		}
		/* 對齊站方 .btn.btn-xs */
		.action-btn {
			padding: 3px 8px;
			border: 1px solid transparent;
			border-radius: var(--tk-radius-sm);
			font-size: 12px;
			line-height: 1.5;
			cursor: pointer;
			font-weight: 400;
			color: #fff;
		}
		.action-btn-checkin {
			background-color: var(--tk-success);
			border-color: var(--tk-success-border);
		}
		.action-btn-checkin:hover:not(:disabled) {
			background-color: var(--tk-success-border);
		}
		.action-btn-cancel {
			background-color: var(--tk-warning);
			border-color: var(--tk-warning-border);
		}
		.action-btn-cancel:hover:not(:disabled) {
			background-color: var(--tk-warning-border);
		}
		.action-btn:disabled {
			opacity: 0.65;
			cursor: not-allowed;
		}
		/* 對齊站方 .btn.btn-sm */
		.quick-location-buttons {
			margin-top: 10px;
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		.quick-location-btn {
			padding: 5px 10px;
			background-color: var(--tk-primary);
			color: #fff;
			border: 1px solid var(--tk-primary-border);
			border-radius: var(--tk-radius-sm);
			font-size: 12px;
			line-height: 1.5;
			cursor: pointer;
			font-weight: 400;
		}
		.quick-location-btn:hover {
			background-color: var(--tk-primary-border);
		}
		/* 導覽列的三館快速切換 (取代原本的「切換場館」按鈕),對齊站方 .btn.btn-sm */
		.navbar-location-switch {
			display: inline-flex;
			gap: 6px;
			vertical-align: middle;
		}
		.navbar-location-switch-btn {
			padding: 5px 12px;
			background-color: var(--tk-primary);
			color: #fff;
			border: 1px solid var(--tk-primary-border);
			border-radius: var(--tk-radius-sm);
			font-size: 12px;
			line-height: 1.5;
			cursor: pointer;
			font-weight: 400;
			white-space: nowrap;
		}
		.navbar-location-switch-btn:hover:not(:disabled) {
			background-color: var(--tk-primary-border);
		}
		.navbar-location-switch-btn.is-current {
			background-color: var(--tk-danger);
			border-color: var(--tk-danger-border);
			cursor: default;
			font-weight: 600;
		}
		.navbar-location-switch-btn:disabled {
			opacity: 0.65;
			cursor: progress;
		}
		/* 對齊站方 .label (會籍卡片的狀態同樣是 .label) */
		.membership-status-badge {
			display: inline-block;
			padding: 3px 8px 4px;
			margin-left: 8px;
			border-radius: var(--tk-radius-label);
			font-size: 12px;
			font-weight: 600;
			line-height: 1;
			color: #fff;
		}
		.membership-status-badge.status-active {
			background-color: var(--tk-success);
		}
		.membership-status-badge.status-suspended {
			background-color: var(--tk-danger);
		}
		.membership-status-badge.status-default {
			background-color: var(--tk-muted);
		}
		.fuzzy-search-badge-container {
			margin-top: 8px;
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		/* 對齊站方 .btn.btn-sm */
		.fuzzy-search-badge {
			display: inline-block;
			padding: 5px 10px;
			background-color: var(--tk-primary);
			color: #fff;
			border: 1px solid var(--tk-primary-border);
			border-radius: var(--tk-radius-sm);
			font-size: 12px;
			line-height: 1.5;
			font-weight: 400;
			cursor: pointer;
		}
		.fuzzy-search-badge:hover:not(:disabled) {
			background-color: var(--tk-primary-border);
		}
		/* Google 授權按鈕 (彈窗必須由使用者點擊觸發,故獨立顯示) */
		.fuzzy-search-badge.google-auth-badge {
			background-color: var(--tk-danger);
			border-color: var(--tk-danger-border);
			width: 100%;
			padding: 8px 12px;
			font-size: 13px;
			font-weight: 600;
		}
		.fuzzy-search-badge.google-auth-badge:hover:not(:disabled) {
			background-color: var(--tk-danger-border);
		}
		.fuzzy-search-badge.google-auth-badge:disabled {
			opacity: 0.65;
			cursor: progress;
		}
		.google-auth-hint {
			width: 100%;
			font-size: 12px;
			color: var(--tk-danger);
			line-height: 1.5;
		}
		.google-auth-hint:empty {
			display: none;
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
			background-color: var(--tk-surface);
			margin: 10px auto;
			padding: 20px;
			border: 1px solid rgba(0, 0, 0, 0.2);
			border-radius: var(--tk-radius-modal);
			width: 90%;
			max-width: 500px;
			box-shadow: var(--tk-shadow-modal);
		}
		.settings-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
			border-bottom: 1px solid #e5e5e5;
			padding-bottom: 15px;
		}
		.settings-modal-header h3 {
			margin: 0;
			color: var(--tk-text);
			font-size: 18px;
			font-weight: 300;
		}
		.settings-form-group {
			margin-bottom: 18px;
		}
		.settings-form-group label {
			display: block;
			margin-bottom: 6px;
			font-weight: 600;
			color: var(--tk-text);
			font-size: 13px;
		}
		/* 對齊站方 .form-control */
		.settings-form-group input,
		.settings-form-group textarea {
			width: 100%;
			padding: 6px 12px;
			border: 1px solid var(--tk-input-border);
			border-radius: var(--tk-radius-input);
			font-size: 12px;
			color: var(--tk-input-text);
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
			border-color: var(--tk-primary);
			box-shadow: 0 0 0 2px rgba(93, 143, 194, 0.15);
		}
		.settings-form-hint {
			margin-top: 6px;
			font-size: 12px;
			color: var(--tk-muted);
			line-height: 1.5;
		}
		.settings-form-actions {
			display: flex;
			gap: 8px;
			justify-content: flex-end;
			margin-top: 25px;
		}
		/* 對齊站方 .btn */
		.settings-btn {
			padding: 6px 12px;
			border: 1px solid transparent;
			border-radius: var(--tk-radius);
			font-size: 14px;
			line-height: 1.5;
			cursor: pointer;
			font-weight: 400;
		}
		.settings-btn-primary {
			background-color: var(--tk-primary);
			border-color: var(--tk-primary-border);
			color: #fff;
		}
		.settings-btn-primary:hover {
			background-color: var(--tk-primary-border);
		}
		.settings-btn-secondary {
			background-color: var(--tk-surface-head);
			border-color: #cccccc;
			color: #333333;
		}
		.settings-btn-secondary:hover {
			background-color: #e6e6e6;
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
		googleTokenClient = null;
		googleTokenClientKey = "";
		googleTokenPending = null;

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
	 * 等待候選清單中任一元素出現「且有文字內容」後執行 callback
	 * 導覽列的使用者姓名是登入後才由站方非同步填入,元素會先於文字存在,
	 * 只等元素出現會讀到空字串而誤判身分。
	 * @param {string[]} selectors 候選 CSS 選擇器
	 * @param {Function} callback 執行函式,參數為找到的元素
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=100] 最大重試次數 (100 * 100ms = 10 秒)
	 */
	function waitForAnyWithText(selectors, callback, retry = 0, maxRetry = 100, onTimeout = null) {
		const el = selectors
			.map((selector) => document.querySelector(selector))
			.find((candidate) => candidate && candidate.textContent.trim());

		if (el) {
			callback(el);
		} else if (retry < maxRetry) {
			setTimeout(() => waitForAnyWithText(selectors, callback, retry + 1, maxRetry, onTimeout), 100);
		} else {
			console.error(`waitForAnyWithText: 超過最大重試次數,未找到有文字的元素 ${selectors.join(" | ")}`);
			if (onTimeout) onTimeout();
		}
	}

	/**
	 * 輪詢條件直到成立,逾時則呼叫 onTimeout
	 * 用於等待「元素已存在但內容仍非同步填入」的情況
	 * @param {Function} condition 回傳 boolean 的判斷式
	 * @param {Function} onReady 條件成立時執行
	 * @param {Function} [onTimeout] 逾時時執行
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=100] 最大重試次數 (100 * 100ms = 10 秒)
	 */
	function waitForConditionOrTimeout(condition, onReady, onTimeout, retry = 0, maxRetry = 100) {
		let ok = false;
		try {
			ok = !!condition();
		} catch (err) {
			ok = false;
		}

		if (ok) {
			onReady();
		} else if (retry < maxRetry) {
			setTimeout(() => waitForConditionOrTimeout(condition, onReady, onTimeout, retry + 1, maxRetry), 100);
		} else if (onTimeout) {
			onTimeout();
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

	/**
	 * 取得目前仍有效的 Google Access Token (不觸發授權流程)
	 * @returns {string|null}
	 */
	function getCachedGoogleAccessToken() {
		if (googleSheetState.accessToken && Date.now() < googleSheetState.accessTokenExpire - GOOGLE_ACCESS_TOKEN_REFRESH_BUFFER) {
			return googleSheetState.accessToken;
		}
		return null;
	}

	/**
	 * 預先載入 GSI 並建立 token client。
	 *
	 * 為什麼要預先建立:Google 的 requestAccessToken() 會開彈出視窗,瀏覽器只允許在
	 * 使用者手勢的「同步」呼叫堆疊中開啟。舊版把它排在 await loadGoogleIdentityScript()
	 * 之後才呼叫,首次使用時要等 GSI 下載完,手勢已失效,Chrome 會直接擋掉並回報
	 * error_callback: popup_failed_to_open。改為事先備好 client,實際授權時就能同步呼叫。
	 *
	 * @returns {Promise<Object|null>} token client 或 null (設定不完整時)
	 */
	async function prepareGoogleTokenClient() {
		if (!googleSheetState.initialized) {
			await refreshGoogleSheetState();
		}

		if (!googleSheetState.clientId || !googleSheetState.email) {
			return null;
		}

		// 設定變更時需重建 client
		const clientKey = `${googleSheetState.clientId}|${googleSheetState.email}`;
		if (googleTokenClient && googleTokenClientKey === clientKey) {
			return googleTokenClient;
		}

		await loadGoogleIdentityScript();
		const googleIdentity = getGoogleIdentityApi();

		googleTokenClient = googleIdentity.accounts.oauth2.initTokenClient({
			client_id: googleSheetState.clientId,
			scope: GOOGLE_SHEETS_SCOPE,
			login_hint: googleSheetState.email,
			callback: async (tokenResponse) => {
				const waiter = googleTokenPending;
				googleTokenPending = null;

				try {
					if (!tokenResponse || tokenResponse.error || !tokenResponse.access_token) {
						const message = tokenResponse?.error_description || tokenResponse?.error || "Google OAuth 未回傳 access token";
						waiter?.reject(new Error(message));
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
					waiter?.resolve(googleSheetState.accessToken);
				} catch (err) {
					waiter?.reject(err);
				}
			},
			error_callback: (error) => {
				const waiter = googleTokenPending;
				googleTokenPending = null;

				let message = error?.type ? `Google OAuth 失敗: ${error.type}` : "Google OAuth 失敗";
				if (error?.type === "popup_failed_to_open") {
					message = "Google 授權視窗被瀏覽器阻擋，請允許本站的彈出視窗後再點一次授權";
				} else if (error?.type === "popup_closed") {
					message = "已取消 Google 授權";
				}

				console.error("Google OAuth error_callback:", error);
				waiter?.reject(new Error(message));
			},
		});
		googleTokenClientKey = clientKey;
		console.log("Google 授權元件已就緒");
		return googleTokenClient;
	}

	/**
	 * 開啟 Google 授權視窗。
	 * 必須在使用者點擊的同步呼叫堆疊中呼叫 (呼叫前不可有 await),否則彈窗會被瀏覽器阻擋。
	 * @returns {Promise<string>} access token
	 */
	function requestGoogleAccessTokenInteractive() {
		return new Promise((resolve, reject) => {
			if (!googleTokenClient) {
				reject(new Error("Google 授權元件尚未就緒，請稍候再試一次"));
				return;
			}

			if (googleTokenPending) {
				reject(new Error("已有授權流程進行中，請先完成或關閉 Google 授權視窗"));
				return;
			}

			googleTokenPending = { resolve, reject };

			try {
				googleTokenClient.requestAccessToken({
					prompt: "",
					login_hint: googleSheetState.email,
				});
			} catch (err) {
				googleTokenPending = null;
				reject(err);
			}
		});
	}

	/**
	 * 使用已取得的 Google Access Token 讀取 Google Sheets 資料。
	 * 本函式不會觸發授權流程 (授權彈窗只能由使用者點擊同步觸發,
	 * 見 requestGoogleAccessTokenInteractive)。
	 * @returns {Promise<Array<{name: string, phone: string}>|null>} 姓名電話資料或 null
	 * @throws {Error} 讀取失敗時拋出,由呼叫端顯示訊息
	 */
	async function fetchGoogleSheetData() {
		if (!googleSheetState.initialized) {
			await refreshGoogleSheetState();
		}

		if (!googleSheetState.sheetId) {
			throw new Error("尚未設定 Google Sheet ID，請由腳本選單的「設定」填入");
		}

		if (hasFreshGoogleSheetCache()) {
			console.log("使用快取的 Google Sheets 資料");
			return googleSheetState.cachedData;
		}

		const accessToken = getCachedGoogleAccessToken();
		if (!accessToken) {
			throw new Error("尚未取得 Google 授權");
		}

		{

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
		}
	}

	async function ensureGoogleSheetDataLoaded() {
		if (hasFreshGoogleSheetCache()) {
			return googleSheetState.cachedData;
		}

		if (!googleSheetDataLoadingPromise) {
			const loadingPromise = fetchGoogleSheetData();
			googleSheetDataLoadingPromise = loadingPromise;
			loadingPromise.catch(() => {}).finally(() => {
				if (googleSheetDataLoadingPromise === loadingPromise) {
					googleSheetDataLoadingPromise = null;
				}
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
			// 站方改版後改以 jQuery 讀值,補送事件確保框架同步
			[emailField, passwordField].forEach((field) => {
				field.dispatchEvent(new Event("input", { bubbles: true }));
				field.dispatchEvent(new Event("change", { bubbles: true }));
			});

			// 站方已將館別下拉自登入表單移除,改為登入後由「切換場館」modal 處理。
			// 此處只留下旗標,待登入完成後由 autoSwitchLocation() 自動切換。
			markPendingLocationSwitch();

			// 點擊登入按鈕。
			// 站方新增 reCAPTCHA v3,送出前會等待 grecaptcha 就緒,故此處需等腳本載入完再點,
			// 並避開「登入失敗次數過多」時被停用的按鈕。
			waitForRecaptchaReady(() => {
				const loginButton = document.querySelector("button.sign_in");
				if (!loginButton) {
					console.error("找不到登入按鈕");
					alert("點擊登入按鈕失敗: 找不到登入按鈕");
					return;
				}
				if (loginButton.disabled) {
					console.warn("登入按鈕目前為停用狀態(可能已被鎖定),略過自動點擊");
					return;
				}
				loginButton.click();
				console.log("已自動點擊登入按鈕");
			});
		} catch (err) {
			console.error("填寫登入表單失敗:", err);
			alert("填寫登入表單失敗: " + err.message);
		}
	}

	/**
	 * 等待 reCAPTCHA v3 就緒 (或確認其不可用) 後執行 callback
	 * @param {Function} callback 執行函式
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=40] 最大重試次數 (40 * 150ms = 6 秒)
	 */
	function waitForRecaptchaReady(callback, retry = 0, maxRetry = 40) {
		const win = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
		const ready = win.recaptchaReady === true;
		const unavailable = win.recaptchaFallback === true || typeof win.grecaptcha === "undefined";

		if (ready || (unavailable && retry >= 10)) {
			// 站方點擊後仍自帶 1 秒延遲,這裡不再額外等待
			callback();
			return;
		}

		if (retry < maxRetry) {
			setTimeout(() => waitForRecaptchaReady(callback, retry + 1, maxRetry), 150);
			return;
		}

		console.warn("reCAPTCHA 未就緒,仍嘗試送出登入");
		callback();
	}

	/**
	 * 標記「下一個頁面要自動切換到預設場館」
	 * 於登入頁送出登入時呼叫,登入後由 autoSwitchLocation() 消費此旗標
	 */
	function markPendingLocationSwitch() {
		try {
			sessionStorage.setItem(PENDING_LOCATION_SWITCH_KEY, TARGET_LOCATION_NAME);
		} catch (err) {
			console.warn("無法寫入 sessionStorage 旗標:", err);
		}
	}

	/**
	 * 依場館名稱關鍵字從切換場館下拉找出對應選項
	 * 站方的 location_id 由後端配發,以名稱比對比寫死 id 穩定
	 * @param {string} keyword 場館名稱關鍵字 (例: "古亭")
	 * @returns {HTMLOptionElement|null}
	 */
	function findLocationOption(keyword) {
		const select = queryFirst(SELECTORS.locationSelect);
		if (!select) return null;
		return Array.from(select.options).find((option) => option.text.includes(keyword)) || null;
	}

	/**
	 * 等待場館下拉的選項載入完成 (站方以 AJAX 抓取場館清單)
	 * @param {Function} callback 參數為下拉元素
	 * @param {number} [retry=0] 重試次數
	 * @param {number} [maxRetry=60] 最大重試次數 (60 * 200ms = 12 秒)
	 */
	function waitForLocationOptions(callback, retry = 0, maxRetry = 60) {
		const select = queryFirst(SELECTORS.locationSelect);
		// 載入中站方會塞一個 value 為空的佔位選項,需排除
		const ready = select && Array.from(select.options).some((option) => option.value);

		if (ready) {
			callback(select);
		} else if (retry < maxRetry) {
			setTimeout(() => waitForLocationOptions(callback, retry + 1, maxRetry), 200);
		} else {
			console.warn("等待場館清單載入逾時");
		}
	}

	/**
	 * 切換場館。直接操作站方的下拉並觸發確認按鈕,不需要先開啟 modal。
	 * @param {string} locationId 目標 location_id
	 * @returns {boolean} 是否成功送出切換
	 */
	function switchLocation(locationId) {
		const select = queryFirst(SELECTORS.locationSelect);
		if (!select) {
			console.warn("找不到場館下拉,無法切換");
			return false;
		}

		select.value = locationId;
		select.dispatchEvent(new Event("change", { bubbles: true }));

		const confirmBtn = document.querySelector("#change_store");
		if (!confirmBtn) {
			console.warn("找不到場館切換確認按鈕 #change_store");
			return false;
		}

		confirmBtn.click();
		return true;
	}

	/**
	 * 登入後自動切換至預設場館 (取代舊版登入表單的館別下拉)
	 * 僅在登入頁送出登入時設定旗標,故一次登入只會執行一次
	 */
	function autoSwitchLocation() {
		let pending;
		try {
			pending = sessionStorage.getItem(PENDING_LOCATION_SWITCH_KEY);
		} catch (err) {
			return;
		}
		if (!pending) return;
		if (isLoginPage()) return;

		waitForLocationOptions((select) => {
			const targetOption = findLocationOption(pending);
			if (!targetOption) {
				console.warn(`找不到名稱含「${pending}」的場館選項,取消自動切換`);
				sessionStorage.removeItem(PENDING_LOCATION_SWITCH_KEY);
				return;
			}

			// 已經在目標場館就不用切
			if (select.value === targetOption.value) {
				console.log(`已在 ${targetOption.text},略過自動切換`);
				sessionStorage.removeItem(PENDING_LOCATION_SWITCH_KEY);
				return;
			}

			// 先清旗標,避免切換後重新載入又觸發一次造成迴圈
			sessionStorage.removeItem(PENDING_LOCATION_SWITCH_KEY);

			console.log(`自動切換場館至 ${targetOption.text}`);
			switchLocation(targetOption.value);
		});
	}

	/**
	 * 將導覽列的「切換場館」按鈕換成三館快速切換按鈕 (古亭 / 松仁 / 林口)
	 * 點擊即直接切換,不需要開啟 modal
	 */
	function replaceNavLocationSwitch() {
		// 導覽列的觸發鈕 (排除行動版側欄的圖示鈕,那個維持原本開 modal 的行為)
		const originalBtn = Array.from(document.querySelectorAll('[data-target="#modalLocation"]')).find(
			(btn) => !btn.classList.contains("sidebar-mobile-icon-btn")
		);
		if (!originalBtn) return;

		const host = originalBtn.parentElement;
		if (!host || host.querySelector(".navbar-location-switch")) return;

		waitForLocationOptions((select) => {
			// 等待期間可能已被其他呼叫插入
			if (host.querySelector(".navbar-location-switch")) return;

			const container = document.createElement("div");
			container.className = "navbar-location-switch";

			let inserted = 0;
			NAV_LOCATIONS.forEach((name) => {
				const option = findLocationOption(name);
				if (!option) {
					console.warn(`找不到名稱含「${name}」的場館選項,略過此按鈕`);
					return;
				}

				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "navbar-location-switch-btn";
				btn.textContent = name;
				btn.title = option.text;
				btn.setAttribute("data-location-id", option.value);

				// 標示目前所在場館
				if (select.value === option.value) {
					btn.classList.add("is-current");
					btn.title = `${option.text} (目前所在)`;
				}

				btn.addEventListener("click", () => {
					if (btn.classList.contains("is-current")) return;

					const buttons = container.querySelectorAll(".navbar-location-switch-btn");
					buttons.forEach((b) => (b.disabled = true));
					btn.textContent = "切換中…";

					if (!switchLocation(option.value)) {
						buttons.forEach((b) => (b.disabled = false));
						btn.textContent = name;
						// 退回站方原本的流程,讓使用者手動切
						alert("自動切換場館失敗,請改用原本的「切換場館」視窗");
						originalBtn.style.display = "";
					}
				});

				container.appendChild(btn);
				inserted += 1;
			});

			if (inserted === 0) {
				console.warn("沒有任何場館按鈕可插入,保留原本的切換場館按鈕");
				return;
			}

			// 保留原按鈕但隱藏,切換失敗時可還原
			originalBtn.style.display = "none";
			host.appendChild(container);
			console.log(`已將導覽列切換場館按鈕改為 ${inserted} 館快速切換`);
		});
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
			// 電話是頁面載入後才填入的,元素會先於文字存在。
			// 只等元素出現會讀到空字串而誤判為「找不到電話」,必須等到有文字。
			waitForAnyWithText(
				["a#phone.phone", "#member_phone"],
				(phoneElement) => resolve(phoneElement.textContent.trim()),
				0,
				100,
				() => {
					console.error("找不到會員電話號碼 (等待逾時)");
					resolve(null);
				}
			);
		});
	}

	/**
	 * 取得單一會籍列的狀態文字
	 * 站方改版後整列改為單一 td 內的卡片版面,狀態移到 .member-package-card-status
	 * @param {Element} row 會籍表格的 tr
	 * @returns {string} 狀態文字 (取不到時回傳空字串)
	 */
	function getPackageRowStatusText(row) {
		if (!row) return "";
		const statusEl = queryFirst(SELECTORS.packageStatus, row);
		if (statusEl) return statusEl.textContent.trim();
		return "";
	}

	/**
	 * 從頁面取得會籍狀態
	 * @returns {Promise<{text: string, badgeClass: string}|null>} 會籍狀態物件或 null
	 */
	async function getMembershipStatus() {
		return new Promise((resolve) => {
			const readRows = () => Array.from(document.querySelectorAll("#member_package .package_list table tbody tr"));

			// 等待會籍表格載入。狀態文字同樣是非同步填入,故等到「有狀態文字」為止
			waitForConditionOrTimeout(
				() => {
					const rows = readRows();
					return rows.length > 0 && rows.some((row) => getPackageRowStatusText(row));
				},
				() => {
					// 優先取「使用中 / 停權中」的列,否則退回第一列
					const rows = readRows();
					const primaryRow =
						rows.find((row) => {
							const text = getPackageRowStatusText(row);
							return text.includes("停權中") || text === "使用中";
						}) || rows[0];

					const statusText = getPackageRowStatusText(primaryRow);
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
				},
				() => {
					console.log("等待會籍狀態逾時,略過會籍 badge");
					resolve(null);
				}
			);
		});
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

		// 找插入點。站方改版後 #member_profile_info 內已無 .col-md-6,
		// 版面改為 .member-profile-layout > .member-summary-column,依序退回尋找。
		let targetCol = queryFirst(SELECTORS.bookListAnchor);
		if (!targetCol) {
			// 相容舊版版面
			const colMd6List = memberProfileSection.querySelectorAll(".col-md-6");
			targetCol = colMd6List[1] || colMd6List[0] || null;
		}
		if (!targetCol) {
			console.error("找不到上課清單的插入點 (已嘗試: " + SELECTORS.bookListAnchor.join(", ") + ", .col-md-6)");
			return;
		}

		// 移除舊的 booking-list-title (整份文件都清,避免重複插入殘留在不同容器)
		document.querySelectorAll("#member_profile_info .booking-list-title").forEach((e) => e.remove());
		document.querySelectorAll("body > .booking-modal").forEach((e) => e.remove());

		// 計算總筆數
		const totalCount = data?.aaData?.length || 0;

		// 建立只顯示 badge 的容器
		const titleDiv = document.createElement("div");
		titleDiv.className = "booking-list-title";

		if (membershipStatus?.text) {
			const badge = document.createElement("span");
			badge.className = `membership-status-badge ${membershipStatus.badgeClass}`;
			badge.textContent = membershipStatus.text;
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

		// 點擊 badge 顯示上課紀錄彈窗
		titleDiv.addEventListener("click", () => {
			modal.style.display = "block";
		});

		// 點擊關閉按鈕或背景時關閉彈窗
		modal.querySelector(".booking-modal-close").addEventListener("click", () => {
			modal.style.display = "none";
		});

		modal.addEventListener("click", (event) => {
			if (event.target === modal) modal.style.display = "none";
		});

		// 插入到會員摘要區塊的最下方
		targetCol.appendChild(titleDiv);
		document.body.appendChild(modal);
		console.log("預約清單已插入到會員資訊區塊 (彈窗模式)");
		bindActionButtonEvents();
	}

	/**
	 * 綁定動作按鈕的點擊事件
	 */
	let actionButtonEventsBound = false;

	function bindActionButtonEvents() {
		// 事件委派只需綁一次,重複綁會造成 confirm 跳兩次
		if (actionButtonEventsBound) return;
		actionButtonEventsBound = true;

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
				// 此區塊位於 form#modal_search_form 內,不指定 type 會變成 submit,
				// 會在下方手動 dispatch submit 之前先觸發一次原生送出
				type: "button",
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
	/**
	 * 顯示「授權 Google」按鈕。
	 *
	 * 不能在輸入事件的 async 流程中自動呼叫 requestAccessToken(),
	 * 因為那時使用者手勢已失效,Chrome 會擋掉彈窗 (error_callback: popup_failed_to_open)。
	 * 改為請使用者按一下,於 click handler 中同步開啟授權視窗。
	 *
	 * @param {HTMLInputElement} phoneInput 電話輸入框
	 * @param {Function} onAuthorized 授權成功後的 callback
	 */
	function showGoogleAuthPrompt(phoneInput, onAuthorized) {
		clearFuzzySearchBadges();

		const searchInputArea = document.querySelector("#search_input_area");
		if (!searchInputArea) return;

		const container = GM_addElement(searchInputArea, "div", {
			class: "fuzzy-search-badge-container",
		});

		const authBtn = GM_addElement(container, "button", {
			// 此區塊位於 form#modal_search_form 內,不指定 type 會變成 submit
			type: "button",
			class: "fuzzy-search-badge google-auth-badge",
			textContent: "🔑 點此授權 Google 以啟用姓名搜尋",
		});

		const hint = GM_addElement(container, "div", {
			class: "google-auth-hint",
			textContent: "",
		});

		authBtn.addEventListener("click", async () => {
			// 必須「同步」開啟授權視窗,此行之前不可有 await
			const tokenPromise = requestGoogleAccessTokenInteractive();

			authBtn.disabled = true;
			authBtn.textContent = "授權中，請於 Google 視窗完成…";
			hint.textContent = "";

			try {
				await tokenPromise;
				authBtn.textContent = "授權成功，載入資料中…";
				await onAuthorized();
				clearFuzzySearchBadges();
			} catch (err) {
				console.error("Google 授權失敗:", err);
				authBtn.disabled = false;
				authBtn.textContent = "🔑 重新授權 Google";
				hint.textContent = err.message || "Google 授權失敗";
			}
		});
	}

	/**
	 * 初始化會員查詢模糊搜尋功能
	 */
	async function initMemberSearchFuzzySearch() {
		try {
			console.log("初始化會員查詢模糊搜尋功能...");
			await refreshGoogleSheetState();

			let namePhoneRecords = googleSheetState.cachedData;
			let searchDataNeedsRefresh = !hasFreshGoogleSheetCache();
			let totalCount = countGoogleSheetRecords(namePhoneRecords);
			let statusMessage = "";

			// 預先備好授權元件,讓使用者按下授權時能同步開啟彈窗
			prepareGoogleTokenClient().catch((err) => {
				console.warn("預先載入 Google 授權元件失敗:", err);
			});

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

				phoneInput.placeholder = "請輸入姓名或電話";
			}

			/**
			 * 載入 Google Sheets 資料 (需已取得授權)
			 * @returns {Promise<Array|null>} 資料或 null
			 */
			async function loadSearchData() {
				try {
					const data = await ensureGoogleSheetDataLoaded();
					if (!data) {
						searchDataNeedsRefresh = true;
						return null;
					}

					namePhoneRecords = data;
					searchDataNeedsRefresh = false;
					totalCount = countGoogleSheetRecords(namePhoneRecords);
					statusMessage = "";
					console.log(`已載入 ${totalCount} 筆姓名電話資料`);
					setPhoneInputPlaceholder();
					return namePhoneRecords;
				} catch (err) {
					console.error("載入 Google Sheets 資料失敗:", err);
					searchDataNeedsRefresh = true;
					// 有舊快取就沿用,只是提示更新失敗
					statusMessage = namePhoneRecords ? "Google 資料更新失敗，改用舊快取搜尋" : err.message;
					setPhoneInputPlaceholder(statusMessage);
					return null;
				}
			}

			/**
			 * 確認資料就緒;若缺 Google 授權則顯示授權按鈕並回傳 false
			 * @param {HTMLInputElement} phoneInput 電話輸入框
			 * @returns {Promise<boolean>} 是否可以進行搜尋
			 */
			async function ensureReadyForSearch(phoneInput) {
				if (namePhoneRecords && !searchDataNeedsRefresh) return true;

				if (!googleSheetState.sheetId || !googleSheetState.clientId) {
					statusMessage = "請先由腳本選單的「設定」填入 Google Sheet ID 與 OAuth Client ID";
					setPhoneInputPlaceholder(statusMessage);
					clearFuzzySearchBadges();
					return false;
				}

				if (getCachedGoogleAccessToken()) {
					const data = await loadSearchData();
					if (data) return true;
					// token 失效時 fetch 會清掉 token,退回顯示授權按鈕
					if (getCachedGoogleAccessToken()) return !!namePhoneRecords;
				}

				// 沒有有效 token:顯示授權按鈕 (彈窗必須由使用者點擊觸發)
				setPhoneInputPlaceholder("需要 Google 授權，請點下方按鈕");
				showGoogleAuthPrompt(phoneInput, async () => {
					await loadSearchData();
					const keyword = phoneInput.value;
					if (keyword && keyword.trim() && namePhoneRecords) {
						showFuzzySearchBadges(fuzzySearch(keyword, namePhoneRecords), phoneInput);
					}
				});
				return false;
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
				setPhoneInputPlaceholder(statusMessage);

				let debounceTimer = null;

				phoneInput.addEventListener("input", async (event) => {
					const keyword = event.target.value;

					if (debounceTimer) {
						clearTimeout(debounceTimer);
					}

					if (!keyword || keyword.trim() === "") {
						clearFuzzySearchBadges();
						setPhoneInputPlaceholder(statusMessage);
						return;
					}

					const ready = await ensureReadyForSearch(phoneInput);
					if (!ready) return;

					// 設定新的計時器 (100ms 防抖)
					debounceTimer = setTimeout(() => {
						const latestKeyword = phoneInput.value;
						if (!latestKeyword || latestKeyword.trim() === "") {
							clearFuzzySearchBadges();
							return;
						}

						showFuzzySearchBadges(fuzzySearch(latestKeyword, namePhoneRecords), phoneInput);
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

			// 已有有效授權時直接預載資料,沒有就等使用者按授權按鈕
			if (getCachedGoogleAccessToken()) {
				void loadSearchData();
			}
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
		// 站方改版後 #notifications-dropdown-toggle 已移除,
		// 使用者姓名改掛在 #navbar-user-menu-toggle / #navbar-user-menu-toggle-mobile 下。
		// 桌機版與行動版各有一份,其中一份可能尚未填入文字,取第一個有文字的。
		const userNameElement = SELECTORS.staffName
			.map((selector) => document.querySelector(selector))
			.find((candidate) => candidate && candidate.textContent.trim());
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

			// 站方改版後下拉 id 由 location_id 改為 switch_store_location_id,改以 name 為主
			const locationSelect = queryFirst(SELECTORS.locationSelect, form);
			if (!locationSelect) {
				if (retry < 50) setTimeout(() => tryInsertButtons(retry + 1), 100);
				return;
			}

			// 選項是 AJAX 載入的,尚未載入完成就先等
			if (locationSelect.options.length === 0) {
				if (retry < 50) setTimeout(() => tryInsertButtons(retry + 1), 100);
				return;
			}

			// 避免重複插入
			if (form.querySelector(".quick-location-buttons")) return;

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
					switchLocation(option.value);
				});

				buttonContainer.appendChild(btn);
			});

			locationSelect.parentNode.appendChild(buttonContainer);
			console.log("已添加快速切換場館按鈕");
		}

		waitForElement("#editor-location", () => tryInsertButtons());

		// 站方每次開啟 modal 都會重新 AJAX 抓場館清單並重建 <option>,
		// 因此需在 modal 顯示後再檢查一次 (首次載入時選項可能還沒回來)。
		const locationModal = document.querySelector("#modalLocation");
		if (locationModal) {
			locationModal.addEventListener("shown.bs.modal", () => tryInsertButtons());
			// jQuery 觸發的自訂事件不會冒泡到原生 listener 以外,補一層 MutationObserver 保險
			const observer = new MutationObserver(() => {
				if (locationModal.classList.contains("in")) tryInsertButtons();
			});
			observer.observe(locationModal, { attributes: true, attributeFilter: ["class"] });
		}
	}

	// 主流程
	registerMenuCommands();

	let fuzzySearchStarted = false;

	async function initFuzzySearchIfTargetUser() {
		if (fuzzySearchStarted) return;
		try {
			const raw = (await GM_getValue("fuzzy_search_usernames", "蔡嘉如,lulu")) || "";
			const targets = raw.split(",").map((s) => s.trim()).filter(Boolean);
			if (targets.length > 0 && isTargetUser(targets)) {
				fuzzySearchStarted = true;
				console.log("偵測到目標使用者，啟動模糊搜尋功能");
				initMemberSearchFuzzySearch();
			} else {
				console.log("非目標使用者，不啟動模糊搜尋功能");
			}
		} catch (err) {
			console.error("檢查目標使用者失敗:", err);
		}
	}

	(async function main() {
		if (isLoginPage()) {
			console.log("偵測到登入/登出頁面,啟動自動登入");
			// 不論是腳本自動登入、手動按登入、或走 Google 登入,都標記登入後要切到預設場館
			document.addEventListener(
				"click",
				(event) => {
					const target = event.target;
					if (!target || !target.closest) return;
					if (target.closest(".sign_in") || target.closest('[href*="c=google_oauth"]')) {
						markPendingLocationSwitch();
					}
				},
				true
			);
			waitForElement("form#login_form", fillLoginForm);
		} else if (isMemberDetailPage()) {
			console.log("偵測到會員詳細頁面,啟動遲到取消紀錄檢查");
			handleMemberDetailPage();
		}

		// 登入後自動切換到預設場館 (取代舊版登入表單的館別下拉)
		autoSwitchLocation();

		// 導覽列的「切換場館」改為古亭/松仁/林口三顆直接切換的按鈕
		replaceNavLocationSwitch();

		addQuickLocationButtons();

		// 檢查使用者身份，若為設定的目標使用者則啟動模糊搜尋功能 (支援多筆，以逗號分隔，不計大小寫)
		// 站方改版後入口元素由 #notifications-dropdown-toggle 改為 .navbar_staff_name。
		// 姓名為非同步填入,必須等到有文字才判斷身分,否則會讀到空字串誤判為非目標使用者。
		waitForAnyWithText(SELECTORS.staffName, () => {
			void initFuzzySearchIfTargetUser();
		});

		// 站方導覽列已啟用 jquery-pjax (PJAX_ENABLED)，側邊選單換頁只會抽換 #content，
		// 不會重新執行 userscript。這裡在 pjax 結束後重掛需要依附 #content 的功能。
		document.addEventListener("pjax:end", () => {
			console.log("pjax 換頁完成,重新掛載功能");
			if (isMemberDetailPage()) handleMemberDetailPage();
			replaceNavLocationSwitch();
			addQuickLocationButtons();
			void initFuzzySearchIfTargetUser();
		});
	})();
})();
