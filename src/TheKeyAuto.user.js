// ==UserScript==
// @name         The Key Auto Login
// @namespace    https://admin.hypercore.com.tw/*
// @version      1.25.1004.1149
// @description  自動填入帳號密碼並登入 Hypercore 後台管理系統,自動選擇 THE KEY YOGA 台北古亭館
// @author       KuoAnn
// @match        https://admin.hypercore.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypercore.com.tw
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// ==/UserScript==

(function () {
	"use strict";

	/**
	 * 顯示提示訊息
	 * @param {string} msg 訊息內容
	 */
	function showAlert(msg) {
		alert(msg);
	}

	/**
	 * 註冊 Tampermonkey 選單命令,設定帳號與密碼
	 */
	function registerMenuCommands() {
		GM_registerMenuCommand("設定帳密", async () => {
			const email = prompt("請輸入帳號 (Email):", await GM_getValue("thekey_email", ""));
			if (email !== null) {
				await GM_setValue("thekey_email", email);
			}
			const password = prompt("請輸入密碼:", await GM_getValue("thekey_password", ""));
			if (password !== null) {
				await GM_setValue("thekey_password", password);
			}
			if (email !== null || password !== null) {
				showAlert("帳號與密碼已儲存!");
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
		if (!email || !password) {
			email = prompt("請輸入帳號 (Email):", email);
			if (email === null) return null;
			await GM_setValue("thekey_email", email);

			password = prompt("請輸入密碼:", password);
			if (password === null) return null;
			await GM_setValue("thekey_password", password);
		}

		if (!email || !password) {
			showAlert("帳號或密碼不能為空");
			return null;
		}

		return { email, password };
	}

	/**
	 * 等待指定元素出現後執行 callback,最多嘗試 50 次避免無限遞迴
	 * @param {string} selector CSS 選擇器
	 * @param {Function} callback 執行函式
	 * @param {number} [retry=0] 重試次數
	 */
	function waitForElement(selector, callback, retry = 0) {
		const el = document.querySelector(selector);
		if (el) {
			callback();
		} else if (retry < 50) {
			setTimeout(() => waitForElement(selector, callback, retry + 1), 100);
		} else {
			console.error(`waitForElement: 超過最大重試次數,未找到元素 ${selector}`);
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

			// 填入帳號
			const emailField = document.querySelector('input[name="email"]');
			if (!emailField) throw new Error("找不到帳號欄位");
			emailField.value = email;

			// 填入密碼
			const passwordField = document.querySelector('input[name="password"]');
			if (!passwordField) throw new Error("找不到密碼欄位");
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
				try {
					const loginButton = document.querySelector('button.sign_in');
					if (!loginButton) throw new Error("找不到登入按鈕");
					loginButton.click();
					console.log("已自動點擊登入按鈕");
				} catch (err) {
					console.error("點擊登入按鈕失敗:", err);
					showAlert("點擊登入按鈕失敗: " + err.message);
				}
			}, 500);
		} catch (err) {
			console.error("填寫登入表單失敗:", err);
			showAlert("填寫登入表單失敗: " + err.message);
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

	// 主流程
	registerMenuCommands();
	(async function main() {
		if (isLoginPage()) {
			console.log("偵測到登入/登出頁面,啟動自動登入");
			waitForElement('form#login_form', fillLoginForm);
		}
	})();
})();
