// ==UserScript==
// @name         Baozi Comic Reader
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  包子漫畫增強閱讀器：支援 twmanga、baozimh、colamanga 三站點，提供簡化介面、智能閱讀紀錄管理、多種快捷操作、自動翻頁功能
// @author       KuoAnn
// @match        https://www.twmanga.com/comic/chapter/*
// @match        https://www.baozimh.com/comic/*
// @match        https://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.google.com/s2/favicons?sz=16&domain=twmanga.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/baozi.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

/**
 * Baozi Comic Reader - 包子漫畫增強閱讀器
 * 提供簡化介面、閱讀紀錄管理、快捷操作等功能
 *
 * 支援站點：
 * - twmanga.com: 完整功能（閱讀紀錄、快捷操作、自動翻頁）
 * - baozimh.com: 完整功能（介面清理、閱讀紀錄、章節排序）
 * - colamanga.com: 快捷操作與翻頁功能
 *
 * 功能特色：
 * - 智能閱讀進度管理（twmanga、baozimh）
 * - 多種快捷鍵操作 (W/S 滾動, A/D 翻章, F 全螢幕)
 * - 自動翻頁與滑輪支援
 * - 移動裝置觸控操作
 * - 介面清理與章節排序（baozimh）
 */

(function () {
	'use strict';

	// ---------------------------------------------------------------------------
	// Constants & Configuration
	// ---------------------------------------------------------------------------
	const CONFIG = {
		BOTTOM_TOLERANCE: 100,
		BOTTOM_DETECT_THRESHOLD: 1,
		MAX_ALERT_MESSAGES: 10,
		DEFAULT_ALERT_TIMEOUT: 3000,
		SCROLL_PERCENTAGE: 0.9,
		MOBILE_BREAKPOINT: 1000,
		MOBILE_SCROLL_AMOUNT: 900,
		CHAPTER_SORT_PATTERN: /(\d+(?:\.\d+)?)/,
		URL_PATTERN: /comic\/chapter\/([^\/]+)\/(\d+)_(\d+)(?:_(\d+))?\.html/,
	};

	const SELECTORS = {
		NEXT_CHAPTER: 'a#next-chapter',
		PREV_CHAPTER: 'a#prev-chapter',
		SECTION_TITLES: '.section-title',
		CHAPTER_ITEMS: '#chapter-items',
		CHAPTERS_OTHER: '#chapters_other_list',
		ACTION_BUTTONS: '.action-buttons',
		CLEAR_READ_BTN: '.clearReadBtn',
		COMICS_TITLE: '.comics-detail__title',
	};

	// 遠端 API 設定（Endpoint 固定，Token 仍可自訂）
	const API = {
		ENDPOINT: 'https://script.google.com/macros/s/AKfycbxhZtApgZcHy9cjr9NklUx1CHUj1xH_-lmbXne5hyjiCoChXORKT6f9c3DgJ1rj6rc9xA/exec',
		TOKEN_KEY: 'baozi_api_token',
		TIMEOUT: 10000,
	};
	function getApiToken() {
		return GM_getValue(API.TOKEN_KEY) || '';
	}
	function setApiToken(v) {
		GM_setValue(API.TOKEN_KEY, String(v || ''));
	}

	// ---------------------------------------------------------------------------
	// Local Cache for read records
	// Key format: baozi_cache_<comicKey> => Array<{ss:string, cs:string}>
	// ---------------------------------------------------------------------------
	const CACHE_PREFIX = 'baozi_cache_';

	/**
	 * 取得本地快取的閱讀紀錄
	 * @param {string} comicKey
	 * @returns {Array<{ss:string, cs:string}>}
	 */
	function getLocalReads(comicKey) {
		const raw = GM_getValue(CACHE_PREFIX + comicKey);
		if (Array.isArray(raw)) return raw;
		const arr = typeof raw === 'string' ? safeJSONParse(raw, null) : null;
		return Array.isArray(arr) ? arr : [];
	}

	/**
	 * 設定本地快取的閱讀紀錄
	 * @param {string} comicKey
	 * @param {Array<{ss:string, cs:string}>} list
	 */
	function setLocalReads(comicKey, list) {
		try {
			GM_setValue(CACHE_PREFIX + comicKey, JSON.stringify(list || []));
		} catch (e) {
			console.warn('setLocalReads failed', e);
			if (typeof showAlert === 'function') {
				showAlert('本地紀錄儲存失敗: ' + (e && e.message ? e.message : e), 2500);
			}
		}
	}

	/**
	 * 新增一筆至本地快取（若不存在）
	 * @param {string} comicKey
	 * @param {{ss:string, cs:string}} item
	 */
	function addLocalRead(comicKey, item) {
		const list = getLocalReads(comicKey);
		const key = `${item.ss}-${item.cs}`;
		const exists = list.some((x) => `${x.ss}-${x.cs}` === key);
		if (!exists) {
			list.push({ ss: String(item.ss), cs: String(item.cs) });
			setLocalReads(comicKey, list);
		}
	}

	/**
	 * 以本地與雲端交集為準，回寫雙方
	 * 修正：當交集為空時僅本地清空，不呼叫 apiClear/apiSave，避免雲端被清空。
	 * 交集不為空時才進行雲端同步。
	 * @param {string} comicKey
	 * @param {Array<{ss:string, cs:string}>} remoteList
	 * @returns {Array<{ss:string, cs:string}>} intersected
	 */
	function intersectAndSync(comicKey, remoteList) {
		const localList = getLocalReads(comicKey);
		const localSet = new Set(localList.map((x) => `${x.ss}-${x.cs}`));
		const remoteSet = new Set((Array.isArray(remoteList) ? remoteList : []).map((x) => `${x.ss}-${x.cs}`));

		// 聯集 key
		const unionKeys = new Set([...localSet, ...remoteSet]);
		const unioned = [...unionKeys].map((k) => {
			const [ss, cs] = k.split('-');
			return { ss, cs };
		});

		// 覆寫本地快取
		setLocalReads(comicKey, unioned);

		// 雲端同步：僅在雲端資料與聯集不同時才同步，且聯集不為空才執行
		if (getApiToken() && typeof apiClear === 'function' && typeof apiSave === 'function') {
			const unionSet = new Set(unioned.map((x) => `${x.ss}-${x.cs}`));
			let isSame = true;
			if (unionSet.size !== remoteSet.size) {
				isSame = false;
			} else {
				for (const k of unionSet) {
					if (!remoteSet.has(k)) {
						isSame = false;
						break;
					}
				}
			}

			// 僅當聯集不為空且雲端資料與聯集不同時才同步
			if (!isSame && unioned.length > 0) {
				apiClear(comicKey)
					.then(() => Promise.all(unioned.map((it) => apiSave({ comicKey, ss: it.ss, cs: it.cs })))).
					catch((e) => {
						console.warn('remote sync failed:', e);
						if (typeof showAlert === 'function') {
							showAlert('雲端同步失敗: ' + (e && e.message ? e.message : e), 2500);
						}
					});
			}
			// 若聯集為空，僅本地清空，不動雲端
		}
		return unioned;
	}

	// ---------------------------------------------------------------------------
	// Styling
	// ---------------------------------------------------------------------------
	GM_addStyle(`
        .alertContainer {
            position: fixed;
            top: 6px;
            left: 6px;
            z-index: 9999;
            pointer-events: none;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .alertMessage {
            background: rgba(94, 39, 0, 0.78);
            color: #fff;
            padding: 4px 8px;
            margin: 4px;
            border-radius: 5px;
            pointer-events: auto;
            font-size: 13px;
            line-height: 1.4;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        #__nuxt {
            padding: 0;
        }
        
        .clearReadBtn {
            margin: 8px;
            max-height: 42px;
            cursor: pointer;
            background: #007cba;
            color: white;
            border: 1px solid #005a8b;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        
        .clearReadBtn:hover {
            background: #005a8b;
        }
        
        .swapClickBtn {
            position: fixed;
            top: 6px;
            right: 6px;
            z-index: 10000;
            background: #c95000;
            color: #fff;
            border: none;
            padding: 6px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            cursor: pointer;
            opacity: 0.88;
            transition: all 0.2s;
        }
        
        .swapClickBtn:hover {
            opacity: 1;
        }
        
        .swapClickBtn:active {
            transform: scale(0.95);
        }
        
        @media (min-width: ${CONFIG.MOBILE_BREAKPOINT}px) {
            .swapClickBtn {
                display: none;
            }
        }
        
        .read-chapter {
            background-color: #ffd706 !important;
            position: relative;
        }
        
        .read-chapter::after {
            content: "✓";
            position: absolute;
            top: 2px;
            right: 4px;
            color: #333;
            font-weight: bold;
            font-size: 12px;
        }
    `);

	// ---------------------------------------------------------------------------
	// Global Variables
	// ---------------------------------------------------------------------------
	const alertQueue = [];
	let alertDiv;
	let loader;
	let interstitialObserver;
	let isLoaded = false;
	let apiWarned = false;
	let tokenPrompted = false; // 單頁僅提示一次

	// ---------------------------------------------------------------------------
	// Utility Functions
	// ---------------------------------------------------------------------------

	/**
	 * 安全的 JSON 解析
	 * @param {string} raw - 要解析的 JSON 字串
	 * @param {*} defaultValue - 解析失敗時的預設值
	 * @returns {*} 解析結果或預設值
	 */
	function safeJSONParse(raw, defaultValue = null) {
		if (raw == null) return defaultValue;
		try {
			return JSON.parse(raw);
		} catch (error) {
			console.warn('JSON parse error:', error);
			if (typeof showAlert === 'function') {
				showAlert('JSON 解析錯誤: ' + (error && error.message ? error.message : error), 2000);
			}
			return defaultValue;
		}
	}

	/**
	 * 安全的元素選取
	 * @param {string} selector - CSS 選擇器
	 * @param {Element} parent - 父元素，預設為 document
	 * @returns {Element|null} 找到的元素或 null
	 */
	function safeQuerySelector(selector, parent = document) {
		try {
			return parent.querySelector(selector);
		} catch (error) {
			console.warn(`Query selector error for "${selector}":`, error);
			return null;
		}
	}

	/**
	 * 安全的多元素選取
	 * @param {string} selector - CSS 選擇器
	 * @param {Element} parent - 父元素，預設為 document
	 * @returns {NodeList} 找到的元素列表
	 */
	function safeQuerySelectorAll(selector, parent = document) {
		try {
			return parent.querySelectorAll(selector);
		} catch (error) {
			console.warn(`Query selector all error for "${selector}":`, error);
			return [];
		}
	}

	/**
	 * 防抖函數
	 * @param {Function} func - 要執行的函數
	 * @param {number} wait - 等待時間（毫秒）
	 * @returns {Function} 防抖後的函數
	 */
	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	/**
	 * 節流函數
	 * @param {Function} func - 要執行的函數
	 * @param {number} limit - 時間間隔（毫秒）
	 * @returns {Function} 節流後的函數
	 */
	function throttle(func, limit) {
		let inThrottle;
		return function (...args) {
			if (!inThrottle) {
				func.apply(this, args);
				inThrottle = true;
				setTimeout(() => (inThrottle = false), limit);
			}
		};
	}

	// ---------------------------------------------------------------------------
	// Remote API（取代本機 GM_* 儲存）
	// ---------------------------------------------------------------------------

	function apiPost(ac, payload = {}) {
		return new Promise((resolve, reject) => {
			const endpoint = API.ENDPOINT;
			let token = getApiToken();

			// 若未設定 Token，立即提示使用者輸入（僅提示一次）
			if (!token && !tokenPrompted) {
				tokenPrompted = true;
				const v = prompt('請輸入 API Token（留空則以離線模式）', '');
				if (v && v.trim()) {
					setApiToken(v.trim());
					token = v.trim();
					showAlert('已設定 API Token', 1500);
				} else {
					showAlert('未設定 API Token，將以離線模式運作', 2000);
				}
			}

			if (!token) {
				return resolve({ rc: -1, rm: 'no-token' });
			}

			try {
				GM_xmlhttpRequest({
					method: 'POST',
					url: endpoint,
					data: JSON.stringify({ token: token, ac, ...payload }),
					headers: { 'Content-Type': 'application/json' },
					timeout: API.TIMEOUT,
					onload: (res) => {
						try {
							const json = safeJSONParse(res.responseText, null);
							if (!json) return reject(new Error('API 解析失敗'));
							if (json.rc === 0) return resolve(json);
							return reject(new Error(json.rm || 'API 錯誤'));
						} catch (e) {
							reject(e);
						}
					},
					onerror: () => reject(new Error('API 連線失敗')),
					ontimeout: () => reject(new Error('API 等待逾時')),
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	function apiSave(data) {
		return apiPost('save', data);
	}
	function apiList(comicKey) {
		return apiPost('list', { comicKey });
	}
	function apiClear(comicKey) {
		return apiPost('clear', { comicKey });
	}

	// ---------------------------------------------------------------------------
	// Alert System
	// ---------------------------------------------------------------------------

	/**
	 * 初始化提醒系統
	 */
	function initAlertSystem() {
		try {
			alertDiv = GM_addElement(document.body, 'div', { class: 'alertContainer' });
		} catch (error) {
			console.error('Failed to initialize alert system:', error);
			if (typeof showAlert === 'function') {
				showAlert('提醒系統初始化失敗: ' + (error && error.message ? error.message : error), 2500);
			}
		}
	}

	/**
	 * 顯示暫時訊息
	 * @param {string} message - 訊息內容
	 * @param {number} timeout - 顯示時間（毫秒）
	 */
	function showAlert(message, timeout = CONFIG.DEFAULT_ALERT_TIMEOUT) {
		if (!alertDiv) {
			console.warn('Alert system not initialized, falling back to console:', message);
			return;
		}

		try {
			const msg = GM_addElement(alertDiv, 'div', {
				class: 'alertMessage',
				textContent: message,
			});

			alertQueue.push(msg);

			// 限制最大訊息數量
			while (alertQueue.length > CONFIG.MAX_ALERT_MESSAGES) {
				const old = alertQueue.shift();
				if (old && alertDiv.contains(old)) {
					old.remove();
				}
			}

			// 自動移除訊息
			setTimeout(() => {
				if (alertDiv && alertDiv.contains(msg)) {
					msg.remove();
					const index = alertQueue.indexOf(msg);
					if (index > -1) {
						alertQueue.splice(index, 1);
					}
				}
			}, timeout);
		} catch (error) {
			console.error('Alert display error:', error, 'Message:', message);
			if (typeof showAlert === 'function' && message !== '顯示錯誤訊息失敗') {
				// 避免遞迴
				setTimeout(() => alert('顯示錯誤訊息失敗: ' + (error && error.message ? error.message : error)), 100);
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Reading Progress Management
	// ---------------------------------------------------------------------------

	/**
	 * 記錄目前閱讀章節 (twmanga)
	 */
	function saveLastRead() {
		const url = window.location.href;
		const match = url.match(CONFIG.URL_PATTERN);

		if (!match) {
			console.error('URL 格式不正確:', url);
			showAlert('無法解析章節資訊', 2000);
			return;
		}

		const key = match[1];
		const readData = {
			ss: match[2],
			cs: match[3],
			timestamp: Date.now(),
			url: url,
		};

		// 先寫入本地快取，確保後續列表能即時顯示
		addLocalRead(key, { ss: readData.ss, cs: readData.cs });
		showAlert(`已讀 ${readData.ss}-${readData.cs}`, 1200);

		// 再同步到雲端（不阻塞 UI）
		apiSave({ comicKey: key, ...readData }).catch((error) => {
			console.error('Save read progress (remote) error:', error);
			if (typeof showAlert === 'function') {
				showAlert('雲端儲存失敗: ' + (error && error.message ? error.message : error), 2000);
			}
			// 失敗不回滾本地，等下次交集同步會修正
		});
	}

	/**
	 * 顯示已讀章節標示並提供清除按鈕 (baozimh)
	 */
	function showLastRead() {
		const url = window.location.href;
		try {
			const key = new URL(url).pathname.split('/').pop();
			if (!key) {
				showAlert('無法取得漫畫識別碼', 2000);
				return;
			}

			// 1) 先用本地快取立即標示
			const localList = getLocalReads(key);
			if (localList.length > 0) {
				localList.forEach((value) => {
					const links = safeQuerySelectorAll(`a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`);
					links.forEach((ele) => ele.classList.add('read-chapter'));
				});
				showAlert(`(本機) 已標示 ${localList.length} 個已讀章節`, 1200);
			}

			// 2) 再讀雲端並以交集為準，同步雙方與 UI
			apiList(key)
				.then((resp) => {
					if (!resp || resp.rc !== 0) {
						// 無 Token 或雲端回應非成功，不進行交集同步，保留本地顯示
						showAlert('未同步雲端（無 Token 或錯誤）', 1200);
						return;
					}
					const remoteList = Array.isArray(resp.rs) ? resp.rs : [];
					const unioned = intersectAndSync(key, remoteList);
					// 先清掉舊標記再標示聯集（避免顯示超出聯集的本地項）
					const readChapters = safeQuerySelectorAll('.read-chapter');
					readChapters.forEach((chapter) => chapter.classList.remove('read-chapter'));
					unioned.forEach((value) => {
						const links = safeQuerySelectorAll(`a[href$="section_slot=${value.ss}&chapter_slot=${value.cs}"]`);
						links.forEach((ele) => ele.classList.add('read-chapter'));
					});
					showAlert(`(同步) 已標示 ${unioned.length} 個已讀章節\n[${unioned.map(x=>x.ss+'-'+x.cs).join(', ')}]`, 2500);
				})
				.catch((error) => {
					console.error('Show last read error:', error);
					showAlert('讀取雲端紀錄失敗 ' + error, 2000);
				});

			// 新增清除按鈕
			const btnWrap = safeQuerySelector(SELECTORS.ACTION_BUTTONS);
			if (btnWrap && !safeQuerySelector(SELECTORS.CLEAR_READ_BTN, btnWrap)) {
				const btn = GM_addElement(btnWrap, 'button', {
					class: 'clearReadBtn',
					textContent: '清除閱讀紀錄',
				});

				btn.addEventListener('click', handleClearReads);
			}
		} catch (error) {
			console.error('Show last read error:', error);
			showAlert(`顯示閱讀紀錄失敗: ${error.message}`, 3000);
		}
	}

	/**
	 * 處理清除閱讀紀錄
	 */
	function handleClearReads() {
		try {
			const url = window.location.href;
			const key = new URL(url).pathname.split('/').pop();
			const titleEle = safeQuerySelector(SELECTORS.COMICS_TITLE);
			const comicTitle = titleEle?.textContent?.replace(/\n/g, '').trim() || '此漫畫';

			if (confirm(`確定要清除 ${comicTitle} 的閱讀紀錄嗎？`)) {
				// 先清本地
				setLocalReads(key, []);
				// UI 清除
				const readChapters = safeQuerySelectorAll('.read-chapter');
				readChapters.forEach((chapter) => chapter.classList.remove('read-chapter'));
				showAlert('已清除閱讀紀錄');
				// 再清雲端
				apiClear(key).catch((error) => {
					console.error('Clear reads (remote) error:', error);
					showAlert('雲端清除失敗', 2000);
				});
			}
		} catch (error) {
			console.error('Clear reads error:', error);
			showAlert('清除失敗', 2000);
		}
	}

	// ---------------------------------------------------------------------------
	// Navigation & Interaction
	// ---------------------------------------------------------------------------

	/**
	 * 取得 Colamanga 下一頁 URL
	 * 格式: /manga-xxx/1/414.html -> /manga-xxx/1/415.html
	 */
	function getColamangaNextPage() {
		const url = window.location.pathname;
		const match = url.match(/^(.+\/)(\d+)(\.html)$/);
		if (match) {
			const [, basePath, pageNum, extension] = match;
			const nextPage = parseInt(pageNum, 10) + 1;
			return `${basePath}${nextPage}${extension}`;
		}
		return null;
	}

	/**
	 * 取得 Colamanga 上一頁 URL
	 * 格式: /manga-xxx/1/414.html -> /manga-xxx/1/413.html
	 */
	function getColamangaPrevPage() {
		const url = window.location.pathname;
		const match = url.match(/^(.+\/)(\d+)(\.html)$/);
		if (match) {
			const [, basePath, pageNum, extension] = match;
			const prevPage = parseInt(pageNum, 10) - 1;
			if (prevPage >= 0) {
				return `${basePath}${prevPage}${extension}`;
			}
		}
		return null;
	}

	/**
	 * 點擊下一章
	 */
	function clickNext() {
		const hostname = window.location.hostname;
		
		// Colamanga 使用 URL 跳轉方式
		if (hostname === 'www.colamanga.com') {
			const nextUrl = getColamangaNextPage();
			if (nextUrl) {
				window.location.href = nextUrl;
			} else {
				showAlert('已是最後一頁', 1500);
			}
			return;
		}
		
		// 其他站點使用按鈕點擊方式
		const nextBtn = safeQuerySelector(SELECTORS.NEXT_CHAPTER);
		if (nextBtn) {
			nextBtn.click();
		} else {
			showAlert('已是最後一章', 1500);
		}
	}

	/**
	 * 點擊上一章
	 */
	function clickPrev() {
		const hostname = window.location.hostname;
		
		// Colamanga 使用 URL 跳轉方式
		if (hostname === 'www.colamanga.com') {
			const prevUrl = getColamangaPrevPage();
			if (prevUrl) {
				window.location.href = prevUrl;
			} else {
				showAlert('已是第一頁', 1500);
			}
			return;
		}
		
		// 其他站點使用按鈕點擊方式
		const prevBtn = safeQuerySelector(SELECTORS.PREV_CHAPTER);
		if (prevBtn) {
			prevBtn.click();
		} else {
			showAlert('已是第一章', 1500);
		}
	}

	/**
	 * 檢查是否在文件底部
	 */
	function isAtDocumentBottom() {
		const scrollBottom = window.innerHeight + window.scrollY;
		const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
		return scrollBottom + CONFIG.BOTTOM_TOLERANCE >= docHeight;
	}

	/**
	 * 檢查是否在文件頂部
	 */
	function isAtDocumentTop() {
		return window.scrollY <= 10;
	}

	/**
	 * 平滑滾動
	 */
	function smoothScroll(amount) {
		window.scrollBy({
			top: amount,
			behavior: 'smooth',
		});
	}

	/**
	 * 切換全螢幕模式
	 */
	function toggleFullscreen() {
		try {
			if (document.fullscreenElement) {
				document.exitFullscreen();
				showAlert('退出全螢幕', 1000);
			} else {
				document.documentElement.requestFullscreen();
				showAlert('進入全螢幕', 1000);
			}
		} catch (error) {
			console.error('Fullscreen toggle error:', error);
			showAlert('全螢幕切換失敗', 2000);
		}
	}

	// ---------------------------------------------------------------------------
	// Auto Page Navigation
	// ---------------------------------------------------------------------------

	let bottomDetectCount = 0;

	const autoNextPage = throttle(() => {
		if (isAtDocumentBottom()) {
			bottomDetectCount++;
			showAlert(`即將前往下一章... (${bottomDetectCount}/${CONFIG.BOTTOM_DETECT_THRESHOLD})`, 1000);

			if (bottomDetectCount >= CONFIG.BOTTOM_DETECT_THRESHOLD) {
				bottomDetectCount = 0;
				clickNext();
			}
		} else {
			bottomDetectCount = 0; // 離開底部重置計數
		}
	}, 500);

	const autoPrevPage = debounce(() => {
		if (isAtDocumentTop()) {
			clickPrev();
		}
	}, 300);

	// ---------------------------------------------------------------------------
	// Event Handlers
	// ---------------------------------------------------------------------------

	/**
	 * 鍵盤事件處理器
	 */
	function handleKeydown(event) {
		// 避免在輸入框中觸發快捷鍵
		if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
			return;
		}

		switch (event.key) {
			case 'w':
			case 'W':
			case 'PageUp':
				event.preventDefault();
				smoothScroll(-window.innerHeight * CONFIG.SCROLL_PERCENTAGE);
				autoPrevPage();
				break;

			case 's':
			case 'S':
			case ' ':
			case 'PageDown':
				event.preventDefault();
				smoothScroll(window.innerHeight * CONFIG.SCROLL_PERCENTAGE);
				autoNextPage();
				break;

			case 'a':
			case 'A':
			case 'ArrowLeft':
				event.preventDefault();
				clickPrev();
				break;

			case 'd':
			case 'D':
			case 'ArrowRight':
				event.preventDefault();
				clickNext();
				break;

			case 'f':
			case 'F':
				event.preventDefault();
				toggleFullscreen();
				break;
		}
	}

	/**
	 * 滑鼠滾輪事件處理器
	 */
	const handleWheel = throttle((event) => {
		if (event.deltaY > 0) {
			autoNextPage();
		} else {
			autoPrevPage();
		}
	}, 200);

	/**
	 * 點擊事件處理器（移動裝置）
	 */
	function handleClick(event) {
		if (window.innerWidth < CONFIG.MOBILE_BREAKPOINT) {
			smoothScroll(CONFIG.MOBILE_SCROLL_AMOUNT);
			autoNextPage();
		}
	}

	/**
	 * 添加鍵盤/滑輪/觸控操作邏輯 (twmanga)
	 */
	function addHotkey() {
		document.addEventListener('click', handleClick);
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('wheel', handleWheel, { passive: true });
	}

	// ---------------------------------------------------------------------------
	// UI Cleanup
	// ---------------------------------------------------------------------------

	/**
	 * 移除符合選擇器的元素
	 * @param {string} selector - CSS 選擇器
	 * @param {string} textFilter - 可選的文字過濾條件
	 */
	function removeElements(selector, textFilter = null) {
		const elements = safeQuerySelectorAll(selector);
		elements.forEach((element) => {
			try {
				if (!textFilter || (element.textContent && element.textContent.includes(textFilter))) {
					element.remove();
				}
			} catch (error) {
				console.warn('Remove element error:', error);
			}
		});
	}

	/**
	 * 章節排序：以文字中第一組數字作為排序依據（降序）
	 * @param {Element} container - 章節容器元素
	 */
	function sortChapters(container) {
		if (!container) return;

		try {
			const items = Array.from(container.querySelectorAll(':scope > div'));
			if (items.length === 0) return;

			const fragment = document.createDocumentFragment();

			items
				.map((element) => ({
					element,
					number: parseFloat(element.textContent.match(CONFIG.CHAPTER_SORT_PATTERN)?.[1] || '0'),
				}))
				.sort((a, b) => b.number - a.number)
				.forEach(({ element }) => fragment.appendChild(element));

			container.innerHTML = '';
			container.appendChild(fragment);
		} catch (error) {
			console.error('Sort chapters error:', error);
		}

		// ---------------------------------------------------------------------------
		// Interstitial Fade Removal (global)
		// ---------------------------------------------------------------------------

		/**
		 * 移除 #interstitial_fade（如存在），並嘗試恢復 body 的 overflow
		 * @returns {boolean} 已刪除回傳 true，否則 false
		 */
		function removeInterstitialIfPresent() {
			try {
				const el = safeQuerySelector('#interstitial_fade');
				if (el) {
					el.remove();
					// 解除可能被遮罩鎖定的滾動行為
					try {
						document.body.style.overflow = '';
					} catch (err) {
						console.warn('Failed to reset body overflow:', err);
						return true;
					}
					return false;

					// Optional visual feedback for debugging/confirmation
					if (typeof showAlert === 'function') {
						showAlert('已移除遮罩 (#interstitial_fade)', 1200);
					}
				}
			} catch (error) {
				console.error('removeInterstitialIfPresent error:', error);
			}
		}

		/**
		 * 使用 MutationObserver 監控 DOM，若出現 #interstitial_fade 則移除
		 */
		function monitorInterstitial() {
			try {
				// 先嘗試一次清除可能已存在的 #interstitial_fade
				const initRemoved = removeInterstitialIfPresent();
				if (initRemoved) {
					// 如果已存在並被移除，則不需要啟動 observer
					interstitialObserver = null;
					return;
				}

				// 若已存在 observer，先斷開（避免重複建立）
				if (interstitialObserver && typeof interstitialObserver.disconnect === 'function') {
					interstitialObserver.disconnect();
				}

				interstitialObserver = new MutationObserver((mutations) => {
					for (const m of mutations) {
						if (m.addedNodes && m.addedNodes.length > 0) {
							for (const node of m.addedNodes) {
								try {
									if (node && node.nodeType === Node.ELEMENT_NODE) {
										const el = node.closest ? node.closest('#interstitial_fade') : null;
										if ((node && node.id === 'interstitial_fade') || el) {
											const didRemove = removeInterstitialIfPresent();
											if (didRemove) {
												// 停用 observer，因為此元素不會連續出現
												if (interstitialObserver && typeof interstitialObserver.disconnect === 'function') {
													try {
														interstitialObserver.disconnect();
													} catch (err) {
														console.warn('Failed to disconnect interstitialObserver:', err);
													}
												}
												interstitialObserver = null;
												// 已執行移除，直接結束 callback
												return;
											}
										}
									}
								} catch (innerErr) {
									console.warn('monitorInterstitial inner error:', innerErr);
								}
							}
						}
					}
				});

				// Observe the whole document for newly added nodes
				const targetNode = document.documentElement || document.body || document;
				interstitialObserver.observe(targetNode, { childList: true, subtree: true });
			} catch (error) {
				console.error('monitorInterstitial error:', error);
			}
		}
	}

	// ---------------------------------------------------------------------------
	// Site-specific Handlers
	// ---------------------------------------------------------------------------

	/**
	 * 初始載入處理 (baozimh)
	 */
	function handleLoader() {
		if (isLoaded) return;

		const sectionTitles = safeQuerySelectorAll(SELECTORS.SECTION_TITLES);
		if (sectionTitles.length === 0) return; // DOM 尚未載入

		isLoaded = true;
		clearInterval(loader);

		try {
			// 清理不需要的元素
			removeElements('.l-content', '猜你喜歡');
			removeElements('.footer');
			removeElements('.recommend');
			removeElements('.addthis-box');

			// 展開「查看全部」按鈕
			const viewAllButtons = safeQuerySelectorAll('button');
			viewAllButtons.forEach((btn) => {
				if (btn.textContent?.includes('查看全部')) {
					btn.click();
				}
			});

			// 處理章節排序與合併
			sectionTitles.forEach((sectionTitle) => {
				const text = sectionTitle.textContent || '';
				if (text.includes('最新章節')) {
					sortChapters(sectionTitle.nextElementSibling);
				} else if (text.includes('章節目錄')) {
					const chapterItems = safeQuerySelector(SELECTORS.CHAPTER_ITEMS);
					const chaptersOther = safeQuerySelector(SELECTORS.CHAPTERS_OTHER);

					if (chapterItems && chaptersOther) {
						const otherChapters = chaptersOther.querySelectorAll(':scope > div');
						otherChapters.forEach((chapter) => chapterItems.appendChild(chapter));
					}

					if (chapterItems) {
						sortChapters(chapterItems);
					}
				}
			});

			showLastRead();
			showAlert('頁面載入完成', 1500);
		} catch (error) {
			console.error('Handle loader error:', error);
			showAlert('初始化失敗', 2000);
		}
	}

	/**
	 * 處理 TWManga 站點
	 */
	function handleTwmanga() {
		try {
			saveLastRead();
			addHotkey();
		} catch (error) {
			console.error('TWManga handler error:', error);
			showAlert('TWManga 初始化失敗', 2000);
		}
	}

	/**
	 * 處理 Baozimh 站點
	 */
	function handleBaozimh() {
		try {
			loader = setInterval(handleLoader, 500);
		} catch (error) {
			console.error('Baozimh handler error:', error);
			showAlert('Baozimh 初始化失敗', 2000);
		}
	}

	/**
	 * 處理 Colamanga 站點
	 * 僅啟用快捷操作和翻頁功能
	 */
	function handleColamanga() {
		try {
			addHotkey();
			showAlert('Colamanga 快捷鍵已啟用', 1500);
		} catch (error) {
			console.error('Colamanga handler error:', error);
			showAlert('Colamanga 初始化失敗', 2000);
		}
	}

	/**
	 * 添加用戶選單命令
	 */
	function addUserMenuCommands() {
		GM_registerMenuCommand('設定 API Token', () => {
			const cur = getApiToken();
			const v = prompt('請輸入 API Token', cur || '');
			if (v !== null) {
				setApiToken(v);
				alert('已設定 API Token');
			}
		});

		GM_registerMenuCommand('顯示快捷鍵說明', () => {
			const helpText = `
快捷鍵說明：
• W/S: 上下滾動
• A/←: 上一章
• D/→: 下一章  
• F: 切換全螢幕
• Space/PageDown: 自動下一章
• PageUp: 自動上一章

移動裝置：
• 點擊螢幕: 向下滾動
• 滾輪: 自動翻頁
            `.trim();
			alert(helpText);
		});
	}

	// ---------------------------------------------------------------------------
	// Main Execution
	// ---------------------------------------------------------------------------

	/**
	 * 主要初始化函數
	 */
	function initialize() {
		try {
			// 初始化提醒系統
			initAlertSystem();

			// 開始監控 interstitial 遮罩並移除（若出現）
			monitorInterstitial();

			// 添加用戶選單
			addUserMenuCommands();

			// 根據站點執行對應邏輯
			const hostname = window.location.hostname;

			if (hostname === 'www.twmanga.com') {
				handleTwmanga();
			} else if (hostname === 'www.baozimh.com') {
				handleBaozimh();
			} else if (hostname === 'www.colamanga.com') {
				handleColamanga();
			} else {
				console.warn('Unsupported hostname:', hostname);
			}
		} catch (error) {
			console.error('Initialization error:', error);
			// 即使初始化失敗，也嘗試顯示錯誤訊息
			if (typeof showAlert === 'function') {
				showAlert('腳本初始化失敗', 3000);
			}
		}
	}

	// 確保 DOM 載入完成後才執行
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		initialize();
	}
})();
