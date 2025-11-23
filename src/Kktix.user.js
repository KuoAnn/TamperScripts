// ==UserScript==
// @name         kktix
// @namespace    http://tampermonkey.net/
// @version      1.26.1123.1600
// @description  自動票券選擇與提交，忽略 alert 並於左上角顯示已自動點擊訊息 10 秒，移除 .banner-wrapper
// @author       You
// @match        https://kktix.com/events/*/registrations/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kktix.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/Kktix.user.js
// @grant        none
// ==/UserScript==

/* 設定說明
	keyword：票券關鍵字，支援多組關鍵字，依序比對，空字串代表不篩選
	qty：票券數量
	member_code：會員代碼，如無可留空字串 (僅在有會員代碼欄位時自動填入)
	refresh_time：自動刷新時間，格式 YYYY/MM/DD HH:MM:SS (建議設定搶票時間前 1~5 秒)
*/
const CUSTOM_CONFIG = {
	keyword: [""],
	qty: 2,
	member_code: "VEZ9XJ",
	refresh_time: "2025/11/23 11:59:59",
};

// ===== 全域優化常量 =====
const SELECTORS = {
	registerStatus: ".register-status",
	ticketUnit: ".ticket-unit",
	qtyInput: "input[type='text'][ng-model='ticketModel.quantity']",
	memberCodeInput: "input[type='text'][ng-if=\"oq.type == 'member_code'\"]",
	agreeTerms: "#person_agree_terms",
	nextButton: ".register-new-next-button-area button.btn-primary",
	imgWrapper: ".img-wrapper",
	footer: ".footer",
	bannerWrapper: ".banner-wrapper",
	countdownDisplay: "#kktix-countdown-display",
};

const DELAYS = {
	actionClick: 0,
	reload: 50,
};

const REFRESH_CLASSES = new Set(["register-status-OUT_OF_STOCK", "register-status-REGISTRATION_CLOSED", "register-status-CLOSED"]);
const EXCLUDED_TEXTS = ["暫無票券", "已售完", "輪椅席", "身障席"];
const REMAIN_TICKETS_REGEX = /剩\s*(\d+)\s*張/;

let step = 0;

// 自動處理原生對話框：alert
// alert：改成僅記錄不阻塞
(function overrideDialogs() {
	const CONTAINER_ID = "kktix-dialog-log";
	function ensureContainer() {
		let box = document.getElementById(CONTAINER_ID);
		if (!box) {
			box = document.createElement("div");
			box.id = CONTAINER_ID;
			box.style.cssText =
				"position:fixed;top:56px;left:10px;z-index:10000;display:flex;flex-direction:column;gap:6px;max-width:320px;font-size:14px";
			document.body && document.body.appendChild(box);
		}
		return box;
	}
	function pushMessage(raw, type) {
		const box = ensureContainer();
		const wrap = document.createElement("div");
		wrap.style.cssText =
			"background:rgba(0,0,0,.75);color:#fff;padding:6px 10px;border-radius:6px;line-height:1.4;font-weight:600;box-shadow:0 0 0 1px rgba(255,255,255,.15);word-break:break-all";
		const label = type === "confirm" ? "confirm" : "alert";
		wrap.textContent = `已自動點擊 ${label}: ${String(raw)}`;
		console.log("[AutoAlert]", raw);
		box.appendChild(wrap);
		setTimeout(() => {
			wrap.remove();
			if (box.children.length === 0) box.remove();
		}, 6000);
	}
	try {
		const originalAlert = window.alert;
		window.alert = function (msg) {
			console.log("[AutoAlert suppressed]", msg);
			pushMessage(msg, "alert");
		};
		for (let i = 0; i < window.frames.length; i++) {
			try {
				window.frames[i].alert = window.alert;
			} catch (_) {}
		}
	} catch (e) {
		console.log("[Dialog override failed]", e);
	}
})();
(function () {
	("use strict");

	let observerEnabled = false;

	const observer = new MutationObserver(() => {
		if (!observerEnabled) return;
		console.log("偵測到 DOM 變更");
		handlePage();
	});

	function shouldAutoRefresh(statusElements) {
		for (let i = 0; i < statusElements.length; i++) {
			const classList = statusElements[i].classList;
			for (const className of REFRESH_CLASSES) {
				if (classList.contains(className)) return true;
			}
		}
		return false;
	}

	function clearPage() {
		const elements = document.querySelectorAll(SELECTORS.imgWrapper + ", " + SELECTORS.footer + ", " + SELECTORS.bannerWrapper);
		for (let i = 0; i < elements.length; i++) {
			elements[i].remove();
		}
	}

	function clearTicketUnits() {
		const rows = document.querySelectorAll(SELECTORS.ticketUnit);
		for (let i = rows.length - 1; i >= 0; i--) {
			const row = rows[i];
			const text = row.textContent;
			let shouldRemove = false;
			for (const excluded of EXCLUDED_TEXTS) {
				if (text.includes(excluded)) {
					shouldRemove = true;
					break;
				}
			}
			if (!shouldRemove) {
				const match = text.match(REMAIN_TICKETS_REGEX);
				if (match && parseInt(match[1], 10) < CUSTOM_CONFIG.qty) {
					shouldRemove = true;
				}
			}
			if (shouldRemove) row.remove();
		}
	}

	function autoCheckAgreeTerms() {
		const agreeTerms = document.getElementById("person_agree_terms");
		if (agreeTerms && !agreeTerms.checked) {
			agreeTerms.click();
		}
	}

	function autoFillMemberCode() {
		const inputs = document.querySelectorAll(SELECTORS.memberCodeInput);
		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i];
			if (input.value !== CUSTOM_CONFIG.member_code) {
				input.value = CUSTOM_CONFIG.member_code;
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}
		}
	}

	function selectTicketByKeyword() {
		const ticketUnitNodeList = document.querySelectorAll(SELECTORS.ticketUnit);
		const ticketUnits = Array.from(ticketUnitNodeList);
		if (ticketUnits.length === 0) return;

		const keywords = CUSTOM_CONFIG.keyword;
		const qty = CUSTOM_CONFIG.qty;

		// 預計算所有票券文本一次，使用 Map 緩存
		const textCache = new Map();
		const cleanText = (text) => text.replace(/,/g, "").replace(/\s+/g, " ").trim();
		ticketUnits.forEach((el) => {
			textCache.set(el, cleanText(el.textContent));
		});

		// 依序比對關鍵字一次找到符合的票券
		let matchedUnits = [];
		for (let i = 0; i < keywords.length; i++) {
			const keyword = keywords[i].trim();
			if (keyword === "") {
				matchedUnits = ticketUnits;
				break;
			}

			const andWords = keyword.split(" ").filter(Boolean);
			matchedUnits = ticketUnits.filter((el) => {
				const text = textCache.get(el);
				return andWords.every((word) => text.includes(word));
			});

			if (matchedUnits.length > 0) break;
		}

		if (matchedUnits.length === 0) return;

		// 隨機選一個
		const selected = matchedUnits[Math.floor(Math.random() * matchedUnits.length)];
		selected.style.backgroundColor = "yellow";

		// 找到 input 並填入數量，儘設 input 一次
		const input = selected.querySelector(SELECTORS.qtyInput);
		if (input && input.value !== qty.toString()) {
			input.value = qty;
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
	}

	function checkAndClickNext() {
		// 一次查詢所有需要的元素
		const qtyInputs = document.querySelectorAll(SELECTORS.qtyInput);
		const memberInput = document.querySelector(SELECTORS.memberCodeInput);
		const agreeTerms = document.getElementById("person_agree_terms");

		const qtyFilled = Array.from(qtyInputs).some((input) => Number(input.value) > 0);
		const memberFilled = !memberInput || (memberInput.value && memberInput.value.trim() !== "");
		const agreeChecked = agreeTerms && agreeTerms.checked;

		if (qtyFilled && memberFilled && agreeChecked) {
			const nextBtn = document.querySelector(SELECTORS.nextButton);
			if (nextBtn && !nextBtn.disabled) {
				nextBtn.click();
			}
		}
	}

	function handlePage() {
		const allStatusElements = document.querySelectorAll(SELECTORS.registerStatus);
		const statusElements = Array.from(allStatusElements).filter((el) => !el.classList.contains("hide"));

		if (shouldAutoRefresh(statusElements)) {
			setTimeout(() => location.reload(), DELAYS.reload);
			return;
		}

		clearPage();
		const inStock = statusElements.some((el) => el.classList.contains("register-status-IN_STOCK"));
		if (inStock) {
			clearTicketUnits();

			if (document.querySelectorAll(SELECTORS.ticketUnit).length === 0) {
				setTimeout(() => location.reload(), DELAYS.reload);
				return;
			}

			autoCheckAgreeTerms();
			observerEnabled = false;

			if (step === 0) {
				step = 1;
				selectTicketByKeyword();
			}
			autoFillMemberCode();
			checkAndClickNext();
			observerEnabled = true;
		}
	}

	// 左上角倒數顯示元素 (已整合至 startCountdown)
	function createCountdownDisplay() {
		let el = document.getElementById(SELECTORS.countdownDisplay.slice(1));
		if (!el) {
			el = document.createElement("div");
			el.id = SELECTORS.countdownDisplay.slice(1);
			el.style.cssText =
				"position:fixed;top:10px;left:10px;z-index:9999;background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:8px;font-size:18px;font-weight:bold;pointer-events:none;";
		}
		return el;
	}

	// 倒數邏輯 - 優化版本
	function startCountdown() {
		const refreshTime = new Date(CUSTOM_CONFIG.refresh_time.replace(/-/g, "/"));
		let diff = refreshTime - new Date();

		// 若已經超過刷新時間，直接啟用 DOM 監聽
		if (diff <= 0) {
			observerEnabled = true;
			return;
		}

		let display = null;
		let displayAppended = false;
		let lastSecond = -1;
		let intervalId = null;

		function update() {
			diff = refreshTime - new Date();
			if (diff <= 0) {
				clearInterval(intervalId);
				if (diff > -500) location.reload();
				observerEnabled = true;
				return;
			}

			// 僅當秒數變化時才更新 DOM
			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			const currentSecond = h * 3600 + m * 60 + s;

			if (currentSecond !== lastSecond) {
				lastSecond = currentSecond;
				if (!display) {
					display = document.createElement("div");
					display.id = SELECTORS.countdownDisplay.slice(1);
					display.style.cssText =
						"position:fixed;top:10px;left:10px;z-index:9999;background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:8px;font-size:18px;font-weight:bold;pointer-events:none;";
				}
				display.textContent = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
				if (!displayAppended && document.body) {
					document.body.appendChild(display);
					displayAppended = true;
				}
			}
		}

		intervalId = setInterval(update, DELAYS.refreshCheckInterval);
		update();
	}

	// 初始執行一次
	handlePage();

	startCountdown();

	// MutationObserver - 優化監聽範圍縮小至 ticketUnit 容器變化
	const ticketContainer = document.querySelector(".register-form-area") || document.body;
	observer.observe(ticketContainer, {
		childList: true,
		subtree: true,
		characterData: false,
		attributes: false,
	});
})();
