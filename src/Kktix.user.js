// ==UserScript==
// @name         kktix
// @namespace    http://tampermonkey.net/
// @version      1.25.1123.1500
// @description  try to take over the world!
// @author       You
// @match        https://kktix.com/events/*/registrations/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kktix.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @grant        none
// ==/UserScript==

/*
keyword：票券關鍵字，支援多組關鍵字，依序比對，空字串代表不篩選
qty：票券數量
member_code：會員代碼，如無可留空字串 (僅在有會員代碼欄位時自動填入)
refresh_time：自動刷新時間，格式 YYYY/MM/DD HH:MM:SS (建議設定搶票時間前 1~5 秒)
*/
const config = {
	keyword: [""],
	qty: 2,
	member_code: "VEZ9XJ",
	refresh_time: "2025/11/23 11:59:59",
};
let step = 0;

(function () {
	("use strict");

	let observerEnabled = false;

	const observer = new MutationObserver(() => {
		if (!observerEnabled) return;
		console.log("偵測到 DOM 變更");
		handlePage();
	});

	function shouldAutoRefresh(statusElements) {
		const refreshClasses = ["register-status-OUT_OF_STOCK", "register-status-REGISTRATION_CLOSED", "register-status-CLOSED"];
		for (let i = 0; i < statusElements.length; i++) {
			const el = statusElements[i];
			for (let j = 0; j < refreshClasses.length; j++) {
				if (el.classList.contains(refreshClasses[j])) {
					return true;
				}
			}
		}
		return false;
	}

	function clearPage() {
		const elements = document.querySelectorAll(".img-wrapper, .footer");
		for (let i = 0; i < elements.length; i++) {
			elements[i].remove();
		}
	}

	function clearTicketUnits() {
		const rows = document.querySelectorAll(".ticket-unit");
		for (let i = rows.length - 1; i >= 0; i--) {
			const row = rows[i];
			const text = row.textContent;
			if (text.includes("暫無票券") || text.includes("已售完") || text.includes("輪椅席") || text.includes("身障席")) {
				row.remove();
				continue;
			}
			const match = text.match(/剩\s*(\d+)\s*張/);
			if (match) {
				const remain = parseInt(match[1], 10);
				if (remain > 0 && remain < config.qty) {
					row.remove();
				}
			}
		}
	}

	function autoCheckAgreeTerms() {
		const agreeTerms = document.getElementById("person_agree_terms");
		if (agreeTerms && !agreeTerms.checked) {
			agreeTerms.click();
		}
	}

	function autoFillMemberCode() {
		const inputs = document.querySelectorAll("input[type='text'][ng-if=\"oq.type == 'member_code'\"]");
		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i];
			console.log("填入會員代碼:", config.member_code);
			input.value = config.member_code;
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
	}

	function selectTicketByKeyword() {
		const keywords = config.keyword;
		const qty = config.qty;
		const ticketUnitNodeList = document.querySelectorAll(".ticket-unit");
		const ticketUnits = [];
		for (let i = 0; i < ticketUnitNodeList.length; i++) {
			ticketUnits.push(ticketUnitNodeList[i]);
		}
		// 將 ticket-unit 文字內容做前處理（去除逗號、去除多餘空白）
		const getText = (el) => el.textContent.replace(/,/g, "").replace(/\s+/g, " ").trim();
		// 依序比對每個 keyword
		let matchedUnits = [];
		for (let i = 0; i < keywords.length; i++) {
			const keyword = keywords[i].trim();
			if (keyword === "") {
				matchedUnits = ticketUnits;
			} else {
				const andWords = keyword.split(" ").filter(Boolean);
				matchedUnits = [];
				for (let k = 0; k < ticketUnits.length; k++) {
					const el = ticketUnits[k];
					const text = getText(el);
					let allMatch = true;
					for (let w = 0; w < andWords.length; w++) {
						if (!text.includes(andWords[w])) {
							allMatch = false;
							break;
						}
					}
					if (allMatch) {
						matchedUnits.push(el);
					}
				}
			}
			if (matchedUnits.length > 0) break;
		}
		if (matchedUnits.length === 0) return;
		// 隨機選一個
		const selected = matchedUnits[Math.floor(Math.random() * matchedUnits.length)];
		// 標記背景色
		selected.style.backgroundColor = "yellow";
		// 找到 input 並填入數量
		const input = selected.querySelector("input[type='text'][ng-model='ticketModel.quantity']");
		if (input) {
			// 觸發所有 Angular 事件
			const events = ["input", "change", "blur"];
			for (let i = 0; i < events.length; i++) {
				input.value = qty;
				input.dispatchEvent(new Event(events[i], { bubbles: true }));
			}
			input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "0" }));
			input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "0" }));
		}
	}

	function checkAndClickNext() {
		// 檢查是否有任一票券已填寫數量
		const qtyInputs = document.querySelectorAll("input[type='text'][ng-model='ticketModel.quantity']");
		let qtyFilled = false;
		for (let i = 0; i < qtyInputs.length; i++) {
			if (Number(qtyInputs[i].value) > 0) {
				qtyFilled = true;
				break;
			}
		}
		// 檢查會員代碼（如有 input）
		const memberInput = document.querySelector("input[type='text'][ng-if=\"oq.type == 'member_code'\"]");
		const memberFilled = !memberInput || (memberInput.value && memberInput.value.trim() !== "");
		// 檢查同意條款
		const agreeTerms = document.getElementById("person_agree_terms");
		const agreeChecked = agreeTerms && agreeTerms.checked;
		if (qtyFilled && memberFilled && agreeChecked) {
			const nextBtn = document.querySelector(".register-new-next-button-area button.btn-primary");
			if (nextBtn && !nextBtn.disabled) {
				setTimeout(() => {
					nextBtn.click();
					console.log("已自動點擊下一步");
				}, 200);
			}
		}
	}

	function handlePage() {
		const allStatusElements = document.querySelectorAll(".register-status");
		const statusElements = [];
		for (let i = 0; i < allStatusElements.length; i++) {
			if (!allStatusElements[i].classList.contains("hide")) {
				statusElements.push(allStatusElements[i]);
			}
		}

		if (shouldAutoRefresh(statusElements)) {
			console.log("不給買，將自動重新整理頁面");
			setTimeout(() => location.reload(), 200);
			return;
		}

		clearPage();
		const inStock = statusElements.some((el) => el.classList.contains("register-status-IN_STOCK"));
		if (inStock) {
			clearTicketUnits();

			if (document.querySelectorAll(".ticket-unit").length === 0) {
				console.log("所有票券均不符合條件，將自動重新整理頁面");
				setTimeout(() => location.reload(), 200);
				return;
			}

			autoCheckAgreeTerms();
			observer.disconnect();

			if (step === 0) {
				step = 1;
				console.log("第一步：選擇票券");
				selectTicketByKeyword();
			}
			autoFillMemberCode();
			checkAndClickNext();
		}
	}

	// 左上角倒數顯示元素
	function createCountdownDisplay() {
		let el = document.getElementById("kktix-countdown-display");
		if (!el) {
			el = document.createElement("div");
			el.id = "kktix-countdown-display";
			el.style.position = "fixed";
			el.style.top = "10px";
			el.style.left = "10px";
			el.style.zIndex = "9999";
			el.style.background = "rgba(0,0,0,0.7)";
			el.style.color = "#fff";
			el.style.padding = "8px 16px";
			el.style.borderRadius = "8px";
			el.style.fontSize = "18px";
			el.style.fontWeight = "bold";
			el.style.pointerEvents = "none";
			// 不在這裡加入 document.body
		}
		return el;
	}

	// 倒數邏輯
	function startCountdown() {
		const refreshTime = new Date(config.refresh_time.replace(/-/g, "/"));
		const now = new Date();
		const diff = refreshTime - now;

		// 若已經超過刷新時間，不需倒數，直接啟用 DOM 監聽
		if (diff <= 0) {
			console.log("無需倒數，直接監聽 DOM 變更");
			observerEnabled = true;
			return;
		}

		const display = createCountdownDisplay();
		let stopped = false;
		let displayAppended = false;
		const intervalId = setInterval(() => {
			if (stopped) {
				clearInterval(intervalId);
				observerEnabled = true;
				return;
			}
			update();
		}, 500);
		function update() {
			console.log("倒數更新中...");
			if (stopped) return;
			const now = new Date();
			const diff = refreshTime - now;
			if (diff <= 0) {
				stopped = true;
				if (diff > -500) {
					location.reload();
				} else {
					console.log("倒數結束");
				}
				return;
			}
			// 顯示倒數
			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			display.textContent = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
			if (!displayAppended && document.body) {
				document.body.appendChild(display);
				displayAppended = true;
			}
		}
	}

	// 初始執行一次
	handlePage();

	startCountdown();

	observer.observe(document.body, { childList: true, subtree: true });
})();
