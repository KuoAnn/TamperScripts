// ==UserScript==
// @name         自我學習網助手
// @namespace    http://tampermonkey.net/
// @source       https://github.com/KuoAnn/TampermonkeyUserscripts/raw/main/src/Cathay-Learn.user.js
// @version      1.1.4
// @author       KuoAnn
// @match        https://cathay.elearn.com.tw/cltcms/play-index-home.do
// @connect      *
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/refs/heads/main/src/CathayLearn.user.js
// ==/UserScript==
GM_addStyle(`
    .alertContainer{position:fixed;top:6px;left:6px;z-index:9999;pointer-events:none;}
    .alertMessage{background:rgba(94,39,0,0.7);color:white;padding:4px;margin:4px;border-radius:5px;pointer-events:auto;font-size:14px;}
	.feature-btn{position:fixed;right:20px;z-index:1000;padding:10px 16px;margin-bottom:5px;border-radius:5px;border:none;font-weight:500;cursor:pointer;transition:all 0.3s ease;box-shadow:0 2px 5px rgba(0,0,0,0.2);}
	.feature-btn:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.3);}
	.feature-btn-check{top:10px;background-color:#4CAF50;color:white;}
	.feature-btn-check:hover{background-color:#45a049;}
	.feature-btn-save{top:60px;background-color:#2196F3;color:white;}
	.feature-btn-save:hover{background-color:#0b7dda;}
	.feature-btn-read{top:110px;background-color:#ff9800;color:white;}
	.feature-btn-read:hover{background-color:#e68a00;}
  `);
const alertMQ = [];
const alertDiv = GM_addElement(document.body, 'div', { class: 'alertContainer' });
const alert = (text, type = '', timeout = 3333) => {
	let $msg;
	if (type === 'error') {
		$msg = GM_addElement(alertDiv, 'div', { class: 'alertMessage', style: 'color:red', textContent: text });
	} else {
		console.log(text);
		$msg = GM_addElement(alertDiv, 'div', { class: 'alertMessage', textContent: text });
	}
	alertMQ.push($msg);
	if (alertMQ.length > 10) {
		const old = alertMQ.shift();
		alertDiv.contains(old) && alertDiv.removeChild(old);
	}
	setTimeout(() => alertDiv.contains($msg) && alertDiv.removeChild($msg), timeout);
};

(function () {
	const TIMEOUT_SECOND = 300;
	const PDF_SECOND = 100;
	const LOAD_TIME_SECOND = 20;
	('use strict');

	// 初始化狀態變數
	let countdownInterval;
	let countdownSec = 0;
	let totalSec = 0;
	let loadTime = LOAD_TIME_SECOND;

	// 建立倒數計時UI
	const countdownRow = createCountdownRow();
	const countdownText = countdownRow.querySelector('span');

	// 主要監控間隔
	const onloadInterval = setInterval(() => {
		try {
			// 檢查影片元素
			const videos = tryGetElements('video');
			if (videos === 'CORS') {
				alert('無法讀取影片，可能為 PDF 檔案');
				countdownSec = PDF_SECOND;
			} else {
				const button = tryGetButtonByText('測驗開始');
				if (videos?.length > 0) {
					initVideo(videos[0]);
				} else if (button) {
					clearInterval(onloadInterval);
					alert('測驗開始');
					button.click();
					hideCountdownRow();
					createAutoAnswerButton();
					return;
				}
			}
		} catch (error) {
			alert(error.message, 'error');
			console.error('[onLoadInterval] error:', error);
		}

		// 檢查是否開始倒數或等待影片載入
		if (countdownSec > 0) {
			clearInterval(onloadInterval);
			waitToNextPage();
		} else if (loadTime <= 0) {
			clearInterval(onloadInterval);
			alert(`載入超過等待時間，使用預設等待時間 ${TIMEOUT_SECOND} 秒`);
			countdownSec = TIMEOUT_SECOND;
			totalSec = countdownSec;
			waitToNextPage();
		} else {
			loadTime--;
			alert(`頁面載入中...${loadTime} 秒`);
		}
	}, 1000);

	function createCountdownRow() {
		const r = GM_addElement(document.body, 'div', {
			style: 'text-align:center; position:fixed; width:100%; top:0; color:#eee; background-color:red;',
		});
		GM_addElement(r, 'span');
		r.appendChild(createCancelButton());
		return r;
	}

	function createCancelButton() {
		const button = document.createElement('a');
		setStyles(button, {
			color: '#eee',
			backgroundColor: 'red',
			cursor: 'pointer',
			textDecoration: 'underline',
		});
		button.innerText = '取消';
		button.onclick = () => {
			clearInterval(onloadInterval);
			if (countdownInterval) clearInterval(countdownInterval);
			hideCountdownRow();
		};
		return button;
	}

	function hideCountdownRow() {
		countdownRow.remove();
	}

	function initVideo(video) {
		const duration = video.duration;
		if (isNaN(duration) || duration <= 0) {
			alert('影片載入中...');
			return;
		}

		countdownSec = Math.round(duration) + 5; // 多等待 5 秒
		totalSec = countdownSec;

		alert(`影片長度 ${countdownSec} 秒`);
		video.click();
		video.play();
		video.muted = !video.muted;
		alert('開始上課');
	}

	/**
	 * 設定元素樣式
	 * @param {Element} element
	 * @param {Object} styles
	 */
	function setStyles(element, styles) {
		Object.assign(element.style, styles);
	}

	/**
	 * 統一 alert 行為
	 * @param {string} text
	 * @param {string} [type]
	 * @param {number} [timeout]
	 */
	function showAlert(text, type = '', timeout = 3333) {
		let $msg;
		if (type === 'error') {
			$msg = GM_addElement(alertDiv, 'div', { class: 'alertMessage', style: 'color:red', textContent: text });
		} else {
			console.log(text);
			$msg = GM_addElement(alertDiv, 'div', { class: 'alertMessage', textContent: text });
		}
		alertMQ.push($msg);
		if (alertMQ.length > 10) {
			const old = alertMQ.shift();
			alertDiv.contains(old) && alertDiv.removeChild(old);
		}
		setTimeout(() => alertDiv.contains($msg) && alertDiv.removeChild($msg), timeout);
	}

	function waitToNextPage() {
		const endDate = new Date(Date.now() + countdownSec * 1000);
		alert(`換課時間：${endDate.toLocaleString()}`);

		countdownInterval = setInterval(() => {
			countdownSec = Math.round((endDate - Date.now()) / 1000);

			if (countdownSec > 0) {
				countdownText.innerText = `${--countdownSec}/${totalSec}`;
			} else {
				clearInterval(countdownInterval);
				goToNextPage();
			}
		}, 1000);
	}

	function goToNextPage() {
		let iframeBanner = document.querySelector('iframe#banner');
        iframeBanner.focus();
		setTimeout(() => {
			// 換頁前等待 3 秒讓課程紀錄(假設有)有時間可發送出去
			iframeBanner = document.querySelector('iframe#banner');
			if (iframeBanner?.contentWindow?.document) {
				const buttons = iframeBanner.contentWindow.document.querySelectorAll('button');
				if (buttons.length > 0) buttons[buttons.length - 1].click();
			}
		}, 3000);
	}

	function createAutoAnswerButton() {
		const submitAllButton = GM_addElement(document.body, 'button', {
			textContent: '👀 偷看答案',
			class: 'feature-btn feature-btn-check',
		});
		const saveAnswerButton = GM_addElement(document.body, 'button', {
			textContent: '💾 製作小抄',
			class: 'feature-btn feature-btn-save',
		});
		const writeAnswerButton = GM_addElement(document.body, 'button', {
			textContent: '📖 快樂作弊',
			class: 'feature-btn feature-btn-read',
		});

		submitAllButton.addEventListener('click', function () {
			// 新增：自動點擊所有「下一頁」直到出現「完成」
			function clickNextUntilFinish() {
				const nextBtn = tryGetButtonByText('下一頁');
				const finishBtn = tryGetButtonByText('完成');
				if (nextBtn) {
					alert('找到「下一頁」，自動點擊');
					nextBtn.click();
					setTimeout(clickNextUntilFinish, 500); // 遞迴繼續尋找
				} else if (finishBtn) {
					alert('已找到「完成」按鈕，開始自動交卷流程');
					tryClickButton('完成', () =>
						tryClickButton('確認', () =>
							tryClickButton('全部', () =>
								setTimeout(() => {
									saveAnswers();
								}, 1000)
							)
						)
					);
				} else {
					alert('找不到「下一頁」或「完成」按鈕，請檢查頁面狀態', 'error');
				}
			}
			clickNextUntilFinish();
		});
		saveAnswerButton.addEventListener('click', saveAnswers);

		writeAnswerButton.addEventListener('click', writeAnswers);
	}

	/**
	 * 統一錯誤提示與日誌
	 * @param {string} msg - 顯示訊息
	 * @param {Error|string} [err] - 錯誤物件或訊息
	 */
	function logError(msg, err) {
		alert(msg, 'error');
		if (err) {
			console.error(`[LearningAssistant] ${msg}`, err);
		} else {
			console.error(`[LearningAssistant] ${msg}`);
		}
	}

	// 儲存答案功能
	async function saveAnswers() {
		try {
			const title = 'quiz';
			const resultContainer = tryGetElements('ctms-feedback-result');
			if (!resultContainer || resultContainer?.length === 0) {
				alert('找不到答案頁面，請確認是否已完成測驗');
				return;
			}
			const questionDivs = resultContainer[0].querySelectorAll('div.p-8.mat-pink-50');
			const data = {};
			if (questionDivs.length === 0) {
				alert('找不到答案，請確認【檢視我的答案】頁籤是否已切至【全部】');
				return;
			}

			questionDivs.forEach((qDiv, qi) => {
				const qIndex = qi + 1;
				const qTextElem = qDiv.querySelector('h3');
				const qKey = qTextElem ? qTextElem.innerText.trim() : `第${qIndex}題`;
				const rows = qDiv.querySelectorAll('form [fxlayout="row"]');
				const ansArr = [];
				rows.forEach((row) => {
					if (row.querySelector('mat-icon.fa-check-circle')) {
						const ansText = (row.querySelector('.mat-checkbox-label, .mat-radio-label-content')?.textContent || '').trim();
						ansArr.push(ansText);
					}
				});
				console.log(`${qKey} > ${ansArr.map((ansText) => `${ansText}`).join(', ')}`);
				data[qKey] = ansArr;
			});

			// 讀取現有資料，若存在且在一小時內更新過，則合併，否則使用新資料
			let existingData = {};
			try {
				const existingDataStr = await GM_getValue(title, '{}');
				if (existingDataStr) {
					const storageData = JSON.parse(existingDataStr);
					const quizTime = await GM_getValue('quizTime', 0);
					const currentTime = Date.now();
					const oneHourInMs = 60 * 60 * 1000; // 1小時的毫秒數

					// 檢查時間戳記是否在一小時內
					if (currentTime - quizTime <= oneHourInMs) {
						existingData = storageData;
					}
				}
			} catch (e) {
				logError('小抄題庫異常', e);
			}

			// 合併新舊資料，以新資料為優先
			const mergedData = { ...existingData, ...data };

			// 儲存資料和時間戳記
			await GM_setValue(title, JSON.stringify(mergedData));
			await GM_setValue('quizTime', Date.now());

			alert(`小抄已就緒 (${Object.keys(data).length}/${Object.keys(mergedData).length})`, '', 10000);
		} catch (e) {
			logError('儲存答案時發生錯誤', e);
		}
	}

	// 讀取、標示、抄寫答案
	async function writeAnswers() {
		try {
			const dataStr = await GM_getValue('quiz', '');
			const quizTime = await GM_getValue('quizTime', 0);

			if (!dataStr) {
				alert('找不到小抄');
				return;
			}

			// 檢查時間是否有效（小於一小時）
			const currentTime = Date.now();
			const oneHourInMs = 60 * 60 * 1000; // 1小時的毫秒數

			if (currentTime - quizTime > oneHourInMs) {
				alert('小抄已過期（超過1小時），請重新製作小抄');
				await GM_setValue('quiz', '');
				await GM_setValue('quizTime', 0);
				return;
			}

			let quizAnswers;
			try {
				quizAnswers = JSON.parse(dataStr);
			} catch (e) {
				alert(`看不懂小抄 ${e.message}`, 'error');
				return;
			}

			const resultContainer = tryGetElements('mat-card-content')[0];
			if (!resultContainer) {
				alert('找不到題目');
				return;
			}
			const qDivs = resultContainer.querySelectorAll('[id^="question-"]');
			qDivs.forEach((qDiv) => {
				const h3 = qDiv.querySelectorAll('h3');
				if (!h3 || h3?.length != 2) return;
				const questionText = h3[1].innerText.replace(/^\d+\.\s*/, '').trim();
				const answers = quizAnswers[questionText];
				if (!answers) return;
				answers.forEach((answerText) => {
					const label = Array.from(qDiv.querySelectorAll('label')).find((l) => l.textContent.trim() === answerText);
					if (!label) return;
					const input = qDiv.querySelector(`#${label.getAttribute('for')}`);
					if (!input) return;

					if (!input.checked) {
						label.click();
						input.dispatchEvent(new Event('input', { bubbles: true }));
						input.dispatchEvent(new Event('change', { bubbles: true }));
					}
					label.style.backgroundColor = 'yellow';
				});
			});
			alert('已自動作答並標示');
		} catch (e) {
			logError('自動作答失敗', e);
		}
	}

	/**
	 * 取得最深層 iframe 的 document
	 * @param {Document} doc
	 * @param {string[]} iframeSelectors
	 * @returns {Document}
	 */
	function getDeepestDocument(doc, iframeSelectors = ['iframe#content', 'iframe#playContent', 'iframe#Content']) {
		if (!doc || iframeSelectors.length === 0) return doc;
		const iframeSelector = iframeSelectors[0];
		const iframe = doc.querySelector(iframeSelector);
		if (!iframe) return doc;
		const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
		if (!iframeDoc) return doc;
		return getDeepestDocument(iframeDoc, iframeSelectors.slice(1));
	}

	/**
	 * 取得指定 selector 的元素
	 * @param {string} selector
	 * @returns {NodeList|null|string}
	 */
	function tryGetElements(selector) {
		try {
			console.log('[tryGetElements] selector:', selector);
			const deepestDoc = getDeepestDocument(document);
			const elements = deepestDoc.querySelectorAll(selector);
			return elements?.length > 0 ? elements : null;
		} catch (error) {
			if (error.name == 'SecurityError') {
				return 'CORS';
			}
			logError(`[tryGetElements] error: ${error.message}`, error);
			return null;
		}
	}

	/**
	 * 依文字取得按鈕
	 * @param {string} text
	 * @returns {Element|null}
	 */
	function tryGetButtonByText(text) {
		const buttons = tryGetElements('button');
		if (!buttons || buttons.length === 0) return null;
		return Array.from(buttons).find((btn) => btn.innerText.includes(text)) || null;
	}

	/**
	 * 嘗試自動點擊指定文字的按鈕
	 * @param {string} buttonText
	 * @param {Function} nextFunc
	 * @param {number} retryCount
	 */
	function tryClickButton(buttonText, nextFunc, retryCount = 10) {
		const clickWithDelay = (btn) => {
			alert(`找到按鈕 "${buttonText}"，將在 1 秒後自動點擊`);
			setTimeout(() => {
				btn.click();
				if (typeof nextFunc === 'function') nextFunc();
			}, 1000);
		};

		const button = tryGetButtonByText(buttonText);
		if (button) {
			clickWithDelay(button);
			return;
		}

		alert(`找不到按鈕 "${buttonText}"，將嘗試重新尋找，最多 ${retryCount} 次`);
		let attempts = 0;
		const retryInterval = setInterval(() => {
			const foundButton = tryGetButtonByText(buttonText);

			if (foundButton) {
				clearInterval(retryInterval);
				clickWithDelay(foundButton);
			} else if (++attempts >= retryCount) {
				clearInterval(retryInterval);
				alert(`嘗試 ${retryCount} 次仍找不到按鈕 "${buttonText}"，請手動點擊`);
			} else {
				console.log(`嘗試尋找 "${buttonText}" 按鈕... (${attempts}/${retryCount})`);
			}
		}, 500);
	}
})();
