// ==UserScript==
// @name         The Key Auto Login
// @namespace    https://admin.hypercore.com.tw/*
// @version      1.25.1004.1700
// @description  自動填入帳號密碼並登入 Hypercore 後台管理系統,自動選擇 THE KEY YOGA 台北古亭館,檢查會員遲到取消紀錄並顯示預約清單,支援黃牌簽到/取消操作
// @author       KuoAnn
// @match        https://admin.hypercore.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypercore.com.tw
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      admin.hypercore.com.tw
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/TheKeyAuto.user.js
// ==/UserScript==

(function () {
	"use strict";

	// 加入表格樣式
	GM_addStyle(`
		.booking-list-table {
			width: 100%;
			margin-top: 20px;
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
		.booking-list-table th {
			background-color: #f5f5f5;
			font-weight: bold;
			color: #333;
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
		.booking-list-table .status-check_in {
			color: #2e7d32;
		}
		.booking-list-table .status-reserved {
			color: #1565c0;
		}
		.booking-list-container {
			margin-top: 20px;
		}
		.booking-list-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 10px;
			color: #333;
		}
		.action-buttons {
			display: flex;
			gap: 8px;
			flex-direction: column;
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
	`);

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
					const loginButton = document.querySelector("button.sign_in");
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
	 * 呼叫 API 取得會員預約課程清單
	 * @param {string} account 會員帳號(電話號碼)
	 * @returns {Promise<Object|null>} API 回應資料或 null
	 */
	async function getBookList(account) {
		return new Promise((resolve) => {
			const now = Date.now();
			const endDate = new Date();
			const startDate = new Date();
			startDate.setMonth(startDate.getMonth() - 1); // 查詢最近一個月

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
			formData.append('book_id', bookId);
			formData.append('action_type', actionType);

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
			reserved: "已預約",
			check_in: "✅簽到",
			late_cancel: "⚠️黃牌",
			punished: "黃牌不罰",
			cancel: "❌取消",
			waiting: "候補中",
			absent: "缺席",
		};

		let html = '<div class="booking-list-container">';
		html += `<div class="booking-list-title">📋 上課紀錄 (最近一個月，共 ${data.aaData.length} 筆)</div>`;
		html += '<table class="booking-list-table">';
		   html += "<thead><tr>";
		   html += "<th>狀態</th>";
		   html += "<th>日期/時間</th>";
		   html += "<th>課程/教練</th>";
		   html += "<th>教室</th>";
		   html += "</tr></thead>";
		html += "<tbody>";

		data.aaData.forEach((record) => {
			const statusClass = `status-${record.status_name}`;
			const statusText = statusMap[record.status_name] || record.status_name;
			const roomName = (record.room_name || '').replace(/教室/g, '');
			const rowClass = record.status_name === 'late_cancel' ? 'late-cancel-row' : '';

			   html += `<tr class="${rowClass}">`;
			   html += `<td class="${statusClass}">${statusText}`;
			   if (record.status_name === 'late_cancel') {
				   html += `<br><div class="action-buttons">
					   <button class="action-btn action-btn-checkin" data-book-id="${record.book_id}" data-action="check_in">簽到(扣課)</button>
					   <button class="action-btn action-btn-cancel" data-book-id="${record.book_id}" data-action="punished">撤銷(不扣課)</button>
				   </div>`;
			   }
			   html += `</td>`;
			   html += `<td>${record.class_day}<br>${record.class_time}</td>`;
			   html += `<td>${record.class_name}<br>${record.coach_name}</td>`;
			   html += `<td>${roomName}</td>`;
			   html += "</tr>";
		});

		html += "</tbody></table>";
		html += "</div>";

		return html;
	}

	/**
	 * 將預約清單表格插入到頁面
	 * @param {Object} data API 回應資料
	 */
	function insertBookListTable(data) {
		// 尋找目標容器
		const targetContainer = document.querySelector(".content-wrap .content .row .col-md-5");
		if (!targetContainer) {
			console.error("找不到目標容器 .content-wrap .content .row .col-md-5");
			return;
		}

		// 檢查是否已經插入過表格，避免重複插入
		const existingTable = targetContainer.querySelector(".booking-list-container");
		if (existingTable) {
			existingTable.remove();
		}

		// 建立表格並插入
		const tableHTML = createBookListTable(data);
		const tableContainer = document.createElement("div");
		tableContainer.innerHTML = tableHTML;

		targetContainer.appendChild(tableContainer);
		console.log("預約清單表格已插入到頁面");

		// 綁定動作按鈕事件監聽器
		bindActionButtonEvents();
	}

	/**
	 * 綁定動作按鈕的點擊事件
	 */
	function bindActionButtonEvents() {
		// 使用事件委派方式處理所有動作按鈕
		document.addEventListener('click', async function(event) {
			const target = event.target;
			
			// 檢查是否點擊了動作按鈕
			if (target.classList.contains('action-btn')) {
				const bookId = target.getAttribute('data-book-id');
				const actionType = target.getAttribute('data-action');
				
				if (!bookId || !actionType) {
					console.error('缺少 book_id 或 action_type');
					return;
				}

				// 防止重複點擊
				if (target.disabled) {
					return;
				}

				// 禁用所有同列的按鈕
				const row = target.closest('tr');
				const allButtons = row.querySelectorAll('.action-btn');
				allButtons.forEach(btn => btn.disabled = true);

				try {
					console.log(`執行動作: bookId=${bookId}, actionType=${actionType}`);
					
					// 呼叫 API
					const response = await setBookAction(bookId, actionType);
					
					console.log('API 回應:', response);

					// 根據回應顯示訊息
					if (response && response.message === 'success') {
						const actionText = actionType === 'check_in' ? '簽到' : '取消';
						alert(`${actionText}成功`);
						
						// 重新整理頁面
						window.location.reload();
					} else {
						const message = response && response.message ? response.message : '未知錯誤';
						alert(`操作失敗：${message}`);
						
						// 重新啟用按鈕
						allButtons.forEach(btn => btn.disabled = false);
					}
				} catch (err) {
					console.error('執行動作失敗:', err);
					alert(`操作失敗：${err.message}`);
					
					// 重新啟用按鈕
					allButtons.forEach(btn => btn.disabled = false);
				}
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
			
			// 插入預約清單表格到頁面
			insertBookListTable(data);
		} catch (err) {
			console.error("處理會員詳細頁面失敗:", err);
		}
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
	})();
})();
