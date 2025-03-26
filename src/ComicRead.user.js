// ==UserScript==
// @name            ComicRead
// @namespace       ComicRead
// @version         11.8.4
// @description     为漫画站增加双页阅读、翻译等优化体验的增强功能。百合会（记录阅读历史、自动签到等）、百合会新站、动漫之家（解锁隐藏漫画）、E-Hentai（关联 nhentai、快捷收藏、标签染色、识别广告页等）、nhentai（彻底屏蔽漫画、无限滚动）、Yurifans（自动签到）、拷贝漫画(copymanga)（显示最后阅读记录、解锁隐藏漫画）、PonpomuYuri、再漫画、明日方舟泰拉记事社、禁漫天堂、漫画柜(manhuagui)、漫画DB(manhuadb)、动漫屋(dm5)、绅士漫画(wnacg)、mangabz、komiic、MangaDex、NoyAcg、無限動漫、新新漫画、熱辣漫畫、hitomi、SchaleNetwork、kemono、nekohouse、コミックグロウル、welovemanga、Tachidesk
// @description:en  Add enhanced features to the comic site for optimized experience, including dual-page reading and translation. E-Hentai (Associate nhentai, Quick favorite, Colorize tags, Floating tag list, etc.) | nhentai (Totally block comics, Auto page turning) | hitomi | Anchira | kemono | nekohouse | welovemanga.
// @noframes
// @match           *://*.18comic.vip/*
// @match           *://*.dm5.com/*
// @match           *://*.onemoreplace.tw/*
// @match           *://*.manhuagui.com/*
// @connect         *
// @grant           GM_addElement
// @grant           GM_getResourceText
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM.addValueChangeListener
// @grant           GM.removeValueChangeListener
// @grant           GM.getResourceText
// @grant           GM.getValue
// @grant           GM.setValue
// @grant           GM.listValues
// @grant           GM.deleteValue
// @grant           GM.registerMenuCommand
// @grant           GM.unregisterMenuCommand
// @grant           unsafeWindow
// @icon            data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAACBUExURUxpcWB9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i2B9i////198il17idng49DY3PT297/K0MTP1M3X27rHzaCxupmstbTByK69xOfr7bfFy3WOmqi4wPz9/X+XomSBjqW1vZOmsN/l6GmFkomeqe7x8vn6+kv+1vUAAAAOdFJOUwDsAoYli9zV+lIqAZEDwV05SQAAAUZJREFUOMuFk+eWgjAUhGPBiLohjZACUqTp+z/gJkqJy4rzg3Nn+MjhwB0AANjv4BEtdITBHjhtQ4g+CIZbC4Qb9FGb0J4P0YrgCezQqgIA14EDGN8fYz+f3BGMASFkTJ+GDAYMUSONzrFL7SVvjNQIz4B9VERRmV0rbJWbrIwidnsd6ACMlEoip3uad3X2HJmqb3gCkkJELwk5DExRDxA6HnKaDEPSsBnAsZoANgJaoAkg12IJqBiPACImXQKF9IDULIHUkOk7kDpeAMykHqCEWACy8ACdSM7LGSg5F3HtAU1rrkaK9uGAshXS2lZ5QH/nVhmlD8rKlmbO3ZsZwLe8qnpdxJRnLaci1X1V5R32fjd5CndVkfYdGpy3D+htU952C/ypzPtdt3JflzZYBy7fi/O1euvl/XH1Pp+Cw3/1P1xOZwB+AWMcP/iw0AlKAAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC
// @resource        solid-js https://registry.npmmirror.com/solid-js/1.9.1/files/dist/solid.cjs
// @resource        fflate https://registry.npmmirror.com/fflate/0.8.2/files/umd/index.js
// @resource        jsqr https://registry.npmmirror.com/jsqr/1.4.0/files/dist/jsQR.js
// @resource        comlink https://registry.npmmirror.com/comlink/4.4.1/files/dist/umd/comlink.js
// @resource        dmzjDecrypt https://greasyfork.org/scripts/467177/code/dmzjDecrypt.js?version=1207199
// @resource        solid-js|store https://registry.npmmirror.com/solid-js/1.9.1/files/store/dist/store.cjs
// @resource        solid-js|web https://registry.npmmirror.com/solid-js/1.9.1/files/web/dist/web.cjs
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/ComicRead.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/ComicRead.user.js
// ==/UserScript==

let supportWorker = typeof Worker !== 'undefined';
const gmApi = {
  GM,
  GM_addElement: typeof GM_addElement === 'undefined' ? undefined : GM_addElement,
  GM_getResourceText,
  GM_xmlhttpRequest,
  GM_addStyle,
  unsafeWindow
};
const gmApiList = Object.keys(gmApi);
const crsLib = {
  // 有些 cjs 模块会检查这个，所以在这里声明下
  process: {
    env: {
      NODE_ENV: 'production'
    }
  },
  ...gmApi
};
const tempName = Math.random().toString(36).slice(2);
const evalCode = code => {
  if (!code) return;

  // 因为部分网站会对 eval 进行限制，比如推特（CSP）、hitomi（代理 window.eval 进行拦截）
  // 所以优先使用最通用的 GM_addElement 来加载
  if (gmApi.GM_addElement) return GM_addElement('script', {
    textContent: code
  })?.remove();
  eval.call(unsafeWindow, code); // eslint-disable-line no-eval
};

/**
 * 通过 Resource 导入外部模块
 * @param name \@resource 引用的资源名
 */
const selfImportSync = name => {
  let code;

  // 为了方便打包、减少在无关站点上的运行损耗、顺带隔离下作用域
  // 除站点逻辑外的代码会作为字符串存着，要用时再像外部模块一样导入
  switch (name) {
case 'helper/languages':
code =`
const langList = ['zh', 'en', 'ru', 'ta'];
/** 判断传入的字符串是否是支持的语言类型代码 */
const isLanguages = lang => Boolean(lang) && langList.includes(lang);

/** 返回浏览器偏好语言 */
const getBrowserLang = () => {
  for (const language of navigator.languages) {
    const matchLang = langList.find(l => l === language.split('-')[0]);
    if (matchLang) return matchLang;
  }
};
const getSaveLang = async () => typeof GM === 'undefined' ? localStorage.getItem('Languages') : GM.getValue('Languages');
const setSaveLang = async val => typeof GM === 'undefined' ? localStorage.setItem('Languages', val) : GM.setValue('Languages', val);
const getInitLang = async () => {
  const saveLang = await getSaveLang();
  if (isLanguages(saveLang)) return saveLang;
  const lang = getBrowserLang() ?? 'zh';
  setSaveLang(lang);
  return lang;
};

exports.getInitLang = getInitLang;
exports.isLanguages = isLanguages;
exports.langList = langList;
exports.setSaveLang = setSaveLang;
`
break;
case 'helper':
code =`
const solidJs = require('solid-js');
const web = require('solid-js/web');
const store = require('solid-js/store');
const languages = require('helper/languages');

/**
 * Creates a callback that is debounced and cancellable. The debounced callback is called on **trailing** edge.
 *
 * The timeout will be automatically cleared on root dispose.
 *
 * @param callback The callback to debounce
 * @param wait The duration to debounce in milliseconds
 * @returns The debounced function
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#debounce
 *
 * @example
 * \`\`\`ts
 * const fn = debounce((message: string) => console.log(message), 250);
 * fn('Hello!');
 * fn.clear() // clears a timeout in progress
 * \`\`\`
 */
const debounce$1 = (callback, wait) => {
    if (web.isServer) {
        return Object.assign(() => undefined, { clear: () => undefined });
    }
    let timeoutId;
    const clear = () => clearTimeout(timeoutId);
    if (solidJs.getOwner())
        solidJs.onCleanup(clear);
    const debounced = (...args) => {
        if (timeoutId !== undefined)
            clear();
        timeoutId = setTimeout(() => callback(...args), wait);
    };
    return Object.assign(debounced, { clear });
};
/**
 * Creates a callback that is throttled and cancellable. The throttled callback is called on **trailing** edge.
 *
 * The timeout will be automatically cleared on root dispose.
 *
 * @param callback The callback to throttle
 * @param wait The duration to throttle
 * @returns The throttled callback trigger
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#throttle
 *
 * @example
 * \`\`\`ts
 * const trigger = throttle((val: string) => console.log(val), 250);
 * trigger('my-new-value');
 * trigger.clear() // clears a timeout in progress
 * \`\`\`
 */
const throttle$1 = (callback, wait) => {
    if (web.isServer) {
        return Object.assign(() => undefined, { clear: () => undefined });
    }
    let isThrottled = false, timeoutId, lastArgs;
    const throttled = (...args) => {
        lastArgs = args;
        if (isThrottled)
            return;
        isThrottled = true;
        timeoutId = setTimeout(() => {
            callback(...lastArgs);
            isThrottled = false;
        }, wait);
    };
    const clear = () => {
        clearTimeout(timeoutId);
        isThrottled = false;
    };
    if (solidJs.getOwner())
        solidJs.onCleanup(clear);
    return Object.assign(throttled, { clear });
};
/**
 * Creates a scheduled and cancellable callback that will be called on the **leading** edge for the first call, and **trailing** edge for other calls.
 *
 * The timeout will be automatically cleared on root dispose.
 *
 * @param schedule {@link debounce} or {@link throttle}
 * @param callback The callback to debounce/throttle
 * @param wait timeout duration
 * @returns The scheduled callback trigger
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#leadingAndTrailing
 *
 * @example
 * \`\`\`ts
 * const trigger = leadingAndTrailing(throttle, (val: string) => console.log(val), 250);
 * trigger('my-new-value');
 * trigger.clear() // clears a timeout in progress
 * \`\`\`
 */
function leadingAndTrailing(schedule, callback, wait) {
    if (web.isServer) {
        let called = false;
        const scheduled = (...args) => {
            if (called)
                return;
            called = true;
            callback(...args);
        };
        return Object.assign(scheduled, { clear: () => undefined });
    }
    let State;
    (function (State) {
        State[State["Ready"] = 0] = "Ready";
        State[State["Leading"] = 1] = "Leading";
        State[State["Trailing"] = 2] = "Trailing";
    })(State || (State = {}));
    let state = State.Ready;
    const scheduled = schedule((args) => {
        state === State.Trailing && callback(...args);
        state = State.Ready;
    }, wait);
    const fn = (...args) => {
        if (state !== State.Trailing) {
            if (state === State.Ready)
                callback(...args);
            state += 1;
        }
        scheduled(args);
    };
    const clear = () => {
        state = State.Ready;
        scheduled.clear();
    };
    if (solidJs.getOwner())
        solidJs.onCleanup(clear);
    return Object.assign(fn, { clear });
}
/**
 * Creates a signal used for scheduling execution of solid computations by tracking.
 *
 * @param schedule Schedule the invalidate function (can be {@link debounce} or {@link throttle})
 * @returns A function used to track the signal. It returns \`true\` if the signal is dirty *(callback should be called)* and \`false\` otherwise.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled#createScheduled
 *
 * @example
 * \`\`\`ts
 * const debounced = createScheduled(fn => debounce(fn, 250));
 *
 * createEffect(() => {
 *   // track source signal
 *   const value = count();
 *   // track the debounced signal and check if it's dirty
 *   if (debounced()) {
 *     console.log('count', value);
 *   }
 * });
 * \`\`\`
 */
// Thanks to Fabio Spampinato (https://github.com/fabiospampinato) for the idea for the primitive
function createScheduled(schedule) {
    let listeners = 0;
    let isDirty = false;
    const [track, dirty] = solidJs.createSignal(undefined, { equals: false });
    const call = schedule(() => {
        isDirty = true;
        dirty();
    });
    return () => {
        if (!isDirty)
            call(), track();
        if (isDirty) {
            isDirty = !!listeners;
            return true;
        }
        if (solidJs.getListener()) {
            listeners++;
            solidJs.onCleanup(() => listeners--);
        }
        return false;
    };
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var es6 = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }


    if ((a instanceof Map) && (b instanceof Map)) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      for (i of a.entries())
        if (!equal(i[1], b.get(i[0]))) return false;
      return true;
    }

    if ((a instanceof Set) && (b instanceof Set)) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      return true;
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (a[i] !== b[i]) return false;
      return true;
    }


    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};

const isEqual = /*@__PURE__*/getDefaultExportFromCjs(es6);

const throttle = (fn, wait = 100) => leadingAndTrailing(throttle$1, fn, wait);
const debounce = (fn, wait = 100) => debounce$1(fn, wait);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clamp = (min, val, max) => Math.max(Math.min(max, val), min);
const inRange = (min, val, max) => val >= min && val <= max;

/** 判断两个数是否在指定误差范围内相等 */
const approx = (val, target, range) => Math.abs(target - val) <= range;

function range(a, b, c) {
  switch (typeof b) {
    case 'undefined':
      return [...Array.from({
        length: a + 1
      }).keys()];
    case 'number':
      {
        const list = [];
        for (let i = a; i <= b; i++) list.push(c ? c(i) : i);
        return list;
      }
    case 'function':
      return Array.from({
        length: a
      }, (_, i) => b(i));
  }
}

/**
 * 对 document.querySelector 的封装
 * 将默认返回类型改为 HTMLElement
 */
const querySelector = selector => document.querySelector(selector);

/**
 * 对 document.querySelector 的封装
 * 将默认返回类型改为 HTMLElement
 */
const querySelectorAll = selector => [...document.querySelectorAll(selector)];

/** 返回 Dom 的点击函数 */
const querySelectorClick = (selector, textContent) => {
  let getDom;
  if (typeof selector === 'function') getDom = selector;else if (textContent) {
    getDom = () => querySelectorAll(selector).find(e => e.textContent?.includes(textContent));
  } else getDom = () => querySelector(selector);
  if (getDom()) return () => getDom()?.click();
};

/** 找出数组中出现最多次的元素 */
const getMostItem = list => {
  const counts = new Map();
  for (const val of list) counts.set(val, (counts.get(val) ?? 0) + 1);

  // eslint-disable-next-line unicorn/no-array-reduce
  return [...counts.entries()].reduce((maxItem, item) => maxItem[1] > item[1] ? maxItem : item)[0];
};

/** 创建顺序数组 */
const createSequence = length => [...Array.from({
  length
}).keys()];

/** 判断字符串是否为 URL */
const isUrl = text => {
  // 等浏览器版本上来后可以直接使用 URL.canParse
  try {
    return Boolean(new URL(text));
  } catch {
    return false;
  }
};

/** 将 blob 数据作为文件保存至本地 */
const saveAs = (blob, name = 'download') => {
  const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  a.download = name;
  a.rel = 'noopener';
  a.href = URL.createObjectURL(blob);
  setTimeout(() => a.dispatchEvent(new MouseEvent('click')));
};

/** 滚动页面到指定元素的所在位置 */
const scrollIntoView = (selector, behavior = 'instant') => querySelector(selector)?.scrollIntoView({
  behavior
});
/** 确保函数在同一时间下只有一个在运行 */
const singleThreaded = (callback, initState) => {
  const state = {
    running: false,
    argList: [],
    continueRun: (...args) => state.argList.length > 0 || state.argList.push(args),
    ...initState
  };
  const work = async () => {
    if (state.argList.length === 0) return;
    const args = state.argList.shift();
    try {
      state.running = true;
      await callback(state, ...args);
    } catch (error) {
      await sleep(100);
      if (state.argList.length === 0) throw error;
    } finally {
      if (state.abandon) state.argList.length = 0;
      if (state.argList.length > 0) setTimeout(work, state.timeout);else state.running = false;
    }
  };
  return (...args) => {
    state.argList.push(args);
    if (!state.running) return work();
  };
};

/**
 * 限制 Promise 并发
 * @param fnList 任务函数列表
 * @param callBack 成功执行一个 Promise 后调用，主要用于显示进度
 * @param limit 限制数
 * @returns 所有 Promise 的返回值
 */
const plimit = async (fnList, callBack = undefined, limit = 10) => {
  let doneNum = 0;
  const totalNum = fnList.length;
  const resList = [];
  const execPool = new Set();
  const taskList = fnList.map((fn, i) => {
    let p;
    return () => {
      p = (async () => {
        resList[i] = await fn();
        doneNum += 1;
        execPool.delete(p);
        callBack?.(doneNum, totalNum, resList, i);
      })();
      execPool.add(p);
    };
  });

  // eslint-disable-next-line no-unmodified-loop-condition
  while (doneNum !== totalNum) {
    while (taskList.length > 0 && execPool.size < limit) taskList.shift()();
    await Promise.race(execPool);
  }
  return resList;
};

/**
 * 判断使用参数颜色作为默认值时是否需要切换为黑暗模式
 * @param hexColor 十六进制颜色。例如 #112233
 */
const needDarkMode = hexColor => {
  // by: https://24ways.org/2010/calculating-color-contrast
  const r = Number.parseInt(hexColor.slice(1, 3), 16);
  const g = Number.parseInt(hexColor.slice(3, 5), 16);
  const b = Number.parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
};

async function wait(fn, timeout = Number.POSITIVE_INFINITY, waitTime = 100) {
  let res = await fn();
  let _timeout = timeout;
  while (_timeout > 0 && !res) {
    await sleep(waitTime);
    _timeout -= waitTime;
    res = await fn();
  }
  return res;
}

/** 等到指定的 dom 出现 */
const waitDom = (selector, timeout) => wait(() => querySelector(selector), timeout);

/** 等待指定的图片元素加载完成 */
const waitImgLoad = (target, timeout) => new Promise((resolve, reject) => {
  const img = typeof target === 'string' ? new Image() : target;
  if (img.complete && img.naturalHeight) resolve(img);
  const id = timeout ? window.setTimeout(() => reject(new Error('timeout')), timeout) : undefined;
  const handleError = e => {
    window.clearTimeout(id);
    reject(new Error(e.message));
  };
  const handleLoad = () => {
    window.clearTimeout(id);
    img.removeEventListener('error', handleError);
    resolve(img);
  };
  img.addEventListener('load', handleLoad, {
    once: true
  });
  img.addEventListener('error', handleError, {
    once: true
  });
  if (typeof target === 'string') img.src = target;
});

/** 将指定的布尔值转换为字符串或未定义 */
const boolDataVal = val => val ? '' : undefined;

/** 测试图片 url 能否正确加载 */
const testImgUrl = url => new Promise(resolve => {
  const img = new Image();
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
  img.src = url;
});
const canvasToBlob = async (canvas, type, quality = 1) => {
  if (canvas instanceof OffscreenCanvas) return canvas.convertToBlob({
    type,
    quality
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), type, quality);
  });
};

/**
 * 求 a 和 b 的差集，相当于从 a 中删去和 b 相同的属性
 *
 * 不会修改参数对象，返回的是新对象
 */
const difference = (a, b) => {
  const res = {};
  const keys = Object.keys(a);
  for (const key of keys) {
    if (typeof a[key] === 'object' && typeof b[key] === 'object') {
      const _res = difference(a[key], b[key]);
      if (Object.keys(_res).length > 0) res[key] = _res;
    } else if (a[key] !== b?.[key]) res[key] = a[key];
  }
  return res;
};
const _assign = (a, b) => {
  const res = JSON.parse(JSON.stringify(a));
  const keys = Object.keys(b);
  for (const key of keys) {
    if (res[key] === undefined) res[key] = b[key];else if (typeof b[key] === 'object') {
      const _res = _assign(res[key], b[key]);
      if (Object.keys(_res).length > 0) res[key] = _res;
    } else if (res[key] !== b[key]) res[key] = b[key];
  }
  return res;
};

/**
 * Object.assign 的深拷贝版，不会导致子对象属性的缺失
 *
 * 不会修改参数对象，返回的是新对象
 */
const assign = (target, ...sources) => {
  let res = target;
  for (const source of sources) if (typeof source === 'object') res = _assign(res, source);
  return res;
};

/** 根据路径获取对象下的指定值 */
const byPath = (obj, path, handleVal) => {
  const keys = path.split('.');
  let target = obj;
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];

    // 兼容含有「.」的 key
    while (!Reflect.has(target, key) && i < keys.length) {
      i += 1;
      if (keys[i] === undefined) break;
      key += \`.\${keys[i]}\`;
    }
    if (handleVal && i > keys.length - 2 && Reflect.has(target, key)) {
      const res = handleVal(target, key);
      while (i < keys.length - 1) {
        target = target[key];
        i += 1;
        key = keys[i];
      }
      if (res !== undefined) target[key] = res;
      break;
    }
    target = target[key];
  }
  if (target === obj) return null;
  return target;
};
const requestIdleCallback = (callback, timeout) => {
  if (Reflect.has(window, 'requestIdleCallback')) return window.requestIdleCallback(callback, {
    timeout
  });
  return window.setTimeout(callback, 16);
};

/** 获取键盘事件的编码 */
const getKeyboardCode = e => {
  let {
    key
  } = e;
  switch (key) {
    case 'Shift':
    case 'Control':
    case 'Alt':
      return key;
  }
  key = key.replaceAll(/\\b[A-Z]\\b/g, match => match.toLowerCase());
  if (e.ctrlKey) key = \`Ctrl + \${key}\`;
  if (e.altKey) key = \`Alt + \${key}\`;
  if (e.shiftKey) key = \`Shift + \${key}\`;
  return key;
};

/** 将快捷键的编码转换成更易读的形式 */
const keyboardCodeToText = code => code.replace('Control', 'Ctrl').replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('ArrowLeft', '←').replace('ArrowRight', '→').replace(/^\\s$/, 'Space');

/** 将 HTML 字符串转换为 DOM 对象 */
const domParse = html => new DOMParser().parseFromString(html, 'text/html');

/** 监听键盘事件 */
const linstenKeydown = (handler, capture) => window.addEventListener('keydown', e => {
  // 跳过输入框的键盘事件
  switch (e.target.tagName) {
    case 'INPUT':
    case 'TEXTAREA':
      return;
  }
  return handler(e);
}, {
  capture
});

/**
 * 劫持修改原网页上的函数
 *
 * 如果传入函数的所需参数为零，将在原函数执行完后自动调用
 */
const hijackFn = (fnName, fn) => {
  const rawFn = unsafeWindow[fnName];
  unsafeWindow[fnName] = fn.length === 0 ? (...args) => {
    const res = rawFn(...args);
    fn();
    return res;
  } : (...args) => fn(rawFn, args);
};
async function getGmValue(name, setValueFn) {
  const value = await GM.getValue(name);
  if (value !== undefined) return value;
  await setValueFn();
  return await GM.getValue(name);
}

/** 根据范围文本提取指定范围的元素的 index */
const extractRange = (rangeText, length) => {
  const list = new Set();
  for (const text of rangeText.replaceAll(/[^\\d,-]/g, '').split(',')) {
    if (/^\\d+$/.test(text)) list.add(Number(text) - 1);else if (/^\\d*-\\d*$/.test(text)) {
      let [start, end] = text.split('-').map(Number);
      end ||= length;
      for (start--, end--; start <= end; start++) list.add(start);
    }
  }
  return list;
};

/** extractRange 的逆向，按照相同的语法表述一个结果数组 */
const descRange = (list, length) => {
  let text = '';
  const nowRange = [];
  const pushRange = newIndex => {
    if (nowRange.length === 0) return;
    if (text.length > 0) text += ', ';
    if (nowRange.length === 1) text += nowRange[0] + 1;else {
      const end = newIndex === undefined && nowRange[1] === length - 1 ? '' : nowRange[1] + 1;
      text += \`\${nowRange[0] + 1}-\${end}\`;
    }
    nowRange.length = 0;
    if (newIndex !== undefined) nowRange[0] = newIndex;
  };
  for (const i of list) {
    switch (nowRange.length) {
      case 0:
        nowRange[0] = i;
        break;
      case 1:
        if (i === nowRange[0] + 1) nowRange[1] = i;else pushRange(i);
        break;
      case 2:
        if (i === nowRange[1] + 1) nowRange[1] = i;else pushRange(i);
        break;
    }
  }
  pushRange();
  return text;
};

/** 监听 url 变化 */
const onUrlChange = async (fn, handleUrl = location => location.href) => {
  let lastUrl = '';
  const refresh = singleThreaded(async () => {
    if (!(await wait(() => handleUrl(window.location) !== lastUrl, 5000))) return;
    lastUrl = handleUrl(window.location);
    await fn();
  });
  const controller = new AbortController();
  for (const eventName of ['click', 'popstate']) window.addEventListener(eventName, refresh, {
    capture: true,
    signal: controller.signal
  });
  refresh();
  return () => controller.abort();
};

/** wait，但是只在 url 变化时判断 */
const waitUrlChange = async isValidUrl => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
    const abort = await onUrlChange(() => {
      if (!isValidUrl()) return;
      resolve();
      abort();
    });
  });
};

let publicOwner;
solidJs.createRoot(() => {
  publicOwner = solidJs.getOwner();
});

/** 会自动设置 equals 的 createSignal */
const createEqualsSignal = (init, options) => solidJs.createSignal(init, {
  equals: isEqual,
  ...options
});

/** 会自动设置 equals 和 createRoot 的 createMemo */
const createRootMemo = (fn, init, options) => {
  // 如果函数已经是 createMemo 创建的，就直接使用
  if (fn.name === 'bound readSignal') return fn;
  const _init = init ?? fn(undefined);
  // 自动为对象类型设置 equals
  const _options = options?.equals === undefined && typeof _init === 'object' ? {
    ...options,
    equals: isEqual
  } : options;
  return solidJs.getOwner() ? solidJs.createMemo(fn, _init, _options) : solidJs.runWithOwner(publicOwner, () => solidJs.createMemo(fn, _init, _options));
};

/** 节流的 createMemo */
const createThrottleMemo = (fn, wait = 100, init = fn(undefined), options = undefined) => {
  const scheduled = createScheduled(_fn => throttle(_fn, wait));
  return createRootMemo(prev => scheduled() ? fn(prev) : prev, init, options);
};
const createMemoMap = fnMap => {
  const memoMap = Object.fromEntries(Object.entries(fnMap).map(([key, fn]) => [key, createRootMemo(fn)]));
  const map = createRootMemo(() => {
    const obj = {};
    for (const key of Object.keys(memoMap)) Reflect.set(obj, key, memoMap[key]());
    return obj;
  });
  return map;
};
const createRootEffect = (fn, val, options) => solidJs.getOwner() ? solidJs.createEffect(fn, val, options) : solidJs.runWithOwner(publicOwner, () => solidJs.createEffect(fn, val, options));
const createEffectOn = (deps, fn, options) => createRootEffect(solidJs.on(deps, fn, options));
const onAutoMount = fn => {
  const owner = solidJs.getOwner();
  if (!owner) return fn(owner);
  solidJs.onMount(() => {
    const cleanFn = fn(owner);
    if (cleanFn) solidJs.onCleanup(cleanFn);
  });
};

const promisifyRequest = request => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const openDb = (name, version, initSchema) => new Promise((resolve, reject) => {
  const request = indexedDB.open(\`ComicReadScript\${name}\`, version);
  request.onupgradeneeded = () => initSchema(request.result);
  request.onsuccess = () => resolve(request.result);
  request.onerror = error => {
    console.error('数据库打开失败', error);
    reject(new Error('数据库打开失败'));
  };
});
const useCache = async (schema, name = '', version = 2) => {
  const db = await openDb(name, version, typeof schema === 'function' ? schema : db => {
    for (const storeName of db.objectStoreNames) if (!Reflect.has(schema, storeName)) db.deleteObjectStore(storeName);
    for (const storeName of Object.keys(schema)) {
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, {
        keyPath: schema[storeName]
      });
    }
  });
  return {
    set: (storeName, value) => promisifyRequest(db.transaction(storeName, 'readwrite').objectStore(storeName).put(value)),
    get: async (storeName, query) => promisifyRequest(db.transaction(storeName, 'readonly').objectStore(storeName).get(query)),
    del: (storeName, query) => promisifyRequest(db.transaction(storeName, 'readwrite').objectStore(storeName).delete(query)),
    async each(storeName, callback) {
      const request = db.transaction(storeName, 'readwrite').objectStore(storeName).openCursor();
      request.onsuccess = async function (event) {
        const cursor = event.target.result;
        if (!cursor) return;
        await callback(cursor.value, cursor);
        cursor.continue();
      };
    }
  };
};

const createPointerState = (e, type = 'down') => {
  const xy = [e.clientX, e.clientY];
  return {
    id: e.pointerId,
    type,
    xy,
    initial: xy,
    last: xy,
    startTime: performance.now(),
    target: e.target
  };
};
const useDrag = ({
  ref,
  handleDrag,
  easyMode,
  handleClick,
  skip,
  setCapture,
  touches = new Map()
}) => {
  onAutoMount(() => {
    const controller = new AbortController();
    const options = {
      capture: false,
      passive: true,
      signal: controller.signal
    };
    let allowClick = -1;
    const handleDown = e => {
      if (skip?.(e)) return;
      e.stopPropagation();
      if (!easyMode?.() && e.buttons !== 1) return;
      if (setCapture) ref.setPointerCapture(e.pointerId);
      const state = createPointerState(e);
      touches.set(e.pointerId, state);
      handleDrag(state, e);

      // 在时限内松手才触发 click 事件
      allowClick = window.setTimeout(() => {
        allowClick = 0;
      }, 300);
    };
    const handleMove = e => {
      e.preventDefault();
      if (!easyMode?.() && e.buttons !== 1) return;
      const state = touches.get(e.pointerId);
      if (!state) return;
      state.type = 'move';
      state.xy = [e.clientX, e.clientY];
      handleDrag(state, e);
      state.last = state.xy;

      // 拖拽一段距离后就不触发 click 了
      if (allowClick > 0 && (Math.abs(e.clientX - state.initial[0]) > 5 || Math.abs(e.clientY - state.initial[1]) > 5)) {
        window.clearTimeout(allowClick);
        allowClick = -2;
      }
    };
    const handleUp = e => {
      e.stopPropagation();
      ref.releasePointerCapture(e.pointerId);
      const state = touches.get(e.pointerId);
      if (!state) return;
      touches.delete(e.pointerId);
      state.type = 'up';
      state.xy = [e.clientX, e.clientY];

      // 判断单击
      if (handleClick && allowClick && touches.size === 0 && approx(state.xy[0] - state.initial[0], 0, 5) && approx(state.xy[1] - state.initial[1], 0, 5)) handleClick(e, state.target);
      window.clearTimeout(allowClick);
      handleDrag(state, e);
    };
    const handleCancel = e => {
      e.stopPropagation();
      ref.releasePointerCapture(e.pointerId);
      const state = touches.get(e.pointerId);
      if (!state) return;
      state.type = 'cancel';
      handleDrag(state, e);
      touches.clear();
    };
    ref.addEventListener('pointerdown', handleDown, options);
    ref.addEventListener('pointermove', handleMove, {
      ...options,
      passive: false
    });
    ref.addEventListener('pointerup', handleUp, options);
    ref.addEventListener('pointercancel', handleCancel, options);
    if (easyMode) {
      ref.addEventListener('pointerover', handleDown, options);
      ref.addEventListener('pointerout', handleUp, options);
    }
    ref.addEventListener('click', e => {
      if (allowClick > 0 && touches.size === 0 || skip?.(e)) return;
      e.stopPropagation();
      e.preventDefault();
    }, {
      capture: true
    });
    return () => controller.abort();
  });
};

const useStore = initState => {
  const [_state, _setState] = store.createStore(initState);
  return {
    _state,
    _setState,
    setState: fn => _setState(store.produce(fn)),
    store: _state
  };
};

const useStyleSheet = e => {
  const styleSheet = new CSSStyleSheet();
  onAutoMount(() => {
    const root = e?.getRootNode() ?? document;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, styleSheet];
    return () => {
      const index = root.adoptedStyleSheets.indexOf(styleSheet);
      if (index !== -1) root.adoptedStyleSheets.splice(index, 1);
    };
  });
  return styleSheet;
};
const useStyle = (css, e) => {
  const styleSheet = useStyleSheet(e);
  if (typeof css === 'string') styleSheet.replaceSync(css);else createEffectOn(createRootMemo(css), style => styleSheet.replaceSync(style));
};
/** 用 CSSStyleSheet 实现和修改 style 一样的效果 */
const useStyleMemo = (selector, styleMapArg, e) => {
  const styleSheet = useStyleSheet(e);
  styleSheet.insertRule(\`\${selector} { }\`);
  const {
    style
  } = styleSheet.cssRules[0];
  // 等火狐实现了 CSS Typed OM 后改用 styleMap 性能会更好，也能使用 CSS Typed OM 的 单位

  const setStyle = (key, val) => {
    if (val === undefined || val === '') return style.removeProperty(key);
    style.setProperty(key, typeof val === 'string' ? val : \`\${val}\`);
  };
  const styleMapList = Array.isArray(styleMapArg) ? styleMapArg : [styleMapArg];
  for (const styleMap of styleMapList) {
    if (typeof styleMap === 'object') {
      for (const [key, val] of Object.entries(styleMap)) {
        const styleText = createRootMemo(val);
        createEffectOn(styleText, newVal => setStyle(key, newVal));
      }
    } else {
      const styleMemoMap = createRootMemo(styleMap);
      createEffectOn(styleMemoMap, map => {
        for (const [key, val] of Object.entries(map)) setStyle(key, val);
      });
    }
  }
};

const zh = {alert:{comic_load_error:"漫画加载出错",download_failed:"下载失败",fetch_comic_img_failed:"获取漫画图片失败",img_load_failed:"图片加载失败",no_img_download:"没有能下载的图片",repeat_load:"加载图片中，请稍候",retry_get_img_url:"重新获取第 {{i}} 页图片的地址",server_connect_failed:"无法连接到服务器"},button:{close_current_page_translation:"关闭当前页的翻译",download:"下载",download_completed:"下载完成",download_completed_error:"下载完成，但有 {{errorNum}} 张图片下载失败",downloading:"下载中",exit:"退出",fullscreen:"全屏",fullscreen_exit:"退出全屏",grid_mode:"网格模式",packaging:"打包中",page_fill:"页面填充",page_mode_double:"双页模式",page_mode_single:"单页模式",scroll_mode:"卷轴模式",setting:"设置",translate_current_page:"翻译当前页",zoom_in:"放大",zoom_out:"缩小"},description:"为漫画站增加双页阅读、翻译等优化体验的增强功能。",eh_tag_lint:{combo:"存在 [tag] 时，一般也存在 [tag]",conflict:"存在 [tag] 时，不应该存在 [tag]",correct_tag:"应该是正确的标签",miss_female:"缺少男性标签，可能需要",miss_parody:"缺少原作标签，可能需要",possible_conflict:"存在 [tag] 时，一般不应该存在 [tag]",prerequisite:"[tag] 的前置标签 [tag] 不存在"},end_page:{next_button:"下一话",prev_button:"上一话",tip:{end_jump:"已到结尾，继续向下翻页将跳至下一话",exit:"已到结尾，继续翻页将退出",start_jump:"已到开头，继续向上翻页将跳至上一话"}},hotkeys:{enter_read_mode:"进入阅读模式",float_tag_list:"悬浮标签列表",jump_to_end:"跳至尾页",jump_to_home:"跳至首页",page_down:"向下翻页",page_up:"向上翻页",scroll_down:"向下滚动",scroll_left:"向左滚动",scroll_right:"向右滚动",scroll_up:"向上滚动",switch_auto_enlarge:"切换图片自动放大选项",switch_dir:"切换阅读方向",switch_grid_mode:"切换网格模式",switch_page_fill:"切换页面填充",switch_scroll_mode:"切换卷轴模式",switch_single_double_page_mode:"切换单双页模式"},img_status:{error:"加载出错",loading:"正在加载",wait:"等待加载"},other:{"default":"默认",disable:"禁用",enabled:"启用",enter_comic_read_mode:"进入漫画阅读模式",fab_hidden:"隐藏悬浮按钮",fab_show:"显示悬浮按钮",fill_page:"填充页",img_loading:"图片加载中",loading_img:"加载图片中",none:"无",or:"或",page_range:"请输入页码范围：\\n（例如：1, 3-5, 9-)",read_mode:"阅读模式"},pwa:{alert:{img_data_error:"图片数据错误",img_not_found:"找不到图片",img_not_found_files:"请选择图片文件或含有图片文件的压缩包",img_not_found_folder:"文件夹下没有图片文件或含有图片文件的压缩包",not_valid_url:"不是有效的 URL",repeat_load:"正在加载其他文件中……",unzip_error:"解压出错",unzip_password_error:"解压密码错误",userscript_not_installed:"未安装 ComicRead 脚本"},button:{enter_url:"输入 URL",install:"安装",no_more_prompt:"不再提示",resume_read:"恢复阅读",select_files:"选择文件",select_folder:"选择文件夹"},install_md:"### 每次都要打开这个网页很麻烦？\\n如果你希望\\n1. 能有独立的窗口，像是在使用本地软件一样\\n1. 加入本地压缩文件的打开方式之中，方便直接打开\\n1. 离线使用~~（主要是担心国内网络抽风无法访问这个网页~~\\n### 欢迎将本页面作为 PWA 应用安装到电脑上😃👍",message:{enter_password:"请输入密码",unzipping:"解压缩中"},tip_enter_url:"请输入压缩包 URL",tip_md:"# ComicRead PWA\\n使用 [ComicRead](https://github.com/hymbz/ComicReadScript) 的阅读模式阅读**本地**漫画\\n---\\n### 将图片文件、文件夹、压缩包直接拖入即可开始阅读\\n*也可以选择**直接粘贴**或**输入**压缩包 URL 下载阅读*"},setting:{hotkeys:{add:"添加新快捷键",restore:"恢复默认快捷键"},language:"语言",option:{abreast_duplicate:"每列重复比例",abreast_mode:"并排卷轴模式",always_load_all_img:"始终加载所有图片",autoHiddenMouse:"自动隐藏鼠标",auto_switch_page_mode:"根据屏幕比例切换单双页",background_color:"背景颜色",click_page_turn_area:"点击区域",click_page_turn_enabled:"点击翻页",click_page_turn_swap_area:"左右点击区域交换",click_page_turn_vertical:"上下翻页",dark_mode:"黑暗模式",dark_mode_auto:"黑暗模式跟随系统",dir_ltr:"从左到右（美漫）",dir_rtl:"从右到左（日漫）",disable_auto_enlarge:"禁止图片自动放大",first_page_fill:"默认启用首页填充",fit_to_width:"图片适合宽度",img_recognition:"图像识别",img_recognition_background:"识别背景色",img_recognition_pageFill:"自动调整页面填充",img_recognition_warn:"❗ 当前浏览器不支持 Web Worker，开启此功能可能导致页面卡顿，建议升级或更换浏览器。",img_recognition_warn_2:"❗ 当前网站不支持 Web Worker，开启此功能可能导致页面卡顿。",paragraph_appearance:"外观",paragraph_dir:"阅读方向",paragraph_display:"显示",paragraph_hotkeys:"快捷键",paragraph_other:"其他",paragraph_scrollbar:"滚动条",paragraph_translation:"翻译",preload_page_num:"预加载页数",scroll_end:"翻页至尽头后",scroll_end_auto:"优先跳至上/下一话，否则退出",scroll_mode_img_scale:"卷轴图片缩放",scroll_mode_img_spacing:"卷轴图片间距",scrollbar_auto_hidden:"自动隐藏",scrollbar_easy_scroll:"快捷滚动",scrollbar_position:"位置",scrollbar_position_auto:"自动",scrollbar_position_bottom:"底部",scrollbar_position_hidden:"隐藏",scrollbar_position_right:"右侧",scrollbar_position_top:"顶部",scrollbar_show_img_status:"显示图片加载状态",show_clickable_area:"显示点击区域",show_comments:"在结束页显示评论",swap_page_turn_key:"左右翻页键交换",zoom:"图片缩放"},translation:{cotrans_tip:"<p>将使用 <a href=\\"https://cotrans.touhou.ai\\" target=\\"_blank\\">Cotrans</a> 提供的接口翻译图片，该服务器由其维护者用爱发电自费维护</p>\\n<p>多人同时使用时需要排队等待，等待队列达到上限后再上传新图片会报错，需要过段时间再试</p>\\n<p>所以还请 <b>注意用量</b></p>\\n<p>更推荐使用自己本地部署的项目，既不占用服务器资源也不需要排队</p>",options:{detection_resolution:"文本扫描清晰度",direction:"渲染字体方向",direction_auto:"原文一致",direction_horizontal:"仅限水平",direction_vertical:"仅限垂直",forceRetry:"忽略缓存强制重试",localUrl:"自定义服务器 URL",onlyDownloadTranslated:"只下载翻译完的图片",target_language:"目标语言",text_detector:"文本扫描器",translator:"翻译服务"},range:"翻译范围",server:"翻译服务器",server_selfhosted:"本地部署",translate_all:"翻译全部图片",translate_to_end:"翻译当前页至结尾"}},site:{add_feature:{associate_nhentai:"关联nhentai",auto_adjust_option:"自动调整阅读配置",auto_page_turn:"无限滚动",auto_show:"自动进入阅读模式",block_totally:"彻底屏蔽漫画",colorize_tag:"标签染色",detect_ad:"识别广告页",float_tag_list:"悬浮标签列表",hotkeys:"快捷键",load_original_image:"加载原图",lock_option:"锁定站点配置",open_link_new_page:"在新页面中打开链接",quick_favorite:"快捷收藏",quick_rating:"快捷评分",quick_tag_define:"快捷查看标签定义",remember_current_site:"记住当前站点",tag_lint:"标签检查"},changed_load_failed:"网站发生变化，无法加载漫画",ehentai:{change_favorite_failed:"收藏夹修改失败",change_favorite_success:"收藏夹修改成功",change_rating_failed:"评分修改失败",change_rating_success:"评分修改成功",fetch_favorite_failed:"获取收藏夹信息失败",fetch_img_page_source_failed:"获取图片页源码失败",fetch_img_page_url_failed:"从详情页获取图片页地址失败",fetch_img_url_failed:"从图片页获取图片地址失败",html_changed_nhentai_failed:"页面结构发生改变，关联 nhentai 漫画功能无法正常生效",ip_banned:"IP地址被禁",nhentai_error:"nhentai 匹配出错",nhentai_failed:"匹配失败，请在确认登录 {{nhentai}} 后刷新"},need_captcha:"需要人机验证",nhentai:{fetch_next_page_failed:"获取下一页漫画数据失败",tag_blacklist_fetch_failed:"标签黑名单获取失败"},settings_tip:"设置",show_settings_menu:"显示设置菜单",simple:{auto_read_mode_message:"已默认开启「自动进入阅读模式」",no_img:"未找到合适的漫画图片，\\n如有需要可点此关闭简易阅读模式",simple_read_mode:"使用简易阅读模式"}},touch_area:{menu:"菜单",next:"下页",prev:"上页",type:{edge:"边缘",l:"L",left_right:"左右",up_down:"上下"}},translation:{status:{colorizing:"正在上色","default":"未知状态",detection:"正在检测文本",downscaling:"正在缩小图片",error:"翻译出错","error-lang":"你选择的翻译服务不支持你选择的语言","error-translating":"翻译服务没有返回任何文本","error-with-id":"翻译出错",finished:"正在整理结果",inpainting:"正在修补图片","mask-generation":"正在生成文本掩码",ocr:"正在识别文本",pending:"正在等待","pending-pos":"正在等待",preparing:"等待空闲窗口",rendering:"正在渲染",saved:"保存结果","skip-no-regions":"图片中没有检测到文本区域","skip-no-text":"图片中没有检测到文本",textline_merge:"正在整合文本",translating:"正在翻译文本",upscaling:"正在放大图片"},tip:{check_img_status_failed:"检查图片状态失败",download_img_failed:"下载图片失败",get_translator_list_error:"获取可用翻译服务列表时出错",id_not_returned:"未返回 id",img_downloading:"下载图片中",img_not_fully_loaded:"图片未加载完毕",pending:"正在等待，列队还有 {{pos}} 张图片",resize_img_failed:"缩放图片失败",translating:"翻译图片中",translation_completed:"翻译完成",upload:"上传图片中",upload_error:"上传图片出错",upload_return_error:"服务器翻译出错",wait_translation:"等待翻译"},translator:{baidu:"百度",deepl:"DeepL",google:"谷歌","gpt3.5":"GPT-3.5",none:"删除文本",offline:"离线模型",original:"原文",youdao:"有道"}}};

const en = {alert:{comic_load_error:"Comic loading error",download_failed:"Download failed",fetch_comic_img_failed:"Failed to fetch comic images",img_load_failed:"Image loading failed",no_img_download:"No images available for download",repeat_load:"Loading image, please wait",retry_get_img_url:"Retrieve the URL of the image on page {{i}} again",server_connect_failed:"Unable to connect to the server"},button:{close_current_page_translation:"Close translation of the current page",download:"Download",download_completed:"Download completed",download_completed_error:"Download complete, but {{errorNum}} images failed to download",downloading:"Downloading",exit:"Exit",fullscreen:"Fullscreen",fullscreen_exit:"Exit Fullscreen",grid_mode:"Grid mode",packaging:"Packaging",page_fill:"Page fill",page_mode_double:"Double page mode",page_mode_single:"Single page mode",scroll_mode:"Scroll mode",setting:"Settings",translate_current_page:"Translate current page",zoom_in:"Zoom in",zoom_out:"Zoom out"},description:"Add enhanced features to the comic site for optimized experience, including dual-page reading and translation.",eh_tag_lint:{combo:"[tag]: In most cases, Should coexist with [tag]",conflict:"[tag]: Should not coexist with [tag]",correct_tag:"Should be the correct tag",miss_female:"Missing male tag, might need",miss_parody:"Missing parody tag, might need",possible_conflict:"[tag]: In most cases, Should not coexist with [tag]",prerequisite:"[tag]: The prerequisite tag [tag] does not exist"},end_page:{next_button:"Next chapter",prev_button:"Prev chapter",tip:{end_jump:"Reached the last page, scrolling down will jump to the next chapter",exit:"Reached the last page, scrolling down will exit",start_jump:"Reached the first page, scrolling up will jump to the previous chapter"}},hotkeys:{enter_read_mode:"Enter reading mode",float_tag_list:"Floating tag list",jump_to_end:"Jump to the last page",jump_to_home:"Jump to the first page",page_down:"Turn the page to the down",page_up:"Turn the page to the up",scroll_down:"Scroll down",scroll_left:"Scroll left",scroll_right:"Scroll right",scroll_up:"Scroll up",switch_auto_enlarge:"Switch auto image enlarge option",switch_dir:"Switch reading direction",switch_grid_mode:"Switch grid mode",switch_page_fill:"Switch page fill",switch_scroll_mode:"Switch scroll mode",switch_single_double_page_mode:"Switch single/double page mode"},img_status:{error:"Load Error",loading:"Loading",wait:"Waiting for load"},other:{"default":"Default",disable:"Disable",enabled:"Enabled",enter_comic_read_mode:"Enter comic reading mode",fab_hidden:"Hide floating button",fab_show:"Show floating button",fill_page:"Fill Page",img_loading:"Image loading",loading_img:"Loading image",none:"None",or:"or",page_range:"Please enter the page range.:\\n (e.g., 1, 3-5, 9-)",read_mode:"Reading mode"},pwa:{alert:{img_data_error:"Image data error",img_not_found:"Image not found",img_not_found_files:"Please select an image file or a compressed file containing image files",img_not_found_folder:"No image files or compressed files containing image files in the folder",not_valid_url:"Not a valid URL",repeat_load:"Loading other files…",unzip_error:"Decompression error",unzip_password_error:"Decompression password error",userscript_not_installed:"ComicRead userscript not installed"},button:{enter_url:"Enter URL",install:"Install",no_more_prompt:"Do not prompt again",resume_read:"Restore reading",select_files:"Select File",select_folder:"Select folder"},install_md:"### Tired of opening this webpage every time?\\nIf you wish to:\\n1. Have an independent window, as if using local software\\n1. Add to the local compressed file opening method for easy direct opening\\n1. Use offline\\n### Welcome to install this page as a PWA app on your computer😃👍",message:{enter_password:"Please enter your password",unzipping:"Unzipping"},tip_enter_url:"Please enter the URL of the compressed file",tip_md:"# ComicRead PWA\\nRead **local** comics using [ComicRead](https://github.com/hymbz/ComicReadScript) reading mode.\\n---\\n### Drag and drop image files, folders, or compressed files directly to start reading\\n*You can also choose to **paste directly** or **enter** the URL of the compressed file for downloading and reading*"},setting:{hotkeys:{add:"Add new hotkeys",restore:"Restore default hotkeys"},language:"Language",option:{abreast_duplicate:"Column duplicates ratio",abreast_mode:"Abreast scroll mode",always_load_all_img:"Always load all images",autoHiddenMouse:"Auto hide mouse",auto_switch_page_mode:"Auto switch single/double page mode by aspect ratio",background_color:"Background Color",click_page_turn_area:"Touch area",click_page_turn_enabled:"Click to turn page",click_page_turn_swap_area:"Swap LR clickable areas",click_page_turn_vertical:"Vertically arranged clickable areas",dark_mode:"Dark mode",dark_mode_auto:"Dark mode follow system",dir_ltr:"LTR (American comics)",dir_rtl:"RTL (Japanese manga)",disable_auto_enlarge:"Disable automatic image enlarge",first_page_fill:"Enable first page fill by default",fit_to_width:"Fit to width",img_recognition:"Image Recognition",img_recognition_background:"Recognition background color",img_recognition_pageFill:"Auto switch page fill",img_recognition_warn:"❗ The current browser does not support Web Workers. Enabling this feature may cause page lag. It's recommended to upgrade or switch browsers.",img_recognition_warn_2:"❗ The current website does not support Web Workers. Enabling this feature may cause page lag.",paragraph_appearance:"Appearance",paragraph_dir:"Reading direction",paragraph_display:"Display",paragraph_hotkeys:"Hotkeys",paragraph_other:"Other",paragraph_scrollbar:"Scrollbar",paragraph_translation:"Translation",preload_page_num:"Preload page number",scroll_end:"After reaching the End",scroll_end_auto:"First jump to previous/next chapter, else exit",scroll_mode_img_scale:"Scroll mode image zoom ratio",scroll_mode_img_spacing:"Scroll mode image spacing",scrollbar_auto_hidden:"Auto hide",scrollbar_easy_scroll:"Easy scroll",scrollbar_position:"position",scrollbar_position_auto:"Auto",scrollbar_position_bottom:"Bottom",scrollbar_position_hidden:"Hidden",scrollbar_position_right:"Right",scrollbar_position_top:"Top",scrollbar_show_img_status:"Show image loading status",show_clickable_area:"Show clickable areas",show_comments:"Show comments on the end page",swap_page_turn_key:"Swap LR page-turning keys",zoom:"Image zoom ratio"},translation:{cotrans_tip:"<p>Using the interface provided by <a href=\\"https://cotrans.touhou.ai\\" target=\\"_blank\\">Cotrans</a> to translate images, which is maintained by its maintainer at their own expense.</p>\\n<p>When multiple people use it at the same time, they need to queue and wait. If the waiting queue reaches its limit, uploading new images will result in an error. Please try again after a while.</p>\\n<p>So please <b>mind the frequency of use</b>.</p>\\n<p>It is highly recommended to use your own locally deployed project, as it does not consume server resources and does not require queuing.</p>",options:{detection_resolution:"Text detection resolution",direction:"Render text orientation",direction_auto:"Follow source",direction_horizontal:"Horizontal only",direction_vertical:"Vertical only",forceRetry:"Force retry (ignore cache)",localUrl:"customize server URL",onlyDownloadTranslated:"Download only the translated images",target_language:"Target language",text_detector:"Text detector",translator:"Translator"},range:"Scope of Translation",server:"Translation server",server_selfhosted:"Selfhosted",translate_all:"Translate all images",translate_to_end:"Translate the current page to the end"}},site:{add_feature:{associate_nhentai:"Associate nhentai",auto_adjust_option:"Auto adjust reading option",auto_page_turn:"Infinite scroll",auto_show:"Auto enter reading mode",block_totally:"Totally block comics",colorize_tag:"Colorize tags",detect_ad:"Detect advertise page",float_tag_list:"Floating tag list",hotkeys:"Hotkeys",load_original_image:"Load original image",lock_option:"Lock site option",open_link_new_page:"Open links in a new page",quick_favorite:"Quick favorite",quick_rating:"Quick rating",quick_tag_define:"Quick view tag define",remember_current_site:"Remember the current site",tag_lint:"Tag Lint"},changed_load_failed:"The website has undergone changes, unable to load comics",ehentai:{change_favorite_failed:"Failed to change the favorite",change_favorite_success:"Successfully changed the favorite",change_rating_failed:"Failed to change the rating",change_rating_success:"Successfully changed the rating",fetch_favorite_failed:"Failed to get favorite info",fetch_img_page_source_failed:"Failed to get the source code of the image page",fetch_img_page_url_failed:"Failed to get the image page address from the detail page",fetch_img_url_failed:"Failed to get the image address from the image page",html_changed_nhentai_failed:"The web page structure has changed, the function to associate nhentai comics is not working properly",ip_banned:"IP address is banned",nhentai_error:"Error in nhentai matching",nhentai_failed:"Matching failed, please refresh after confirming login to {{nhentai}}"},need_captcha:"Need CAPTCHA verification",nhentai:{fetch_next_page_failed:"Failed to get next page of comic data",tag_blacklist_fetch_failed:"Failed to fetch tag blacklist"},settings_tip:"Settings",show_settings_menu:"Show settings menu",simple:{auto_read_mode_message:"\\"Auto enter reading mode\\" is enabled by default",no_img:"No suitable comic images were found.\\nIf necessary, you can click here to close the simple reading mode.",simple_read_mode:"Enter simple reading mode"}},touch_area:{menu:"Menu",next:"Next Page",prev:"Prev Page",type:{edge:"Edge",l:"L",left_right:"Left Right",up_down:"Up Down"}},translation:{status:{colorizing:"Colorizing","default":"Unknown status",detection:"Detecting text",downscaling:"Downscaling",error:"Error during translation","error-lang":"The target language is not supported by the chosen translator","error-translating":"Did not get any text back from the text translation service","error-with-id":"Error during translation",finished:"Finishing",inpainting:"Inpainting","mask-generation":"Generating mask",ocr:"Scanning text",pending:"Pending","pending-pos":"Pending",preparing:"Waiting for idle window",rendering:"Rendering",saved:"Saved","skip-no-regions":"No text regions detected in the image","skip-no-text":"No text detected in the image",textline_merge:"Merging text lines",translating:"Translating",upscaling:"Upscaling"},tip:{check_img_status_failed:"Failed to check image status",download_img_failed:"Failed to download image",get_translator_list_error:"Error occurred while getting the list of available translation services",id_not_returned:"No id returned",img_downloading:"Downloading images",img_not_fully_loaded:"Image has not finished loading",pending:"Pending, {{pos}} in queue",resize_img_failed:"Failed to resize image",translating:"Translating image",translation_completed:"Translation completed",upload:"Uploading image",upload_error:"Image upload error",upload_return_error:"Error during server translation",wait_translation:"Waiting for translation"},translator:{baidu:"baidu",deepl:"DeepL",google:"Google","gpt3.5":"GPT-3.5",none:"Remove texts",offline:"offline translator",original:"Original",youdao:"youdao"}}};

const ru = {alert:{comic_load_error:"Ошибка загрузки комикса",download_failed:"Ошибка загрузки",fetch_comic_img_failed:"Не удалось загрузить изображения",img_load_failed:"Не удалось загрузить изображение",no_img_download:"Нет доступных картинок для загрузки",repeat_load:"Загрузка изображения, пожалуйста подождите",retry_get_img_url:"Повторно получить адрес изображения на странице {{i}}",server_connect_failed:"Не удалось подключиться к серверу"},button:{close_current_page_translation:"Скрыть перевод текущей страницы",download:"Скачать",download_completed:"Загрузка завершена",download_completed_error:"Загрузка завершена, но {{errorNum}} изображений не удалось загрузить",downloading:"Скачивание",exit:"Выход",fullscreen:"полноэкранный",fullscreen_exit:"выйти из полноэкранного режима",grid_mode:"Режим сетки",packaging:"Упаковка",page_fill:"Заполнить страницу",page_mode_double:"Двухчастичный режим",page_mode_single:"Одностраничный режим",scroll_mode:"Режим прокрутки",setting:"Настройки",translate_current_page:"Перевести текущую страницу",zoom_in:"Приблизить",zoom_out:"Уменьшить"},description:"Добавляет расширенные функции для удобства на сайт, такие как двухстраничный режим и перевод.",eh_tag_lint:{combo:"[тег]: В большинстве случаев должен сосуществовать с [тегом]",conflict:"[tag]: Не должен сосуществовать с [tag]",correct_tag:"Должен быть правильный тег",miss_female:"Отсутствует мужской тег, возможно, понадобится",miss_parody:"Отсутствует тег пародии, возможно, понадобится",possible_conflict:"[tag]: В большинстве случаев не должен сосуществовать с [tag]",prerequisite:"[tag]: Предварительный тег [tag] не существует"},end_page:{next_button:"Следующая глава",prev_button:"Предыдущая глава",tip:{end_jump:"Последняя страница, следующая глава ниже",exit:"Последняя страница, ниже комикс будет закрыт",start_jump:"Первая страница, выше будет загружена предыдущая глава"}},hotkeys:{enter_read_mode:"Режим чтения",float_tag_list:"Плавающий список тегов",jump_to_end:"Перейти к последней странице",jump_to_home:"Перейти к первой странице",page_down:"Перелистнуть страницу вниз",page_up:"Перелистнуть страницу вверх",scroll_down:"Прокрутить вниз",scroll_left:"Прокрутить влево",scroll_right:"Прокрутите вправо",scroll_up:"Прокрутите вверх",switch_auto_enlarge:"Автоматическое приближение",switch_dir:"Направление чтения",switch_grid_mode:"Режим сетки",switch_page_fill:"Заполнение страницы",switch_scroll_mode:"Режим прокрутки",switch_single_double_page_mode:"Одностраничный/Двухстраничный режим"},img_status:{error:"Ошибка загрузки",loading:"Загрузка",wait:"Ожидание загрузки"},other:{"default":"Дефолт",disable:"Отключить",enabled:"Включено",enter_comic_read_mode:"Режим чтения комиксов",fab_hidden:"Скрыть плавающую кнопку",fab_show:"Показать плавающую кнопку",fill_page:"Заполнить страницу",img_loading:"Изображение загружается",loading_img:"Загрузка изображения",none:"Отсутствует",or:"или",page_range:"Введите диапазон страниц.:\\n (например, 1, 3-5, 9-)",read_mode:"Режим чтения"},pwa:{alert:{img_data_error:"Ошибка данных изображения",img_not_found:"Изображение не найдено",img_not_found_files:"Пожалуйста выберите файл или архив с изображениями",img_not_found_folder:"В папке не найдены изображения или архивы с изображениями",not_valid_url:"Невалидный URL",repeat_load:"Загрузка других файлов…",unzip_error:"Ошибка распаковки",unzip_password_error:"Неверный пароль от архива",userscript_not_installed:"ComicRead не установлен"},button:{enter_url:"Ввести URL",install:"Установить",no_more_prompt:"Больше не показывать",resume_read:"Продолжить чтение",select_files:"Выбрать файл",select_folder:"Выбрать папку"},install_md:"### Устали открывать эту страницу каждый раз?\\nЕсли вы хотите:\\n1. Иметь отдельное окно, как если бы вы использовали обычное программное обеспечение\\n1. Открывать архивы напрямую\\n1. Пользоваться оффлайн\\n### Установите эту страницу в качестве [PWA](https://ru.wikipedia.org/wiki/%D0%9F%D1%80%D0%BE%D0%B3%D1%80%D0%B5%D1%81%D1%81%D0%B8%D0%B2%D0%BD%D0%BE%D0%B5_%D0%B2%D0%B5%D0%B1-%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5) на свой компьютер 🐺☝️",message:{enter_password:"Пожалуйста введите пароль",unzipping:"Распаковка"},tip_enter_url:"Введите URL архива",tip_md:"# ComicRead PWA\\nИспользуйте [ComicRead](https://github.com/hymbz/ComicReadScript) для чтения комиксов **локально**.\\n---\\n### Перетащите изображения, папки или архивы чтобы начать читать\\n*Вы так же можете **открыть** или **вставить** URL архива на напрямую*"},setting:{hotkeys:{add:"Добавить горячие клавиши",restore:"Восстановить горячие клавиши по умолчанию"},language:"Язык",option:{abreast_duplicate:"Коэффициент дублирования столбцов",abreast_mode:"Режим прокрутки в ряд",always_load_all_img:"Всегда загружать все изображения",autoHiddenMouse:"Автоматически скрывать курсор мыши",auto_switch_page_mode:"Автоматическое переключение режима одной/двойной страницы в зависимости от соотношения сторон",background_color:"Цвет фона",click_page_turn_area:"Область нажатия",click_page_turn_enabled:"Перелистывать по клику",click_page_turn_swap_area:"Поменять местами правую и левую области переключения страниц",click_page_turn_vertical:"Вертикальная область переключения страниц",dark_mode:"Ночная тема",dark_mode_auto:"Тёмный режим следует за системой",dir_ltr:"Чтение слева направо (Американские комиксы)",dir_rtl:"Чтение справа налево (Японская манга)",disable_auto_enlarge:"Отключить автоматическое масштабирование изображений",first_page_fill:"Включить заполнение первой страницы по умолчанию",fit_to_width:"По ширине",img_recognition:"распознавание изображений",img_recognition_background:"Определить цвет фона",img_recognition_pageFill:"Автоматическое переключение заполнения страницы",img_recognition_warn:"❗ Текущий браузер не поддерживает Web Workers. Включение этой функции может вызвать задержку страницы. Рекомендуется обновить или сменить браузер.",img_recognition_warn_2:"❗ Текущий веб-сайт не поддерживает Web Workers. Включение этой функции может привести к задержке страницы.",paragraph_appearance:"Внешность",paragraph_dir:"Направление чтения",paragraph_display:"Отображение",paragraph_hotkeys:"Горячие клавиши",paragraph_other:"Другое",paragraph_scrollbar:"Полоса прокрутки",paragraph_translation:"Перевод",preload_page_num:"Предзагружать страниц",scroll_end:"После достижения конца",scroll_end_auto:"Сначала переход к предыдущей/следующей главе, иначе выход",scroll_mode_img_scale:"Коэффициент масштабирования изображения в режиме скроллинга",scroll_mode_img_spacing:"Расстояние между страницами в режиме скроллинга",scrollbar_auto_hidden:"Автоматически скрывать",scrollbar_easy_scroll:"Лёгкая прокрутка",scrollbar_position:"Позиция",scrollbar_position_auto:"Авто",scrollbar_position_bottom:"Снизу",scrollbar_position_hidden:"Спрятано",scrollbar_position_right:"Справа",scrollbar_position_top:"Сверху",scrollbar_show_img_status:"Показывать статус загрузки изображения",show_clickable_area:"Показывать кликабельные области",show_comments:"Показывать комментарии на последней странице",swap_page_turn_key:"Поменять местами клавиши переключения страниц",zoom:"Коэффициент масштабирования изображения"},translation:{cotrans_tip:"<p>Использует для перевода <a href=\\"https://cotrans.touhou.ai\\" target=\\"_blank\\">Cotrans API</a>, работающий исключительно за счёт своего создателя.</p>\\n<p>Запросы обрабатываются по одному в порядке синхронной очереди. Когда очередь превышает лимит новые запросы будут приводить к ошибке. Если такое случилось попробуйте позже.</p>\\n<p>Так что пожалуйста <b>учитывайте загруженность при выборе</b></p>\\n<p>Настоятельно рекомендовано использовать проект развёрнутый локально т.к. это не потребляет серверные ресурсы и вы не ограничены очередью.</p>",options:{detection_resolution:"Разрешение распознавания текста",direction:"Ориетнация текста",direction_auto:"Следование оригиналу",direction_horizontal:"Только горизонтально",direction_vertical:"Только вертикально",forceRetry:"Принудительный повтор(Игнорировать кэш)",localUrl:"Настроить URL сервера",onlyDownloadTranslated:"Скачать только переведённые изображения",target_language:"Целевой язык",text_detector:"Детектор текста",translator:"Переводчик"},range:"Объем перевода",server:"Сервер",server_selfhosted:"Свой",translate_all:"Перевести все изображения",translate_to_end:"Переводить страницу до конца"}},site:{add_feature:{associate_nhentai:"Ассоциация с nhentai",auto_adjust_option:"Автоматическая настройка параметра чтения",auto_page_turn:"Автопереворот страниц",auto_show:"Автоматически включать режим чтения",block_totally:"Глобально заблокировать комиксы",colorize_tag:"Раскрасить теги",detect_ad:"Detect advertise page",float_tag_list:"Плавающий список тегов",hotkeys:"Горячие клавиши",load_original_image:"Загружать оригинальное изображение",lock_option:"Блокировка опции сайта",open_link_new_page:"Открывать ссылки в новой вкладке",quick_favorite:"Быстрый фаворит",quick_rating:"Быстрый рейтинг",quick_tag_define:"Определение тега быстрого просмотра",remember_current_site:"Запомнить текущий сайт",tag_lint:"Тэг Линт"},changed_load_failed:"Страница изменилась, невозможно загрузить комикс",ehentai:{change_favorite_failed:"Не удалось изменить избранное",change_favorite_success:"Избранное успешно изменено",change_rating_failed:"Не удалось изменить оценку",change_rating_success:"Успешно изменен рейтинг",fetch_favorite_failed:"Не удалось получить информацию о избранном",fetch_img_page_source_failed:"Не удалось получить исходный код страницы с изображениями",fetch_img_page_url_failed:"Не удалось получить адрес страницы изображений из деталей",fetch_img_url_failed:"Не удалось получить адрес изображения",html_changed_nhentai_failed:"Структура страницы изменилась, функция nhentai manga работает некорректно",ip_banned:"IP адрес забанен",nhentai_error:"Ошибка сопоставления с nhentai",nhentai_failed:"Ошибка сопостовления. Пожалуйста перезагрузите страницу после входа на {{nhentai}}"},need_captcha:"CAPTCHA",nhentai:{fetch_next_page_failed:"Не удалось получить следующую страницу",tag_blacklist_fetch_failed:"Не удалось получить заблокированные теги"},settings_tip:"Настройки",show_settings_menu:"Показать меню настроек",simple:{auto_read_mode_message:"\\"Автоматически включать режим чтения\\" по умолчанию",no_img:"Не найдено подходящих изображений. Можно нажать тут что бы выключить режим простого чтения.",simple_read_mode:"Включить простой режим чтения"}},touch_area:{menu:"Меню",next:"Следующая страница",prev:"Предыдущая страница",type:{edge:"Грань",l:"L",left_right:"Лево Право",up_down:"Верх Низ"}},translation:{status:{colorizing:"Раскрашивание","default":"Неизвестный статус",detection:"Распознавание текста",downscaling:"Уменьшение масштаба",error:"Ошибка перевода","error-lang":"Целевой язык не поддерживается выбранным переводчиком","error-translating":"Ошибка перевода(пустой ответ)","error-with-id":"Ошибка во время перевода",finished:"Завершение",inpainting:"Наложение","mask-generation":"Генерация маски",ocr:"Распознавание текста",pending:"Ожидание","pending-pos":"Ожидание",preparing:"Ожидание окна бездействия",rendering:"Отрисовка",saved:"Сохранено","skip-no-regions":"На изображении не обнаружено текстовых областей.","skip-no-text":"Текст на изображении не обнаружен",textline_merge:"Обьединение текста",translating:"Переводится",upscaling:"Увеличение изображения"},tip:{check_img_status_failed:"Не удалось проверить статус изображения",download_img_failed:"Не удалось скачать изображение",get_translator_list_error:"Произошла ошибка во время получения списка доступных переводчиков",id_not_returned:"ID не вернули(",img_downloading:"Скачивание изображений",img_not_fully_loaded:"Изображение всё ещё загружается",pending:"Ожидение, позиция в очереди {{pos}}",resize_img_failed:"Не удалось изменить размер изображения",translating:"Изображение переводится",translation_completed:"Перевод завершён",upload:"Загрузка изображения",upload_error:"Ошибка загрузки изображения",upload_return_error:"Ошибка перевода на сервере",wait_translation:"Ожидание перевода"},translator:{baidu:"baidu",deepl:"DeepL",google:"Google","gpt3.5":"GPT-3.5",none:"Убрать текст",offline:"Оффлайн переводчик",original:"Оригинал",youdao:"youdao"}}};

const ta = {alert:{comic_load_error:"காமிக் பிழை",download_failed:"தோல்வி பதிவிறக்கவும்",fetch_comic_img_failed:"காமிக் படங்களைப் பெறத் தவறியது",img_load_failed:"பட சுமை தோல்வியடைந்தது",no_img_download:"பதிவிறக்கம் செய்யக்கூடிய எந்த படமும் இல்லை",repeat_load:"படத்தை ஏற்றவும், தயவுசெய்து ஒரு கணம் காத்திருங்கள்",retry_get_img_url:"{{i}} ஆம் பக்கத்தின் படத்தின் முகவரியை மீண்டும் பெறவும்",server_connect_failed:"சேவையகத்துடன் இணைக்க முடியாது"},button:{close_current_page_translation:"தற்போதைய பக்கத்தின் மொழிபெயர்ப்பை அணைக்கவும்",download:"பதிவிறக்குங்கள்",download_completed:"பதிவிறக்குங்கள்",download_completed_error:"பதிவிறக்கம் முடிந்தது, ஆனால் {{errorNum}} படங்களை பதிவிறக்க முடியவில்லை",downloading:"பதிவிறக்குங்கள்",exit:"வெளியேறு",fullscreen:"முழுத்திரை",fullscreen_exit:"முழுத்திரையிலிருந்து வெளியேறு",grid_mode:"கட்டம் பயன்முறை",packaging:"பேக்",page_fill:"பக்கம் நிரப்புதல்",page_mode_double:"இரட்டை -பேச் பயன்முறை",page_mode_single:"ஒற்றை -பக்க பயன்முறை",scroll_mode:"உருள் பயன்முறை",setting:"அமைக்கவும்",translate_current_page:"மொழிபெயர்ப்பு தற்போதைய பக்கம்",zoom_in:"பெரிதாக்கு",zoom_out:"குறுகிய"},description:"காமிக் நிலையத்தில் இரட்டை -பக்க வாசிப்பு மற்றும் மொழிபெயர்ப்பு போன்ற உகந்த அனுபவத்தின் மேம்பாட்டு செயல்பாட்டைச் சேர்க்கவும்.",eh_tag_lint:{combo:"[குறிச்சொல்] இருக்கும்போது, அது பொதுவாக [குறிச்சொல்] உள்ளது",conflict:"[குறிச்சொல்] இருக்கும்போது, இருப்பு இருக்கக்கூடாது [குறிச்சொல்]",correct_tag:"சரியான குறிச்சொல்லாக இருக்க வேண்டும்",miss_female:"ஆண் லேபிள்களின் பற்றாக்குறை, அது தேவைப்படலாம்",miss_parody:"அசல் லேபிளின் பற்றாக்குறை, அது தேவைப்படலாம்",possible_conflict:"[குறிச்சொல்] போது, அது இருக்கக்கூடாது [குறிச்சொல்]",prerequisite:"[குறிச்சொல்] முன் குறிச்சொல் [குறிச்சொல்] இல்லை"},end_page:{next_button:"அடுத்து",prev_button:"கடைசி வார்த்தைகள்",tip:{end_jump:"இது முடிவை எட்டியுள்ளது, மேலும் பக்கம் நிராகரிக்கும் அடுத்த வார்த்தைக்கு செல்லும்",exit:"முடிவில், பக்கத்தைத் திருப்புவதைத் தொடர்ந்து வெளியேறும்",start_jump:"ஆரம்பத்தில், முந்தைய சொற்களுக்கு பக்கத்தை மாற்றவும்"}},hotkeys:{enter_read_mode:"வாசிப்பு பயன்முறையை உள்ளிடவும்",float_tag_list:"இடைநீக்க சிட்டை பட்டியல்",jump_to_end:"இறுதிவரை குதிக்கவும்",jump_to_home:"முகப்புப்பக்கத்திற்கு செல்லவும்",page_down:"பக்கங்கள் கீழே",page_up:"பக்கங்கள் மேலே",scroll_down:"கீழே உருட்டவும்",scroll_left:"இடதுபுறத்தில் உருட்டவும்",scroll_right:"வலதுபுறம் உருட்டவும்",scroll_up:"உருட்டவும்",switch_auto_enlarge:"படத்தை மாற்றவும் விருப்பங்களை தானாக பெருக்கவும்",switch_dir:"வாசிப்பு திசையை மாற்றவும்",switch_grid_mode:"கட்டம் பயன்முறையை மாற்றவும்",switch_page_fill:"பக்கத்தை நிரப்பவும்",switch_scroll_mode:"சுருள் பயன்முறையை மாற்றவும்",switch_single_double_page_mode:"ஒற்றை மற்றும் இரட்டை பக்கங்கள் பயன்முறையை மாற்றவும்"},img_status:{error:"பிழை",loading:"சுமை",wait:"ஏற்றுவதற்காக காத்திருக்கிறது"},other:{"default":"இயல்புநிலை",disable:"முடக்கவும்",enabled:"திறந்திருக்கும்",enter_comic_read_mode:"காமிக் வாசிப்பு பயன்முறையை உள்ளிடவும்",fab_hidden:"மறைக்கப்பட்ட இடைநீக்க பொத்தான்",fab_show:"சச்பென்சன் பொத்தானைக் காண்பி",fill_page:"பக்கங்கள்",img_loading:"படம் ஏற்றுகிறது",loading_img:"படத்தை ஏற்றவும்",none:"இல்லை",or:"அல்லது",page_range:"பக்க எண் வரம்பை உள்ளிடவும்:\\n (எடுத்துக்காட்டாக: 1, 3-5, 9-))",read_mode:"படித்தல் பயன்முறை"},pwa:{alert:{img_data_error:"பட தரவு பிழை",img_not_found:"படங்களைக் கண்டுபிடிக்க முடியவில்லை",img_not_found_files:"படக் கோப்பு அல்லது படக் கோப்பைக் கொண்ட சுருக்கப்பட்ட தொகுப்பைத் தேர்ந்தெடுக்கவும்",img_not_found_folder:"கோப்புறையின் கீழ் படக் கோப்புகளைக் கொண்ட படக் கோப்பு அல்லது சுருக்கப்பட்ட தொகுப்பு இல்லை",not_valid_url:"பயனுள்ள முகவரி அல்ல",repeat_load:"மற்ற கோப்புகளில் …",unzip_error:"பிழையை குறைக்கவும்",unzip_password_error:"கடவுச்சொல் பிழையை குறைத்தல்",userscript_not_installed:"சந்தேகத்திற்கு இடமில்லாத காமிக்ரீம் ச்கிரிப்ட்"},button:{enter_url:"முகவரி ஐ உள்ளிடவும்",install:"நிறுவவும்",no_more_prompt:"இனி வரியில் இல்லை",resume_read:"வாசிப்பை மீட்டெடுக்கவும்",select_files:"கோப்பைத் தேர்ந்தெடுக்கவும்",select_folder:"ஒரு கோப்புறையைத் தேர்ந்தெடுக்கவும்"},install_md:"ஒவ்வொரு முறையும் இந்த வலையை திறக்க ### மோச்டர்?\\n நீங்கள் விரும்பினால்\\n 1. உள்ளக மென்பொருளைப் பயன்படுத்துவது போல ஒரு சுயாதீன சாளரத்தைக் கொண்டிருக்கலாம்\\n 1. உள்ளக சுருக்க கோப்பைத் திறக்க வழியைச் சேர்க்கவும், அதை நேரடியாக திறக்க வசதியானது\\n 1. ஆஃப்லைனைப் பயன்படுத்தவும் ~~ (முக்கியமாக உள்நாட்டு பிணையம் இந்த வலைப்பக்கத்தை அணுக முடியாது என்று கவலைப்படுகிறார் ~~\\n ### இந்த பக்கத்தை கணினிக்கு PWA பயன்பாடாக நிறுவ வரவேற்கிறோம்",message:{enter_password:"கடவுச்சொல்லை உள்ளிடவும்",unzipping:"குறைக்கவும்"},tip_enter_url:"சுருக்கப்பட்ட தொகுப்பு முகவரி ஐ உள்ளிடவும்",tip_md:"# காமிக்ரீம் PWA\\n [Comicream] (https://github.com/hymbz/comicreamscript) எழுதிய வாசிப்பு முறை வாசிப்பு பயன்முறையைப் படியுங்கள்.\\n ---\\n ### படக் கோப்புகள், கோப்புறைகள் மற்றும் சுருக்கப்பட்ட பொதிகளை நேரடியாக படிக்கத் தொடங்கவும்\\n *நீங்கள் ** பேச்ட் நேரடியாக ** அல்லது ** உள்ளிடவும் ** சுருக்கப்பட்ட பேக் முகவரி பதிவிறக்கம் வாசிப்பு*"},setting:{hotkeys:{add:"புதிய குறுக்குவழி விசைகளைச் சேர்க்கவும்",restore:"இயல்புநிலை குறுக்குவழி விசையை மீட்டெடுக்கவும்"},language:"மொழி",option:{abreast_duplicate:"ஒவ்வொரு நெடுவரிசை நகல் விகிதம்",abreast_mode:"இணை சுருள் பயன்முறை",always_load_all_img:"எப்போதும் எல்லா படங்களையும் ஏற்றவும்",autoHiddenMouse:"தானியங்கி மறைக்கும் சுட்டி",auto_switch_page_mode:"விகிதத்தின் அடிப்படையில் ஒற்றை/இரட்டை பக்க பயன்முறையை தானாக மாற்றவும்.",background_color:"பின்னணி நிறம்",click_page_turn_area:"பகுதியைக் சொடுக்கு செய்க",click_page_turn_enabled:"பக்கத்தைக் சொடுக்கு செய்க",click_page_turn_swap_area:"பகுதி பரிமாற்றத்தில் சொடுக்கு செய்க",click_page_turn_vertical:"பக்கங்கள் மேல் மற்றும் கீழ்",dark_mode:"இரவு முறை",dark_mode_auto:"சிஸ்டத்திற்கு இணங்க டார்க் மோட்",dir_ltr:"இடமிருந்து வலமாக (மெய் மேன்)",dir_rtl:"வலமிருந்து இடமாக (ரிமான்)",disable_auto_enlarge:"தடைசெய்யப்பட்ட படங்கள் தானாக விரிவாக்கப்படுகின்றன",first_page_fill:"இயல்பாக, முகப்புப்பக்க நிரப்புதலை இயக்கவும்",fit_to_width:"அகலத்திற்கு ஏற்ற படம்",img_recognition:"பட ஏற்பு",img_recognition_background:"அடையாள பின்னணி நிறம்",img_recognition_pageFill:"தானியங்கி சரிசெய்தல் பக்கம் நிரப்புதல்",img_recognition_warn:"Brows இந்த அம்சத்தைத் திறப்பது பக்கத்தை மாற்றுவதற்கு பரிந்துரைக்கப்படுகிறது.",img_recognition_warn_2:"தற்போதைய வலைத்தளம் வலைத் தொழிலாளர்களை ஆதரிக்காது.",paragraph_appearance:"தோற்றம்",paragraph_dir:"வாசிப்பு திசை",paragraph_display:"காட்டு",paragraph_hotkeys:"குறுக்குவழி விசை",paragraph_other:"மற்றொன்று",paragraph_scrollbar:"ரோலிங் பார்",paragraph_translation:"மொழிபெயர்க்கவும்",preload_page_num:"முன் -ஏற்ற எண்",scroll_end:"பக்க முடிவை அடைந்த பின்",scroll_end_auto:"முதலில் முந்தைய/அடுத்த அத்தியாயத்துக்கு தாவு, இல்லையெனில் வெளியேறு",scroll_mode_img_scale:"உருள் பட அளவிடுதல்",scroll_mode_img_spacing:"உருட்டல் பட இடைவெளி",scrollbar_auto_hidden:"தானியங்கி மறைத்தல்",scrollbar_easy_scroll:"உருட்டல்",scrollbar_position:"இடம்",scrollbar_position_auto:"தானியங்கி",scrollbar_position_bottom:"கீழே",scrollbar_position_hidden:"மறை",scrollbar_position_right:"வலது பக்கம்",scrollbar_position_top:"மேல்",scrollbar_show_img_status:"பட ஏற்றுதல் நிலையை காட்டு",show_clickable_area:"சொடுக்கு பகுதியைக் காட்டு",show_comments:"இறுதிப் பக்கத்தில் கருத்துகளைக் காண்பி",swap_page_turn_key:"இடது மற்றும் வலது பக்கங்கள் மாறுதல்",zoom:"படம் பெரிதாக்கு"},translation:{cotrans_tip:"<p> <a> வழங்கிய இடைமுக மொழிபெயர்ப்பு படங்கள்\\n </a></p><p><a> ஒரே நேரத்தில் பல நபர்களைப் பயன்படுத்தும் போது, வரிசையில் மேல் வரம்பை அடைந்த பிறகு, புதிய படத்தைப் பதிவேற்றுவது பிழையைப் புகாரளிக்கும், நீங்கள் சிறிது நேரம் கழித்து முயற்சி செய்ய வேண்டும் </a></p><a>\\n <p> எனவே தயவுசெய்து <b> அளவிற்கு கவனம் செலுத்துங்கள் </b> </p>\\n <p> உங்கள் சொந்த உள்ளக வரிசைப்படுத்தல் திட்டங்களைப் பயன்படுத்தவும் பரிந்துரைக்கப்படுகிறது, சேவையக வளங்களை ஆக்கிரமிக்கவில்லை அல்லது வரிசைப்படுத்தவில்லை </p></a>",options:{detection_resolution:"உரை ச்கேன் தெளிவு",direction:"எழுத்துரு திசையை வழங்குதல்",direction_auto:"ஒருமித்த உரை",direction_horizontal:"மட்டும்",direction_vertical:"செங்குத்து மட்டுமே",forceRetry:"கட்டாய சோதனைக்கு கேச் புறக்கணிக்கவும்",localUrl:"தனிப்பயன் சேவையக முகவரி",onlyDownloadTranslated:"மொழிபெயர்ப்பு படத்தை மட்டுமே பதிவிறக்கவும்",target_language:"இலக்கு மொழி",text_detector:"உரை ச்கேனர்",translator:"மொழிபெயர்ப்பு பணி"},range:"மொழிபெயர்ப்பின் நோக்கம்",server:"மொழிபெயர்ப்பு சேவையகம்",server_selfhosted:"உள்ளக வரிசைப்படுத்தல்",translate_all:"மொழிபெயர்ப்பின் அனைத்து படங்களும்",translate_to_end:"தற்போதைய பக்கத்தை இறுதிவரை மொழிபெயர்க்கவும்"}},site:{add_feature:{associate_nhentai:"தொடர்புடைய nhentai",auto_adjust_option:"தானியங்கி சரிசெய்தல் வாசிப்பு உள்ளமைவு",auto_page_turn:"எல்லையற்ற உருட்டல்",auto_show:"தானாகவே வாசிப்பு பயன்முறையை உள்ளிடவும்",block_totally:"முற்றிலும் கவச காமிக்ச்",colorize_tag:"குறிச்சொல் கறை",detect_ad:"விளம்பர பக்கத்தை அடையாளம் காணவும்",float_tag_list:"இடைநீக்க சிட்டை பட்டியல்",hotkeys:"குறுக்குவழி விசை",load_original_image:"ஏற்றுகிறது",lock_option:"பூட்டு தள உள்ளமைவு",open_link_new_page:"புதிய பக்கத்தில் இணைப்பைத் திறக்கவும்",quick_favorite:"வேகமான சேகரிப்பு",quick_rating:"விரைவான மதிப்பெண்",quick_tag_define:"சிட்டை வரையறையை விரைவாகப் பார்ப்பது",remember_current_site:"தற்போதைய தளத்தை நினைவில் கொள்ளுங்கள்",tag_lint:"சிட்டை"},changed_load_failed:"வலைத்தளம் மாறுகிறது, மேலும் காமிக்சை ஏற்ற முடியாது",ehentai:{change_favorite_failed:"சேகரிப்பு கோப்புறையை மாற்றுவதில் தோல்வி",change_favorite_success:"பிடித்த கிளிப் மாற்றம் வெற்றிகரமாக",change_rating_failed:"மதிப்பெண் மாற்றம் தோல்வியடைந்தது",change_rating_success:"மதிப்பெண் மாற்றம்",fetch_favorite_failed:"சேகரிப்பு கிளிப் தகவலைப் பெறுவதில் தோல்வி தோல்வியடைந்தது",fetch_img_page_source_failed:"பட பக்க மூலக் குறியீடு தோல்வியடைந்தது",fetch_img_page_url_failed:"விவரங்கள் பக்கத்திலிருந்து பட பக்க முகவரியைப் பெறுங்கள்",fetch_img_url_failed:"பட பக்கத்திலிருந்து பட முகவரியைப் பெறுவது தோல்வியடைந்தது",html_changed_nhentai_failed:"பக்க அமைப்பு மாறிவிட்டது, மேலும் நோசெட்டாய் காமிக்சின் செயல்பாடுகள் பொதுவாக நடைமுறைக்கு வர முடியாது",ip_banned:"ஐபி முகவரி தடைசெய்யப்பட்டுள்ளது",nhentai_error:"நோச்டாய் பிழையுடன் பொருந்துகிறது",nhentai_failed:"போட்டி தோல்வியுற்றால், உள்நுழைவை உறுதிப்படுத்திய பின் புதுப்பிக்கவும் {{nhentai}}"},need_captcha:"மனித -மெச்சின் சரிபார்ப்பு தேவை",nhentai:{fetch_next_page_failed:"காமிக் தரவின் அடுத்த பக்கத்தைப் பெறுங்கள்",tag_blacklist_fetch_failed:"குறிச்சொல் கருப்பு பட்டியல் தோல்வியடைந்தது"},settings_tip:"அமைக்கவும்",show_settings_menu:"அமைப்புகள் மெனுவைக் காண்பி",simple:{auto_read_mode_message:"இயல்பாக \\"தானாகவே வாசிப்பு பயன்முறையை உள்ளிடவும்\\"",no_img:"பொருத்தமான காமிக் படங்கள் இல்லை,\\n தேவைப்பட்டால், எளிய வாசிப்பு பயன்முறையை மூட இங்கே சொடுக்கு செய்க",simple_read_mode:"எளிய வாசிப்பு பயன்முறையைப் பயன்படுத்தவும்"}},touch_area:{menu:"பட்டி",next:"அடுத்த பக்கம்",prev:"பக்கத்தில்",type:{edge:"விளிம்பு",l:"எல்",left_right:"பற்றி",up_down:"மேல் மற்றும் கீழ்"}},translation:{status:{colorizing:"வண்ணம்","default":"தெரியாத நிலை",detection:"உரை சோதிக்கப்படுகிறது",downscaling:"படத்தை வாழ்க",error:"மொழிபெயர்க்கவும்","error-lang":"நீங்கள் தேர்ந்தெடுக்கும் மொழிபெயர்ப்பு பணி நீங்கள் தேர்ந்தெடுக்கும் மொழியை ஆதரிக்காது","error-translating":"மொழிபெயர்ப்பு பணி எந்த உரையையும் திருப்பித் தராது","error-with-id":"மொழிபெயர்க்கவும்",finished:"முடிவுகள் வரிசைப்படுத்துகின்றன",inpainting:"படங்களை சரிசெய்யவும்","mask-generation":"உரை முகமூடி உருவாக்கப்படுகிறது",ocr:"உரை அடையாளம் காணப்படுகிறது",pending:"காத்திருங்கள்","pending-pos":"காத்திருங்கள்",preparing:"இலவச சாளரத்திற்காக காத்திருக்கிறது",rendering:"வழங்குதல்",saved:"முடிவைச் சேமிக்கவும்","skip-no-regions":"படத்தில் உரை பகுதி கண்டறியப்படவில்லை","skip-no-text":"படத்தில் எந்த உரை கண்டறியப்படவில்லை",textline_merge:"ஒருங்கிணைந்த உரை",translating:"உரையை மொழிபெயர்க்கவும்",upscaling:"படம் குறைக்க"},tip:{check_img_status_failed:"படத்தின் நிலை தோல்வியடைந்தது",download_img_failed:"படம் தோல்வியுற்றது",get_translator_list_error:"மொழிபெயர்ப்பு சேவைகளின் பட்டியலைப் பெறும்போது, பிழைகள் ஏற்படுகின்றன.",id_not_returned:"ஐடியைத் திரும்ப முடியவில்லை",img_downloading:"படத்தைப் பதிவிறக்கவும்",img_not_fully_loaded:"படம் ஏற்றப்படவில்லை",pending:"காத்திருக்கிறது, வரிசை {{pos}} சாங் படம்",resize_img_failed:"அளவிடுதல் படம் தோல்வியடைந்தது",translating:"படத்தை மொழிபெயர்க்கிறது",translation_completed:"முழுமையான மொழிபெயர்ப்பு",upload:"படத்தைப் பதிவேற்றவும்",upload_error:"படத்தை தவறாக பதிவேற்றவும்",upload_return_error:"சேவையக மொழிபெயர்ப்பு பிழை",wait_translation:"மொழிபெயர்ப்புக்காக காத்திருக்கிறது"},translator:{baidu:"பைடு",deepl:"ஆழம்எல்",google:"கூகிள்","gpt3.5":"சிபிடி -3.5",none:"உரையை நீக்கு",offline:"இணைப்பில்லாத மாதிரி",original:"அசல்",youdao:"ஒரு வழி வேண்டும்"}}};

/* eslint-disable no-console */

const prefix = ['%cComicRead', 'background-color: #607d8b; color: white; padding: 2px 4px; border-radius: 4px;'];
const log = (...args) => console.log(...prefix, ...args);
log.warn = (...args) => console.warn(...prefix, ...args);
log.error = (...args) => {
  console.error(...prefix, ...args);
  // if (false) debugger; // eslint-disable-line no-debugger
};

const [lang, setLang] = solidJs.createSignal('zh');
const setInitLang = async () => setLang(await languages.getInitLang());
const t = solidJs.createRoot(() => {
  solidJs.createEffect(solidJs.on(lang, async () => languages.setSaveLang(lang()), {
    defer: true
  }));
  const locales = solidJs.createMemo(() => {
    switch (lang()) {
      case 'en':
        return en;
      case 'ru':
        return ru;
      case 'ta':
        return ta;
      default:
        return zh;
    }
  });
  return (keys, variables) => {
    let text = byPath(locales(), keys) ?? '';
    if (variables) for (const [k, v] of Object.entries(variables)) text = text.replaceAll(\`{{\${k}}}\`, \`\${String(v)}\`);
    return text;
  };
});

const getDom = id => {
  let dom = document.getElementById(id);
  if (dom) {
    dom.innerHTML = '';
    return dom;
  }
  dom = document.createElement('div');
  dom.id = id;
  document.body.append(dom);
  return dom;
};

/** 挂载 solid-js 组件 */
const mountComponents = (id, fc) => {
  const dom = getDom(id);
  dom.style.setProperty('display', 'unset', 'important');
  const shadowDom = dom.attachShadow({
    mode: 'closed'
  });
  web.render(fc, shadowDom);
  return dom;
};

class FaviconProgress {
  constructor(color = '#607D8B') {
    this.color = color;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext('2d');
    const existingLink = document.querySelector("link[rel~='icon']");
    if (existingLink) this.link = existingLink;else {
      const link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      document.head.append(link);
      this.link = link;
    }
    this.initLink = this.link.href || '/favicon.ico';
  }
  update(progress) {
    this.ctx.clearRect(0, 0, 32, 32);

    // 绘制背景
    this.ctx.beginPath();
    this.ctx.arc(16, 16, 16, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FAFAFA';
    this.ctx.fill();

    // 绘制进度扇形
    const startAngle = -Math.PI / 2;
    const endAngle = Math.PI * 2 * progress + startAngle;
    this.ctx.beginPath();
    this.ctx.moveTo(16, 16);
    this.ctx.arc(16, 16, 16, startAngle, endAngle);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.updateFavicon();
  }
  updateFavicon() {
    if (!this.link || !this.canvas) return;
    this.link.href = this.canvas.toDataURL('image/png');
  }

  /** 恢复默认图标 */
  recover() {
    if (!this.link || !this.initLink) return;
    this.link.href = this.initLink;
  }
}
const useFaviconProgress = () => {
  //
};

exports.FaviconProgress = FaviconProgress;
exports.approx = approx;
exports.assign = assign;
exports.boolDataVal = boolDataVal;
exports.byPath = byPath;
exports.canvasToBlob = canvasToBlob;
exports.clamp = clamp;
exports.createEffectOn = createEffectOn;
exports.createEqualsSignal = createEqualsSignal;
exports.createMemoMap = createMemoMap;
exports.createRootEffect = createRootEffect;
exports.createRootMemo = createRootMemo;
exports.createScheduled = createScheduled;
exports.createSequence = createSequence;
exports.createThrottleMemo = createThrottleMemo;
exports.debounce = debounce;
exports.descRange = descRange;
exports.difference = difference;
exports.domParse = domParse;
exports.extractRange = extractRange;
exports.getGmValue = getGmValue;
exports.getKeyboardCode = getKeyboardCode;
exports.getMostItem = getMostItem;
exports.hijackFn = hijackFn;
exports.inRange = inRange;
exports.isEqual = isEqual;
exports.isUrl = isUrl;
exports.keyboardCodeToText = keyboardCodeToText;
exports.lang = lang;
exports.linstenKeydown = linstenKeydown;
exports.log = log;
exports.mountComponents = mountComponents;
exports.needDarkMode = needDarkMode;
exports.onAutoMount = onAutoMount;
exports.onUrlChange = onUrlChange;
exports.plimit = plimit;
exports.promisifyRequest = promisifyRequest;
exports.querySelector = querySelector;
exports.querySelectorAll = querySelectorAll;
exports.querySelectorClick = querySelectorClick;
exports.range = range;
exports.requestIdleCallback = requestIdleCallback;
exports.saveAs = saveAs;
exports.scrollIntoView = scrollIntoView;
exports.setInitLang = setInitLang;
exports.setLang = setLang;
exports.singleThreaded = singleThreaded;
exports.sleep = sleep;
exports.t = t;
exports.testImgUrl = testImgUrl;
exports.throttle = throttle;
exports.useCache = useCache;
exports.useDrag = useDrag;
exports.useFaviconProgress = useFaviconProgress;
exports.useStore = useStore;
exports.useStyle = useStyle;
exports.useStyleMemo = useStyleMemo;
exports.wait = wait;
exports.waitDom = waitDom;
exports.waitImgLoad = waitImgLoad;
exports.waitUrlChange = waitUrlChange;
`
break;
case 'request':
code =`
const helper = require('helper');
const Toast = require('components/Toast');

// 将 xmlHttpRequest 包装为 Promise
const xmlHttpRequest = details => new Promise((resolve, reject) => {
  const handleError = error => {
    details.onerror?.(error);
    console.error('GM_xmlhttpRequest Error', error);
    reject(new Error(error?.responseText || 'GM_xmlhttpRequest Error'));
  };
  const abort = GM_xmlhttpRequest({
    ...details,
    onload(res) {
      details.onload?.call(res, res);
      resolve(res);
    },
    onerror: handleError,
    ontimeout: handleError,
    onabort: handleError
  });
  details.signal?.addEventListener('abort', abort.abort);
});
/** 发起请求 */
const request = async (url, details, retryNum = 0, errorNum = 0) => {
  const headers = {
    Referer: window.location.href
  };
  const errorText = \`\${details?.errorText ?? helper.t('alert.comic_load_error')}\\nurl: \${url}\`;
  try {
    // 虽然 GM_xmlhttpRequest 有 fetch 选项，但在 stay 上不太稳定
    // 为了支持 ios 端只能自己实现一下了
    if (details?.fetch ?? (url.startsWith('/') || url.startsWith(window.location.origin))) {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout?.(details?.timeout ?? 1000 * 10),
        // eslint-disable-next-line unicorn/no-invalid-fetch-options
        body: details?.data,
        ...details
      });
      if (!details?.noCheckCode && res.status !== 200) {
        helper.log.error(errorText, res);
        throw new Error(errorText);
      }
      let response = null;
      switch (details?.responseType) {
        case 'arraybuffer':
          response = await res.arrayBuffer();
          break;
        case 'blob':
          response = await res.blob();
          break;
        case 'json':
          response = await res.json();
          break;
      }
      return {
        status: res.status,
        statusText: res.statusText,
        response,
        responseText: response ? '' : await res.text()
      };
    }
    if (typeof GM_xmlhttpRequest === 'undefined') throw new Error(helper.t('pwa.alert.userscript_not_installed'));
    let targetUrl = url;
    // https://github.com/hymbz/ComicReadScript/issues/195
    // 在某些情况下 Tampermonkey 无法正确处理相对协议的 url
    // 实际 finalUrl 会变成 \`///xxx.xxx\` 莫名多了一个斜杠
    // 然而在修改代码发出正确的请求后，就再也无法复现了
    // 不过以防万一还是在这里手动处理下
    if (url.startsWith('//')) targetUrl = \`http:\${url}\`;
    // stay 没法处理相对路径，也得转换一下
    else if (url.startsWith('/')) targetUrl = \`\${window.location.origin}\${url}\`;
    const res = await xmlHttpRequest({
      method: 'GET',
      url: targetUrl,
      headers,
      timeout: 1000 * 10,
      ...details
    });
    if (!details?.noCheckCode && res.status !== 200) {
      helper.log.error(errorText, res);
      throw new Error(errorText);
    }

    // stay 好像没有正确处理 json，只能再单独判断处理一下
    if (details?.responseType === 'json' && (typeof res.response !== 'object' || Object.keys(res.response).length === 0)) {
      try {
        Reflect.set(res, 'response', JSON.parse(res.responseText));
      } catch {}
    }
    return res;
  } catch (error) {
    if (details && details.retryFetch && retryNum === 0) {
      console.warn('retryFetch', url);
      details.fetch = !details.fetch;
      if (typeof details.retryFetch === 'function') details.retryFetch(details);
      return request(url, details, retryNum + 1, errorNum);
    }
    if (errorNum >= retryNum) {
      (details?.noTip ? console.error : Toast.toast.error)(\`\${errorText}\\nerror: \${error.message}\`);
      throw new Error(errorText);
    }
    helper.log.error(errorText, error);
    await helper.sleep(1000);
    return request(url, details, retryNum, errorNum + 1);
  }
};

/** 轮流向多个 api 发起请求 */
const eachApi = async (url, baseUrlList, details) => {
  for (const baseUrl of baseUrlList) {
    try {
      return await request(\`\${baseUrl}\${url}\`, {
        ...details,
        noTip: true
      });
    } catch {}
  }
  const errorText = details?.errorText ?? helper.t('alert.comic_load_error');
  if (!details?.noTip) Toast.toast.error(errorText);
  helper.log.error('所有 api 请求均失败', url, baseUrlList, details);
  throw new Error(errorText);
};

exports.eachApi = eachApi;
exports.request = request;
`
break;
case 'components/Manga':
code =`
const web = require('solid-js/web');
const solidJs = require('solid-js');
const helper = require('helper');
const store$1 = require('solid-js/store');
const request = require('request');
const Comlink = require('comlink');
const worker = require('worker/ImageRecognition');

const imgState = {
  imgMap: {},
  imgList: [],
  pageList: [],
  fillEffect: {
    '-1': true
  },
  showRange: [0, 0],
  renderRange: [0, 0],
  loadingRange: [0, 0],
  defaultImgType: ''
};

const LanguageMap = {
  zh: 'CHS',
  en: 'ENG'
};
const targetLanguage = LanguageMap[helper.lang()] ?? 'CHS';
const _defaultOption = {
  dir: 'rtl',
  scrollbar: {
    position: 'auto',
    autoHidden: false,
    showImgStatus: true,
    easyScroll: false
  },
  clickPageTurn: {
    enabled: 'ontouchstart' in document.documentElement,
    reverse: false,
    area: 'left_right'
  },
  firstPageFill: true,
  disableZoom: false,
  darkMode: false,
  autoDarkMode: false,
  swapPageTurnKey: false,
  scroolEnd: 'auto',
  alwaysLoadAllImg: false,
  showComment: true,
  preloadPageNum: 20,
  pageNum: 0,
  autoSwitchPageMode: true,
  autoHiddenMouse: true,
  zoom: {
    ratio: 100,
    offset: {
      x: 0,
      y: 0
    }
  },
  scrollMode: {
    enabled: false,
    spacing: 0,
    imgScale: 1,
    fitToWidth: false,
    abreastMode: false,
    abreastDuplicate: 0.1,
    doubleMode: false
  },
  imgRecognition: {
    enabled: false,
    background: true,
    pageFill: true
  },
  translation: {
    server: 'disable',
    localUrl: undefined,
    forceRetry: false,
    options: {
      size: '1536',
      detector: 'default',
      translator: 'gpt3.5',
      direction: 'auto',
      targetLanguage
    },
    onlyDownloadTranslated: false
  }
};
const defaultOption = () => JSON.parse(JSON.stringify(_defaultOption));
const optionState = {
  defaultOption: defaultOption(),
  option: defaultOption()
};

const otherState = {
  title: '',
  /**
   * 用于防止滚轮连续滚动导致过快触发事件的锁
   *
   * - 在首次触发结束页时开启，一段时间关闭。开启时禁止触发结束页的上下话切换功能。
   */
  scrollLock: false,
  /** 当前是否处于全屏状态 */
  fullscreen: false,
  rootSize: {
    width: 0,
    height: 0
  },
  scrollbarSize: {
    width: 0,
    height: 0
  },
  supportWorker: false
};

const propState = {
  commentList: undefined,
  hotkeys: {},
  prop: {
    onExit: undefined,
    onPrev: undefined,
    onNext: undefined,
    onLoading: undefined,
    onOptionChange: undefined,
    onHotkeysChange: undefined,
    editButtonList: list => list,
    editSettingList: list => list
  }
};

const showState = {
  isMobile: false,
  isDragMode: false,
  activePageIndex: 0,
  gridMode: false,
  show: {
    toolbar: false,
    scrollbar: false,
    touchArea: false,
    endPage: undefined
  },
  page: {
    anima: '',
    vertical: false,
    offset: {
      x: {
        pct: 0,
        px: 0
      },
      y: {
        pct: 0,
        px: 0
      }
    }
  }
};

const initStore = {
  ...imgState,
  ...showState,
  ...propState,
  ...optionState,
  ...otherState
};
const {
  store,
  setState,
  _state,
  _setState
} = helper.useStore({
  ...initStore
});
const refs = {
  root: undefined,
  mangaBox: undefined,
  mangaFlow: undefined,
  touchArea: undefined,
  scrollbar: undefined,
  settingPanel: undefined,
  // 结束页上的按钮
  prev: undefined,
  next: undefined,
  exit: undefined
};

const useStyle = css => solidJs.onMount(() => helper.useStyle(css, refs.root));
const useStyleMemo = (selector, styleMapArg) => solidJs.onMount(() => helper.useStyleMemo(selector, styleMapArg, refs.root));

/** 在鼠标静止一段时间后自动隐藏 */
const useHiddenMouse = () => {
  const [hiddenMouse, setHiddenMouse] = solidJs.createSignal(true);
  const hidden = helper.debounce(() => setHiddenMouse(true), 1000);
  return {
    hiddenMouse,
    /** 鼠标移动 */
    onMouseMove() {
      setHiddenMouse(false);
      hidden();
    }
  };
};

const getImg = (i, state = store) => state.imgMap[state.imgList[i]];

/** 找到指定 url 图片在 imgList 里的 index */
const getImgIndexs = url => {
  const indexList = [];
  for (const [i, imgUrl] of store.imgList.entries()) if (imgUrl === url) indexList.push(i);
  return indexList;
};

/** 找到指定 url 图片的 dom */
const getImgEle = url => refs.mangaFlow.querySelector(\`img[data-src="\${url}"]\`);

/** 找到指定页面所处的图片流 */
const findFillIndex = (pageIndex, fillEffect) => {
  let nowFillIndex = pageIndex;
  while (!Reflect.has(fillEffect, nowFillIndex)) nowFillIndex -= 1;
  return nowFillIndex;
};

/** 触发 onOptionChange */
const triggerOnOptionChange = helper.throttle(() => store.prop.onOptionChange?.(helper.difference(store.option, store.defaultOption)), 1000);

/** 在 option 后手动触发 onOptionChange */
const setOption = fn => {
  setState(state => fn(state.option, state));
  triggerOnOptionChange();
};

/** 创建一个专门用于修改指定配置项的函数 */
const createStateSetFn = name => val => setOption(draftOption => helper.byPath(draftOption, name, () => val));

/** 创建用于将 ref 绑定到对应 state 上的工具函数 */
const bindRef = name => e => Reflect.set(refs, name, e);
const watchDomSize = (name, e) => {
  const resizeObserver = new ResizeObserver(([{
    contentRect
  }]) => {
    if (!contentRect.width || !contentRect.height) return;
    setState(state => {
      state[name] = {
        width: contentRect.width,
        height: contentRect.height
      };
    });
  });
  resizeObserver.disconnect();
  resizeObserver.observe(e);
  solidJs.onCleanup(() => resizeObserver.disconnect());
};

/** 将界面恢复到正常状态 */
const resetUI = state => {
  state.show.toolbar = false;
  state.show.scrollbar = false;
  state.show.touchArea = false;
};

const [defaultHotkeys, setDefaultHotkeys] = solidJs.createSignal({
  scroll_up: ['w', 'Shift + w', 'ArrowUp'],
  scroll_down: ['s', 'Shift + s', 'ArrowDown', ' '],
  scroll_left: ['a', 'Shift + a', ',', 'ArrowLeft'],
  scroll_right: ['d', 'Shift + d', '.', 'ArrowRight'],
  page_up: ['PageUp'],
  page_down: [' ', 'PageDown'],
  jump_to_home: ['Home'],
  jump_to_end: ['End'],
  exit: ['Escape'],
  switch_page_fill: ['/', 'm', 'z'],
  switch_scroll_mode: [],
  switch_grid_mode: [],
  switch_single_double_page_mode: [],
  switch_dir: [],
  switch_auto_enlarge: [],
  translate_current_page: [],
  translate_all: [],
  translate_to_end: []
});

/** 快捷键配置 */
const hotkeysMap = helper.createRootMemo(() => Object.fromEntries(Object.entries(store.hotkeys).flatMap(([name, key]) => key.map(k => [k, name]))));

// 1. 因为不同汉化组处理情况不同不可能全部适配，所以只能是尽量适配*出现频率更多*的情况
/** 判断图片是否是跨页图 */
const isWideImg = img => {
  switch (img.type ?? store.defaultImgType) {
    case 'long':
    case 'wide':
      return true;
    default:
      return false;
  }
};

/** 根据填充页设置双页排列单页图片 */
const arrangeImg = (pageList, fill) => {
  if (pageList.length === 0) return [];
  const newPageList = [];
  let imgCache = fill ? [-1] : [];
  for (const i of pageList) {
    imgCache.push(i);
    if (imgCache.length === 2) {
      newPageList.push(imgCache);
      imgCache = [];
    }
  }
  if (imgCache.length === 1 && imgCache[0] !== -1) {
    imgCache.push(-1);
    newPageList.push(imgCache);
  }
  return newPageList;
};

/** 计算指定图片流中的左右页位置正确的页数 */
const computeAccuracy = (imgList, pageList) => {
  let accuracy = 0;
  for (const [a, b] of pageList) {
    if ((imgList[a]?.blankMargin?.left ?? 0) > 0.04) accuracy += 1;
    if (b === undefined) break;
    if ((imgList[b]?.blankMargin?.right ?? 0) > 0.04) accuracy += 1;
  }
  return accuracy;
};

/** 自动切换填充页设置到左右页正确率更高的情况 */
const arrangePage = (pageList, {
  imgList,
  fillEffect,
  nowFillIndex,
  switchFill
}) => {
  const fill = Boolean(fillEffect[nowFillIndex]);
  const newPageList = arrangeImg(pageList, fill);
  if (!switchFill || typeof fillEffect[nowFillIndex] === 'number') return newPageList;
  const anotherPageList = arrangeImg(pageList, !fill);
  const anotherAccuracy = computeAccuracy(imgList, anotherPageList);
  if (anotherAccuracy === 0) return newPageList;
  const nowAccuracy = computeAccuracy(imgList, newPageList);
  if (anotherAccuracy <= nowAccuracy) return newPageList;
  helper.log(\`\${nowFillIndex} 自动切换页面填充\`);
  fillEffect[nowFillIndex] = !fill;
  return anotherPageList;
};

/** 根据图片比例和填充页设置对漫画图片进行排列 */
const handleComicData = (imgList, fillEffect, switchFill) => {
  const context = {
    imgList,
    fillEffect,
    nowFillIndex: -1,
    switchFill
  };
  let pageList = [];
  let cacheList = [];
  for (let i = 0; i < imgList.length; i += 1) {
    const img = imgList[i];
    if (!isWideImg(img)) {
      cacheList.push(i);
      if (Reflect.has(fillEffect, i)) Reflect.deleteProperty(fillEffect, i);
      continue;
    }

    // 在除结尾（可能是汉化组图）外的位置出现了跨页图的话，那张跨页图大概率是页序的「正确答案」
    // 如果这张跨页导致了上面一页缺页，就说明在这之前的填充有误，应该据此调整之前的填充
    if (typeof fillEffect[context.nowFillIndex] === 'boolean' && i < imgList.length - 2 && (cacheList.length + (fillEffect[context.nowFillIndex] ? 1 : 0)) % 2 === 1) {
      fillEffect[context.nowFillIndex] = !fillEffect[context.nowFillIndex];
      return handleComicData(imgList, fillEffect, switchFill);
    }
    pageList = [...pageList, ...arrangePage(cacheList, context), [i]];
    cacheList = [];
    if (fillEffect[i] === undefined) fillEffect[i] = false;
    context.nowFillIndex = i;
  }
  if (cacheList.length > 0) pageList = [...pageList, ...arrangePage(cacheList, context)];
  return pageList;
};

const imgList = helper.createRootMemo(() => store.imgList.map(url => store.imgMap[url]));

/** 当前是否为并排卷轴模式 */
const isAbreastMode = helper.createRootMemo(() => store.option.scrollMode.enabled && store.option.scrollMode.abreastMode);

/** 当前是否为双页卷轴模式 */
const isDoubleMode = helper.createRootMemo(() => store.option.scrollMode.enabled && store.option.scrollMode.doubleMode);

/** 当前是否为普通卷轴模式（包含了双页卷轴模式） */
const isScrollMode = helper.createRootMemo(() => store.option.scrollMode.enabled && !store.option.scrollMode.abreastMode);

/** 当前是否开启了识别背景色 */
const isEnableBg = helper.createRootMemo(() => store.option.imgRecognition.enabled && store.option.imgRecognition.background);

/** 当前显示页面 */
const activePage = helper.createRootMemo(() => store.pageList[store.activePageIndex] ?? []);

/** 当前显示的第一张图片的 index */
const activeImgIndex = helper.createRootMemo(() => activePage().find(i => i !== -1) ?? 0);

/** 当前所处的图片流 */
const nowFillIndex = helper.createRootMemo(() => findFillIndex(activeImgIndex(), store.fillEffect));

/** 预加载页数 */
const preloadNum = helper.createRootMemo(() => ({
  back: store.option.preloadPageNum,
  front: Math.floor(store.option.preloadPageNum / 2)
}));

/** 获取图片列表中指定属性的中位数 */
const getImgMedian = sizeFn => {
  const list = imgList().filter(img => img.loadType === 'loaded' && img.width).map(sizeFn).sort((a, b) => a - b);
  // 因为涉及到图片默认类型的计算，所以至少等到加载完三张图片再计算，避免被首页大图干扰
  if (list.length < 3) return null;
  return list[Math.floor(list.length / 2)];
};

/** 图片占位尺寸 */
const placeholderSize = helper.createThrottleMemo(() => ({
  width: getImgMedian(img => img.width) ?? 800,
  height: getImgMedian(img => img.height) ?? 1200
}), 500);

/** 并排卷轴模式下的列宽度 */
const abreastColumnWidth = helper.createRootMemo(() => isAbreastMode() ? placeholderSize().width * store.option.scrollMode.imgScale : 0);
const autoPageNum = helper.createThrottleMemo(() => store.rootSize.width >= store.rootSize.height ? 2 : 1);
const pageNum = helper.createRootMemo(() => store.option.pageNum || autoPageNum());

/** 是否为单页模式 */
const isOnePageMode = helper.createRootMemo(() => {
  if (store.isMobile || store.imgList.length <= 1) return true;
  if (store.option.scrollMode.enabled) {
    if (store.option.scrollMode.abreastMode) return true;
    return !store.option.scrollMode.doubleMode;
  }
  return pageNum() === 1;
});

/** 重新计算图片排列 */
const updatePageData = state => {
  const lastActiveImgIndex = activeImgIndex();
  let newPageList = [];
  newPageList = isOnePageMode() ? state.imgList.map((_, i) => [i]) : handleComicData(state.imgList.map(url => state.imgMap[url]), state.fillEffect, state.option.imgRecognition.pageFill);
  if (helper.isEqual(state.pageList, newPageList)) return;
  state.pageList = newPageList;

  // 在图片排列改变后自动跳转回原先显示图片所在的页数
  if (lastActiveImgIndex !== activeImgIndex()) {
    const newActivePageIndex = state.pageList.findIndex(page => page.includes(lastActiveImgIndex));
    if (newActivePageIndex !== -1) state.activePageIndex = newActivePageIndex;
  }
};
updatePageData.throttle = helper.throttle(() => setState(updatePageData), 100);

/**
 * 将处理图片的相关变量恢复到初始状态
 *
 * 必须按照以下顺序调用
 * 1. 修改 imgList
 * 2. resetImgState
 * 3. updatePageData
 */
const resetImgState = state => {
  // 如果用户没有手动修改过首页填充，才将其恢复初始
  if (typeof state.fillEffect['-1'] === 'boolean') state.fillEffect['-1'] = state.option.firstPageFill && state.imgList.length > 3;
};
helper.createEffectOn([pageNum, isOnePageMode], () => setState(updatePageData));

/** 记录每张图片所在的页面 */
const imgPageMap = helper.createRootMemo(() => {
  const map = {};
  for (let i = 0; i < store.pageList.length; i++) {
    for (const imgIndex of store.pageList[i]) if (imgIndex !== -1) map[imgIndex] = i;
  }
  return map;
});
const [_scrollTop, setScrollTop] = solidJs.createSignal(0);
/** 卷轴模式下的滚动距离 */
const scrollModTop = _scrollTop;
/** 滚动距离 */
const scrollTop = helper.createRootMemo(() => isAbreastMode() ? store.page.offset.x.px : scrollModTop());
const bindScrollTop = dom => {
  dom.addEventListener('scroll', () => setScrollTop(dom.scrollTop), {
    passive: true
  });
};

// 自动切换黑暗模式
const darkModeQuery = matchMedia('(prefers-color-scheme: dark)');
const autoSwitchDarkMode = query => {
  if (!store.option.autoDarkMode) return;
  if (query.matches === store.option.darkMode) return;
  _setState('option', 'darkMode', query.matches);
};
darkModeQuery.addEventListener('change', autoSwitchDarkMode);
autoSwitchDarkMode(darkModeQuery);
helper.createEffectOn(() => store.option.autoDarkMode, () => autoSwitchDarkMode(darkModeQuery));

// 窗口宽度小于800像素时，标记为移动端
helper.createEffectOn(() => store.rootSize.width, width => {
  const isMobile = helper.inRange(1, width, 800);
  if (isMobile === store.isMobile) return;
  setState(state => {
    state.isMobile = isMobile;
    resetImgState(state);
    updatePageData(state);
  });
});

const isWideType = type => type === 'wide' || type === 'long';

// https://www.figma.com/design/h0x2ZHVh3P3bCbnszonRqk/漫画双页阅读比例图
// https://github.com/hymbz/ComicReadScript/issues/174#issuecomment-2252114640
// 用于判断图片类型的比例
const 单页比例 = 1920 / 2 / 1080;
const 横幅比例 = 1920 / 1080;
const 条漫比例 = 1920 / 2 / 1080 / 2;

/** 根据比例判断图片类型 */
const getImgType = img => {
  const imgRatio = img.width / img.height;
  if (imgRatio <= 单页比例) return imgRatio < 条漫比例 ? 'vertical' : '';
  return imgRatio > 横幅比例 ? 'long' : 'wide';
};

/** 更新图片类型。返回是否修改了图片类型 */
const updateImgType = (state, draftImg) => {
  const {
    type
  } = draftImg;
  if (!draftImg.width || !draftImg.height) return false;
  draftImg.type = getImgType(draftImg);
  if (isWideType(type) !== isWideType(draftImg.type)) updatePageData.throttle();
  return (type ?? state.defaultImgType) !== draftImg.type;
};

/** 是否自动开启过卷轴模式 */
let autoScrollMode = false;
helper.createRootEffect(prevIsWide => {
  if (store.rootSize.width === 0 || store.rootSize.height === 0) return;
  const defaultImgType = getImgType(placeholderSize());
  if (defaultImgType === store.defaultImgType) return prevIsWide;
  const isWide = isWideType(defaultImgType);
  setState(state => {
    state.defaultImgType = defaultImgType;

    // 连续出现多张长图后，自动开启卷轴模式
    if (defaultImgType === 'vertical' && !autoScrollMode && !state.option.scrollMode.enabled) {
      state.option.scrollMode.enabled = true;
      autoScrollMode = true;
      return;
    }
    if (isWide !== prevIsWide) updatePageData(state);
  });
  return isWide;
}, false);

/** 获取指定图片的显示尺寸 */
const getImgDisplaySize = (state, url) => {
  const img = state.imgMap[url];
  let height = img.height ?? placeholderSize().height;
  let width = img.width ?? placeholderSize().width;
  const setWidth = w => {
    height *= w / width;
    width = w;
    return {
      height,
      width
    };
  };
  if (!state.option.scrollMode.enabled) return {
    height,
    width
  };
  if (isAbreastMode()) return setWidth(abreastColumnWidth());
  if (state.option.scrollMode.fitToWidth) return setWidth(state.rootSize.width);
  height *= state.option.scrollMode.imgScale;
  width *= state.option.scrollMode.imgScale;
  if (width > state.rootSize.width) return setWidth(state.rootSize.width);
  return {
    height,
    width
  };
};

/** 更新图片尺寸 */
const updateImgSize = (url, width, height) => setState(state => {
  const img = state.imgMap[url];
  if (img.width === width && img.height === height) return;
  img.width = width;
  img.height = height;
  img.size = getImgDisplaySize(state, url);
  updateImgType(state, img);
});
helper.createEffectOn([imgList, () => store.option.scrollMode.enabled, () => store.option.scrollMode.abreastMode, () => store.option.scrollMode.fitToWidth, () => store.option.scrollMode.imgScale, () => store.rootSize, placeholderSize], ([{
  length
}]) => {
  if (length === 0) return;
  setState(state => {
    for (const url of state.imgList) state.imgMap[url].size = getImgDisplaySize(state, url);
  });
});

/** 卷轴模式下每张图片的位置 */
const imgTopList = helper.createRootMemo(() => {
  if (!isScrollMode()) return [];
  const list = Array.from({
    length: store.imgList.length
  });
  let top = 0;
  for (let i = 0; i < store.imgList.length; i++) {
    list[i] = top;
    top += getImg(i).size.height + store.option.scrollMode.spacing * 7;
  }
  return list;
});

/** 卷轴模式下漫画流的总高度 */
const contentHeight = helper.createRootMemo(() => store.option.scrollMode.enabled ? (imgTopList().at(-1) ?? 0) + (imgList().at(-1)?.size.height ?? 0) : 0);

/** 双页卷轴模式下的每行高度 */
const doubleScrollLineHeight = helper.createRootMemo(() => {
  if (!isDoubleMode()) return [];
  const doubleWidth = store.rootSize.width / 2;
  return store.pageList.map(indexs => {
    if (indexs.length === 1) return getImg(indexs[0]).size.height;

    // 选择更高的那张图片作为行高度，尽量放大图片
    let targetImg;
    for (const i of indexs) {
      if (i === -1) continue;
      const img = getImg(i);
      if (!targetImg || img.size.height > targetImg.size.height) targetImg = img;
    }
    if (!targetImg) throw new Error('找不到图片');
    if (targetImg.size.width < doubleWidth && !store.option.scrollMode.fitToWidth) return targetImg.size.height;
    return targetImg.size.height * (doubleWidth / targetImg.size.width);
  });
});

// /** 预加载图片尺寸 */
// const preloadImgSize = singleThreaded(async () => {
//   let index = 0;
//   for (; index < store.imgList.length; index++) {
//     const img = store.imgList[index];
//     if (img.size === undefined) continue;
//     const size = await getImgSize(img.src);
//     if (!size) continue;
//     // 防止加载过程中 imgList 变了的情况
//     if (store.imgList[index].src !== img.src) break;
//     // eslint-disable-next-line @typescript-eslint/no-loop-func
//     setState((state) => updateImgSize(state, index, ...size));
//   }
//
//   if (index < store.imgList.length) requestIdleCallback(preloadImgSize);
// });
//
// 空闲期间预加载所有图片的尺寸
// 卷轴模式下需要提前知道尺寸方便正确布局
// 翻页模式下也需要提前发现跨页图重新排序
// requestIdleCallback(preloadImgSize);
var css$1 = ".img____hash_base64_5_ img{display:block;height:100%;object-fit:contain;width:100%}.img____hash_base64_5_{align-content:center;content-visibility:hidden;display:none;height:100%;margin-left:auto;margin-right:auto;position:relative;width:100%}.img____hash_base64_5_[data-show]{content-visibility:visible;display:block}.img____hash_base64_5_>picture{display:block;height:auto;inset:0;margin-bottom:auto;margin-left:inherit;margin-right:inherit;margin-top:auto;max-height:100%;max-width:100%;position:absolute;width:auto}.img____hash_base64_5_>picture,.img____hash_base64_5_>picture:after{background-color:var(--hover-bg-color,#fff3);background-image:var(--md-photo);background-position:50%;background-repeat:no-repeat;background-size:30%}.img____hash_base64_5_[data-load-type=error]>picture:after{background-color:#eee;background-image:var(--md-image-not-supported);content:\\"\\";height:100%;pointer-events:none;position:absolute;right:0;top:0;width:100%}.img____hash_base64_5_[data-load-type=loading]>picture{background-image:var(--md-cloud-download)}:is(.img____hash_base64_5_[data-load-type=loading]>picture) img{animation:show____hash_base64_5_ .1s forwards}.mangaFlow____hash_base64_5_[dir=ltr] .img____hash_base64_5_[data-show=\\"1\\"],.mangaFlow____hash_base64_5_[dir=rtl] .img____hash_base64_5_[data-show=\\"0\\"]{margin-left:0;margin-right:auto}.mangaFlow____hash_base64_5_[dir=ltr] .img____hash_base64_5_[data-show=\\"0\\"],.mangaFlow____hash_base64_5_[dir=rtl] .img____hash_base64_5_[data-show=\\"1\\"]{margin-left:auto;margin-right:0}.mangaFlow____hash_base64_5_{contain:layout;display:grid;grid-auto-columns:100%;grid-auto-flow:column;grid-auto-rows:100%;overflow:visible;position:absolute;touch-action:none;transform-origin:0 0;-webkit-user-select:none;user-select:none;will-change:left,top;grid-row-gap:0;backface-visibility:hidden;color:var(--text);height:100%;place-items:center;width:100%}.mangaFlow____hash_base64_5_[data-disable-zoom] .img____hash_base64_5_>picture{height:fit-content;width:fit-content}.mangaFlow____hash_base64_5_[data-hidden-mouse=true]{cursor:none}.mangaFlow____hash_base64_5_[data-vertical]{grid-auto-flow:row}.mangaBox____hash_base64_5_{contain:layout style;height:100%;transform-origin:0 0;transition-duration:0s;width:100%}.mangaBox____hash_base64_5_[data-animation=page] .mangaFlow____hash_base64_5_,.mangaBox____hash_base64_5_[data-animation=zoom]{transition-duration:.3s}.root____hash_base64_5_:not([data-grid-mode]) .mangaBox____hash_base64_5_{scrollbar-width:none}:is(.root____hash_base64_5_:not([data-grid-mode]) .mangaBox____hash_base64_5_)::-webkit-scrollbar{display:none}.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_{grid-auto-columns:1fr;grid-auto-flow:row;grid-auto-rows:max-content;overflow:auto;grid-row-gap:1.5em;align-items:end;box-sizing:border-box;grid-template-rows:unset}:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_{cursor:pointer;margin-left:auto;margin-right:auto}:is(:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_)>picture{position:relative}:is(:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_)>.gridModeTip____hash_base64_5_{bottom:-1.5em;cursor:auto;direction:ltr;line-height:1.5em;opacity:.5;overflow:hidden;position:absolute;text-align:center;text-overflow:ellipsis;white-space:nowrap;width:100%}[data-load-type=error]:is(:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_),[data-load-type=wait]:is(:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_),[src=\\"\\"]:is(:is(.root____hash_base64_5_[data-grid-mode] .mangaFlow____hash_base64_5_) .img____hash_base64_5_){height:100%}.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_{overflow:auto}:is(.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_) .mangaFlow____hash_base64_5_{grid-row-gap:calc(var(--scroll-mode-spacing)*7px);height:fit-content}[data-abreast-scroll]:is(.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_){overflow:hidden}[data-abreast-scroll]:is(.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_) .mangaFlow____hash_base64_5_{grid-column-gap:calc(var(--scroll-mode-spacing)*7px);align-items:start;height:100%}:is([data-abreast-scroll]:is(.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_) .mangaFlow____hash_base64_5_) .img____hash_base64_5_{height:auto;width:100%;will-change:transform}:is(:is([data-abreast-scroll]:is(.root____hash_base64_5_[data-scroll-mode]:not([data-grid-mode]) .mangaBox____hash_base64_5_) .mangaFlow____hash_base64_5_) .img____hash_base64_5_)>picture{position:relative}@keyframes show____hash_base64_5_{0%{opacity:0}90%{opacity:0}to{opacity:1}}.endPageBody____hash_base64_5_,.endPage____hash_base64_5_{align-items:center;display:flex;height:100%;justify-content:center;width:100%;z-index:10}.endPage____hash_base64_5_{background-color:#333d;color:#fff;left:0;opacity:0;pointer-events:none;position:absolute;top:0;transition:opacity .5s}.endPage____hash_base64_5_[data-show]{opacity:1;pointer-events:all}.endPage____hash_base64_5_[data-type=start] .tip____hash_base64_5_{transform:translateY(-10em)}.endPage____hash_base64_5_[data-type=end] .tip____hash_base64_5_{transform:translateY(10em)}.endPage____hash_base64_5_ .endPageBody____hash_base64_5_{transform:translateY(var(--drag-y,0));transition:transform .2s}:is(.endPage____hash_base64_5_ .endPageBody____hash_base64_5_) button{animation:jello____hash_base64_5_ .3s forwards;background-color:initial;color:inherit;cursor:pointer;font-size:1.2em;transform-origin:center}[data-is-end]:is(:is(.endPage____hash_base64_5_ .endPageBody____hash_base64_5_) button){font-size:3em;margin:2em}:is(.endPage____hash_base64_5_ .endPageBody____hash_base64_5_) .tip____hash_base64_5_{margin:auto;position:absolute}.endPage____hash_base64_5_[data-drag] .endPageBody____hash_base64_5_{transition:transform 0s}.root____hash_base64_5_[data-mobile] .endPage____hash_base64_5_>button{width:1em}.comments____hash_base64_5_{align-items:flex-end;display:flex;flex-direction:column;max-height:80%;opacity:.3;overflow:auto;padding-right:.5em;position:absolute;right:1em;width:20em}.comments____hash_base64_5_>p{background-color:#333b;border-radius:.5em;margin:.5em .1em;padding:.2em .5em}.comments____hash_base64_5_:hover{opacity:1}.root____hash_base64_5_[data-mobile] .comments____hash_base64_5_{bottom:0;max-height:15em;opacity:.8}@keyframes jello____hash_base64_5_{0%,11.1%,to{transform:translateZ(0)}22.2%{transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{transform:skewX(6.25deg) skewY(6.25deg)}44.4%{transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{transform:skewX(-.7812deg) skewY(-.7812deg)}77.7%{transform:skewX(.3906deg) skewY(.3906deg)}88.8%{transform:skewX(-.1953deg) skewY(-.1953deg)}}.toolbar____hash_base64_5_{align-items:center;display:flex;height:100%;justify-content:flex-start;position:fixed;top:0;z-index:9}.toolbarPanel____hash_base64_5_{display:flex;flex-direction:column;padding:.5em;position:relative;transform:translateX(-100%);transition:transform .2s}.toolbarPanel____hash_base64_5_>hr{border:none;height:1em;margin:0;visibility:hidden}:is(.toolbar____hash_base64_5_[data-show],.toolbar____hash_base64_5_:hover) .toolbarPanel____hash_base64_5_{transform:none}.toolbar____hash_base64_5_[data-close] .toolbarPanel____hash_base64_5_{transform:translateX(-100%);visibility:hidden}.toolbarBg____hash_base64_5_{background-color:var(--page-bg);border-bottom-right-radius:1em;border-top-right-radius:1em;filter:opacity(.8);height:100%;position:absolute;right:0;top:0;width:100%}.root____hash_base64_5_[data-mobile] .toolbar____hash_base64_5_{font-size:1.3em}.root____hash_base64_5_[data-mobile] .toolbar____hash_base64_5_:not([data-show]){pointer-events:none}.root____hash_base64_5_[data-mobile] .toolbarBg____hash_base64_5_{filter:opacity(.8)}.SettingPanelPopper____hash_base64_5_{height:0!important;padding:0!important;pointer-events:unset!important;transform:none!important}.SettingPanel____hash_base64_5_{background-color:var(--page-bg);border-radius:.3em;bottom:0;box-shadow:0 3px 1px -2px #0003,0 2px 2px 0 #00000024,0 1px 5px 0 #0000001f;color:var(--text);font-size:1.2em;height:fit-content;margin:auto;max-height:95%;max-width:calc(100% - 5em);overflow:auto;position:fixed;top:0;-webkit-user-select:text;user-select:text;z-index:1}.SettingPanel____hash_base64_5_ hr{color:#fff;margin:0}.SettingBlock____hash_base64_5_{display:grid;grid-template-rows:max-content 1fr;transition:grid-template-rows .2s ease-out}.SettingBlock____hash_base64_5_ .SettingBlockBody____hash_base64_5_{overflow:hidden;padding:0 .5em 1em;z-index:0}:is(.SettingBlock____hash_base64_5_ .SettingBlockBody____hash_base64_5_)>div+:is(.SettingBlock____hash_base64_5_ .SettingBlockBody____hash_base64_5_)>div{margin-top:1em}.SettingBlock____hash_base64_5_[data-show=false]{grid-template-rows:max-content 0fr;padding-bottom:unset}.SettingBlock____hash_base64_5_[data-show=false] .SettingBlockBody____hash_base64_5_{padding:unset}.SettingBlockSubtitle____hash_base64_5_{background-color:var(--page-bg);color:var(--text-secondary);cursor:pointer;font-size:.7em;height:3em;line-height:3em;margin-bottom:.1em;position:sticky;text-align:center;top:0;z-index:1}.SettingsItem____hash_base64_5_{align-items:center;display:flex;justify-content:space-between}:is(.SettingsItem____hash_base64_5_,.SettingsShowItem____hash_base64_5_)+.SettingsItem____hash_base64_5_{margin-top:1em}.SettingsItemName____hash_base64_5_{font-size:.9em;max-width:calc(100% - 4em);overflow-wrap:anywhere;text-align:start;white-space:pre-wrap}.SettingsItemSwitch____hash_base64_5_{align-items:center;background-color:var(--switch-bg);border:0;border-radius:1em;cursor:pointer;display:inline-flex;height:.8em;margin:.3em;padding:0;width:2.3em}.SettingsItemSwitchRound____hash_base64_5_{background:var(--switch);border-radius:100%;box-shadow:0 2px 1px -1px #0003,0 1px 1px 0 #00000024,0 1px 3px 0 #0000001f;height:1.15em;transform:translateX(-10%);transition:transform .1s;width:1.15em}.SettingsItemSwitch____hash_base64_5_[data-checked=true]{background:var(--secondary-bg)}.SettingsItemSwitch____hash_base64_5_[data-checked=true] .SettingsItemSwitchRound____hash_base64_5_{background:var(--secondary);transform:translateX(110%)}.SettingsItemIconButton____hash_base64_5_{background-color:initial;border:none;color:var(--text);cursor:pointer;font-size:1.7em;height:1em;margin:0 .2em 0 0;padding:0}.SettingsItemSelect____hash_base64_5_{background-color:var(--hover-bg-color);border:none;border-radius:5px;cursor:pointer;font-size:.9em;margin:0;max-width:6.5em;outline:none;padding:.3em}.closeCover____hash_base64_5_{height:100%;left:0;position:fixed;top:0;width:100%}.SettingsShowItem____hash_base64_5_{display:grid;transition:grid-template-rows .2s ease-out}.SettingsShowItem____hash_base64_5_>.SettingsShowItemBody____hash_base64_5_{display:flex;flex-direction:column;overflow:hidden}:is(.SettingsShowItem____hash_base64_5_>.SettingsShowItemBody____hash_base64_5_)>.SettingsItem____hash_base64_5_{margin-top:1em}:is(.SettingsShowItem____hash_base64_5_>.SettingsShowItemBody____hash_base64_5_)>:is(textarea,input){line-height:1.2;margin:.4em .2em 0}[data-only-number]{padding:0 .2em}[data-only-number]+span{margin-left:-.1em}.hotkeys____hash_base64_5_{align-items:center;border-bottom:1px solid var(--secondary-bg);color:var(--text);display:flex;flex-grow:1;flex-wrap:wrap;font-size:.9em;padding:2em .2em .2em;position:relative;z-index:1}.hotkeys____hash_base64_5_+.hotkeys____hash_base64_5_{margin-top:.5em}.hotkeys____hash_base64_5_:last-child{border-bottom:none}.hotkeysItem____hash_base64_5_{align-items:center;border-radius:.3em;box-sizing:initial;cursor:pointer;display:flex;font-family:serif;height:1em;margin:.3em;outline:1px solid;outline-color:var(--secondary-bg);padding:.2em 1.2em}.hotkeysItem____hash_base64_5_>svg{background-color:var(--text);border-radius:1em;color:var(--page-bg);display:none;height:1em;margin-left:.4em;opacity:.5}:is(.hotkeysItem____hash_base64_5_>svg):hover{opacity:.9}.hotkeysItem____hash_base64_5_:hover{padding:.2em .5em}.hotkeysItem____hash_base64_5_:hover>svg{display:unset}.hotkeysItem____hash_base64_5_:focus,.hotkeysItem____hash_base64_5_:focus-visible{outline:var(--text) solid 2px}.hotkeysHeader____hash_base64_5_{align-items:center;box-sizing:border-box;display:flex;left:0;padding:0 .5em;position:absolute;top:0;width:100%}.hotkeysHeader____hash_base64_5_>p{background-color:var(--page-bg);line-height:1em;overflow-wrap:anywhere;text-align:start;white-space:pre-wrap}.hotkeysHeader____hash_base64_5_>div[title]{background-color:var(--page-bg);cursor:pointer;display:flex;transform:scale(0);transition:transform .1s}:is(.hotkeysHeader____hash_base64_5_>div[title])>svg{width:1.6em}.hotkeys____hash_base64_5_:hover div[title]{transform:scale(1)}.scrollbar____hash_base64_5_{--arrow-y:clamp(0.45em,calc(var(--slider-midpoint)),calc(var(--scroll-length) - 0.45em));border-left:max(6vw,1em) solid #0000;display:flex;flex-direction:column;height:98%;position:absolute;right:3px;top:1%;touch-action:none;-webkit-user-select:none;user-select:none;width:5px;z-index:9}.scrollbar____hash_base64_5_>div{align-items:center;display:flex;flex-direction:column;flex-grow:1;justify-content:center;pointer-events:none}.scrollbarPage____hash_base64_5_{background-color:var(--secondary);flex-grow:1;height:100%;transform:scaleY(1);transform-origin:bottom;transition:transform 1s;width:100%}.scrollbarPage____hash_base64_5_[data-type=loaded]{transform:scaleY(0)}.scrollbarPage____hash_base64_5_[data-type=wait]{opacity:.5}.scrollbarPage____hash_base64_5_[data-null]{background-color:#fbc02d}.scrollbarPage____hash_base64_5_[data-translation-type]{background-color:initial;transform:scaleY(1);transform-origin:top}.scrollbarPage____hash_base64_5_[data-translation-type=wait]{background-color:#81c784}.scrollbarPage____hash_base64_5_[data-translation-type=show]{background-color:#4caf50}.scrollbarPage____hash_base64_5_[data-translation-type=error],.scrollbarPage____hash_base64_5_[data-type=error]{background-color:#f005}.scrollbarSlider____hash_base64_5_{background-color:#fff5;border-radius:1em;height:var(--slider-height);justify-content:center;opacity:1;position:absolute;transform:translateY(var(--slider-top));transition:transform .15s,opacity .15s;width:100%;z-index:1}.scrollbarPoper____hash_base64_5_{--poper-top:clamp(0%,calc(var(--slider-midpoint) - 50%),calc(var(--scroll-length) - 100%));background-color:#303030;border-radius:.3em;color:#fff;font-size:.8em;line-height:1.5em;min-height:1.5em;min-width:1em;padding:.2em .5em;position:absolute;right:2em;text-align:center;transform:translateY(var(--poper-top));white-space:pre;width:fit-content}.scrollbar____hash_base64_5_:before{background-color:initial;border:.4em solid #0000;border-left:.5em solid #303030;content:\\"\\";position:absolute;right:2em;transform:translate(140%,calc(var(--arrow-y) - 50%))}.scrollbarPoper____hash_base64_5_,.scrollbar____hash_base64_5_:before{opacity:0;transition:opacity .15s,transform .15s}:is(.scrollbar____hash_base64_5_:hover,.scrollbar____hash_base64_5_[data-force-show]) .scrollbarPoper____hash_base64_5_,:is(.scrollbar____hash_base64_5_:hover,.scrollbar____hash_base64_5_[data-force-show]) .scrollbarSlider____hash_base64_5_,:is(.scrollbar____hash_base64_5_:hover,.scrollbar____hash_base64_5_[data-force-show]):before{opacity:1}.scrollbar____hash_base64_5_[data-drag] .scrollbarPoper____hash_base64_5_,.scrollbar____hash_base64_5_[data-drag] .scrollbarSlider____hash_base64_5_,.scrollbar____hash_base64_5_[data-drag]:before{transition:opacity .15s}.scrollbar____hash_base64_5_[data-auto-hidden]:not([data-force-show]) .scrollbarSlider____hash_base64_5_{opacity:0}.scrollbar____hash_base64_5_[data-auto-hidden]:not([data-force-show]):hover .scrollbarSlider____hash_base64_5_{opacity:1}.scrollbar____hash_base64_5_[data-position=hidden]{display:none}.scrollbar____hash_base64_5_[data-position=top]{border-bottom:max(6vh,1em) solid #0000;top:1px}.scrollbar____hash_base64_5_[data-position=top]:before{border-bottom:.5em solid #303030;right:0;top:1.2em;transform:translate(var(--arrow-x),-120%)}.scrollbar____hash_base64_5_[data-position=top] .scrollbarPoper____hash_base64_5_{top:1.2em}.scrollbar____hash_base64_5_[data-position=bottom]{border-top:max(6vh,1em) solid #0000;bottom:1px;top:unset}.scrollbar____hash_base64_5_[data-position=bottom]:before{border-top:.5em solid #303030;bottom:1.2em;right:0;transform:translate(var(--arrow-x),120%)}.scrollbar____hash_base64_5_[data-position=bottom] .scrollbarPoper____hash_base64_5_{bottom:1.2em}.scrollbar____hash_base64_5_[data-position=bottom],.scrollbar____hash_base64_5_[data-position=top]{--arrow-x:calc(var(--arrow-y)*-1 + 50%);border-left:none;flex-direction:row-reverse;height:5px;right:1%;width:98%}:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]):before{border-left:.4em solid #0000}:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarSlider____hash_base64_5_{height:100%;transform:translateX(calc(var(--slider-top)*-1));width:var(--slider-height)}:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarPoper____hash_base64_5_{padding:.1em .3em;right:unset;transform:translateX(calc(var(--poper-top)*-1))}[data-dir=ltr]:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]){--arrow-x:calc(var(--arrow-y) - 50%);flex-direction:row}[data-dir=ltr]:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]):before{left:0;right:unset}[data-dir=ltr]:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarSlider____hash_base64_5_{transform:translateX(var(--top))}[data-dir=ltr]:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarPoper____hash_base64_5_{transform:translateX(var(--poper-top))}:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarPage____hash_base64_5_{transform:scaleX(1)}[data-type=loaded]:is(:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarPage____hash_base64_5_){transform:scaleX(0)}[data-translation-type]:is(:is(.scrollbar____hash_base64_5_[data-position=top],.scrollbar____hash_base64_5_[data-position=bottom]) .scrollbarPage____hash_base64_5_){transform:scaleX(1)}.scrollbar____hash_base64_5_[data-is-abreast-mode] .scrollbarPoper____hash_base64_5_{line-height:1.5em;text-orientation:upright;writing-mode:vertical-rl}.scrollbar____hash_base64_5_[data-is-abreast-mode][data-dir=ltr] .scrollbarPoper____hash_base64_5_{writing-mode:vertical-lr}.root____hash_base64_5_[data-scroll-mode] .scrollbar____hash_base64_5_:before,.root____hash_base64_5_[data-scroll-mode] :is(.scrollbarSlider____hash_base64_5_,.scrollbarPoper____hash_base64_5_){transition:opacity .15s}:is(.root____hash_base64_5_[data-mobile] .scrollbar____hash_base64_5_:hover) .scrollbarPoper____hash_base64_5_,:is(.root____hash_base64_5_[data-mobile] .scrollbar____hash_base64_5_:hover):before{opacity:0}.touchAreaRoot____hash_base64_5_{color:#fff;display:grid;font-size:3em;grid-template-columns:1fr min(30%,10em) 1fr;grid-template-rows:1fr min(20%,10em) 1fr;height:100%;letter-spacing:.5em;opacity:0;pointer-events:none;position:absolute;top:0;transition:opacity .4s;-webkit-user-select:none;user-select:none;width:100%}.touchAreaRoot____hash_base64_5_[data-show]{opacity:1}.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_{align-items:center;display:flex;justify-content:center;text-align:center}[data-area=PREV]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_),[data-area=prev]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_){background-color:#95e1d3e6}[data-area=MENU]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_),[data-area=menu]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_){background-color:#fce38ae6}[data-area=NEXT]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_),[data-area=next]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_){background-color:#f38181e6}[data-area=PREV]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_):after{content:var(--i18n-touch-area-prev)}[data-area=MENU]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_):after{content:var(--i18n-touch-area-menu)}[data-area=NEXT]:is(.touchAreaRoot____hash_base64_5_ .touchArea____hash_base64_5_):after{content:var(--i18n-touch-area-next)}.touchAreaRoot____hash_base64_5_[data-vert=true]{flex-direction:column!important}.touchAreaRoot____hash_base64_5_:not([data-turn-page]) .touchArea____hash_base64_5_[data-area=NEXT],.touchAreaRoot____hash_base64_5_:not([data-turn-page]) .touchArea____hash_base64_5_[data-area=PREV],.touchAreaRoot____hash_base64_5_:not([data-turn-page]) .touchArea____hash_base64_5_[data-area=next],.touchAreaRoot____hash_base64_5_:not([data-turn-page]) .touchArea____hash_base64_5_[data-area=prev]{visibility:hidden}.touchAreaRoot____hash_base64_5_[data-area=edge]{grid-template-columns:1fr min(30%,10em) 1fr}.root____hash_base64_5_[data-mobile] .touchAreaRoot____hash_base64_5_{flex-direction:column!important;letter-spacing:0}.root____hash_base64_5_[data-mobile] [data-area]:after{font-size:.8em}.root____hash_base64_5_{background-color:var(--bg);font-size:1em;height:100%;outline:0;overflow:hidden;position:relative;width:100%}.root____hash_base64_5_ a{color:var(--text-secondary)}.root____hash_base64_5_[data-mobile]{font-size:.8em}.hidden____hash_base64_5_{display:none!important}.invisible____hash_base64_5_{visibility:hidden!important}.beautifyScrollbar____hash_base64_5_{scrollbar-color:var(--scrollbar-slider) #0000;scrollbar-width:thin}.beautifyScrollbar____hash_base64_5_::-webkit-scrollbar{height:10px;width:5px}.beautifyScrollbar____hash_base64_5_::-webkit-scrollbar-track{background:#0000}.beautifyScrollbar____hash_base64_5_::-webkit-scrollbar-thumb{background:var(--scrollbar-slider)}img,p{margin:0}:where(div,div:focus,div:focus-within,div:focus-visible,button){border:none;outline:none}blockquote{border-left:.25em solid var(--text-secondary,#607d8b);color:var(--text-secondary);font-size:.9em;font-style:italic;line-height:1.2em;margin:.5em 0 0;overflow-wrap:anywhere;padding:0 0 0 1em;text-align:start;white-space:pre-wrap}svg{width:1em}";
var modules_c21c94f2$1 = {"img":"img____hash_base64_5_","mangaFlow":"mangaFlow____hash_base64_5_","mangaBox":"mangaBox____hash_base64_5_","root":"root____hash_base64_5_","gridModeTip":"gridModeTip____hash_base64_5_","endPage":"endPage____hash_base64_5_","endPageBody":"endPageBody____hash_base64_5_","tip":"tip____hash_base64_5_","comments":"comments____hash_base64_5_","toolbar":"toolbar____hash_base64_5_","toolbarPanel":"toolbarPanel____hash_base64_5_","toolbarBg":"toolbarBg____hash_base64_5_","SettingPanelPopper":"SettingPanelPopper____hash_base64_5_","SettingPanel":"SettingPanel____hash_base64_5_","SettingBlock":"SettingBlock____hash_base64_5_","SettingBlockBody":"SettingBlockBody____hash_base64_5_","SettingBlockSubtitle":"SettingBlockSubtitle____hash_base64_5_","SettingsItem":"SettingsItem____hash_base64_5_","SettingsShowItem":"SettingsShowItem____hash_base64_5_","SettingsItemName":"SettingsItemName____hash_base64_5_","SettingsItemSwitch":"SettingsItemSwitch____hash_base64_5_","SettingsItemSwitchRound":"SettingsItemSwitchRound____hash_base64_5_","SettingsItemIconButton":"SettingsItemIconButton____hash_base64_5_","SettingsItemSelect":"SettingsItemSelect____hash_base64_5_","closeCover":"closeCover____hash_base64_5_","SettingsShowItemBody":"SettingsShowItemBody____hash_base64_5_","hotkeys":"hotkeys____hash_base64_5_","hotkeysItem":"hotkeysItem____hash_base64_5_","hotkeysHeader":"hotkeysHeader____hash_base64_5_","scrollbar":"scrollbar____hash_base64_5_","scrollbarPage":"scrollbarPage____hash_base64_5_","scrollbarSlider":"scrollbarSlider____hash_base64_5_","scrollbarPoper":"scrollbarPoper____hash_base64_5_","touchAreaRoot":"touchAreaRoot____hash_base64_5_","touchArea":"touchArea____hash_base64_5_","hidden":"hidden____hash_base64_5_","invisible":"invisible____hash_base64_5_","beautifyScrollbar":"beautifyScrollbar____hash_base64_5_"};

const touches = new Map();
const bound = helper.createMemoMap({
  x: () => -store.rootSize.width * (store.option.zoom.ratio / 100 - 1),
  y: () => -store.rootSize.height * (store.option.zoom.ratio / 100 - 1)
});
const checkBound = state => {
  state.option.zoom.offset.x = helper.clamp(bound().x, state.option.zoom.offset.x, 0);
  state.option.zoom.offset.y = helper.clamp(bound().y, state.option.zoom.offset.y, 0);
};
const zoom = (val, focal, animation = false) => {
  const newScale = helper.clamp(100, val, 300);
  if (newScale === store.option.zoom.ratio) return;

  // 消除放大导致的偏移
  const {
    left,
    top
  } = refs.mangaBox.getBoundingClientRect();
  const x = (focal?.x ?? store.rootSize.width / 2) - left;
  const y = (focal?.y ?? store.rootSize.height / 2) - top;

  // 当前直接放大后的基准点坐标
  const newX = x / (store.option.zoom.ratio / 100) * (newScale / 100);
  const newY = y / (store.option.zoom.ratio / 100) * (newScale / 100);

  // 放大后基准点的偏移距离
  const dx = newX - x;
  const dy = newY - y;
  setOption((draftOption, state) => {
    draftOption.zoom.ratio = newScale;
    draftOption.zoom.offset.x -= dx;
    draftOption.zoom.offset.y -= dy;
    checkBound(state);
    if (animation) state.page.anima = 'zoom';
  });
};

//
// 惯性滑动
//

/** 摩擦系数 */
const FRICTION_COEFF$1 = 0.91;
const mouse = {
  x: 0,
  y: 0
};
const last = {
  x: 0,
  y: 0
};
const velocity = {
  x: 0,
  y: 0
};
let animationId$2 = null;
const cancelAnimation = () => {
  if (!animationId$2) return;
  cancelAnimationFrame(animationId$2);
  animationId$2 = null;
};
let lastTime$1 = 0;

/** 逐帧计算惯性滑动 */
const handleSlideAnima = timestamp => {
  // 当速率足够小时停止计算动画
  if (helper.approx(velocity.x, 0, 1) && helper.approx(velocity.y, 0, 1)) {
    animationId$2 = null;
    return;
  }

  // 在拖拽后模拟惯性滑动
  setOption((draftOption, state) => {
    draftOption.zoom.offset.x += velocity.x;
    draftOption.zoom.offset.y += velocity.y;
    checkBound(state);

    // 确保每16毫秒才减少一次速率，防止在高刷新率显示器上衰减过快
    if (timestamp - lastTime$1 > 16) {
      velocity.x *= FRICTION_COEFF$1;
      velocity.y *= FRICTION_COEFF$1;
      lastTime$1 = timestamp;
    }
  });
  animationId$2 = requestAnimationFrame(handleSlideAnima);
};

/** 逐帧根据鼠标坐标移动元素，并计算速率 */
const handleDragAnima$1 = () => {
  // 当停着不动时退出循环
  if (mouse.x === store.option.zoom.offset.x && mouse.y === store.option.zoom.offset.y) {
    animationId$2 = null;
    return;
  }
  setOption((draftOption, state) => {
    last.x = draftOption.zoom.offset.x;
    last.y = draftOption.zoom.offset.y;
    draftOption.zoom.offset.x = mouse.x;
    draftOption.zoom.offset.y = mouse.y;
    checkBound(state);
    velocity.x = draftOption.zoom.offset.x - last.x;
    velocity.y = draftOption.zoom.offset.y - last.y;
  });
  animationId$2 = requestAnimationFrame(handleDragAnima$1);
};

/** 一段时间没有移动后应该将速率归零 */
const resetVelocity = helper.debounce(() => {
  velocity.x = 0;
  velocity.y = 0;
}, 200);

/** 是否正在双指捏合缩放中 */
let pinchZoom = false;

/** 处理放大后的拖拽移动 */
const handleZoomDrag = ({
  type,
  xy: [x, y],
  last: [lx, ly]
}) => {
  if (store.option.zoom.ratio === 100) return;
  switch (type) {
    case 'down':
      {
        mouse.x = store.option.zoom.offset.x;
        mouse.y = store.option.zoom.offset.y;
        if (animationId$2) cancelAnimation();
        break;
      }
    case 'move':
      {
        if (animationId$2) cancelAnimation();
        mouse.x += x - lx;
        mouse.y += y - ly;
        if (animationId$2 === null) animationId$2 = requestAnimationFrame(handleDragAnima$1);
        resetVelocity();
        break;
      }
    case 'up':
      {
        resetVelocity.clear();

        // 当双指捏合结束，一个手指抬起时，将剩余的指针当作刚点击来处理
        if (pinchZoom) {
          pinchZoom = false;
          mouse.x = store.option.zoom.offset.x;
          mouse.y = store.option.zoom.offset.y;
          return;
        }
        if (animationId$2) cancelAnimationFrame(animationId$2);
        animationId$2 = requestAnimationFrame(handleSlideAnima);
      }
  }
};

//
// 双指捏合缩放
//

/** 初始双指距离 */
let initDistance = 0;
/** 初始缩放比例 */
let initScale = 100;

/** 获取两个指针之间的距离 */
const getDistance = (a, b) => Math.hypot(b.xy[0] - a.xy[0], b.xy[1] - a.xy[1]);

/** 逐帧计算当前屏幕上两点之间的距离，并换算成缩放比例 */
const handlePinchZoomAnima = () => {
  if (touches.size < 2) {
    animationId$2 = null;
    return;
  }
  const [a, b] = [...touches.values()];
  const distance = getDistance(a, b);
  zoom(distance / initDistance * initScale, {
    x: (a.xy[0] + b.xy[0]) / 2,
    y: (a.xy[1] + b.xy[1]) / 2
  });
  animationId$2 = requestAnimationFrame(handlePinchZoomAnima);
};

/** 处理双指捏合缩放 */
const handlePinchZoom = ({
  type
}) => {
  if (touches.size < 2) return;
  switch (type) {
    case 'down':
      {
        pinchZoom = true;
        const [a, b] = [...touches.values()];
        initDistance = getDistance(a, b);
        initScale = store.option.zoom.ratio;
        break;
      }
    case 'up':
      {
        const [a, b] = [...touches.values()];
        initDistance = getDistance(a, b);
        break;
      }
    case 'move':
      {
        if (animationId$2 === null) animationId$2 = requestAnimationFrame(handlePinchZoomAnima);
        break;
      }
    case 'cancel':
      {
        const [a, b] = [...touches.values()];
        initDistance = getDistance(a, b);
        break;
      }
  }
};

/** 并排卷轴模式下的全局滚动填充 */
const [abreastScrollFill, _setAbreastScrollFill] = solidJs.createSignal(0);
/** 并排卷轴模式下的每列布局 */
const abreastArea = helper.createRootMemo(prev => {
  if (!isAbreastMode()) return prev;
  const columns = [[]];
  const position = {};
  let length = 0;
  const rootHeight = store.rootSize.height;
  if (!rootHeight || store.imgList.length === 0) return {
    columns,
    position,
    length
  };
  const repeatHeight = rootHeight * store.option.scrollMode.abreastDuplicate;

  /** 当前图片在当前列的所在高度 */
  let top = abreastScrollFill();
  while (top > rootHeight) {
    top -= rootHeight - repeatHeight;
    columns.push([]);
  }
  for (let i = 0; i < store.imgList.length; i++) {
    const img = getImg(i);
    const imgPosition = [];
    const imgHeight = img.size.height;
    length += imgHeight;
    let height = imgHeight;
    while (height > 0) {
      columns.at(-1).push(i);
      imgPosition.push({
        column: columns.length - 1,
        top
      });
      if (top < 0 && imgPosition.length > 1) top = 0;
      const availableHeight = rootHeight - top;
      top += height;
      height -= availableHeight;

      // 填满一列后换行
      if (top < rootHeight) continue;
      columns.push([]);
      top = height - imgHeight;

      // 复现上列结尾
      if (!repeatHeight || columns.length === 1) continue;
      top += repeatHeight;
      height = Math.min(imgHeight, height + repeatHeight);

      /** 为了复现而出现的空白部分高度 */
      let emptyTop = top;
      let prevImgIndex = i;
      while (prevImgIndex >= 1 && emptyTop > 0) {
        prevImgIndex -= 1;
        // 把上一张图片加进来填补空白
        columns.at(-1).push(prevImgIndex);
        const prevImgHeight = getImg(prevImgIndex).size.height;
        emptyTop -= prevImgHeight;
        position[prevImgIndex].push({
          column: columns.length - 1,
          top: emptyTop
        });
      }
    }
    position[i] = imgPosition;
  }
  return {
    columns,
    position,
    length
  };
}, {
  columns: [],
  position: {},
  length: 0
});

/** 头尾滚动的限制值 */
const scrollFillLimit = helper.createRootMemo(() => abreastArea().length - store.rootSize.height);
const setAbreastScrollFill = val => _setAbreastScrollFill(helper.clamp(-scrollFillLimit(), val, scrollFillLimit()));

/** 并排卷轴模式下当前要显示的列 */
const abreastShowColumn = helper.createThrottleMemo(() => {
  if (!isAbreastMode() || abreastArea().columns.length === 0) return {
    start: 0,
    end: 0
  };
  const columnWidth = abreastColumnWidth() + store.option.scrollMode.spacing * 7;
  return {
    start: helper.clamp(0, Math.floor(store.page.offset.x.px / columnWidth), abreastArea().columns.length - 1),
    end: helper.clamp(0, Math.floor((store.page.offset.x.px + store.rootSize.width) / columnWidth), abreastArea().columns.length - 1)
  };
});

/** 并排卷轴模式下的漫画流宽度 */
const abreastContentWidth = helper.createRootMemo(() => abreastArea().columns.length * abreastColumnWidth() + (abreastArea().columns.length - 1) * store.option.scrollMode.spacing * 7);

/** 并排卷轴模式下的最大滚动距离 */
const abreastScrollWidth = helper.createRootMemo(() => abreastContentWidth() - store.rootSize.width);

/** 并排卷轴模式下每个图片所在位置的样式 */
const imgAreaStyle = helper.createRootMemo(() => {
  if (!isAbreastMode() || store.gridMode) return '';
  let styleText = '';
  for (const index of store.imgList.keys()) {
    let imgNum = 0;
    for (const {
      column,
      top
    } of abreastArea().position[index] ?? []) {
      const itemStyle = \`grid-area: _\${column} !important; transform: translateY(\${top}px);\`;
      styleText += \`#_\${index}_\${imgNum} { \${itemStyle} }\\n\`;
      imgNum += 1;
    }
  }
  return styleText;
});

/** 滚动内容的总长度 */
const scrollLength = helper.createRootMemo(() => {
  if (store.option.scrollMode.enabled) {
    if (store.option.scrollMode.abreastMode) return abreastContentWidth();
    if (store.option.scrollMode.doubleMode) return doubleScrollLineHeight().reduce((sum, height) => sum + height, 0);
    return contentHeight();
  }
  return store.pageList.length;
});

/** 滚动内容的滚动进度 */
const scrollProgress = helper.createRootMemo(() => {
  if (isScrollMode()) return scrollTop();
  if (isAbreastMode()) return store.page.offset.x.px;
  return store.activePageIndex;
});

/** 滚动内容的滚动进度百分比 */
const scrollPercentage = helper.createRootMemo(() => scrollProgress() / scrollLength());

/** 滚动条滑块长度 */
const sliderHeight = helper.createRootMemo(() => {
  let itemLength = 1;
  if (isScrollMode()) itemLength = store.rootSize.height;
  if (isAbreastMode()) itemLength = store.rootSize.width;
  return itemLength / scrollLength();
});

/** 当前是否已经滚动到底部 */
const isBottom = helper.createRootMemo(() => scrollPercentage() + sliderHeight() >= 0.9999);

/** 当前是否已经滚动到顶部 */
const isTop = helper.createRootMemo(() => scrollPercentage() === 0);

/** 在卷轴模式下滚动到指定进度 */
const scrollTo = (x, smooth = false) => {
  if (!store.option.scrollMode.enabled) return;
  if (store.option.scrollMode.abreastMode) {
    refs.mangaBox.scrollTo({
      top: 0,
      behavior: 'instant'
    });
    const val = helper.clamp(0, x, abreastScrollWidth());
    return _setState('page', 'offset', 'x', 'px', val);
  }
  refs.mangaBox.scrollTo({
    top: x,
    behavior: smooth ? 'smooth' : 'instant'
  });
};

/** 保存当前滚动进度，并在之后恢复 */
const saveScrollProgress = () => {
  const oldScrollPercentage = scrollPercentage();
  return () => scrollTo(oldScrollPercentage * scrollLength());
};

/** 在卷轴模式下，滚动到能显示指定图片的位置 */
const scrollViewImg = i => {
  if (!store.option.scrollMode.enabled) return;
  let top;
  if (store.option.scrollMode.abreastMode) {
    const columnNum = abreastArea().columns.findIndex(column => column.includes(i));
    top = columnNum * abreastColumnWidth() + 1;
  } else if (store.option.scrollMode.doubleMode) {
    const pageNum = imgPageMap()[i];
    top = doubleScrollLineHeight().slice(0, pageNum).reduce((sum, height) => sum + height, 0);
  } else top = imgTopList()[i] + 1;
  scrollTo(top);
};

/** 跳转到指定图片的显示位置 */
const jumpToImg = index => {
  if (store.option.scrollMode.enabled) return scrollViewImg(index);
  const pageNum = imgPageMap()[index];
  if (pageNum === undefined) return;
  setState(state => {
    state.activePageIndex = pageNum;
    state.gridMode = false;
  });
};

/** 在卷轴模式下进行缩放，并且保持滚动进度不变 */
const zoomScrollModeImg = (zoomLevel, set = false) => {
  const jump = saveScrollProgress();
  setOption(draftOption => {
    const newVal = set ? zoomLevel : store.option.scrollMode.imgScale + zoomLevel;
    draftOption.scrollMode.imgScale = helper.clamp(0.1, Number(newVal.toFixed(2)), 3);
  });
  jump();

  // 并排卷轴模式下并没有一个明确直观的滚动进度，
  // 也想不出有什么实现效果能和普通卷轴模式的效果一致,
  // 所以就摆烂不管了，反正现在这样也已经能避免乱跳了
};

/** 切换页面填充 */
const switchFillEffect = () => {
  setState(state => {
    // 如果当前页不是双页显示的就跳过，避免在显示跨页图的页面切换却没看到效果的疑惑
    if (state.pageList[state.activePageIndex].length !== 2) return;
    state.fillEffect[nowFillIndex()] = Number(!state.fillEffect[nowFillIndex()]);
    updatePageData(state);
  });
};

/** 切换卷轴模式 */
const switchScrollMode = () => {
  const index = activeImgIndex();
  zoom(100);
  setOption((draftOption, state) => {
    draftOption.scrollMode.enabled = !draftOption.scrollMode.enabled;
    state.page.offset.x.px = 0;
    state.page.offset.y.px = 0;
  });
  jumpToImg(index);
};

/** 切换单双页模式 */
const switchOnePageMode = () => {
  const index = activeImgIndex();
  setOption((draftOption, state) => {
    if (draftOption.scrollMode.enabled) {
      if (draftOption.scrollMode.abreastMode) {
        draftOption.scrollMode.abreastMode = false;
        draftOption.scrollMode.doubleMode = true;
      } else draftOption.scrollMode.doubleMode = !draftOption.scrollMode.doubleMode;
    } else {
      const newPageNum = pageNum() === 1 ? 2 : 1;
      draftOption.pageNum = state.option.autoSwitchPageMode && newPageNum === autoPageNum() ? 0 : newPageNum;
    }
  });
  jumpToImg(index);
};

/** 切换阅读方向 */
const switchDir = () => {
  setOption(draftOption => {
    draftOption.dir = draftOption.dir === 'rtl' ? 'ltr' : 'rtl';
  });
};

/** 切换网格模式 */
const switchGridMode = () => {
  zoom(100);
  setState(state => {
    state.gridMode = !state.gridMode;
    if (store.option.zoom.ratio !== 100) zoom(100);
    state.page.anima = '';
  });
  // 切换到网格模式后自动定位到当前页
  if (store.gridMode) requestAnimationFrame(() => {
    refs.mangaFlow.children[activeImgIndex()]?.scrollIntoView({
      block: 'center',
      inline: 'center'
    });
  });
};

/** 切换卷轴模式下图片适应宽度 */
const switchFitToWidth = () => {
  const jump = saveScrollProgress();
  setOption(draftOption => {
    draftOption.scrollMode.fitToWidth = !draftOption.scrollMode.fitToWidth;
  });
  jump();
};

/** 切换全屏 */
const switchFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen();else refs.root.requestFullscreen();
};

let clickTimeout = null;
const useDoubleClick = (click, doubleClick, timeout = 200) => {
  return event => {
    // 如果点击触发时还有上次计时器的记录，说明这次是双击
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
      doubleClick?.(event);
      return;
    }

    // 单击事件延迟触发
    clickTimeout = window.setTimeout(() => {
      click(event);
      clickTimeout = null;
    }, timeout);
  };
};

/** 找到普通卷轴模式下指定高度上的图片 */
const findTopImg = (top, initIndex = 0) => {
  if (top > contentHeight()) return imgTopList().length - 1;
  let i = initIndex;
  for (; i < imgTopList().length; i++) if (imgTopList()[i] > top) return i === 0 ? 0 : i - 1;
  return imgTopList().length - 1;
};

/** 获取并排卷轴模式下指定列的指定图片 */
const getAbreastColumnImg = (column, img) => {
  const {
    columns
  } = abreastArea();
  return columns[helper.clamp(0, column, columns.length - 1)]?.at(img) ?? 0;
};

/** 计算显示页面 */
const updateShowRange = state => {
  if (scrollLength() === 0) {
    state.showRange = [0, 0];
    state.renderRange = state.showRange;
  } else if (!state.option.scrollMode.enabled) {
    // 翻页模式
    state.showRange = [state.activePageIndex, state.activePageIndex];
    state.renderRange = [helper.clamp(0, state.activePageIndex - 1, state.pageList.length - 1), helper.clamp(0, state.activePageIndex + 1, state.pageList.length - 1)];
  } else if (state.option.scrollMode.abreastMode) {
    // 并排卷轴模式
    const {
      start,
      end
    } = abreastShowColumn();
    state.showRange = [getAbreastColumnImg(start, 0), getAbreastColumnImg(end, -1)];
    state.renderRange = [getAbreastColumnImg(start - 2, 0), getAbreastColumnImg(end + 2, -1)];
  } else if (state.option.scrollMode.doubleMode) {
    // 双页卷轴模式
    const top = scrollTop();
    const bottom = scrollTop() + state.rootSize.height;
    const renderTop = top - state.rootSize.height;
    const rednerBottom = bottom + state.rootSize.height;
    state.showRange = [-1, -1];
    state.renderRange = [-1, -1];
    let height = 0;
    for (const [pageIndex, lineHeight] of doubleScrollLineHeight().entries()) {
      height += lineHeight;
      if (state.renderRange[0] === -1) {
        if (height >= renderTop) state.renderRange[0] = pageIndex;else continue;
      }
      if (state.showRange[0] === -1) {
        if (height >= top) state.showRange[0] = pageIndex;else continue;
      }
      if (state.showRange[1] === -1) {
        if (height >= bottom) state.showRange[1] = pageIndex;else continue;
      }
      if (state.renderRange[1] === -1) {
        if (height >= rednerBottom) state.renderRange[1] = pageIndex;else continue;
      }
      break;
    }
    if (state.renderRange[1] === -1) state.renderRange[1] = state.pageList.length - 1;
    if (state.showRange[1] === -1) state.showRange[1] = state.pageList.length - 1;
  } else {
    // 普通卷轴模式
    const top = scrollTop();
    const bottom = scrollTop() + state.rootSize.height;
    const renderTop = top - state.rootSize.height;
    const rednerBottom = bottom + state.rootSize.height;
    const renderTopImg = findTopImg(renderTop);
    const topImg = findTopImg(top, renderTopImg);
    const bottomImg = findTopImg(bottom, topImg);
    const renderBottomImg = findTopImg(rednerBottom, bottomImg);
    state.showRange = [topImg, bottomImg];
    state.renderRange = [renderTopImg, renderBottomImg];
  }
};
helper.createEffectOn([scrollLength, () => store.gridMode, () => store.option.scrollMode.enabled, () => store.activePageIndex, () => store.option.scrollMode.abreastMode, () => store.rootSize, abreastShowColumn, scrollTop], helper.throttle(() => setState(updateShowRange))
// 两种卷轴模式下都可以通过在每次滚动后记录
// 当前 \`显示的第一张图片的 bottom\` 和 \`最后一张图片的 top\` 作为忽略范围，
// 在每次滚动后检查是否超出了这个范围，没超出就说明本次滚动不会显示或消失任何图片
// 以此进行性能优化
// 不过两个卷轴模式都要这么处理挺麻烦的，姑且先用 throttle 顶上，后面有需要再优化
);

/** 获取指定范围内页面所包含的图片 */
const getRangeImgList = range => {
  let list;
  if (range[0] === range[1]) list = new Set(store.pageList[range[0]]);else {
    list = new Set();
    for (const [a, b] of store.pageList.slice(range[0], range[1] + 1)) {
      list.add(a);
      if (b !== undefined) list.add(b);
    }
  }
  list.delete(-1);
  return list;
};
const renderImgList = helper.createRootMemo(() => getRangeImgList(store.renderRange));
const showImgList = helper.createRootMemo(() => getRangeImgList(store.showRange));

/**
 * 图片显示状态
 *
 * 0 - 页面中的第一张图片
 * 1 - 页面中的最后一张图片
 * '' - 页面中的唯一一张图片
 */
const imgShowState = helper.createRootMemo(() => {
  if (store.pageList.length === 0) return new Map();
  const showRange = store.gridMode ? [0, store.pageList.length - 1] : store.renderRange;
  const stateList = new Map();
  for (let i = showRange[0]; i <= showRange[1]; i++) {
    const page = store.pageList[i];
    if (!page) continue;
    const [a, b] = page;
    if (b === undefined) {
      stateList.set(a, '');
    } else {
      stateList.set(a, 0);
      stateList.set(b, 1);
    }
  }
  return stateList;
});

// 卷轴模式下，将当前显示的第一页作为当前页
helper.createEffectOn(() => store.showRange, ([firstPage]) => {
  if (!store.gridMode && store.option.scrollMode.enabled) _setState('activePageIndex', firstPage ?? 0);
});

// 图片发生变化时触发回调
helper.createEffectOn(showImgList, showImgs => {
  if (showImgs.size === 0) return;
  store.prop.onShowImgsChange?.(showImgs, imgList());
}, {
  defer: true
});

/** 将页面移回原位 */
const resetPage = (state, animation = false) => {
  updateShowRange(state);
  state.page.offset.x.pct = 0;
  state.page.offset.y.pct = 0;
  if (state.option.scrollMode.enabled) {
    state.page.anima = '';
    return;
  }
  let i = -1;
  if (helper.inRange(state.renderRange[0], state.activePageIndex, state.renderRange[1])) i = state.activePageIndex - state.renderRange[0];
  if (store.page.vertical) state.page.offset.y.pct = i === -1 ? 0 : -i;else state.page.offset.x.pct = i === -1 ? 0 : i;
  state.page.anima = animation ? 'page' : '';
};

/** 获取指定图片的提示文本 */
const getImgTip = i => {
  if (i === -1) return helper.t('other.fill_page');
  const img = getImg(i);

  // 如果图片未加载完毕则在其 index 后增加显示当前加载状态
  if (img.loadType !== 'loaded') return \`\${i + 1} (\${helper.t(\`img_status.\${img.loadType}\`)})\`;
  if (img.translationType && img.translationType !== 'hide' && img.translationMessage) return \`\${i + 1}：\${img.translationMessage}\`;
  return \`\${i + 1}\`;
};

/** 获取指定页面的提示文本 */
const getPageTip = pageIndex => {
  const page = store.pageList[pageIndex];
  if (!page) return 'null';
  const pageIndexText = page.map(index => getImgTip(index));
  if (pageIndexText.length === 1) return pageIndexText[0];
  if (store.option.dir === 'rtl') pageIndexText.reverse();
  return pageIndexText.join(' | ');
};
helper.createEffectOn(() => store.activePageIndex, () => store.show.endPage && _setState('show', 'endPage', undefined), {
  defer: true
});
helper.createEffectOn(activePage, helper.throttle(() => store.isDragMode || setState(resetPage)));

// 在关闭工具栏的同时关掉滚动条的强制显示
helper.createEffectOn(() => store.show.toolbar, () => store.show.scrollbar && !store.show.toolbar && _setState('show', 'scrollbar', false), {
  defer: true
});

// 在切换网格模式后关掉 滚动条和工具栏 的强制显示
helper.createEffectOn(() => store.gridMode, () => setState(resetUI), {
  defer: true
});

let cache = undefined;
const initCache = async () => {
  cache ||= await helper.useCache({
    progress: 'id'
  }, 'ReadProgress');
};
let lastIndex = -1;
/** 保存阅读进度 */
const saveReadProgress = helper.throttle(async () => {
  await initCache();
  const index = activeImgIndex();
  if (index === lastIndex) return;
  lastIndex = index;
  if (
  // 只保存 50 页以上漫画的进度
  store.imgList.length < 50 ||
  // 翻到最后几页时不保存
  index >= store.imgList.length - 5) return await cache.del('progress', location.pathname);
  const imgSize = {};
  for (const [i, img] of imgList().entries()) if (img.width && img.height) imgSize[i] = [img.width, img.height];
  await cache.set('progress', {
    id: location.pathname,
    time: Date.now(),
    index,
    imgSize,
    fillEffect: store$1.unwrap(store.fillEffect)
  });
}, 1000);

/** 恢复阅读进度 */
const resumeReadProgress = async state => {
  await initCache();
  const progress = await cache.get('progress', location.pathname);
  if (!progress) return;

  // 目前卷轴模式下无法避免因图片加载导致的抖动，
  // 为了避免在恢复阅读进度时出现问题，只能将图片显示相关的数据也存着用于恢复
  let i = state.imgList.length;
  while (i--) {
    const imgSize = progress.imgSize[i];
    if (imgSize) updateImgSize(state.imgList[i], ...imgSize);
  }
  state.fillEffect = progress.fillEffect;
  updatePageData(state);
  if (state.option.scrollMode.enabled) setTimeout(scrollViewImg, 500, progress.index);else jumpToImg(progress.index);

  // 清除过时的进度
  const nowTime = Date.now();
  cache.each('progress', async (data, cursor) => {
    if (nowTime - data.time < 1000 * 60 * 60 * 24 * 29) return;
    await helper.promisifyRequest(cursor.delete());
  });
};

const closeScrollLock = helper.debounce(() => _setState('scrollLock', false), 100);

/** 翻页。返回是否成功改变了当前页数 */
const turnPageFn = (state, dir) => {
  if (state.gridMode) return false;
  if (dir === 'prev') {
    switch (state.show.endPage) {
      case 'start':
        if (!state.scrollLock && store.option.scroolEnd === 'auto') state.prop.onPrev?.();
        return false;
      case 'end':
        state.show.endPage = undefined;
        return false;
      default:
        // 弹出卷首结束页
        if (isTop()) {
          if (!state.prop.onExit) return false;
          // 没有 onPrev 时不弹出
          if (!state.prop.onPrev || store.option.scroolEnd !== 'auto') return false;
          state.show.endPage = 'start';
          state.scrollLock = true;
          closeScrollLock();
          return false;
        }
        saveReadProgress();
        if (state.option.scrollMode.enabled) return false;
        state.activePageIndex -= 1;
        return true;
    }
  } else {
    switch (state.show.endPage) {
      case 'end':
        if (state.scrollLock) return false;
        if (state.prop.onNext && store.option.scroolEnd === 'auto') {
          state.prop.onNext();
          return false;
        }
        if (store.option.scroolEnd !== 'none') state.prop.onExit?.(true);
        return false;
      case 'start':
        state.show.endPage = undefined;
        return false;
      default:
        // 弹出卷尾结束页
        if (isBottom()) {
          if (!state.prop.onExit) return false;
          state.show.endPage = 'end';
          state.scrollLock = true;
          closeScrollLock();
          return false;
        }
        saveReadProgress();
        if (state.option.scrollMode.enabled) return false;
        state.activePageIndex += 1;
        return true;
    }
  }
};
const turnPage = dir => setState(state => turnPageFn(state, dir));
const turnPageAnimation = dir => {
  setState(state => {
    // 无法翻页就恢复原位
    if (!turnPageFn(state, dir)) {
      state.page.offset.x.px = 0;
      state.page.offset.y.px = 0;
      resetPage(state, true);
      state.isDragMode = false;
      return;
    }
    state.isDragMode = true;
    resetPage(state);
    if (store.page.vertical) state.page.offset.y.pct += dir === 'next' ? 1 : -1;else state.page.offset.x.pct += dir === 'next' ? -1 : 1;
    setTimeout(() => {
      setState(draftState => {
        resetPage(draftState, true);
        draftState.page.offset.x.px = 0;
        draftState.page.offset.y.px = 0;
        draftState.isDragMode = false;
      });
    }, 16);
  });
};

/** 判断翻页方向 */
const getTurnPageDir = (move, total, startTime) => {
  let dir;

  // 处理无关速度不考虑时间单纯根据当前滚动距离来判断的情况
  if (!startTime) {
    if (Math.abs(move) > total / 2) dir = move > 0 ? 'next' : 'prev';
    return dir;
  }

  // 滑动距离超过总长度三分之一判定翻页
  if (Math.abs(move) > total / 3) dir = move > 0 ? 'next' : 'prev';
  if (dir) return dir;

  // 滑动速度超过 0.4 判定翻页
  const velocity = move / (performance.now() - startTime);
  if (velocity < -0.4) dir = 'prev';
  if (velocity > 0.4) dir = 'next';
  return dir;
};

/** 根据坐标判断点击的元素 */
const findClickEle = (eleList, {
  x,
  y
}) => [...eleList].find(e => {
  const rect = e.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
});

/** 触发点击区域操作 */
const handlePageClick = e => {
  const targetArea = findClickEle(refs.touchArea.children, e);
  if (!targetArea) return;
  const areaName = targetArea.dataset.area;
  if (!areaName) return;
  if (areaName === 'menu' || areaName === 'MENU') return setState(state => {
    state.show.scrollbar = !state.show.scrollbar;
    state.show.toolbar = !state.show.toolbar;
  });
  if (!store.option.clickPageTurn.enabled || store.option.zoom.ratio !== 100) return;
  setState(state => {
    resetUI(state);
    turnPageFn(state, areaName.toLowerCase());
  });
};

/** 网格模式下点击图片跳到对应页 */
const handleGridClick = e => {
  const target = findClickEle(refs.root.getElementsByClassName(modules_c21c94f2$1.img), e);
  if (target) jumpToImg(Number(/_(\\d+)_/.exec(target.id)?.[1]));
};

/** 双击放大 */
const doubleClickZoom = e => !store.gridMode && zoom(store.option.zoom.ratio === 100 ? 350 : 100, e, true);
const handleClick = useDoubleClick(e => store.gridMode ? handleGridClick(e) : handlePageClick(e), doubleClickZoom);
let dx$1 = 0;
let dy$1 = 0;
let animationId$1 = null;
const handleDragAnima = () => {
  // 当停着不动时退出循环
  if (dx$1 === store.page.offset.x.px && dy$1 === store.page.offset.y.px) {
    animationId$1 = null;
    return;
  }
  setState(state => {
    if (state.page.vertical) state.page.offset.y.px = dy$1;else state.page.offset.x.px = dx$1;
  });
  animationId$1 = requestAnimationFrame(handleDragAnima);
};
const handleDragEnd = startTime => {
  dx$1 = 0;
  dy$1 = 0;
  if (animationId$1) {
    cancelAnimationFrame(animationId$1);
    animationId$1 = null;
  }

  // 将拖动的页面移回正常位置
  const dir = store.page.vertical ? getTurnPageDir(-store.page.offset.y.px, store.rootSize.height, startTime) : getTurnPageDir(store.page.offset.x.px, store.rootSize.width, startTime);
  if (dir) return turnPageAnimation(dir);
  setState(state => {
    state.page.offset.x.px = 0;
    state.page.offset.y.px = 0;
    state.page.anima = 'page';
    state.isDragMode = false;
  });
};
handleDragEnd.debounce = helper.debounce(handleDragEnd, 200);
const handleMangaFlowDrag = ({
  type,
  xy: [x, y],
  initial: [ix, iy],
  startTime
}) => {
  switch (type) {
    case 'move':
      {
        dx$1 = store.option.dir === 'rtl' ? x - ix : ix - x;
        dy$1 = y - iy;
        if (store.isDragMode) {
          animationId$1 ||= requestAnimationFrame(handleDragAnima);
          return;
        }

        // 判断滑动方向
        let slideDir;
        const dxAbs = Math.abs(dx$1);
        const dyAbs = Math.abs(dy$1);
        if (dxAbs > 5 && dyAbs < 5) slideDir = 'horizontal';
        if (dyAbs > 5 && dxAbs < 5) slideDir = 'vertical';
        if (!slideDir) return;
        setState(state => {
          // 根据滑动方向自动切换排列模式
          state.page.vertical = slideDir === 'vertical';
          state.isDragMode = true;
          resetPage(state);
        });
        return;
      }
    case 'up':
      return handleDragEnd(startTime);
  }
};
let lastDeltaY$1 = 0;
let retardStartTime = 0;
let lastWheel = 0;
const handleTrackpadWheel = e => {
  let deltaY = Math.floor(-e.deltaY);
  let absDeltaY = Math.abs(deltaY);
  if (absDeltaY < 2) return;
  let time = 0;
  let now = 0;
  // 为了避免被触摸板的滚动惯性触发，限定一下滚动距离
  if (absDeltaY > 50) {
    now = performance.now();
    time = now - lastWheel;
    lastWheel = now;
  }
  if (store.option.scrollMode.enabled) {
    if (time > 200 && (isTop() && e.deltaY < 0 || isBottom() && e.deltaY > 0)) turnPage(e.deltaY > 0 ? 'next' : 'prev');
    return;
  }

  // 加速度小于指定值后逐渐缩小滚动距离，实现减速效果
  if (Math.abs(absDeltaY - lastDeltaY$1) <= 6) {
    retardStartTime ||= Date.now();
    deltaY *= 1 - Math.min(1, (Date.now() - retardStartTime) / 10 * 0.002);
    absDeltaY = Math.abs(deltaY);
    if (absDeltaY < 2) return;
  } else retardStartTime = 0;
  lastDeltaY$1 = absDeltaY;
  dy$1 += deltaY;
  setState(state => {
    // 滚动至漫画头尾尽头时
    if (isTop() && dy$1 > 0 || isBottom() && dy$1 < 0) {
      if (time > 200) turnPageFn(state, dy$1 < 0 ? 'next' : 'prev');
      dy$1 = 0;
    }

    // 滚动过一页时
    if (dy$1 <= -state.rootSize.height) {
      if (turnPageFn(state, 'next')) dy$1 += state.rootSize.height;
    } else if (dy$1 >= state.rootSize.height && turnPageFn(state, 'prev')) dy$1 -= state.rootSize.height;
    state.page.vertical = true;
    state.isDragMode = true;
    resetPage(state);
  });
  animationId$1 ||= requestAnimationFrame(handleDragAnima);
  handleDragEnd.debounce();
};

const setMessage = (url, msg) => _setState('imgMap', url, 'translationMessage', msg);
const sizeDict = {
  '1024': 'S',
  '1536': 'M',
  '2048': 'L',
  '2560': 'X'
};
const createFormData = (imgBlob, type) => {
  const file = new File([imgBlob], \`image.\${imgBlob.type.split('/').at(-1)}\`, {
    type: imgBlob.type
  });
  const {
    size,
    detector,
    direction,
    translator,
    targetLanguage
  } = store.option.translation.options;
  const formData = new FormData();
  if (type === 'selfhosted') {
    formData.append('image', file);
    formData.append('config', JSON.stringify({
      detector: {
        detector,
        detection_size: size
      },
      render: {
        direction
      },
      translator: {
        translator,
        target_lang: targetLanguage
      }
    }));
  } else {
    formData.append('file', file);
    formData.append('mime', file.type);
    formData.append('size', sizeDict[size]);
    formData.append('detector', detector);
    formData.append('direction', direction);
    formData.append('translator', translator);
    formData.append(type === 'cotrans' ? 'target_language' : 'target_lang', targetLanguage);
    formData.append('retry', \`\${store.option.translation.forceRetry}\`);
  }
  return formData;
};

/** 将站点列表转为选择器中的选项 */
const createOptions = list => list.map(name => [name, helper.t(\`translation.translator.\${name}\`) || name]);

/** 阻止事件冒泡 */
const stopPropagation = e => {
  e.stopPropagation();
};

/** 从头开始播放元素的动画 */
const playAnimation = e => {
  if (!e) return;
  for (const animation of e.getAnimations()) {
    animation.cancel();
    animation.play();
  }
};
const headers = {
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'User-Agent': navigator.userAgent,
  Referer: window.location.href
};
const downloadImg = async (imgUrl, details) => {
  const url = store.imgMap[imgUrl]?.blobUrl ?? imgUrl;
  if (url.startsWith('blob:')) {
    const res = await fetch(url);
    return res.blob();
  }
  const res = await request.request(url, {
    responseType: 'blob',
    errorText: helper.t('translation.tip.download_img_failed'),
    headers,
    retryFetch: true,
    ...details
  });
  if (Reflect.has(store.imgMap, imgUrl)) _setState('imgMap', imgUrl, 'blobUrl', URL.createObjectURL(res.response));
  return res.response;
};

const apiUrl = () => store.option.translation.localUrl || 'http://127.0.0.1:5003';

/** 使用自部署服务器翻译指定图片 */
const selfhostedTranslation = async url => {
  const html = await request.request(apiUrl(), {
    errorText: helper.t('alert.server_connect_failed')
  });
  setMessage(url, helper.t('translation.tip.img_downloading'));
  let imgBlob;
  try {
    imgBlob = await downloadImg(url);
  } catch (error) {
    helper.log.error(error, url);
    store.prop.onImgError?.(url);
    throw new Error(helper.t('translation.tip.download_img_failed'));
  }

  // 支持旧版 manga-image-translator
  // https://sleazyfork.org/zh-CN/scripts/374903/discussions/273466
  if (html.responseText.includes('value="S">1024px</')) {
    let task_id;
    // 上传图片取得任务 id
    try {
      const res = await request.request(\`\${apiUrl()}/submit\`, {
        method: 'POST',
        responseType: 'json',
        data: createFormData(imgBlob, 'selfhosted-old')
      });
      task_id = res.response.task_id;
    } catch (error) {
      helper.log.error(error);
      throw new Error(helper.t('translation.tip.upload_error'));
    }
    let errorNum = 0;
    let taskState;
    // 等待翻译完成
    while (!taskState?.finished) {
      try {
        await helper.sleep(200);
        const res = await request.request(\`\${apiUrl()}/task-state?taskid=\${task_id}\`, {
          responseType: 'json'
        });
        taskState = res.response;
        setMessage(url, \`\${helper.t(\`translation.status.\${taskState.state}\`) || taskState.state}\`);
      } catch (error) {
        helper.log.error(error);
        if (errorNum > 5) throw new Error(helper.t('translation.tip.check_img_status_failed'));
        errorNum += 1;
      }
    }
    return URL.createObjectURL(await downloadImg(\`\${apiUrl()}/result/\${task_id}\`));
  }
  try {
    const res = await fetch(\`\${apiUrl()}/translate/with-form/image/stream\`, {
      method: 'POST',
      body: createFormData(imgBlob, 'selfhosted')
    });
    if (res.status !== 200 || !res.body) throw new Error(helper.t('translation.status.error'));
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf8');
    let buffer = new Uint8Array();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) break;
      buffer = Uint8Array.from([...buffer, ...value]);
      while (buffer.length >= 5) {
        const dataSize = new DataView(buffer.buffer).getUint32(1, false);
        const totalSize = 5 + dataSize;
        if (buffer.length < totalSize) break;
        const data = buffer.slice(5, totalSize);
        switch (buffer[0]) {
          case 0:
            return URL.createObjectURL(new Blob([data], {
              type: 'image/png'
            }));
          case 1:
            setMessage(url, helper.t(\`translation.status.\${decoder.decode(data)}\`));
            break;
          case 2:
            throw new Error(\`\${helper.t('translation.status.error')}: \${decoder.decode(data)}\`);
          case 3:
            {
              const pos = decoder.decode(data);
              if (pos !== '0') {
                setMessage(url, helper.t('translation.tip.pending', {
                  pos
                }));
                break;
              }
              // falls through
            }
          case 4:
            setMessage(url, helper.t('translation.status.pending'));
            break;
        }
        buffer = buffer.slice(totalSize);
      }
    }
    throw new Error(helper.t('translation.status.error'));
  } catch (error) {
    // 如果因为 cors 无法使用 fetch，就只能使用拿不到翻译状态的非流式接口了
    if (error.message.includes('Failed to fetch')) {
      setMessage(url, helper.t('translation.tip.translating'));
      // 在拷贝漫画上莫名有概率报错
      // 虽然猜测可能是 cors connect-src 导致的，但在类似的 fantia 上却也无法复现
      // 也找不到第二个同样问题的网站，考虑到应该没人会在拷贝上翻译，就暂且不管了
      const res = await request.request(\`\${apiUrl()}/translate/with-form/image\`, {
        method: 'POST',
        responseType: 'blob',
        fetch: false,
        timeout: 1000 * 60 * 10,
        data: createFormData(imgBlob, 'selfhosted'),
        errorText: helper.t('translation.tip.upload_error')
      });
      return URL.createObjectURL(res.response);
    }
    throw error;
  }
};
const [selfhostedOptions, setSelfOptions] = helper.createEqualsSignal([]);

/** 更新部署服务的可用翻译 */
const updateSelfhostedOptions = async (noTip = false) => {
  if (store.option.translation.server !== 'selfhosted') return;
  try {
    const res = await request.request(\`\${apiUrl()}\`, {
      noTip,
      errorText: helper.t('alert.server_connect_failed')
    });
    const translatorsText = /(?<=validTranslators: ).+?(?=,\\n)/.exec(res.responseText)?.[0];
    if (!translatorsText) return undefined;
    const list = JSON.parse(translatorsText.replaceAll(\`'\`, \`"\`));
    setSelfOptions(createOptions(list));
  } catch (error) {
    helper.log.error(helper.t('translation.tip.get_translator_list_error'), error);
    setSelfOptions([]);
  }

  // 如果更新后原先选择的翻译服务失效了，就换成第一个翻译
  if (!selfhostedOptions().some(([val]) => val === store.option.translation.options.translator)) {
    setOption(draftOption => {
      draftOption.translation.options.translator = selfhostedOptions()[0]?.[0];
    });
  }
};

// 在切换翻译服务器的同时切换可用翻译的选项列表
helper.createEffectOn([() => store.option.translation.server, () => store.option.translation.localUrl, helper.lang], () => store.imgList.length > 0 && updateSelfhostedOptions(true), {
  defer: true
});

const handleMessage = (msg, url) => {
  switch (msg.type) {
    case 'result':
      return msg.result.translation_mask;
    case 'pending':
      setMessage(url, helper.t('translation.tip.pending', {
        pos: msg.pos
      }));
      break;
    case 'status':
      setMessage(url, helper.t(\`translation.status.\${msg.status}\`) || msg.status);
      break;
    case 'error':
      throw new Error(\`\${helper.t('translation.status.error')}：id \${msg.error_id}\`);
    case 'not_found':
      throw new Error(\`\${helper.t('translation.status.error')}：Not Found\`);
  }
};
const waitTranslationPolling = async (id, url) => {
  let result;
  while (result === undefined) {
    const res = await request.request(\`https://api.cotrans.touhou.ai/task/\${id}/status/v1\`, {
      responseType: 'json'
    });
    result = handleMessage(res.response, url);
    await helper.sleep(1000);
  }
  return result;
};

/** 等待翻译完成 */
const waitTranslation = (id, url) => {
  const ws = new WebSocket(\`wss://api.cotrans.touhou.ai/task/\${id}/event/v1\`);

  // 如果网站设置了 CSP connect-src 就只能轮询了
  if (ws.readyState > 1) return waitTranslationPolling(id, url);
  return new Promise((resolve, reject) => {
    ws.onmessage = e => {
      try {
        const result = handleMessage(JSON.parse(e.data), url);
        if (result) resolve(result);
      } catch (error) {
        reject(error);
      }
    };
  });
};

/** 将翻译后的内容覆盖到原图上 */
const mergeImage = async (rawImage, maskUri) => {
  const img = await helper.waitImgLoad(URL.createObjectURL(rawImage));
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.drawImage(img, 0, 0);
  const img2 = new Image();
  img2.src = URL.createObjectURL(await downloadImg(maskUri));
  await helper.waitImgLoad(img2);
  canvasCtx.drawImage(img2, 0, 0);
  return URL.createObjectURL(await helper.canvasToBlob(canvas));
};

/** 缩小过大的图片 */
const resize = async (blob, w, h) => {
  if (w <= 4096 && h <= 4096) return blob;
  const scale = Math.min(4096 / w, 4096 / h);
  const width = Math.floor(w * scale);
  const height = Math.floor(h * scale);
  const img = await helper.waitImgLoad(URL.createObjectURL(blob));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);
  return helper.canvasToBlob(canvas);
};

/** 使用 cotrans 翻译指定图片 */
const cotransTranslation = async url => {
  const img = store.imgMap[url];
  setMessage(url, helper.t('translation.tip.img_downloading'));
  let imgBlob;
  try {
    imgBlob = await downloadImg(img.src);
  } catch (error) {
    helper.log.error(error);
    store.prop.onImgError?.(url);
    throw new Error(helper.t('translation.tip.download_img_failed'));
  }
  try {
    imgBlob = await resize(imgBlob, img.width, img.height);
  } catch (error) {
    helper.log.error(error);
    throw new Error(helper.t('translation.tip.resize_img_failed'));
  }
  setMessage(url, helper.t('translation.tip.upload'));
  let res;
  try {
    res = await request.request('https://api.cotrans.touhou.ai/task/upload/v1', {
      method: 'POST',
      data: createFormData(imgBlob, 'cotrans'),
      headers: {
        Origin: 'https://cotrans.touhou.ai',
        Referer: 'https://cotrans.touhou.ai/'
      }
    });
  } catch (error) {
    helper.log.error(error);
    throw new Error(helper.t('translation.tip.upload_error'));
  }
  let resData;
  try {
    resData = JSON.parse(res.responseText);
    helper.log(resData);
  } catch {
    throw new Error(\`\${helper.t('translation.tip.upload_return_error')}：\${res.responseText}\`);
  }
  if ('error_id' in resData) throw new Error(\`\${helper.t('translation.tip.upload_return_error')}：\${resData.error_id}\`);
  if (!resData.id) throw new Error(helper.t('translation.tip.id_not_returned'));
  const translation_mask = resData.result?.translation_mask || (await waitTranslation(resData.id, url));
  return mergeImage(imgBlob, translation_mask);
};
const cotransTranslators = ['google', 'youdao', 'baidu', 'deepl', 'gpt3.5', 'offline', 'none'];

/** 翻译指定图片 */
const translationImage = async url => {
  try {
    if (typeof GM_xmlhttpRequest === 'undefined') {
      toast?.error(helper.t('pwa.alert.userscript_not_installed'));
      throw new Error(helper.t('pwa.alert.userscript_not_installed'));
    }
    if (!url) return;
    const img = store.imgMap[url];
    if (img.translationType !== 'wait') return;
    if (img.translationUrl) return _setState('imgMap', url, 'translationType', 'show');
    if (img.loadType !== 'loaded') return setMessage(url, helper.t('translation.tip.img_not_fully_loaded'));
    const translationUrl = await (store.option.translation.server === 'cotrans' ? cotransTranslation : selfhostedTranslation)(url);
    _setState('imgMap', url, {
      translationUrl,
      translationMessage: helper.t('translation.tip.translation_completed'),
      translationType: 'show'
    });
  } catch (error) {
    _setState('imgMap', url, 'translationType', 'error');
    if (error?.message) _setState('imgMap', url, 'translationMessage', error.message);
  }
};

/** 逐个翻译状态为等待翻译的图片 */
const translationAll = helper.singleThreaded(async state => {
  const targetImg = imgList().find(img => img.translationType === 'wait' && img.loadType === 'loaded');
  if (!targetImg) return;
  await translationImage(targetImg.src);
  state.continueRun();
});

/** 开启或关闭指定图片的翻译 */
const setImgTranslationEnbale = (list, enbale) => {
  if (store.option.translation.server === 'disable' && enbale) return;
  setState(state => {
    for (const i of list) {
      const img = state.imgMap[state.imgList[i]];
      if (!img) continue;
      const url = img.src;
      if (enbale) {
        if (state.option.translation.forceRetry) {
          img.translationType = 'wait';
          img.translationUrl = undefined;
          setMessage(url, helper.t('translation.tip.wait_translation'));
        } else {
          switch (img.translationType) {
            case 'hide':
              {
                img.translationType = 'show';
                break;
              }
            case 'error':
            case undefined:
              {
                img.translationType = 'wait';
                setMessage(url, helper.t('translation.tip.wait_translation'));
                break;
              }
          }
        }
      } else {
        switch (img.translationType) {
          case 'show':
            {
              img.translationType = 'hide';
              break;
            }
          case 'error':
          case 'wait':
            {
              img.translationType = undefined;
              break;
            }
        }
      }
    }
  });
  return translationAll();
};
const translatorOptions = helper.createRootMemo(() => store.option.translation.server === 'selfhosted' ? selfhostedOptions() : createOptions(cotransTranslators));

/** 当前显示的图片是否正在翻译 */
const isTranslatingImage = helper.createRootMemo(() => activePage().some(i => {
  const img = getImg(i);
  return img?.translationType && img.translationType !== 'hide';
}));

/** 翻译当前页 */
const translateCurrent = () => setImgTranslationEnbale(activePage(), !isTranslatingImage());
const createTranslateRange = imgs => {
  const isTranslating = helper.createRootMemo(() => {
    for (const i of imgs()) if (imgList()[i]?.translationType === undefined) return false;
    return true;
  });
  const translateRange = () => {
    if (store.option.translation.server !== 'selfhosted') return;
    setImgTranslationEnbale(imgs(), !isTranslating());
  };
  return [isTranslating, translateRange];
};

// 翻译全部图片
const [isTranslatingAll, translateAll] = createTranslateRange(helper.createRootMemo(() => helper.range(store.imgList.length - 1)));

// 翻译当前页以后的全部图片
const [isTranslatingToEnd, translateToEnd] = createTranslateRange(helper.createRootMemo(() => helper.range(activeImgIndex(), store.imgList.length - 1)));

// 特意使用 requestAnimationFrame 和 .click() 是为了能和 Vimium 兼容
// （虽然因为使用了 shadow dom 的缘故实际还是不能兼容，但说不定之后就改了呢
const focus = () => requestAnimationFrame(() => {
  refs.mangaBox?.click();
  refs.mangaBox?.focus();
});
const handleMouseDown = e => {
  if (e.button !== 1 || store.option.scrollMode.enabled) return;
  e.stopPropagation();
  e.preventDefault();
  switchFillEffect();
};

/** 卷轴模式下的页面滚动 */
const scrollModeScrollPage = dir => {
  if (!store.show.endPage) {
    scrollTo(scrollTop() + store.rootSize.height * 0.8 * (dir === 'next' ? 1 : -1));
    _setState('scrollLock', true);
  }
  closeScrollLock();
};

/** 根据是否开启了 左右翻页键交换 来切换翻页方向 */
const handleSwapPageTurnKey = nextPage => {
  const next = store.option.swapPageTurnKey ? !nextPage : nextPage;
  return next ? 'next' : 'prev';
};
const handleKeyDown = e => {
  switch (e.target.tagName) {
    case 'INPUT':
    case 'TEXTAREA':
      return;
  }
  if (e.target.className === modules_c21c94f2$1.hotkeysItem) return;
  const code = helper.getKeyboardCode(e);

  // esc 在触发配置操作前，先用于退出一些界面
  if (e.key === 'Escape') {
    if (store.gridMode) {
      e.stopPropagation();
      e.preventDefault();
      return _setState('gridMode', false);
    }
    if (store.show.endPage) {
      e.stopPropagation();
      e.preventDefault();
      return _setState('show', 'endPage', undefined);
    }
  }

  // 处理标注了 data-only-number 的元素
  if (e.target.dataset.onlyNumber !== undefined) {
    // 拦截能输入数字外的按键
    if (/^(Shift \\+ )?[a-zA-Z]$/.test(code)) {
      e.stopPropagation();
      e.preventDefault();
    }
    return;
  }

  // 卷轴、网格模式下跳过用于移动的按键
  if ((isScrollMode() || store.gridMode) && !store.show.endPage) {
    switch (e.key) {
      case 'Home':
      case 'End':
      case 'ArrowRight':
      case 'ArrowLeft':
        e.stopPropagation();
        return;
      case 'ArrowUp':
      case 'PageUp':
        e.stopPropagation();
        return store.gridMode || turnPage('prev');
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.stopPropagation();
        return store.gridMode || turnPage('next');
    }
  }

  // 拦截已注册的快捷键
  if (Reflect.has(hotkeysMap(), code)) {
    e.stopPropagation();
    e.preventDefault();
  } else return;

  // 并排卷轴模式下的快捷键
  if (isAbreastMode()) {
    switch (hotkeysMap()[code]) {
      case 'scroll_up':
        setAbreastScrollFill(abreastScrollFill() - store.rootSize.height * 0.02);
        return;
      case 'scroll_down':
        setAbreastScrollFill(abreastScrollFill() + store.rootSize.height * 0.02);
        return;
      case 'scroll_left':
        return scrollTo(scrollProgress() + abreastColumnWidth());
      case 'scroll_right':
        return scrollTo(scrollProgress() - abreastColumnWidth());
      case 'page_up':
        return scrollTo(scrollProgress() - store.rootSize.width * 0.8);
      case 'page_down':
        return scrollTo(scrollProgress() + store.rootSize.width * 0.8);
      case 'jump_to_home':
        return scrollTo(0);
      case 'jump_to_end':
        return scrollTo(scrollLength());
    }
  }
  switch (hotkeysMap()[code]) {
    case 'page_up':
    case 'scroll_up':
      {
        if (isScrollMode()) scrollModeScrollPage('prev');
        return turnPage('prev');
      }
    case 'page_down':
    case 'scroll_down':
      {
        if (isScrollMode()) scrollModeScrollPage('next');
        return turnPage('next');
      }
    case 'scroll_left':
      return turnPage(handleSwapPageTurnKey(store.option.dir === 'rtl'));
    case 'scroll_right':
      return turnPage(handleSwapPageTurnKey(store.option.dir !== 'rtl'));
    case 'jump_to_home':
      return _setState('activePageIndex', 0);
    case 'jump_to_end':
      return _setState('activePageIndex', Math.max(0, store.pageList.length - 1));
    case 'switch_page_fill':
      return switchFillEffect();
    case 'switch_scroll_mode':
      return switchScrollMode();
    case 'switch_single_double_page_mode':
      return switchOnePageMode();
    case 'switch_dir':
      return switchDir();
    case 'switch_grid_mode':
      return switchGridMode();
    case 'translate_current_page':
      return translateCurrent();
    case 'translate_all':
      return translateAll();
    case 'translate_to_end':
      return translateToEnd();
    case 'switch_auto_enlarge':
      return setOption(draftOption => {
        draftOption.disableZoom = !draftOption.disableZoom;
      });
    case 'exit':
      return store.prop.onExit?.();

    // 阅读模式以外的快捷键转发到网页上去处理
    default:
      document.body.dispatchEvent(new KeyboardEvent('keydown', e));
      document.body.dispatchEvent(new KeyboardEvent('keyup', e));
  }
};

/** 判断两个数值是否是整数倍的关系 */
const isMultipleOf = (a, b) => {
  const decimal = \`\${a < b ? b / a : a / b}\`.split('.')?.[1];
  return !decimal || decimal.startsWith('0000') || decimal.startsWith('9999');
};
let lastDeltaY = -1;
let timeoutId = 0;
let lastPageNum = -1;
let wheelType;
let equalNum = 0;
let diffNum = 0;
const handleWheel = e => {
  if (store.gridMode) return;
  e.stopPropagation();
  if (e.ctrlKey || e.altKey) e.preventDefault();
  const isWheelDown = e.deltaY > 0;
  if (store.show.endPage) return turnPage(isWheelDown ? 'next' : 'prev');

  // 卷轴模式下的图片缩放
  if ((e.ctrlKey || e.altKey) && store.option.scrollMode.enabled && store.option.zoom.ratio === 100) {
    e.preventDefault();
    if (store.option.scrollMode.fitToWidth) return;
    return zoomScrollModeImg(isWheelDown ? -0.05 : 0.05);
  }
  if (e.ctrlKey || e.altKey) {
    e.preventDefault();
    return zoom(store.option.zoom.ratio + (isWheelDown ? -25 : 25), e);
  }
  const nowDeltaY = Math.abs(e.deltaY);

  // 并排卷轴模式下
  if (isAbreastMode() && store.option.zoom.ratio === 100) {
    e.preventDefault();
    // 先触发翻页判断再滚动，防止在滚动到底时立刻触发结束页
    turnPage(isWheelDown ? 'next' : 'prev');
    scrollTo(scrollTop() + e.deltaY);
  }

  // 防止滚动到网页
  if (!isScrollMode()) e.preventDefault();

  // 通过\`两次滚动距离是否成倍数\`和\`滚动距离是否过小\`来判断是否是触摸板
  if (wheelType !== 'trackpad' && (nowDeltaY < 2 || !Number.isInteger(lastDeltaY) && !Number.isInteger(nowDeltaY) && !isMultipleOf(lastDeltaY, nowDeltaY))) {
    wheelType = 'trackpad';
    if (timeoutId) clearTimeout(timeoutId);
    // 如果是触摸板滚动，且上次成功触发了翻页，就重新翻页回去
    if (lastPageNum !== -1) _setState('activePageIndex', lastPageNum);
  }

  // 为了避免因临时卡顿而误判为触摸板
  // 在连续几次滚动量均相同的情况下，将 wheelType 相关变量重置回初始状态
  if (diffNum < 10) {
    if (lastDeltaY === nowDeltaY && nowDeltaY > 5) equalNum += 1;else {
      diffNum += 1;
      equalNum = 0;
    }
    if (equalNum >= 3) {
      wheelType = undefined;
      lastPageNum = -1;
    }
  }
  lastDeltaY = nowDeltaY;
  switch (wheelType) {
    case undefined:
      {
        if (lastPageNum === -1) {
          // 第一次触发滚动没法判断类型，就当作滚轮来处理
          // 但为了避免触摸板前两次滚动事件间隔大于帧生成时间导致得重新翻页回去的闪烁，加个延迟等待下
          lastPageNum = store.activePageIndex;
          timeoutId = window.setTimeout(() => turnPage(isWheelDown ? 'next' : 'prev'), 16);
          return;
        }
        wheelType = 'mouse';
      }
    // falls through

    case 'mouse':
      return turnPage(isWheelDown ? 'next' : 'prev');
    case 'trackpad':
      return handleTrackpadWheel(e);
  }
};

/** 滚动条元素的长度 */
const scrollDomLength = helper.createRootMemo(() => Math.max(store.scrollbarSize.width, store.scrollbarSize.height));

/** 滚动条滑块的中心点高度 */
const sliderMidpoint = helper.createRootMemo(() => scrollDomLength() * (scrollPercentage() + sliderHeight() / 2));

/** 滚动条滑块的位置 */
const sliderTop = helper.createRootMemo(() => \`\${scrollPercentage() * scrollDomLength()}px\`);

/** 滚动条位置 */
const scrollPosition = helper.createRootMemo(() => {
  if (store.option.scrollbar.position === 'auto') {
    if (store.isMobile) return 'top';
    if (isAbreastMode()) return 'bottom';
    // 大部分图片都是宽图时，将滚动条移至底部
    return store.defaultImgType === 'long' ? 'bottom' : 'right';
  }
  return store.option.scrollbar.position;
});

/** 判断点击位置在滚动条上的位置比率 */
const getClickTop = (x, y, e) => {
  switch (scrollPosition()) {
    case 'bottom':
    case 'top':
      return store.option.dir === 'rtl' ? 1 - x / e.offsetWidth : x / e.offsetWidth;
    default:
      return y / e.offsetHeight;
  }
};

/** 计算在滚动条上的拖动距离 */
const getSliderDist = ([x, y], [ix, iy], e) => {
  switch (scrollPosition()) {
    case 'bottom':
    case 'top':
      return store.option.dir === 'rtl' ? (1 - (x - ix)) / e.offsetWidth : (x - ix) / e.offsetWidth;
    default:
      return (y - iy) / e.offsetHeight;
  }
};
const [isDrag, setIsDrag] = solidJs.createSignal(false);
const closeDrag = helper.debounce(() => setIsDrag(false), 200);
let lastType = 'up';

/** 开始拖拽时的 sliderTop 值 */
let startTop = 0;
const handleScrollbarSlider = ({
  type,
  xy,
  initial
}, e) => {
  const [x, y] = xy;

  // 检测是否是拖动操作
  if (type === 'move' && lastType === type) {
    setIsDrag(true);
    closeDrag();
  }
  lastType = type;

  // 跳过拖拽结束事件（单击时会同时触发开始和结束，就用开始事件来完成单击的效果
  if (type === 'up') return saveReadProgress();
  if (!refs.mangaFlow) return;
  const scrollbarDom = e.target;

  /** 点击位置在滚动条上的位置比率 */
  const clickTop = getClickTop(x, y, e.target);
  if (store.option.scrollMode.enabled) {
    if (type === 'move') {
      const top = helper.clamp(0, startTop + getSliderDist(xy, initial, scrollbarDom), 1) * scrollLength();
      scrollTo(top);
    } else {
      // 确保滚动条的中心会在点击位置
      startTop = clickTop - sliderHeight() / 2;
      const top = startTop * scrollLength();
      scrollTo(top, true);
    }
  } else {
    let newPageIndex = Math.floor(clickTop * store.pageList.length);
    // 处理超出范围的情况
    if (newPageIndex < 0) newPageIndex = 0;else if (newPageIndex >= store.pageList.length) newPageIndex = store.pageList.length - 1;
    if (newPageIndex !== store.activePageIndex) _setState('activePageIndex', newPageIndex);
  }
};

/** 摩擦系数 */
const FRICTION_COEFF = 0.96;
let lastTop = 0;
let dy = 0;
let lastLeft = 0;
let dx = 0;
let animationId = null;
let lastTime = 0;

/** 逐帧计算速率 */
const calcVelocity = () => {
  const nowTop = store.option.scrollMode.abreastMode ? abreastScrollFill() : scrollTop();
  dy = nowTop - lastTop;
  lastTop = nowTop;
  dx = store.page.offset.x.px - lastLeft;
  lastLeft = store.page.offset.x.px;
  animationId = requestAnimationFrame(calcVelocity);
};

/** 逐帧计算惯性滑动 */
const handleSlide = timestamp => {
  // 当速率足够小时停止计算动画
  if (Math.abs(dx) + Math.abs(dy) < 1) {
    animationId = null;
    return;
  }

  // 确保每16毫秒才减少一次速率，防止在高刷新率显示器上衰减过快
  if (timestamp - lastTime > 16) {
    dy *= FRICTION_COEFF;
    dx *= FRICTION_COEFF;
    lastTime = timestamp;
  }
  if (store.option.scrollMode.abreastMode) {
    scrollTo(scrollTop() + dx);
    setAbreastScrollFill(abreastScrollFill() + dy);
  } else scrollTo(scrollTop() + dy);
  animationId = requestAnimationFrame(handleSlide);
};
let initTop = 0;
let initLeft = 0;
let initAbreastScrollFill = 0;
const handleScrollModeDrag = ({
  type,
  xy: [x, y],
  initial: [ix, iy]
}) => {
  switch (type) {
    case 'down':
      {
        if (animationId) cancelAnimationFrame(animationId);
        initTop = refs.mangaBox.scrollTop;
        initLeft = store.page.offset.x.px * (store.option.dir === 'rtl' ? 1 : -1);
        initAbreastScrollFill = abreastScrollFill();
        requestAnimationFrame(calcVelocity);
        return;
      }
    case 'move':
      {
        if (store.option.scrollMode.abreastMode) {
          const _dx = x - ix;
          const _dy = y - iy;
          scrollTo((initLeft + _dx) * (store.option.dir === 'rtl' ? 1 : -1));
          setAbreastScrollFill(initAbreastScrollFill + _dy);
        } else scrollTo(initTop + iy - y);
        return;
      }
    case 'up':
      {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(handleSlide);
        saveReadProgress();
      }
  }
};

const getImageData = img => {
  const {
    naturalWidth: width,
    naturalHeight: height
  } = img;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true
  });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, width, height);
};
const handleImgRecognition = (img, url) => {
  const {
    data,
    width,
    height
  } = getImageData(img);
  return worker.handleImg(Comlink.transfer(data, [data.buffer]), width, height, url, store$1.unwrap(store.option.imgRecognition));
};
const mainFn = {
  log: helper.log,
  updatePageData: helper.throttle(() => setState(updatePageData), 1000),
  setImg: (url, key, val) => Reflect.has(store.imgMap, url) && _setState('imgMap', url, key, val)
};
worker.setMainFn(Comlink.proxy(mainFn), Object.keys(mainFn));

/** 图片上次加载出错的时间 */
const imgErrorTime = new Map();

/** 图片加载完毕的回调 */
const handleImgLoaded = (url, e) => {
  // 内联图片元素被创建后立刻就会触发 load 事件，如果在调用这个函数前 url 发生改变
  // 就会导致这里获得的是上个 url 图片的尺寸
  if (e && !e.isConnected) return;
  imgErrorTime.delete(url);
  const img = store.imgMap[url];
  if (img.translationType === 'show') return;
  if (img.loadType !== 'loaded') {
    _setState('imgMap', url, 'loadType', 'loaded');
    updateImgLoadType();
    store.prop.onLoading?.(imgList(), store.imgMap[url]);
  }
  if (!e) return;
  updateImgSize(url, e.naturalWidth, e.naturalHeight);
  if (store.option.imgRecognition.enabled && e.src === img.blobUrl) setTimeout(handleImgRecognition, 0, e, url);
  translationAll();
};

/** 图片加载出错的回调 */
const handleImgError = (url, e) => {
  if (e && !e.isConnected) return;
  const isRetry = !imgErrorTime.has(url);
  imgErrorTime.set(url, Date.now());
  setState(state => {
    const img = state.imgMap[url];
    if (!img) return;
    const imgIndexs = getImgIndexs(url);
    helper.log.error(imgIndexs, helper.t('alert.img_load_failed'), e);
    img.loadType = 'error';
    img.type = undefined;
    if (imgIndexs.some(i => renderImgList().has(i)) && isRetry) img.loadType = 'wait';
  });
  store.prop.onLoading?.(imgList(), store.imgMap[url]);
  store.prop.onImgError?.(url);
  updateImgLoadType();
};

/** 需要加载的图片 */
const needLoadImgList = helper.createRootMemo(() => {
  const list = new Set();
  for (const [index, img] of imgList().entries()) if (img.loadType !== 'loaded' && img.src) list.add(index);
  return list;
});

/** 当前需要加载的图片 */
const loadImgList = new Set();

/** 加载指定图片。返回是否已加载完成 */
const loadImg = index => {
  if (index === -1 || !needLoadImgList().has(index)) return true;
  const img = getImg(index);
  if (img.loadType === 'error') return true;
  loadImgList.add(index);
  return false;
};

/** 获取指定页数下的头/尾图片 */
const getPageImg = (pageNum, imgType) => {
  const page = store.pageList[pageNum].filter(i => i !== -1);
  if (page.length === 1) return page[0];
  return imgType === 'start' ? Math.min(...page) : Math.max(...page);
};

/**
 * 以当前显示页为基准，预加载附近指定页数的图片，并取消其他预加载的图片
 * @param target 加载目标页
 * @param loadNum 加载图片数量
 * @returns 返回指定范围内是否还有未加载的图片
 */
const loadRangeImg = (target = 0, loadNum = 2) => {
  let start = getPageImg(store.showRange[0], 'start');
  let end = getPageImg(store.showRange[1], 'end');
  if (target !== 0) {
    if (target < 0) {
      end = start + target;
      start -= 1;
    } else {
      start = end + 1;
      end += target;
    }
    start = helper.clamp(0, start, store.imgList.length - 1);
    end = helper.clamp(0, end, store.imgList.length - 1);
  }

  /** 是否还有未加载的图片 */
  let hasUnloadedImg = false;
  let index = start;
  const condition = start <= end ? () => index <= end : () => index >= end;
  const step = start <= end ? 1 : -1;
  while (condition()) {
    if (!loadImg(index)) hasUnloadedImg = true;
    if (loadImgList.size >= loadNum) return index !== end || hasUnloadedImg;
    index += step;
  }
  return hasUnloadedImg;
};

/** 加载期间尽快获取图片尺寸 */
const checkImgSize = url => {
  const imgDom = getImgEle(url);
  if (!imgDom) return;
  const timeoutId = setInterval(() => {
    if (!imgDom?.isConnected || store.option.imgRecognition.enabled) return clearInterval(timeoutId);
    const img = store.imgMap[url];
    if (!img || img.loadType !== 'loading') return clearInterval(timeoutId);
    if (imgDom.naturalWidth && imgDom.naturalHeight) {
      updateImgSize(url, imgDom.naturalWidth, imgDom.naturalHeight);
      return clearInterval(timeoutId);
    }
  }, 200);
};
const updateImgLoadType = helper.singleThreaded(() => {
  if (store.showRange[0] < 0 || needLoadImgList().size === 0) return;
  loadImgList.clear();
  if (store.imgList.length > 0) {
    // 优先加载当前显示的图片
    loadRangeImg() ||
    // 再加载后面几页
    loadRangeImg(preloadNum().back) ||
    // 再加载前面几页
    loadRangeImg(-preloadNum().front) ||
    // 根据设置决定是否要继续加载其余图片
    !store.option.alwaysLoadAllImg ||
    // 加载当前页后面的图片
    loadRangeImg(Number.POSITIVE_INFINITY, 5) ||
    // 加载当前页前面的图片
    loadRangeImg(Number.NEGATIVE_INFINITY, 5);
  }
  setState(state => {
    for (const index of needLoadImgList()) {
      const img = getImg(index, state);
      if (loadImgList.has(index)) {
        if (img.loadType !== 'loading') {
          img.loadType = 'loading';
          if (!store.option.imgRecognition.enabled && img.width === undefined) setTimeout(checkImgSize, 0, img.src);
        }
      } else if (img.loadType === 'loading') img.loadType = 'wait';
    }
  });
});
helper.createEffectOn([preloadNum, helper.createRootMemo(() => [...renderImgList()].map(i => store.imgList[i])), () => store.option.alwaysLoadAllImg], updateImgLoadType);
helper.createEffectOn(showImgList, helper.debounce(_showImgList => {
  // 如果当前显示页面有出错的图片，就重新加载一次
  if (imgErrorTime.size === 0) return;
  for (const img of [..._showImgList].map(i => getImg(i))) {
    if (img?.loadType !== 'error') continue;
    _setState('imgMap', img.src, 'loadType', 'wait');
    updateImgLoadType();
  }
}, 500), {
  defer: true
});

/** 隔一段时间重新加载出错的图片 */
const retryErrorImg = () => {
  if (imgErrorTime.size > 0) {
    const retryTime = Date.now() - 1000 * 60 * 3;
    for (const [url, time] of imgErrorTime.entries()) {
      if (time > retryTime) continue;
      _setState('imgMap', url, 'loadType', 'wait');
      updateImgLoadType();
    }
  }
  // 重新加载间隔一定时间，避免因为短时间频繁加载而失败
  setTimeout(retryErrorImg, 1000 * 5);
};
retryErrorImg();

/** 加载中的图片 */
const loadingImgList = helper.createRootMemo(() => {
  const list = new Set();
  for (const [url, img] of Object.entries(store.imgMap)) if (img.loadType === 'loading') list.add(url);
  return list;
});
const abortMap = new Map();
const timeoutAbort = url => {
  if (!abortMap.has(url)) return;
  abortMap.get(url).abort();
  abortMap.delete(url);
  handleImgError(url);
};
helper.createEffectOn(loadingImgList, async (downImgList, prevImgList) => {
  if (!store.option.imgRecognition.enabled) return;
  if (prevImgList) {
    // 中断取消下载的图片
    for (const url of prevImgList) {
      if (downImgList.has(url) || !abortMap.has(url)) continue;
      abortMap.get(url)?.abort();
      abortMap.delete(url);
      helper.log(\`中断下载 \${url}\`);
    }
  }
  for (const url of downImgList.values()) {
    if (abortMap.has(url) || store.imgMap[url].blobUrl) continue;
    const controller = new AbortController();
    const handleTimeout = helper.debounce(() => timeoutAbort(url), 1000 * 3);
    controller.signal.addEventListener('abort', handleTimeout.clear);
    abortMap.set(url, controller);
    handleTimeout();
    request.request(url, {
      responseType: 'blob',
      retryFetch: true,
      signal: controller.signal,
      timeout: undefined,
      noTip: true,
      onerror: () => handleImgError(url),
      onprogress({
        loaded,
        total
      }) {
        _setState('imgMap', url, 'progress', loaded / total * 100);
        // 一段时间内都没进度后超时中断
        handleTimeout();
      },
      onload({
        response
      }) {
        abortMap.delete(url);
        _setState('imgMap', url, {
          blobUrl: URL.createObjectURL(response),
          progress: undefined
        });
        handleImgLoaded(url);
      }
    });
  }
});

const EmptyTip = () => {
  let ref;
  helper.onAutoMount(() => {
    let timeoutId = 0;
    const observer = new IntersectionObserver(([{
      isIntersecting
    }]) => {
      if (!isIntersecting) return;
      timeoutId = window.setTimeout(() => {
        ref?.style.removeProperty('opacity');
        timeoutId = 0;
      }, 2000);
    }, {
      threshold: 1
    });
    observer.observe(ref);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
  return (() => {
    var _el$ = web.template(\`<h1>\`)();
    var _ref$ = ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$) : ref = _el$;
    _el$.style.setProperty("opacity", "0");
    _el$.textContent = "NULL";
    return _el$;
  })();
};

const ComicImg = img => {
  const showState = () => imgShowState().get(img.index);
  const src = () => {
    if (img.loadType === 'wait') return '';
    if (img.translationType === 'show') return img.translationUrl;
    if (store.option.imgRecognition.enabled) return img.blobUrl;
    // 有些浏览器不支持显示带有 hash 标识的图片 url
    if (img.src.startsWith('blob:')) return img.src.replace(/#\\..+/, '');
    return img.src;
  };

  /** 并排卷轴模式下需要复制的图片数量 */
  const cloneNum = solidJs.createMemo(() => {
    if (!isAbreastMode()) return 0;
    const imgPosition = abreastArea().position[img.index];
    return imgPosition ? imgPosition.length - 1 : 0;
  });

  /** 是否要渲染复制图片 */
  const renderClone = () => !store.gridMode && showState() !== undefined && cloneNum() > 0;
  const selector = \`.\${modules_c21c94f2$1.img}[id^="_\${img.index}_"]\`;
  useStyleMemo(selector, {
    'grid-area': () => isAbreastMode() && !store.gridMode ? 'none' : \`_\${img.index}\`,
    'background-color': () => isEnableBg() ? img.background : undefined
  });
  useStyleMemo(\`\${selector} > picture\`, {
    'aspect-ratio': () => \`\${img.size.width} / \${img.size.height}\`,
    background: () => img.progress && \`linear-gradient(
          to bottom,
          var(--secondary-bg) \${img.progress}%,
          var(--hover-bg-color,#fff3) \${img.progress}%
        )\`
  });
  const _ComicImg = props => (() => {
    var _el$ = web.template(\`<div><picture>\`)(),
      _el$2 = _el$.firstChild;
    web.insert(_el$2, web.createComponent(solidJs.Show, {
      get when() {
        return web.memo(() => img.loadType !== 'wait')() && src();
      },
      get children() {
        var _el$3 = web.template(\`<img draggable=false decoding=sync>\`)();
        _el$3.addEventListener("error", e => handleImgError(img.src, e.currentTarget));
        _el$3.addEventListener("load", e => handleImgLoaded(img.src, e.currentTarget));
        web.effect(_p$ => {
          var _v$ = src(),
            _v$2 = \`\${img.index}\`,
            _v$3 = img.src;
          _v$ !== _p$.e && web.setAttribute(_el$3, "src", _p$.e = _v$);
          _v$2 !== _p$.t && web.setAttribute(_el$3, "alt", _p$.t = _v$2);
          _v$3 !== _p$.a && web.setAttribute(_el$3, "data-src", _p$.a = _v$3);
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined
        });
        return _el$3;
      }
    }));
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return store.gridMode;
      },
      get children() {
        var _el$4 = web.template(\`<div>\`)();
        web.insert(_el$4, (() => {
          var _c$ = web.memo(() => !!store.gridMode);
          return () => _c$() ? getImgTip(img.index) : '';
        })());
        web.effect(() => web.className(_el$4, modules_c21c94f2$1.gridModeTip));
        return _el$4;
      }
    }), null);
    web.effect(_p$ => {
      var _v$4 = modules_c21c94f2$1.img,
        _v$5 = \`_\${img.index}_\${props.cloneIndex ?? 0}\`,
        _v$6 = showState(),
        _v$7 = img.type ?? store.defaultImgType,
        _v$8 = img.loadType === 'loaded' ? undefined : img.loadType;
      _v$4 !== _p$.e && web.className(_el$, _p$.e = _v$4);
      _v$5 !== _p$.t && web.setAttribute(_el$, "id", _p$.t = _v$5);
      _v$6 !== _p$.a && web.setAttribute(_el$, "data-show", _p$.a = _v$6);
      _v$7 !== _p$.o && web.setAttribute(_el$, "data-type", _p$.o = _v$7);
      _v$8 !== _p$.i && web.setAttribute(_el$, "data-load-type", _p$.i = _v$8);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
  return [web.createComponent(_ComicImg, {}), web.createComponent(solidJs.Show, {
    get when() {
      return renderClone();
    },
    get children() {
      return web.createComponent(solidJs.For, {
        get each() {
          return Array.from({
            length: cloneNum()
          });
        },
        children: (_, i) => web.createComponent(_ComicImg, {
          get cloneIndex() {
            return i() + 1;
          }
        })
      });
    }
  })];
};

// 目前即使是不显示的图片也必须挂载上，否则解析好的图片会被浏览器垃圾回收掉，
// 导致在 ehentai 上无法正常加载图片。但这样会在图片过多时造成性能问题，
// 虽然也尝试了将解析好的 Image 对象存储起来挂上引用和另外放到一个避免渲染的 dom 下，
// 但也都失败了，只能暂时先不管了。
// 之后尝试新方案时必须经过如下测试：开个几百页的漫画加载完毕后，再打开二十个标签页切换过去，
const ComicImgFlow = () => {
  const {
    hiddenMouse,
    onMouseMove
  } = useHiddenMouse();
  const handleDrag = (state, e) => {
    if (store.gridMode) return;
    if (touches.size > 1) return handlePinchZoom(state);
    if (store.option.zoom.ratio !== 100) return handleZoomDrag(state);
    if (store.option.scrollMode.enabled) return handleScrollModeDrag(state);
    return handleMangaFlowDrag(state);
  };
  solidJs.onMount(() => {
    helper.useDrag({
      ref: refs.mangaBox,
      handleDrag,
      handleClick,
      touches
    });
    bindScrollTop(refs.mangaBox);
  });
  const handleTransitionEnd = () => {
    if (store.isDragMode) return;
    setState(state => {
      if (store.option.zoom.ratio === 100) resetPage(state, false);else state.page.anima = '';
    });
  };

  /** 在当前页之前有图片被加载出来，导致内容高度发生变化后，重新滚动页面，确保当前显示位置不变 */
  helper.createEffectOn([() => store.showRange[0], () => imgTopList()[store.showRange[0]], imgTopList], ([showImg, height, topList], prev) => {
    if (!prev || !height || !isScrollMode()) return;
    const [prevShowImg, prevHeight, prevTopList] = prev;
    if (showImg !== prevShowImg || prevTopList === topList || prevHeight === height) return;
    scrollTo(scrollTop() + height - prevHeight);
    // 目前还是会有轻微偏移，但考虑到大部分情况下都是顺序阅读，本身出现概率就低，就不继续排查优化了
  });
  const pageToText = page => \`\${(page.length === 1 ? [page[0], page[0]] : page).map(i => i === -1 ? '.' : \`_\${i}\`).join(' ')}\`;
  const gridAreas = solidJs.createMemo(() => {
    if (store.pageList.length === 0) return undefined;
    if (store.gridMode) {
      let columnNum;
      if (store.isMobile) columnNum = 2;else if (store.defaultImgType === 'vertical') columnNum = 6;else if (isOnePageMode()) columnNum = 4;else columnNum = 2;
      const areaList = [[]];
      for (const page of store.pageList) {
        if (areaList.at(-1).length === columnNum) areaList.push([]);
        areaList.at(-1).push(pageToText(page));
      }
      while (areaList.at(-1).length !== columnNum) areaList.at(-1).push('. .');
      return areaList.map(line => \`"\${line.join(' ')}"\`).join('\\n') || undefined;
    }
    if (store.option.scrollMode.enabled) {
      if (store.option.scrollMode.abreastMode) return \`"\${helper.createSequence(abreastArea().columns.length).map(i => \`_\${i}\`).join(' ')}"\`;
      if (store.option.scrollMode.doubleMode) return store.pageList.map(page => \`"\${pageToText(page)}"\`).join('\\n');
      return helper.createSequence(store.imgList.length).map(i => \`"_\${i}"\`).join('\\n');
    }
    return store.page.vertical ? store.pageList.slice(store.renderRange[0], store.renderRange[1] + 1).map(page => \`"\${pageToText(page)}"\`).join('\\n') : \`"\${store.pageList.slice(store.renderRange[0], store.renderRange[1] + 1).map(pageToText).join(' ')}"\`;
  });
  useStyleMemo(\`.\${modules_c21c94f2$1.mangaBox}\`, {
    transform: () => \`translate(\${store.option.zoom.offset.x}px, \${store.option.zoom.offset.y}px)
        scale(\${store.option.zoom.ratio / 100})\`
  });
  const pageX = solidJs.createMemo(() => {
    if (store.gridMode || isScrollMode()) return 0;
    let x = store.page.offset.x.pct * store.rootSize.width + store.page.offset.x.px;
    if (store.option.dir !== 'rtl') x = -x;
    return x;
  });
  useStyleMemo(\`#\${modules_c21c94f2$1.mangaFlow}\`, {
    // 不能使用 transform 来移动，不然在 Safari 浏览器上悬浮显示时
    // 每次滚动底下的网页时 mangaFlow 都会闪烁一下，在简易模式下会频繁触发
    left: () => \`\${pageX()}px\`,
    top: () => \`\${store.page.offset.y.pct * store.rootSize.height + store.page.offset.y.px}px\`,
    'touch-action'() {
      if (store.gridMode) return 'auto';
      if (store.option.zoom.ratio !== 100) {
        if (!store.option.scrollMode.enabled) return 'none';
        if (store.option.zoom.offset.y === 0) return 'pan-up';
        if (store.option.zoom.offset.y === bound().y) return 'pan-down';
      }
    },
    'grid-template-areas': gridAreas,
    'grid-template-columns'() {
      if (store.imgList.length === 0 || store.gridMode) return undefined;
      if (store.option.scrollMode.enabled) {
        if (store.option.scrollMode.abreastMode) return \`repeat(\${abreastArea().columns.length}, \${abreastColumnWidth()}px)\`;
        if (store.option.scrollMode.doubleMode) return \`50% 50%\`;
        return undefined;
      }
      if (store.page.vertical) return '50% 50%';
      return \`repeat(\${gridAreas()?.split(' ').length ?? 0}, 50%)\`;
    },
    'grid-template-rows'() {
      if (store.gridMode) return undefined;
      if (isDoubleMode()) return doubleScrollLineHeight().map(num => \`\${num}px\`).join(' ');
      if (isScrollMode()) return imgList().map(({
        size: {
          height
        }
      }) => \`\${height}px\`).join(' ');
    },
    'background-color': () => isEnableBg() ? getImg(activeImgIndex())?.background : undefined
  });
  useStyle(imgAreaStyle);
  return (() => {
    var _el$ = web.template(\`<div tabindex=-1><div tabindex=-1>\`)(),
      _el$2 = _el$.firstChild;
    web.addEventListener(_el$, "scrollend", focus);
    _el$.addEventListener("transitionend", handleTransitionEnd);
    var _ref$ = bindRef('mangaBox');
    typeof _ref$ === "function" && web.use(_ref$, _el$);
    _el$2.addEventListener("transitionend", handleTransitionEnd);
    web.addEventListener(_el$2, "mousemove", onMouseMove);
    var _ref$2 = bindRef('mangaFlow');
    typeof _ref$2 === "function" && web.use(_ref$2, _el$2);
    web.insert(_el$2, web.createComponent(solidJs.Index, {
      get each() {
        return imgList();
      },
      get fallback() {
        return web.createComponent(EmptyTip, {});
      },
      children: (img, i) => web.createComponent(ComicImg, web.mergeProps({
        index: i
      }, img))
    }));
    web.effect(_p$ => {
      var _v$ = \`\${modules_c21c94f2$1.mangaBox} \${modules_c21c94f2$1.beautifyScrollbar}\`,
        _v$2 = store.page.anima,
        _v$3 = helper.boolDataVal(store.option.scrollMode.abreastMode),
        _v$4 = modules_c21c94f2$1.mangaFlow,
        _v$5 = store.option.dir,
        _v$6 = \`\${modules_c21c94f2$1.mangaFlow} \${modules_c21c94f2$1.beautifyScrollbar}\`,
        _v$7 = helper.boolDataVal(store.option.disableZoom && !store.option.scrollMode.enabled),
        _v$8 = helper.boolDataVal(store.option.zoom.ratio !== 100),
        _v$9 = helper.boolDataVal(store.page.vertical),
        _v$10 = !store.gridMode && store.option.autoHiddenMouse && hiddenMouse(),
        _v$11 = helper.boolDataVal(store.option.scrollMode.fitToWidth);
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-animation", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$, "data-abreast-scroll", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$2, "id", _p$.o = _v$4);
      _v$5 !== _p$.i && web.setAttribute(_el$2, "dir", _p$.i = _v$5);
      _v$6 !== _p$.n && web.className(_el$2, _p$.n = _v$6);
      _v$7 !== _p$.s && web.setAttribute(_el$2, "data-disable-zoom", _p$.s = _v$7);
      _v$8 !== _p$.h && web.setAttribute(_el$2, "data-scale-mode", _p$.h = _v$8);
      _v$9 !== _p$.r && web.setAttribute(_el$2, "data-vertical", _p$.r = _v$9);
      _v$10 !== _p$.d && web.setAttribute(_el$2, "data-hidden-mouse", _p$.d = _v$10);
      _v$11 !== _p$.l && web.setAttribute(_el$2, "data-fit-width", _p$.l = _v$11);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined,
      l: undefined
    });
    return _el$;
  })();
};

const MdLooksOne = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-6 14c-.55 0-1-.45-1-1V9h-1c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdLooksTwo = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-4 8c0 1.1-.9 2-2 2h-2v2h3c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1v-3c0-1.1.9-2 2-2h2V9h-3c-.55 0-1-.45-1-1s.45-1 1-1h3c1.1 0 2 .9 2 2z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdViewDay = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M3 21h17c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1M20 8H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M2 4v1c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdQueue = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M3 6c-.55 0-1 .45-1 1v13c0 1.1.9 2 2 2h13c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1-.45-1-1V7c0-.55-.45-1-1-1m17-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-2 9h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3h-3c-.55 0-1-.45-1-1s.45-1 1-1h3V6c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdSettings = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19.5 12c0-.23-.01-.45-.03-.68l1.86-1.41c.4-.3.51-.86.26-1.3l-1.87-3.23a.987.987 0 0 0-1.25-.42l-2.15.91c-.37-.26-.76-.49-1.17-.68l-.29-2.31c-.06-.5-.49-.88-.99-.88h-3.73c-.51 0-.94.38-1 .88l-.29 2.31c-.41.19-.8.42-1.17.68l-2.15-.91c-.46-.2-1-.02-1.25.42L2.41 8.62c-.25.44-.14.99.26 1.3l1.86 1.41a7.3 7.3 0 0 0 0 1.35l-1.86 1.41c-.4.3-.51.86-.26 1.3l1.87 3.23c.25.44.79.62 1.25.42l2.15-.91c.37.26.76.49 1.17.68l.29 2.31c.06.5.49.88.99.88h3.73c.5 0 .93-.38.99-.88l.29-2.31c.41-.19.8-.42 1.17-.68l2.15.91c.46.2 1 .02 1.25-.42l1.87-3.23c.25-.44.14-.99-.26-1.3l-1.86-1.41c.03-.23.04-.45.04-.68m-7.46 3.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdTranslate = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12.65 15.67c.14-.36.05-.77-.23-1.05l-2.09-2.06.03-.03A17.5 17.5 0 0 0 14.07 6h1.94c.54 0 .99-.45.99-.99v-.02c0-.54-.45-.99-.99-.99H10V3c0-.55-.45-1-1-1s-1 .45-1 1v1H1.99c-.54 0-.99.45-.99.99 0 .55.45.99.99.99h10.18A15.7 15.7 0 0 1 9 11.35c-.81-.89-1.49-1.86-2.06-2.88A.89.89 0 0 0 6.16 8c-.69 0-1.13.75-.79 1.35.63 1.13 1.4 2.21 2.3 3.21L3.3 16.87a.99.99 0 0 0 0 1.42c.39.39 1.02.39 1.42 0L9 14l2.02 2.02c.51.51 1.38.32 1.63-.35M17.5 10c-.6 0-1.14.37-1.35.94l-3.67 9.8c-.24.61.22 1.26.87 1.26.39 0 .74-.24.88-.61l.89-2.39h4.75l.9 2.39c.14.36.49.61.88.61.65 0 1.11-.65.88-1.26l-3.67-9.8c-.22-.57-.76-.94-1.36-.94m-1.62 7 1.62-4.33L19.12 17z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdGrid = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M22 6c0-.55-.45-1-1-1h-2V3c0-.55-.45-1-1-1s-1 .45-1 1v2h-4V3c0-.55-.45-1-1-1s-1 .45-1 1v2H7V3c0-.55-.45-1-1-1s-1 .45-1 1v2H3c-.55 0-1 .45-1 1s.45 1 1 1h2v4H3c-.55 0-1 .45-1 1s.45 1 1 1h2v4H3c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h4v2c0 .55.45 1 1 1s1-.45 1-1v-2h4v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-2v-4h2c.55 0 1-.45 1-1s-.45-1-1-1h-2V7h2c.55 0 1-.45 1-1M7 7h4v4H7zm0 10v-4h4v4zm10 0h-4v-4h4zm0-6h-4V7h4z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdZoomIn = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.78 3.04-7.27 7.27.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0l.01-.01c.41-.41.41-1.07 0-1.48zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14m0-7c-.28 0-.5.22-.5.5V9H7.5c-.28 0-.5.22-.5.5s.22.5.5.5H9v1.5c0 .28.22.5.5.5s.5-.22.5-.5V10h1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H10V7.5c0-.28-.22-.5-.5-.5">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdZoomOut = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0l.01-.01c.41-.41.41-1.07 0-1.48zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14m-2-5h4c.28 0 .5.22.5.5s-.22.5-.5.5h-4c-.28 0-.5-.22-.5-.5s.22-.5.5-.5">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdFullscreen = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1m0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdFullscreenExit = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1m2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdLowPriority = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15 5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m0 5.5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m0 5.5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m-5.15 3.15 1.79-1.79c.2-.2.2-.51 0-.71l-1.79-1.79a.495.495 0 0 0-.85.35v3.59c0 .44.54.66.85.35M9 16h-.3c-2.35 0-4.45-1.71-4.68-4.05A4.51 4.51 0 0 1 8.5 7H11c.55 0 1-.45 1-1s-.45-1-1-1H8.5c-3.86 0-6.96 3.4-6.44 7.36C2.48 15.64 5.43 18 8.73 18H9">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

var css = ".iconButtonItem____hash_base64_5_{align-items:center;display:flex;position:relative}.iconButton____hash_base64_5_{align-items:center;background-color:initial;border-radius:9999px;border-style:none;color:var(--text,#fff);cursor:pointer;display:flex;font-size:1.5em;height:1.5em;justify-content:center;margin:.1em;outline:none;padding:0;width:1.5em}.iconButton____hash_base64_5_:focus,.iconButton____hash_base64_5_:hover{background-color:var(--hover-bg-color,#fff3)}.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_){background-color:var(--text,#fff);color:var(--text-bg,#121212)}.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_):focus,.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_):hover{background-color:var(--hover-bg-color-enable,#fffa)}.iconButton____hash_base64_5_.disable____hash_base64_5_{background-color:unset;cursor:not-allowed;opacity:.5}.iconButton____hash_base64_5_>svg{width:1em}.iconButtonPopper____hash_base64_5_{align-items:center;background-color:#303030;border-radius:.3em;color:#fff;display:flex;font-size:.8em;opacity:0;padding:.4em .5em;pointer-events:none;position:absolute;top:50%;transform:translateY(-50%);-webkit-user-select:none;user-select:none;white-space:nowrap}.iconButtonPopper____hash_base64_5_[data-placement=right]{left:calc(100% + 1.5em)}.iconButtonPopper____hash_base64_5_[data-placement=right]:before{border-right-color:var(--switch-bg,#6e6e6e);border-right-width:.5em;right:calc(100% + .5em)}.iconButtonPopper____hash_base64_5_[data-placement=left]{right:calc(100% + 1.5em)}.iconButtonPopper____hash_base64_5_[data-placement=left]:before{border-left-color:var(--switch-bg,#6e6e6e);border-left-width:.5em;left:calc(100% + .5em)}.iconButtonPopper____hash_base64_5_:before{background-color:initial;border:.4em solid #0000;content:\\"\\";pointer-events:none;position:absolute;transition:opacity .15s}.iconButtonItem____hash_base64_5_:is(:hover,:focus,[data-show=true]) .iconButtonPopper____hash_base64_5_{opacity:1}.hidden____hash_base64_5_{display:none}";
var modules_c21c94f2 = {"iconButtonItem":"iconButtonItem____hash_base64_5_","iconButton":"iconButton____hash_base64_5_","enabled":"enabled____hash_base64_5_","disable":"disable____hash_base64_5_","iconButtonPopper":"iconButtonPopper____hash_base64_5_","hidden":"hidden____hash_base64_5_"};

/** 图标按钮 */
const IconButton = _props => {
  const props = solidJs.mergeProps({
    placement: 'right'
  }, _props);
  let buttonRef;
  const handleClick = e => {
    if (props.disable) return;
    props.onClick?.(e);
    // 在每次点击后取消焦点
    buttonRef?.blur();
  };
  return (() => {
    var _el$ = web.template(\`<div><button type=button tabindex=0>\`)(),
      _el$2 = _el$.firstChild;
    web.use(ref => helper.useStyle(css, ref), _el$);
    web.addEventListener(_el$2, "click", handleClick);
    var _ref$ = buttonRef;
    typeof _ref$ === "function" ? web.use(_ref$, _el$2) : buttonRef = _el$2;
    web.insert(_el$2, () => props.children);
    web.insert(_el$, (() => {
      var _c$ = web.memo(() => !!(props.popper || props.tip));
      return () => _c$() ? (() => {
        var _el$3 = web.template(\`<div>\`)();
        web.insert(_el$3, () => props.popper || props.tip);
        web.effect(_p$ => {
          var _v$6 = [modules_c21c94f2.iconButtonPopper, props.popperClassName].join(' '),
            _v$7 = props.placement;
          _v$6 !== _p$.e && web.className(_el$3, _p$.e = _v$6);
          _v$7 !== _p$.t && web.setAttribute(_el$3, "data-placement", _p$.t = _v$7);
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$3;
      })() : null;
    })(), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2.iconButtonItem,
        _v$2 = props.showTip,
        _v$3 = props.tip,
        _v$4 = modules_c21c94f2.iconButton,
        _v$5 = {
          [modules_c21c94f2.hidden]: props.hidden,
          [modules_c21c94f2.enabled]: props.enabled,
          [modules_c21c94f2.disable]: props.disable
        };
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-show", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$2, "aria-label", _p$.a = _v$3);
      _v$4 !== _p$.o && web.className(_el$2, _p$.o = _v$4);
      _p$.i = web.classList(_el$2, _v$5, _p$.i);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
};

const MdOutlineFormatTextdirectionLToR = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M9 10v4c0 .55.45 1 1 1s1-.45 1-1V4h2v10c0 .55.45 1 1 1s1-.45 1-1V4h1c.55 0 1-.45 1-1s-.45-1-1-1H9.17C7.08 2 5.22 3.53 5.02 5.61A4 4 0 0 0 9 10m11.65 7.65-2.79-2.79a.501.501 0 0 0-.86.35V17H6c-.55 0-1 .45-1 1s.45 1 1 1h11v1.79c0 .45.54.67.85.35l2.79-2.79c.2-.19.2-.51.01-.7">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdOutlineFormatTextdirectionRToL = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M10 10v4c0 .55.45 1 1 1s1-.45 1-1V4h2v10c0 .55.45 1 1 1s1-.45 1-1V4h1c.55 0 1-.45 1-1s-.45-1-1-1h-6.83C8.08 2 6.22 3.53 6.02 5.61A4 4 0 0 0 10 10m-2 7v-1.79c0-.45-.54-.67-.85-.35l-2.79 2.79c-.2.2-.2.51 0 .71l2.79 2.79a.5.5 0 0 0 .85-.36V19h11c.55 0 1-.45 1-1s-.45-1-1-1z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

/** 设置菜单项 */
const SettingsItem = props => (() => {
  var _el$ = web.template(\`<div><div> <!> \`)(),
    _el$2 = _el$.firstChild,
    _el$3 = _el$2.firstChild,
    _el$5 = _el$3.nextSibling;
    _el$5.nextSibling;
  web.insert(_el$2, () => props.name, _el$5);
  web.insert(_el$, () => props.children, null);
  web.effect(_p$ => {
    var _v$ = props.class ? \`\${modules_c21c94f2$1.SettingsItem} \${props.class}\` : modules_c21c94f2$1.SettingsItem,
      _v$2 = {
        [props.class ?? '']: Boolean(props.class?.length),
        ...props.classList
      },
      _v$3 = props.style,
      _v$4 = modules_c21c94f2$1.SettingsItemName;
    _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
    _p$.t = web.classList(_el$, _v$2, _p$.t);
    _p$.a = web.style(_el$, _v$3, _p$.a);
    _v$4 !== _p$.o && web.className(_el$2, _p$.o = _v$4);
    return _p$;
  }, {
    e: undefined,
    t: undefined,
    a: undefined,
    o: undefined
  });
  return _el$;
})();

/** 开关式菜单项 */
const SettingsItemSwitch = props => {
  const handleClick = () => props.onChange(!props.value);
  return web.createComponent(SettingsItem, {
    get name() {
      return props.name;
    },
    get ["class"]() {
      return props.class;
    },
    get classList() {
      return props.classList;
    },
    get children() {
      var _el$ = web.template(\`<button type=button><div>\`)(),
        _el$2 = _el$.firstChild;
      web.addEventListener(_el$, "click", handleClick);
      web.effect(_p$ => {
        var _v$ = modules_c21c94f2$1.SettingsItemSwitch,
          _v$2 = props.value,
          _v$3 = modules_c21c94f2$1.SettingsItemSwitchRound;
        _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
        _v$2 !== _p$.t && web.setAttribute(_el$, "data-checked", _p$.t = _v$2);
        _v$3 !== _p$.a && web.className(_el$2, _p$.a = _v$3);
        return _p$;
      }, {
        e: undefined,
        t: undefined,
        a: undefined
      });
      return _el$;
    }
  });
};

const MdClose = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdRefresh = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M17.65 6.35a7.95 7.95 0 0 0-6.48-2.31c-3.67.37-6.69 3.35-7.1 7.02C3.52 15.91 7.27 20 12 20a7.98 7.98 0 0 0 7.21-4.56c.32-.67-.16-1.44-.9-1.44-.37 0-.72.2-.88.53a5.994 5.994 0 0 1-6.8 3.31c-2.22-.49-4.01-2.3-4.48-4.52A6.002 6.002 0 0 1 12 6c1.66 0 3.14.69 4.22 1.78l-1.51 1.51c-.63.63-.19 1.71.7 1.71H19c.55 0 1-.45 1-1V6.41c0-.89-1.08-1.34-1.71-.71z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdAdd = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const setHotkeys = (...args) => {
  _setState(...['hotkeys', ...args]);
  store.prop.onHotkeysChange?.(Object.fromEntries(Object.entries(store.hotkeys).filter(([name, keys]) => !helper.isEqual(keys.filter(Boolean), defaultHotkeys()[name]))));
};
const delHotkeys = code => {
  for (const [name, keys] of Object.entries(store.hotkeys)) {
    const i = keys.indexOf(code);
    if (i === -1) continue;
    const newKeys = [...store.hotkeys[name]];
    newKeys.splice(i, 1);
    setHotkeys(name, newKeys);
  }
};
const getHotkeyName = code => helper.t(\`hotkeys.\${code}\`) || helper.t(\`button.\${code}\`) || helper.t(\`setting.translation.\${code}\`) || code;
const KeyItem = props => {
  const code = () => store.hotkeys[props.operateName][props.i];
  const del = () => delHotkeys(code());
  const handleKeyDown = e => {
    e.stopPropagation();
    e.preventDefault();
    switch (e.key) {
      case 'Tab':
      case 'Enter':
      case 'Escape':
        focus();
        return;
      case 'Backspace':
        setHotkeys(props.operateName, props.i, '');
        return;
    }
    const newCode = helper.getKeyboardCode(e);
    if (!Reflect.has(hotkeysMap(), newCode)) setHotkeys(props.operateName, props.i, newCode);
  };
  return (() => {
    var _el$ = web.template(\`<div tabindex=0>\`)();
    _el$.addEventListener("blur", () => code() || del());
    web.use(ref => code() || setTimeout(() => ref.focus()), _el$);
    web.addEventListener(_el$, "keydown", handleKeyDown);
    web.insert(_el$, () => helper.keyboardCodeToText(code()), null);
    web.insert(_el$, web.createComponent(MdClose, {
      "on:click": del
    }), null);
    web.effect(() => web.className(_el$, modules_c21c94f2$1.hotkeysItem));
    return _el$;
  })();
};
const ShowHotkeys = props => web.createComponent(solidJs.For, {
  get each() {
    return props.keys;
  },
  children: name => (() => {
    var _el$2 = web.template(\`<div><div><p></p><span></span><div></div><div>\`)(),
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.nextSibling,
      _el$7 = _el$6.nextSibling;
    web.insert(_el$4, () => getHotkeyName(name));
    _el$5.style.setProperty("flex-grow", "1");
    web.addEventListener(_el$6, "click", () => setHotkeys(name, store.hotkeys[name].length, ''));
    web.insert(_el$6, web.createComponent(MdAdd, {}));
    web.addEventListener(_el$7, "click", () => {
      const newKeys = defaultHotkeys()[name] ?? [];
      for (const code of defaultHotkeys()[name]) delHotkeys(code);
      setHotkeys(name, newKeys);
    });
    web.insert(_el$7, web.createComponent(MdRefresh, {}));
    web.insert(_el$2, web.createComponent(solidJs.Index, {
      get each() {
        return store.hotkeys[name];
      },
      children: (_, i) => web.createComponent(KeyItem, {
        operateName: name,
        i: i
      })
    }), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.hotkeys,
        _v$2 = modules_c21c94f2$1.hotkeysHeader,
        _v$3 = helper.t('setting.hotkeys.add'),
        _v$4 = helper.t('setting.hotkeys.restore');
      _v$ !== _p$.e && web.className(_el$2, _p$.e = _v$);
      _v$2 !== _p$.t && web.className(_el$3, _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$6, "title", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$7, "title", _p$.o = _v$4);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$2;
  })()
});
const OtherHotkeys = props => {
  let ref;
  const handleChange = e => {
    const name = e.target.value;
    setHotkeys(name, store.hotkeys[name].length, '');
    ref.value = '';
  };
  return (() => {
    var _el$8 = web.template(\`<div><select><option value disabled hidden selected> …\`)(),
      _el$9 = _el$8.firstChild,
      _el$10 = _el$9.firstChild,
      _el$11 = _el$10.firstChild;
    _el$9.addEventListener("change", handleChange);
    var _ref$ = ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$9) : ref = _el$9;
    _el$9.style.setProperty("height", "100%");
    web.insert(_el$10, () => helper.t('setting.option.paragraph_other'), _el$11);
    web.insert(_el$9, web.createComponent(solidJs.For, {
      get each() {
        return props.keys;
      },
      children: name => (() => {
        var _el$12 = web.template(\`<option>\`)();
        _el$12.value = name;
        web.insert(_el$12, () => getHotkeyName(name));
        return _el$12;
      })()
    }), null);
    web.effect(_p$ => {
      var _v$5 = modules_c21c94f2$1.hotkeys,
        _v$6 = modules_c21c94f2$1.hotkeysHeader;
      _v$5 !== _p$.e && web.className(_el$8, _p$.e = _v$5);
      _v$6 !== _p$.t && web.className(_el$9, _p$.t = _v$6);
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$8;
  })();
};
const SettingHotkeys = () => {
  const hotkeys = helper.createRootMemo(() => {
    const show = [];
    const other = [];
    for (const [name, keys] of Object.entries(store.hotkeys)) (keys.length > 0 ? show : other).push(name);
    return {
      show,
      other
    };
  });
  return [web.createComponent(ShowHotkeys, {
    get keys() {
      return hotkeys().show;
    }
  }), web.createComponent(solidJs.Show, {
    get when() {
      return hotkeys().other.length;
    },
    get children() {
      return web.createComponent(OtherHotkeys, {
        get keys() {
          return hotkeys().other;
        }
      });
    }
  })];
};

/** 范围输入框 */
const RangeInput = props => {
  let ref;

  /** 在保持光标位置不变的情况下修改文本 */
  const editText = text => {
    const offset = ref.selectionStart;
    ref.value = text;
    if (offset) requestAnimationFrame(() => {
      ref.selectionStart = offset;
      ref.selectionEnd = offset;
    });
  };

  /** 修改文本中的数字 */
  const replaceTextNumer = (text, offset, fn) => {
    const isNumber = num => /\\d/.test(text[num]);
    let start = offset;
    if (!isNumber(offset)) {
      if (isNumber(start - 1)) start--;else if (isNumber(start + 1)) start++;else return text;
    }
    let end = start;
    while (isNumber(start - 1)) start--;
    while (isNumber(end + 1)) end++;
    return text.slice(0, start) + fn(Number(text.slice(start, end + 1))) + text.slice(end + 1);
  };
  const handleKeyDown = e => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        editText(replaceTextNumer(ref.value, ref.selectionStart, num => e.key === 'ArrowUp' ? num + 1 : num - 1));
    }
  };
  return (() => {
    var _el$ = web.template(\`<textarea autocomplete=off rows=2>\`)();
    _el$.addEventListener("blur", () => {
      try {
        props.onChange?.(ref.value);
      } finally {
        ref.value = props.value;
      }
    });
    web.addEventListener(_el$, "keydown", handleKeyDown);
    var _ref$ = ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$) : ref = _el$;
    web.effect(() => web.setAttribute(_el$, "placeholder", props.placeholder));
    web.effect(() => _el$.value = props.value);
    return _el$;
  })();
};

/** 选择器式菜单项 */
const SettingsItemSelect = props => {
  let ref;
  solidJs.createEffect(() => {
    ref.value = props.options?.some(([val]) => val === props.value) ? props.value : '';
  });
  return web.createComponent(SettingsItem, {
    get name() {
      return props.name;
    },
    get ["class"]() {
      return props.class;
    },
    get classList() {
      return props.classList;
    },
    get children() {
      var _el$ = web.template(\`<select>\`)();
      web.addEventListener(_el$, "click", () => props.onClick?.());
      _el$.addEventListener("change", e => props.onChange(e.target.value));
      var _ref$ = ref;
      typeof _ref$ === "function" ? web.use(_ref$, _el$) : ref = _el$;
      web.insert(_el$, web.createComponent(solidJs.For, {
        get each() {
          return props.options;
        },
        children: ([val, label]) => (() => {
          var _el$2 = web.template(\`<option>\`)();
          _el$2.value = val;
          web.insert(_el$2, label ?? val);
          return _el$2;
        })()
      }));
      web.effect(() => web.className(_el$, modules_c21c94f2$1.SettingsItemSelect));
      return _el$;
    }
  });
};


/** 带有动画过渡的切换显示设置项 */
const SettingsShowItem = props => (() => {
  var _el$ = web.template(\`<div><div>\`)(),
    _el$2 = _el$.firstChild;
  web.insert(_el$2, () => props.children);
  web.effect(_p$ => {
    var _v$ = modules_c21c94f2$1.SettingsShowItem,
      _v$2 = props.when ? '1fr' : '0fr',
      _v$3 = modules_c21c94f2$1.SettingsShowItemBody;
    _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
    _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$.style.setProperty("grid-template-rows", _v$2) : _el$.style.removeProperty("grid-template-rows"));
    _v$3 !== _p$.a && web.className(_el$2, _p$.a = _v$3);
    return _p$;
  }, {
    e: undefined,
    t: undefined,
    a: undefined
  });
  return _el$;
})();

const TranslateRange = () => {
  const [rangeText, setRangeText] = solidJs.createSignal('');
  helper.createEffectOn(rangeText, () => {
    const imgImgs = helper.extractRange(rangeText(), store.imgList.length);
    const openImgs = [...imgImgs].filter(i => {
      // 过滤掉翻译完成和等待翻译的图片，避免因为范围变化而重新发起翻译
      switch (imgList()[i].translationType) {
        case 'show':
        case 'wait':
          return false;
        default:
          return true;
      }
    });
    if (openImgs.length > 0) setImgTranslationEnbale(openImgs, true);
    const closeImgs = new Set();
    for (let i = 0; i < store.imgList.length; i++) if (!imgImgs.has(i)) closeImgs.add(i);
    if (closeImgs.size > 0) setImgTranslationEnbale(closeImgs, false);
    setRangeText(helper.descRange(imgImgs, store.imgList.length));
  });

  // 实时更新翻译范围
  helper.createEffectOn(() => {
    const list = new Set();
    for (const [i, img] of imgList().entries()) {
      switch (img.translationType) {
        case 'error':
        case 'show':
        case 'wait':
          list.add(i);
          break;
      }
    }
    return list;
  }, translationImgs => {
    setRangeText(helper.descRange(translationImgs, store.imgList.length));
  });
  return [web.createComponent(SettingsItem, {
    get name() {
      return helper.t('setting.translation.range');
    }
  }), web.createComponent(RangeInput, {
    get ["class"]() {
      return modules_c21c94f2$1.SettingsItem;
    },
    get placeholder() {
      return helper.t('other.page_range');
    },
    get value() {
      return rangeText();
    },
    onChange: setRangeText
  })];
};
const SettingTranslation = () => [web.createComponent(SettingsItemSelect, {
  get name() {
    return helper.t('setting.translation.server');
  },
  get options() {
    return [['disable', helper.t('other.disable')], ['selfhosted', helper.t('setting.translation.server_selfhosted')], ['cotrans']];
  },
  get value() {
    return store.option.translation.server;
  },
  get onChange() {
    return createStateSetFn('translation.server');
  }
}), web.createComponent(SettingsShowItem, {
  get when() {
    return store.option.translation.server === 'cotrans';
  },
  get children() {
    var _el$ = web.template(\`<blockquote>\`)();
    web.effect(() => _el$.innerHTML = helper.t('setting.translation.cotrans_tip'));
    return _el$;
  }
}), web.createComponent(SettingsShowItem, {
  get when() {
    return store.option.translation.server !== 'disable';
  },
  get children() {
    return [web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.translation.options.detection_resolution');
      },
      options: [['1024', '1024px'], ['1536', '1536px'], ['2048', '2048px'], ['2560', '2560px']],
      get value() {
        return store.option.translation.options.size;
      },
      get onChange() {
        return createStateSetFn('translation.options.size');
      }
    }), web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.translation.options.text_detector');
      },
      options: [['default'], ['ctd', 'Comic Text Detector']],
      get value() {
        return store.option.translation.options.detector;
      },
      get onChange() {
        return createStateSetFn('translation.options.detector');
      }
    }), web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.translation.options.translator');
      },
      get options() {
        return translatorOptions();
      },
      get value() {
        return store.option.translation.options.translator;
      },
      get onChange() {
        return createStateSetFn('translation.options.translator');
      },
      onClick: updateSelfhostedOptions
    }), web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.translation.options.direction');
      },
      get options() {
        return [['auto', helper.t('setting.translation.options.direction_auto')], ['horizontal', helper.t('setting.translation.options.direction_horizontal')], ['vertical', helper.t('setting.translation.options.direction_vertical')]];
      },
      get value() {
        return store.option.translation.options.direction;
      },
      get onChange() {
        return createStateSetFn('translation.options.direction');
      }
    }), web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.translation.options.target_language');
      },
      options: [['CHS', '简体中文'], ['CHT', '繁體中文'], ['JPN', '日本語'], ['ENG', 'English'], ['KOR', '한국어'], ['VIN', 'Tiếng Việt'], ['CSY', 'čeština'], ['NLD', 'Nederlands'], ['FRA', 'français'], ['DEU', 'Deutsch'], ['HUN', 'magyar nyelv'], ['ITA', 'italiano'], ['PLK', 'polski'], ['PTB', 'português'], ['ROM', 'limba română'], ['RUS', 'русский язык'], ['ESP', 'español'], ['TRK', 'Türk dili'], ['IND', 'Indonesia']],
      get value() {
        return store.option.translation.options.targetLanguage;
      },
      get onChange() {
        return createStateSetFn('translation.options.targetLanguage');
      }
    }), web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.translation.options.forceRetry');
      },
      get value() {
        return store.option.translation.forceRetry;
      },
      get onChange() {
        return createStateSetFn('translation.forceRetry');
      }
    }), web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.translation.options.onlyDownloadTranslated');
      },
      get value() {
        return store.option.translation.onlyDownloadTranslated;
      },
      get onChange() {
        return createStateSetFn('translation.onlyDownloadTranslated');
      }
    }), web.createComponent(solidJs.Show, {
      get when() {
        return store.option.translation.server === 'selfhosted';
      },
      get children() {
        return [web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.translation.options.localUrl');
          },
          get value() {
            return store.option.translation.localUrl !== undefined;
          },
          onChange: val => {
            setOption(draftOption => {
              draftOption.translation.localUrl = val ? '' : undefined;
            });
          }
        }), web.createComponent(solidJs.Show, {
          get when() {
            return store.option.translation.localUrl !== undefined;
          },
          get children() {
            var _el$2 = web.template(\`<input type=url>\`)();
            _el$2.addEventListener("change", e => {
              setOption(draftOption => {
                // 删掉末尾的斜杠
                const url = e.target.value.replace(/\\/$/, '');
                draftOption.translation.localUrl = url;
              });
            });
            web.effect(() => _el$2.value = store.option.translation.localUrl);
            return _el$2;
          }
        }), web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.translation.translate_all');
          },
          get value() {
            return isTranslatingAll();
          },
          onChange: translateAll
        }), web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.translation.translate_to_end');
          },
          get value() {
            return isTranslatingToEnd();
          },
          onChange: translateToEnd
        }), web.createComponent(TranslateRange, {})];
      }
    })];
  }
})];

/** 数值输入框 */
const NumberInput = props => {
  const handleInput = e => props.maxLength !== undefined && e.currentTarget.textContent.length > props.maxLength && e.currentTarget.blur();
  const handleKeyDown = e => {
    switch (e.key) {
      case 'ArrowUp':
        return props.onChange(Number(e.target.textContent) + (props.step ?? 1));
      case 'ArrowDown':
        return props.onChange(Number(e.target.textContent) - (props.step ?? 1));
      case 'Enter':
        return e.target.blur();
    }
  };
  return [(() => {
    var _el$ = web.template(\`<span contenteditable data-only-number>\`)();
    _el$.addEventListener("blur", e => {
      try {
        props.onChange(Number(e.currentTarget.textContent));
      } finally {
        e.currentTarget.textContent = \`\${props.value}\`;
      }
    });
    web.addEventListener(_el$, "keydown", handleKeyDown);
    web.addEventListener(_el$, "input", handleInput);
    web.insert(_el$, () => \`\${props.value}\`);
    return _el$;
  })(), web.createComponent(solidJs.Show, {
    get when() {
      return props.suffix;
    },
    get children() {
      return props.suffix;
    }
  })];
};

/** 数值输入框菜单项 */
const SettingsItemNumber = props => web.createComponent(SettingsItem, {
  get name() {
    return props.name;
  },
  get ["class"]() {
    return props.class;
  },
  get classList() {
    return props.classList;
  },
  get children() {
    var _el$ = web.template(\`<div>\`)();
    web.insert(_el$, web.createComponent(NumberInput, props));
    web.effect(_$p => (_$p = props.suffix ? '.3em' : '.6em') != null ? _el$.style.setProperty("margin-right", _$p) : _el$.style.removeProperty("margin-right"));
    return _el$;
  }
});


const areaArrayMap = {
  left_right: [['prev', 'menu', 'next'], ['PREV', 'MENU', 'NEXT'], ['prev', 'menu', 'next']],
  up_down: [['prev', 'PREV', 'prev'], ['menu', 'MENU', 'menu'], ['next', 'NEXT', 'next']],
  edge: [['next', 'menu', 'next'], ['NEXT', 'MENU', 'NEXT'], ['next', 'PREV', 'next']],
  l: [['PREV', 'prev', 'prev'], ['prev', 'MENU', 'next'], ['next', 'next', 'NEXT']]
};
const areaType = helper.createRootMemo(() => Reflect.has(areaArrayMap, store.option.clickPageTurn.area) ? store.option.clickPageTurn.area : 'left_right');
const dir = helper.createRootMemo(() => {
  if (!store.option.clickPageTurn.reverse) return store.option.dir;
  return store.option.dir === 'rtl' ? 'ltr' : 'rtl';
});
const TouchArea = () => (() => {
  var _el$ = web.template(\`<div>\`)();
  var _ref$ = bindRef('touchArea');
  typeof _ref$ === "function" && web.use(_ref$, _el$);
  web.insert(_el$, web.createComponent(solidJs.For, {
    get each() {
      return areaArrayMap[areaType()];
    },
    children: rows => web.createComponent(solidJs.For, {
      each: rows,
      children: area => (() => {
        var _el$2 = web.template(\`<div role=button tabindex=-1>\`)();
        web.setAttribute(_el$2, "data-area", area);
        web.effect(() => web.className(_el$2, modules_c21c94f2$1.touchArea));
        return _el$2;
      })()
    })
  }));
  web.effect(_p$ => {
    var _v$ = modules_c21c94f2$1.touchAreaRoot,
      _v$2 = dir(),
      _v$3 = helper.boolDataVal(store.show.touchArea),
      _v$4 = areaType(),
      _v$5 = helper.boolDataVal(store.option.clickPageTurn.enabled && !store.option.scrollMode.enabled);
    _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
    _v$2 !== _p$.t && web.setAttribute(_el$, "dir", _p$.t = _v$2);
    _v$3 !== _p$.a && web.setAttribute(_el$, "data-show", _p$.a = _v$3);
    _v$4 !== _p$.o && web.setAttribute(_el$, "data-area", _p$.o = _v$4);
    _v$5 !== _p$.i && web.setAttribute(_el$, "data-turn-page", _p$.i = _v$5);
    return _p$;
  }, {
    e: undefined,
    t: undefined,
    a: undefined,
    o: undefined,
    i: undefined
  });
  return _el$;
})();

/** 默认菜单项 */
const defaultSettingList = () => [[helper.t('setting.option.paragraph_dir'), () => web.createComponent(SettingsItem, {
  get name() {
    return web.memo(() => store.option.dir === 'rtl')() ? helper.t('setting.option.dir_rtl') : helper.t('setting.option.dir_ltr');
  },
  get children() {
    var _el$ = web.template(\`<button type=button>\`)();
    web.addEventListener(_el$, "click", switchDir);
    web.insert(_el$, (() => {
      var _c$ = web.memo(() => store.option.dir === 'rtl');
      return () => _c$() ? web.createComponent(MdOutlineFormatTextdirectionRToL, {}) : web.createComponent(MdOutlineFormatTextdirectionLToR, {});
    })());
    web.effect(() => web.className(_el$, modules_c21c94f2$1.SettingsItemIconButton));
    return _el$;
  }
}), true], [helper.t('setting.option.paragraph_display'), () => [web.createComponent(solidJs.Show, {
  get when() {
    return !store.option.scrollMode.enabled;
  },
  get children() {
    return web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.disable_auto_enlarge');
      },
      get value() {
        return store.option.disableZoom;
      },
      get onChange() {
        return createStateSetFn('disableZoom');
      }
    });
  }
}), web.createComponent(solidJs.Show, {
  get when() {
    return store.option.scrollMode.enabled;
  },
  get children() {
    return [web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.abreast_mode');
      },
      get value() {
        return store.option.scrollMode.abreastMode;
      },
      onChange: val => {
        const jump = saveScrollProgress();
        setOption(draftOption => {
          draftOption.scrollMode.abreastMode = val;
          draftOption.scrollMode.doubleMode = false;
        });
        jump();
      }
    }), web.createComponent(SettingsItemNumber, {
      get name() {
        return helper.t('setting.option.scroll_mode_img_scale');
      },
      maxLength: 3,
      suffix: "%",
      step: 5,
      onChange: val => {
        if (!Number.isNaN(val)) zoomScrollModeImg(val / 100, true);
      },
      get value() {
        return Math.round(store.option.scrollMode.imgScale * 100);
      }
    }), web.createComponent(SettingsItemNumber, {
      get name() {
        return helper.t('setting.option.scroll_mode_img_spacing');
      },
      maxLength: 5,
      onChange: val => {
        if (Number.isNaN(val)) return;
        const newVal = helper.clamp(0, val, Number.POSITIVE_INFINITY);
        setOption(draftOption => {
          draftOption.scrollMode.spacing = newVal;
        });
      },
      get value() {
        return Math.round(store.option.scrollMode.spacing);
      }
    }), web.createComponent(solidJs.Show, {
      get when() {
        return store.option.scrollMode.abreastMode;
      },
      get children() {
        return web.createComponent(SettingsItemNumber, {
          get name() {
            return helper.t('setting.option.abreast_duplicate');
          },
          maxLength: 3,
          suffix: "%",
          step: 5,
          onChange: val => {
            if (Number.isNaN(val)) return;
            setOption(draftOption => {
              const newVal = helper.clamp(0, val / 100, 0.95);
              draftOption.scrollMode.abreastDuplicate = newVal;
            });
          },
          get value() {
            return Math.round(store.option.scrollMode.abreastDuplicate * 100);
          }
        });
      }
    }), web.createComponent(solidJs.Show, {
      get when() {
        return !store.option.scrollMode.abreastMode;
      },
      get children() {
        return web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.option.fit_to_width');
          },
          get value() {
            return store.option.scrollMode.fitToWidth;
          },
          onChange: switchFitToWidth
        });
      }
    })];
  }
}), web.createComponent(solidJs.Show, {
  get when() {
    return !store.option.scrollMode.enabled;
  },
  get children() {
    return web.createComponent(SettingsItemNumber, {
      get name() {
        return helper.t('setting.option.zoom');
      },
      maxLength: 3,
      suffix: "%",
      step: 5,
      onChange: val => Number.isNaN(val) || zoom(val),
      get value() {
        return Math.round(store.option.zoom.ratio);
      }
    });
  }
})], true], [helper.t('setting.option.paragraph_appearance'), () => [web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.dark_mode');
  },
  get value() {
    return store.option.darkMode;
  },
  get onChange() {
    return createStateSetFn('darkMode');
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.dark_mode_auto');
  },
  get value() {
    return store.option.autoDarkMode;
  },
  get onChange() {
    return createStateSetFn('autoDarkMode');
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.show_comments');
  },
  get value() {
    return store.option.showComment;
  },
  get onChange() {
    return createStateSetFn('showComment');
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.autoHiddenMouse');
  },
  get value() {
    return store.option.autoHiddenMouse;
  },
  get onChange() {
    return createStateSetFn('autoHiddenMouse');
  }
}), web.createComponent(SettingsItem, {
  get name() {
    return helper.t('setting.option.background_color');
  },
  get children() {
    var _el$2 = web.template(\`<input type=color>\`)();
    web.addEventListener(_el$2, "input", helper.throttle(e => {
      if (!e.target.value) return;
      setOption(draftOption => {
        // 在拉到纯黑或纯白时改回初始值
        draftOption.customBackground = e.target.value === '#000000' || e.target.value === '#ffffff' ? undefined : e.target.value;
        if (draftOption.customBackground) draftOption.darkMode = helper.needDarkMode(draftOption.customBackground);
      });
    }, 20));
    _el$2.style.setProperty("width", "2em");
    _el$2.style.setProperty("margin-right", ".4em");
    web.effect(() => _el$2.value = store.option.customBackground ?? (store.option.darkMode ? '#000000' : '#ffffff'));
    return _el$2;
  }
}), web.createComponent(SettingsItemSelect, {
  get name() {
    return helper.t('setting.language');
  },
  options: [['zh', '中文'], ['en', 'English'], ['ru', 'Русский'], ['ta', 'தமிழ்']],
  get value() {
    return helper.lang();
  },
  onChange: helper.setLang
})]], [helper.t('setting.option.paragraph_scrollbar'), () => [web.createComponent(SettingsItemSelect, {
  get name() {
    return helper.t('setting.option.scrollbar_position');
  },
  get options() {
    return [['auto', helper.t('setting.option.scrollbar_position_auto')], ['right', helper.t('setting.option.scrollbar_position_right')], ['top', helper.t('setting.option.scrollbar_position_top')], ['bottom', helper.t('setting.option.scrollbar_position_bottom')], ['hidden', helper.t('setting.option.scrollbar_position_hidden')]];
  },
  get value() {
    return store.option.scrollbar.position;
  },
  get onChange() {
    return createStateSetFn('scrollbar.position');
  }
}), web.createComponent(SettingsShowItem, {
  get when() {
    return store.option.scrollbar.position !== 'hidden';
  },
  get children() {
    return [web.createComponent(solidJs.Show, {
      get when() {
        return !store.isMobile;
      },
      get children() {
        return web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.option.scrollbar_auto_hidden');
          },
          get value() {
            return store.option.scrollbar.autoHidden;
          },
          get onChange() {
            return createStateSetFn('scrollbar.autoHidden');
          }
        });
      }
    }), web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.scrollbar_show_img_status');
      },
      get value() {
        return store.option.scrollbar.showImgStatus;
      },
      get onChange() {
        return createStateSetFn('scrollbar.showImgStatus');
      }
    }), web.createComponent(solidJs.Show, {
      get when() {
        return store.option.scrollMode.enabled;
      },
      get children() {
        return web.createComponent(SettingsItemSwitch, {
          get name() {
            return helper.t('setting.option.scrollbar_easy_scroll');
          },
          get value() {
            return store.option.scrollbar.easyScroll;
          },
          get onChange() {
            return createStateSetFn('scrollbar.easyScroll');
          }
        });
      }
    })];
  }
})]], [helper.t('setting.option.click_page_turn_enabled'), () => [web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('other.enabled');
  },
  get value() {
    return store.option.clickPageTurn.enabled;
  },
  get onChange() {
    return createStateSetFn('clickPageTurn.enabled');
  }
}), web.createComponent(SettingsShowItem, {
  get when() {
    return store.option.clickPageTurn.enabled;
  },
  get children() {
    return [web.createComponent(SettingsItemSelect, {
      get name() {
        return helper.t('setting.option.click_page_turn_area');
      },
      get options() {
        return Object.keys(areaArrayMap).map(key => [key, helper.t(\`touch_area.type.\${key}\`)]);
      },
      get value() {
        return store.option.clickPageTurn.area;
      },
      get onChange() {
        return createStateSetFn('clickPageTurn.area');
      }
    }), web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.click_page_turn_swap_area');
      },
      get value() {
        return store.option.clickPageTurn.reverse;
      },
      get onChange() {
        return createStateSetFn('clickPageTurn.reverse');
      }
    })];
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.show_clickable_area');
  },
  get value() {
    return store.show.touchArea;
  },
  onChange: () => _setState('show', 'touchArea', !store.show.touchArea)
})]], [helper.t('setting.option.img_recognition'), () => [web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('other.enabled');
  },
  get value() {
    return store.option.imgRecognition.enabled;
  },
  onChange: () => setOption((draftOption, state) => {
    const enabled = !draftOption.imgRecognition.enabled;
    draftOption.imgRecognition.enabled = enabled;
    if (!enabled) return;
    for (const img of Object.values(state.imgMap)) if (!img.blobUrl) img.loadType = 'wait';
    updateImgLoadType();
  })
}), web.createComponent(solidJs.Show, {
  when: typeof Worker === 'undefined',
  get children() {
    var _el$3 = web.template(\`<blockquote><p>\`)(),
      _el$4 = _el$3.firstChild;
    web.effect(() => _el$4.innerHTML = helper.t('setting.option.img_recognition_warn'));
    return _el$3;
  }
}), web.createComponent(solidJs.Show, {
  get when() {
    return !store.supportWorker;
  },
  get children() {
    var _el$5 = web.template(\`<blockquote><p>\`)(),
      _el$6 = _el$5.firstChild;
    web.effect(() => _el$6.innerHTML = helper.t('setting.option.img_recognition_warn_2'));
    return _el$5;
  }
}), web.createComponent(SettingsShowItem, {
  get when() {
    return store.option.imgRecognition.enabled;
  },
  get children() {
    return [web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.img_recognition_background');
      },
      get value() {
        return store.option.imgRecognition.background;
      },
      onChange: () => setOption((draftOption, state) => {
        const enabled = !draftOption.imgRecognition.background;
        draftOption.imgRecognition.background = enabled;
        if (!enabled) return;
        for (const img of Object.values(state.imgMap)) {
          if (img.background === undefined && img.loadType === 'loaded') handleImgRecognition(getImgEle(img.src), img.src);
        }
      })
    }), web.createComponent(SettingsItemSwitch, {
      get name() {
        return helper.t('setting.option.img_recognition_pageFill');
      },
      get value() {
        return store.option.imgRecognition.pageFill;
      },
      onChange: () => setOption((draftOption, state) => {
        const enabled = !draftOption.imgRecognition.pageFill;
        draftOption.imgRecognition.pageFill = enabled;
        if (!enabled) return;
        for (const img of Object.values(state.imgMap)) {
          if (img.blankMargin === undefined && img.loadType === 'loaded') handleImgRecognition(getImgEle(img.src), img.src);
        }
      })
    })];
  }
})]], [helper.t('setting.option.paragraph_translation'), SettingTranslation, store.option.translation.server !== 'disable'], [helper.t('setting.option.paragraph_hotkeys'), SettingHotkeys], [helper.t('setting.option.paragraph_other'), () => [web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.first_page_fill');
  },
  get value() {
    return store.option.firstPageFill;
  },
  get onChange() {
    return createStateSetFn('firstPageFill');
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.auto_switch_page_mode');
  },
  get value() {
    return store.option.autoSwitchPageMode;
  },
  onChange: val => {
    setOption((draftOption, state) => {
      draftOption.autoSwitchPageMode = val;
      state.option.pageNum = val ? 0 : autoPageNum();
    });
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.swap_page_turn_key');
  },
  get value() {
    return store.option.swapPageTurnKey;
  },
  get onChange() {
    return createStateSetFn('swapPageTurnKey');
  }
}), web.createComponent(SettingsItemSelect, {
  get name() {
    return helper.t('setting.option.scroll_end');
  },
  get options() {
    return [['none', helper.t('other.none')], ['exit', helper.t('button.exit')], ['auto', helper.t('setting.option.scroll_end_auto')]];
  },
  get value() {
    return store.option.scroolEnd;
  },
  get onChange() {
    return createStateSetFn('scroolEnd');
  }
}), web.createComponent(SettingsItemSwitch, {
  get name() {
    return helper.t('setting.option.always_load_all_img');
  },
  get value() {
    return store.option.alwaysLoadAllImg;
  },
  get onChange() {
    return createStateSetFn('alwaysLoadAllImg');
  }
}), web.createComponent(SettingsItemNumber, {
  get name() {
    return helper.t('setting.option.preload_page_num');
  },
  maxLength: 5,
  onChange: val => {
    if (Number.isNaN(val)) return;
    setOption(draftOption => {
      draftOption.preloadPageNum = helper.clamp(0, val, 99_999);
    });
  },
  get value() {
    return store.option.preloadPageNum;
  }
})]]];


/** 判断滚动事件是否会导致滚动 */
const canScroll = (e, container) => {
  const {
    scrollHeight,
    clientHeight,
    scrollTop
  } = container;
  return scrollHeight > clientHeight && (e.deltaY < 0 && scrollTop > 0 || e.deltaY > 0 && Math.ceil(scrollTop) < scrollHeight - clientHeight);
};

/** 菜单面板 */
const SettingPanel = () => {
  const settingList = helper.createRootMemo(() => store.prop.editSettingList(defaultSettingList()));
  return (() => {
    var _el$ = web.template(\`<div>\`)();
    web.addEventListener(_el$, "click", stopPropagation);
    web.addEventListener(_el$, "scroll", stopPropagation);
    _el$.addEventListener("wheel", e => canScroll(e, refs.settingPanel) && e.stopPropagation());
    var _ref$ = bindRef('settingPanel');
    typeof _ref$ === "function" && web.use(_ref$, _el$);
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return settingList();
      },
      children: ([name, SettingItem, initShow], i) => {
        const [show, setShwo] = solidJs.createSignal(Boolean(initShow));
        return [web.memo(() => web.memo(() => !!i())() ? web.template(\`<hr>\`)() : null), (() => {
          var _el$2 = web.template(\`<div><div></div><div>\`)(),
            _el$3 = _el$2.firstChild,
            _el$4 = _el$3.nextSibling;
          web.addEventListener(_el$3, "click", () => setShwo(prev => !prev));
          web.insert(_el$3, name, null);
          web.insert(_el$3, () => show() ? null : ' …', null);
          web.insert(_el$4, web.createComponent(SettingItem, {}));
          web.effect(_p$ => {
            var _v$3 = modules_c21c94f2$1.SettingBlock,
              _v$4 = show(),
              _v$5 = modules_c21c94f2$1.SettingBlockSubtitle,
              _v$6 = modules_c21c94f2$1.SettingBlockBody;
            _v$3 !== _p$.e && web.className(_el$2, _p$.e = _v$3);
            _v$4 !== _p$.t && web.setAttribute(_el$2, "data-show", _p$.t = _v$4);
            _v$5 !== _p$.a && web.className(_el$3, _p$.a = _v$5);
            _v$6 !== _p$.o && web.className(_el$4, _p$.o = _v$6);
            return _p$;
          }, {
            e: undefined,
            t: undefined,
            a: undefined,
            o: undefined
          });
          return _el$2;
        })()];
      }
    }));
    web.effect(_p$ => {
      var _v$ = \`\${modules_c21c94f2$1.SettingPanel} \${modules_c21c94f2$1.beautifyScrollbar}\`,
        _v$2 = helper.lang() === 'zh' ? '15em' : '20em';
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$.style.setProperty("width", _v$2) : _el$.style.removeProperty("width"));
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$;
  })();
};

const ZoomButton = () => web.createComponent(IconButton, {
  get tip() {
    return web.memo(() => store.option.zoom.ratio === 100)() ? helper.t('button.zoom_in') : helper.t('button.zoom_out');
  },
  get enabled() {
    return store.option.zoom.ratio !== 100;
  },
  onClick: () => doubleClickZoom(),
  get children() {
    return web.createComponent(solidJs.Show, {
      get when() {
        return store.option.zoom.ratio === 100;
      },
      get fallback() {
        return web.createComponent(MdZoomOut, {});
      },
      get children() {
        return web.createComponent(MdZoomIn, {});
      }
    });
  }
});

/** 工具栏的默认按钮列表 */
const defaultButtonList = [
// 单双页模式
() => web.createComponent(IconButton, {
  get tip() {
    return web.memo(() => !!isOnePageMode())() ? helper.t('button.page_mode_single') : helper.t('button.page_mode_double');
  },
  get hidden() {
    return store.isMobile;
  },
  onClick: switchOnePageMode,
  get children() {
    return web.memo(() => !!isOnePageMode())() ? web.createComponent(MdLooksOne, {}) : web.createComponent(MdLooksTwo, {});
  }
}),
// 卷轴模式
() => web.createComponent(IconButton, {
  get tip() {
    return helper.t('button.scroll_mode');
  },
  get enabled() {
    return store.option.scrollMode.enabled;
  },
  onClick: switchScrollMode,
  get children() {
    return web.createComponent(MdViewDay, {});
  }
}),
// 页面填充
() => web.createComponent(IconButton, {
  get tip() {
    return helper.t('button.page_fill');
  },
  get enabled() {
    return Boolean(store.fillEffect[nowFillIndex()]);
  },
  get hidden() {
    return isOnePageMode();
  },
  onClick: switchFillEffect,
  get children() {
    return web.createComponent(MdQueue, {});
  }
}),
// 网格模式
() => web.createComponent(IconButton, {
  get tip() {
    return helper.t('button.grid_mode');
  },
  get enabled() {
    return store.gridMode;
  },
  onClick: switchGridMode,
  get children() {
    return web.createComponent(MdGrid, {});
  }
}),
// 翻译
() => web.createComponent(solidJs.Show, {
  get when() {
    return store.option.translation.server !== 'disable';
  },
  get children() {
    return [web.template(\`<hr>\`)(), web.createComponent(IconButton, {
      get tip() {
        return web.memo(() => !!isTranslatingImage())() ? helper.t('button.close_current_page_translation') : helper.t('button.translate_current_page');
      },
      get enabled() {
        return isTranslatingImage();
      },
      onClick: translateCurrent,
      get children() {
        return web.createComponent(MdTranslate, {});
      }
    }), web.createComponent(IconButton, {
      get tip() {
        return helper.t('setting.translation.translate_to_end');
      },
      get enabled() {
        return isTranslatingToEnd();
      },
      get hidden() {
        return store.option.translation.server !== 'selfhosted';
      },
      onClick: translateToEnd,
      get children() {
        return web.createComponent(MdLowPriority, {});
      }
    })];
  }
}), () => web.template(\`<hr>\`)(),
// 放大模式
() => web.createComponent(solidJs.Show, {
  get when() {
    return store.option.scrollMode.enabled;
  },
  get fallback() {
    return web.createComponent(ZoomButton, {});
  },
  get children() {
    return [web.createComponent(IconButton, {
      get tip() {
        return helper.t('button.zoom_in');
      },
      get enabled() {
        return store.option.scrollMode.imgScale >= 3;
      },
      onClick: () => zoomScrollModeImg(0.05),
      get children() {
        return web.createComponent(MdZoomIn, {});
      }
    }), web.createComponent(IconButton, {
      get tip() {
        return helper.t('button.zoom_out');
      },
      get enabled() {
        return store.option.scrollMode.imgScale <= 0.1;
      },
      onClick: () => zoomScrollModeImg(-0.05),
      get children() {
        return web.createComponent(MdZoomOut, {});
      }
    })];
  }
}),
// 全屏
() => web.createComponent(IconButton, {
  get tip() {
    return web.memo(() => !!store.fullscreen)() ? helper.t('button.fullscreen_exit') : helper.t('button.fullscreen');
  },
  get hidden() {
    return !refs.root.requestFullscreen;
  },
  onClick: switchFullscreen,
  get children() {
    return web.memo(() => !!store.fullscreen)() ? web.createComponent(MdFullscreenExit, {}) : web.createComponent(MdFullscreen, {});
  }
}),
// 设置
() => {
  const [showPanel, setShowPanel] = solidJs.createSignal(false);
  const handleClick = () => {
    const _showPanel = !showPanel();
    _setState('show', 'toolbar', _showPanel);
    setShowPanel(_showPanel);
  };
  helper.createEffectOn(() => store.show.toolbar, showToolbar => showToolbar || setShowPanel(false));
  const popper = solidJs.createMemo(() => [web.createComponent(SettingPanel, {}), (() => {
    var _el$3 = web.template(\`<div role=button tabindex=-1>\`)();
    _el$3.addEventListener("wheel", e => {
      if (isScrollMode()) refs.mangaBox.scrollBy({
        top: e.deltaY
      });
    });
    web.addEventListener(_el$3, "click", handleClick);
    web.effect(() => web.className(_el$3, modules_c21c94f2$1.closeCover));
    return _el$3;
  })()]);
  return web.createComponent(IconButton, {
    get tip() {
      return helper.t('button.setting');
    },
    get enabled() {
      return showPanel();
    },
    get showTip() {
      return showPanel();
    },
    onClick: handleClick,
    get popperClassName() {
      return showPanel() && modules_c21c94f2$1.SettingPanelPopper;
    },
    get popper() {
      return web.memo(() => !!showPanel())() && popper();
    },
    get children() {
      return web.createComponent(MdSettings, {});
    }
  });
}];


/** 左侧工具栏 */
const Toolbar = () => {
  helper.createEffectOn(() => store.show.toolbar, show => show || focus());
  return (() => {
    var _el$ = web.template(\`<div role=toolbar><div><div>\`)(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild;
    web.addEventListener(_el$2, "click", focus);
    web.insert(_el$2, web.createComponent(solidJs.For, {
      get each() {
        return store.prop.editButtonList(defaultButtonList);
      },
      children: ButtonItem => web.createComponent(ButtonItem, {})
    }), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.toolbar,
        _v$2 = helper.boolDataVal(store.show.toolbar),
        _v$3 = helper.boolDataVal(store.isMobile && store.gridMode),
        _v$4 = store.isDragMode ? 'none' : undefined,
        _v$5 = modules_c21c94f2$1.toolbarPanel,
        _v$6 = modules_c21c94f2$1.toolbarBg;
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-show", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$, "data-close", _p$.a = _v$3);
      _v$4 !== _p$.o && ((_p$.o = _v$4) != null ? _el$.style.setProperty("pointer-events", _v$4) : _el$.style.removeProperty("pointer-events"));
      _v$5 !== _p$.i && web.className(_el$2, _p$.i = _v$5);
      _v$6 !== _p$.n && web.className(_el$3, _p$.n = _v$6);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined
    });
    return _el$;
  })();
};

const getScrollbarPage = (img, i, double = false) => {
  let num;
  if (store.option.scrollMode.enabled) num = getImg(i).size.height;else num = double ? 2 : 1;
  return {
    num,
    loadType: img.loadType,
    isNull: !img.src,
    translationType: img.translationType
  };
};
const ScrollbarPage = props => {
  const flexBasis = solidJs.createMemo(() => props.num / (store.option.scrollMode.enabled ? contentHeight() : store.imgList.length));
  return (() => {
    var _el$ = web.template(\`<div>\`)();
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.scrollbarPage,
        _v$2 = \`\${flexBasis() * 100}%\`,
        _v$3 = props.loadType,
        _v$4 = helper.boolDataVal(props.isNull),
        _v$5 = props.translationType;
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$.style.setProperty("flex-basis", _v$2) : _el$.style.removeProperty("flex-basis"));
      _v$3 !== _p$.a && web.setAttribute(_el$, "data-type", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$, "data-null", _p$.o = _v$4);
      _v$5 !== _p$.i && web.setAttribute(_el$, "data-translation-type", _p$.i = _v$5);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
};

/** 显示对应图片加载情况的元素 */
const ScrollbarPageStatus = () => {
  // 将相同类型的页面合并显示
  const scrollbarPageList = helper.createThrottleMemo(() => {
    if (store.pageList.length === 0) return [];
    const list = [];
    let item;
    const handleImg = (i, double = false) => {
      const img = getImg(i);
      if (!item) {
        item = getScrollbarPage(img, i, double);
        return;
      }
      if (img.loadType === item.loadType && !img.src === item.isNull && img.translationType === item.translationType) {
        if (store.option.scrollMode.enabled) item.num += img.size.height;else item.num += double ? 2 : 1;
      } else {
        list.push(item);
        item = getScrollbarPage(img, i, double);
      }
    };
    for (let i = 0; i < store.pageList.length; i++) {
      const [a, b] = store.pageList[i];
      if (b === undefined) handleImg(a, !isOnePageMode());else if (a === -1) {
        handleImg(b);
        handleImg(b);
      } else if (b === -1) {
        handleImg(a);
        handleImg(a);
      } else {
        handleImg(a);
        handleImg(b);
      }
    }
    if (item) list.push(item);
    return list;
  }, 200);
  return web.createComponent(solidJs.For, {
    get each() {
      return scrollbarPageList();
    },
    children: page => web.createComponent(ScrollbarPage, page)
  });
};


/** 滚动条 */
const Scrollbar = () => {
  solidJs.onMount(() => {
    helper.useDrag({
      ref: refs.scrollbar,
      handleDrag: handleScrollbarSlider,
      easyMode: () => isScrollMode() && store.option.scrollbar.easyScroll,
      setCapture: true
    });
    watchDomSize('scrollbarSize', refs.scrollbar);
  });

  // 在被滚动时使自身可穿透，以便在卷轴模式下触发页面的滚动
  const [penetrate, setPenetrate] = solidJs.createSignal(false);
  const resetPenetrate = helper.debounce(() => setPenetrate(false));
  const handleWheel = () => {
    setPenetrate(true);
    resetPenetrate();
  };

  /** 是否强制显示滚动条 */
  const showScrollbar = solidJs.createMemo(() => store.show.scrollbar || Boolean(penetrate()));

  /** 滚动条提示文本 */
  const tipText = helper.createThrottleMemo(() => {
    if (store.showRange[0] === store.showRange[1]) return getPageTip(store.showRange[0]);

    /** 并排卷轴模式下的滚动条提示文本 */
    if (isAbreastMode()) {
      const columns = abreastArea().columns.slice(abreastShowColumn().start, abreastShowColumn().end + 1).map(column => column.map(getPageTip));
      if (store.option.dir !== 'rtl') columns.reverse();
      return columns.map(column => column.join(' ')).join('\\n');
    }
    const tipList = [];
    for (let i = store.showRange[0]; i <= store.showRange[1]; i++) tipList.push(getPageTip(i));
    if (isOnePageMode() || isDoubleMode()) return tipList.join('\\n');
    if (tipList.length === 1) return tipList[0];
    if (store.option.dir === 'rtl') tipList.reverse();
    return tipList.join('   ');
  });
  useStyleMemo(\`.\${modules_c21c94f2$1.scrollbar}\`, {
    'pointer-events': () => penetrate() || store.isDragMode || store.gridMode ? 'none' : 'auto',
    '--scroll-length': () => \`\${scrollDomLength()}px\`,
    '--slider-midpoint': () => \`\${sliderMidpoint()}px\`,
    '--slider-height': () => \`\${sliderHeight() * scrollDomLength()}px\`,
    '--slider-top': sliderTop
  });
  const _Scrollbar = props => (() => {
    var _el$ = web.template(\`<div role=scrollbar tabindex=-1>\`)();
    _el$.addEventListener("wheel", handleWheel);
    var _ref$ = props.ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$) : props.ref = _el$;
    web.insert(_el$, () => props.children);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.scrollbar,
        _v$2 = modules_c21c94f2$1.mangaFlow,
        _v$3 = store.activePageIndex || -1,
        _v$4 = helper.boolDataVal(store.option.scrollbar.autoHidden),
        _v$5 = helper.boolDataVal(showScrollbar()),
        _v$6 = store.option.dir,
        _v$7 = scrollPosition(),
        _v$8 = helper.boolDataVal(isAbreastMode()),
        _v$9 = helper.boolDataVal(isDrag()),
        _v$10 = props.style;
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "aria-controls", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$, "aria-valuenow", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$, "data-auto-hidden", _p$.o = _v$4);
      _v$5 !== _p$.i && web.setAttribute(_el$, "data-force-show", _p$.i = _v$5);
      _v$6 !== _p$.n && web.setAttribute(_el$, "data-dir", _p$.n = _v$6);
      _v$7 !== _p$.s && web.setAttribute(_el$, "data-position", _p$.s = _v$7);
      _v$8 !== _p$.h && web.setAttribute(_el$, "data-is-abreast-mode", _p$.h = _v$8);
      _v$9 !== _p$.r && web.setAttribute(_el$, "data-drag", _p$.r = _v$9);
      _p$.d = web.style(_el$, _v$10, _p$.d);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined
    });
    return _el$;
  })();
  return [web.createComponent(_Scrollbar, {
    ref(r$) {
      var _ref$2 = bindRef('scrollbar');
      typeof _ref$2 === "function" && _ref$2(r$);
    },
    get children() {
      return [(() => {
        var _el$2 = web.template(\`<div>\`)();
        web.insert(_el$2, tipText);
        web.effect(() => web.className(_el$2, modules_c21c94f2$1.scrollbarPoper));
        return _el$2;
      })(), web.createComponent(solidJs.Show, {
        get when() {
          return store.option.scrollbar.showImgStatus;
        },
        get children() {
          return web.createComponent(ScrollbarPageStatus, {});
        }
      })];
    }
  }), web.createComponent(_Scrollbar, {
    style: {
      'mix-blend-mode': 'difference',
      'pointer-events': 'none'
    },
    get children() {
      var _el$3 = web.template(\`<div>\`)();
      web.effect(_p$ => {
        var _v$11 = modules_c21c94f2$1.scrollbarSlider,
          _v$12 = {
            [modules_c21c94f2$1.hidden]: store.gridMode
          };
        _v$11 !== _p$.e && web.className(_el$3, _p$.e = _v$11);
        _p$.t = web.classList(_el$3, _v$12, _p$.t);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      return _el$3;
    }
  })];
};

let delayTypeTimer = 0;
const EndPage = () => {
  const handleClick = e => {
    e.stopPropagation();
    if (e.target?.nodeName !== 'BUTTON') _setState('show', 'endPage', undefined);
    focus();
  };
  let ref;
  const [isDrag, setIsDrag] = solidJs.createSignal(false);
  const [dragY, setDragY] = solidJs.createSignal(0);
  const handleDrag = ({
    type,
    xy: [, y],
    initial: [, iy],
    startTime
  }) => {
    switch (type) {
      case 'down':
        return setIsDrag(true);
      case 'move':
        return setDragY(y - iy);
    }
    const pageDir = getTurnPageDir(-dragY(), store.rootSize.height / 2, startTime);
    if (pageDir) turnPage(pageDir);
    setDragY(0);
    setIsDrag(false);
  };
  solidJs.onMount(() => {
    ref.addEventListener('wheel', e => {
      e.preventDefault();
      e.stopPropagation();
      turnPage(e.deltaY > 0 ? 'next' : 'prev');
    }, {
      passive: false
    });
    helper.useDrag({
      ref,
      handleDrag,
      skip: e => e.target.matches(\`.\${modules_c21c94f2$1.comments}, .\${modules_c21c94f2$1.comments} *\`)
    });
  });

  // state.show.endPage 变量的延时版本，在隐藏的动画效果结束之后才会真正改变
  // 防止在动画效果结束前 tip 就消失或改变了位置
  const [delayType, setDelayType] = solidJs.createSignal();
  solidJs.createEffect(() => {
    if (store.show.endPage) {
      window.clearTimeout(delayTypeTimer);
      setDelayType(store.show.endPage);
    } else {
      delayTypeTimer = window.setTimeout(() => setDelayType(store.show.endPage), 500);
    }
  });
  const tip = solidJs.createMemo(() => {
    if (store.option.scroolEnd === 'none') return '';
    switch (delayType()) {
      case 'start':
        if (!store.prop.onPrev || store.option.scroolEnd !== 'auto') break;
        return helper.t('end_page.tip.start_jump');
      case 'end':
        if (store.prop.onNext && store.option.scroolEnd === 'auto') return helper.t('end_page.tip.end_jump');
        if (store.prop.onExit) return helper.t('end_page.tip.exit');
    }
    return '';
  });
  return (() => {
    var _el$ = web.template(\`<div role=button tabindex=-1><div><p></p><button type=button></button><button type=button data-is-end></button><button type=button>\`)(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.nextSibling;
    web.addEventListener(_el$, "click", handleClick);
    var _ref$ = ref;
    typeof _ref$ === "function" ? web.use(_ref$, _el$) : ref = _el$;
    web.insert(_el$3, tip);
    web.addEventListener(_el$4, "click", () => store.prop.onPrev?.());
    var _ref$2 = bindRef('prev');
    typeof _ref$2 === "function" && web.use(_ref$2, _el$4);
    web.insert(_el$4, () => helper.t('end_page.prev_button'));
    web.addEventListener(_el$5, "click", () => store.prop.onExit?.(store.show.endPage === 'end'));
    var _ref$3 = bindRef('exit');
    typeof _ref$3 === "function" && web.use(_ref$3, _el$5);
    web.insert(_el$5, () => helper.t('button.exit'));
    web.addEventListener(_el$6, "click", () => store.prop.onNext?.());
    var _ref$4 = bindRef('next');
    typeof _ref$4 === "function" && web.use(_ref$4, _el$6);
    web.insert(_el$6, () => helper.t('end_page.next_button'));
    web.insert(_el$2, web.createComponent(solidJs.Show, {
      get when() {
        return store.option.showComment && delayType() === 'end' && store.commentList?.length;
      },
      get children() {
        var _el$7 = web.template(\`<div>\`)();
        web.addEventListener(_el$7, "wheel", stopPropagation);
        web.insert(_el$7, web.createComponent(solidJs.For, {
          get each() {
            return store.commentList;
          },
          children: comment => (() => {
            var _el$8 = web.template(\`<p>\`)();
            web.insert(_el$8, comment);
            return _el$8;
          })()
        }));
        web.effect(() => web.className(_el$7, \`\${modules_c21c94f2$1.comments} \${modules_c21c94f2$1.beautifyScrollbar}\`));
        return _el$7;
      }
    }), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.endPage,
        _v$2 = store.show.endPage,
        _v$3 = delayType(),
        _v$4 = helper.boolDataVal(isDrag()),
        _v$5 = dir() === 'rtl' ? 'row-reverse' : undefined,
        _v$6 = modules_c21c94f2$1.endPageBody,
        _v$7 = \`\${dragY()}px\`,
        _v$8 = modules_c21c94f2$1.tip,
        _v$9 = {
          [modules_c21c94f2$1.invisible]: !store.prop.onPrev
        },
        _v$10 = store.show.endPage ? 0 : -1,
        _v$11 = store.show.endPage ? 0 : -1,
        _v$12 = {
          [modules_c21c94f2$1.invisible]: !store.prop.onNext
        },
        _v$13 = store.show.endPage ? 0 : -1;
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-show", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$, "data-type", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$, "data-drag", _p$.o = _v$4);
      _v$5 !== _p$.i && ((_p$.i = _v$5) != null ? _el$.style.setProperty("flex-direction", _v$5) : _el$.style.removeProperty("flex-direction"));
      _v$6 !== _p$.n && web.className(_el$2, _p$.n = _v$6);
      _v$7 !== _p$.s && ((_p$.s = _v$7) != null ? _el$2.style.setProperty("--drag-y", _v$7) : _el$2.style.removeProperty("--drag-y"));
      _v$8 !== _p$.h && web.className(_el$3, _p$.h = _v$8);
      _p$.r = web.classList(_el$4, _v$9, _p$.r);
      _v$10 !== _p$.d && web.setAttribute(_el$4, "tabindex", _p$.d = _v$10);
      _v$11 !== _p$.l && web.setAttribute(_el$5, "tabindex", _p$.l = _v$11);
      _p$.u = web.classList(_el$6, _v$12, _p$.u);
      _v$13 !== _p$.c && web.setAttribute(_el$6, "tabindex", _p$.c = _v$13);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined,
      l: undefined,
      u: undefined,
      c: undefined
    });
    return _el$;
  })();
};

const createComicImg = src => ({
  src,
  loadType: 'wait',
  size: placeholderSize(),
  blobUrl: src.startsWith('blob:') ? src : undefined
});
const useInit = props => {
  watchDomSize('rootSize', refs.root);
  const updateOption = state => {
    state.option = props.option ? helper.assign(state.defaultOption, props.option) : state.defaultOption;
  };
  const bindDebounce = key => state => {
    state.prop[key] = props[key] ? helper.debounce(props[key]) : undefined;
  };
  const watchProps = {
    option: updateOption,
    onLoading: bindDebounce('onLoading'),
    onOptionChange: bindDebounce('onOptionChange'),
    onHotkeysChange: bindDebounce('onHotkeysChange'),
    onShowImgsChange: bindDebounce('onShowImgsChange'),
    defaultOption(state) {
      state.defaultOption = helper.assign(defaultOption(), props.defaultOption);
      updateOption(state);
    },
    fillEffect(state) {
      state.fillEffect = props.fillEffect ?? {
        '-1': true
      };
      updatePageData(state);
    },
    onExit(state) {
      state.prop.onExit = isEnd => {
        playAnimation(refs.exit);
        props.onExit?.(Boolean(isEnd));
        setState(draftState => {
          if (isEnd) draftState.activePageIndex = 0;
          draftState.show.endPage = undefined;
        });
      };
    },
    onPrev(state) {
      state.prop.onPrev = props.onPrev ? helper.throttle(() => {
        playAnimation(refs.prev);
        props.onPrev?.();
      }, 1000) : undefined;
    },
    onNext(state) {
      state.prop.onNext = props.onNext ? helper.throttle(() => {
        playAnimation(refs.next);
        props.onNext?.();
      }, 1000) : undefined;
    },
    onImgError(state) {
      state.prop.onImgError = props.onImgError;
    },
    editButtonList(state) {
      state.prop.editButtonList = props.editButtonList ?? (list => list);
    },
    editSettingList(state) {
      state.prop.editSettingList = props.editSettingList ?? (list => list);
    },
    commentList(state) {
      state.commentList = props.commentList;
    },
    title(state) {
      state.title = props.title ?? '';
    }
  };
  for (const [key, fn] of Object.entries(watchProps)) {
    solidJs.createEffect(solidJs.on(() => props[key], () => setState(fn)));
  }
  solidJs.createEffect(() => {
    setState(state => {
      state.hotkeys = {
        ...JSON.parse(JSON.stringify(defaultHotkeys())),
        ...props.hotkeys
      };
    });
  });
  const handleImgList = () => {
    setState(state => {
      // 使用相对协议路径，防止 Mixed Content 报错
      const imgList = props.imgList.map(url => url?.replace(/^http:/, ''));

      /** 修改前的当前显示图片 */
      const oldActiveImg = state.pageList[state.activePageIndex]?.map(i => state.imgList?.[i]) ?? [];

      /** 是否需要重置页面填充 */
      let needResetFillEffect = false;
      const fillEffectList = Object.keys(state.fillEffect).map(Number);
      for (const pageIndex of fillEffectList) {
        if (pageIndex === -1) continue;
        if (state.imgList[pageIndex] === imgList[pageIndex]) continue;
        needResetFillEffect = true;
        break;
      }
      const newImgList = new Set(imgList);
      const oldImgList = new Set(state.imgList);
      if (oldImgList.size === 0 && newImgList.size > 0) {
        resumeReadProgress(state);
        updateSelfhostedOptions(true);
      }

      /** 被删除的图片 */
      const deleteList = [...oldImgList].filter(url => !newImgList.has(url));
      for (const url of deleteList) if (state.imgMap[url].blobUrl && state.imgMap[url].blobUrl !== url) URL.revokeObjectURL(state.imgMap[url].blobUrl);

      /** 删除图片数 */
      const deleteNum = deleteList.length;

      /** 传入的是否是新漫画 */
      const isNew = deleteNum >= oldImgList.size * 0.8; // 删掉8成图就算是新漫画

      /** 是否需要更新页面 */
      const needUpdatePageData = needResetFillEffect || state.imgList.length !== imgList.length || deleteNum > 0;
      const newImgMap = {};
      for (const url of imgList) newImgMap[url] = state.imgMap[url] ?? createComicImg(url);
      state.imgMap = newImgMap;
      state.imgList = imgList;
      state.prop.onLoading?.(state.imgList.map(url => state.imgMap[url]));
      if (isNew) state.show.endPage = undefined;
      if (isNew || needResetFillEffect) state.fillEffect = props.fillEffect ?? {
        '-1': true
      };
      if (isNew || needUpdatePageData) {
        updatePageData(state);

        // 当前位于最后一页时最后一页被删的处理
        if (state.activePageIndex >= state.pageList.length) state.activePageIndex = state.pageList.length - 1;
        updateShowRange(state);
      }
      if (isNew || state.pageList.length === 0) {
        resetImgState(state);
        state.activePageIndex = 0;
        scrollTo(0);
        return;
      }

      // 尽量使当前显示的图片在修改后依然不变
      oldActiveImg.some(url => {
        // 跳过填充页和已被删除的图片
        if (!url || imgList.includes(url)) return false;
        const newPageIndex = state.pageList.findIndex(page => page.some(index => state.imgList?.[index] === url));
        if (newPageIndex === -1) return false;
        state.activePageIndex = newPageIndex;
        return true;
      });

      // 如果已经翻到了最后一页，且最后一页的图片被删掉了，那就保持在末页显示
      if (state.activePageIndex > state.pageList.length - 1) state.activePageIndex = state.pageList.length - 1;
    });
  };

  // 处理 imgList 参数的初始化和修改
  helper.createEffectOn(helper.createRootMemo(() => props.imgList), helper.throttle(handleImgList, 500));

  // 通过手动创建一个 Worker 来检测是否支持 Worker，避免因为 CSP 限制而出错
  setTimeout(() => {
    const codeUrl = URL.createObjectURL(new Blob(['self.close();'], {
      type: 'text/javascript'
    }));
    setTimeout(URL.revokeObjectURL, 0, codeUrl);
    _setState('supportWorker', Boolean(new Worker(codeUrl)));
  }, 0);

  // 更新 fullscreen 参数
  refs.root.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) return _setState('fullscreen', false);
    if (document.fullscreenElement.id === 'comicRead' || document.fullscreenElement.classList.contains(modules_c21c94f2$1.root)) _setState('fullscreen', true);
  });
  for (const eventName of ['keypress', 'keyup', 'touchstart', 'touchmove', 'touchend']) refs.root.addEventListener(eventName, stopPropagation, {
    capture: true
  });
  focus();
};

/** 深色模式 */
const darkStyle = {
  '--hover-bg-color': '#FFF3',
  '--hover-bg-color-enable': '#FFFa',
  '--switch': '#BDBDBD',
  '--switch-bg': '#6E6E6E',
  '--page-bg': '#303030',
  '--secondary': '#7A909A',
  '--secondary-bg': '#556065',
  '--text': 'white',
  '--text-secondary': '#FFFC',
  '--text-bg': '#121212',
  'color-scheme': 'dark'
};

/** 浅色模式 */
const lightStyle = {
  '--hover-bg-color': '#0001',
  '--hover-bg-color-enable': '#0009',
  '--switch': '#FAFAFA',
  '--switch-bg': '#9C9C9C',
  '--page-bg': 'white',
  '--secondary': '#7A909A',
  '--secondary-bg': '#BAC5CA',
  '--text': 'black',
  '--text-secondary': '#0008',
  '--text-bg': '#FAFAFA',
  'color-scheme': 'light'
};
const createSvgIcon = (fill, d) => \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='\${fill}' viewBox='0 0 24 24'%3E%3Cpath d='\${d}'/%3E%3C/svg%3E")\`;
const MdImageNotSupported = \`m21.9 21.9-8.49-8.49-9.82-9.82L2.1 2.1.69 3.51 3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31 1.42-1.41zM5 18l3.5-4.5 2.5 3.01L12.17 15l3 3H5zm16 .17L5.83 3H19c1.1 0 2 .9 2 2v13.17z\`;
const MdCloudDownload = \`M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-4.65 4.65c-.2.2-.51.2-.71 0L7 13h3V9h4v4h3z\`;
const MdPhoto = \`M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z\`;
const useCssVar = () => {
  const svg = () => {
    const fill = store.option.darkMode ? 'rgb(156,156,156)' : 'rgb(110,110,110)';
    return {
      '--md-image-not-supported': \`\${createSvgIcon(fill, MdImageNotSupported)}\`,
      '--md-cloud-download': \`\${createSvgIcon(fill, MdCloudDownload)}\`,
      '--md-photo': \`\${createSvgIcon(fill, MdPhoto)}\`
    };
  };
  const i18n = () => ({
    '--i18n-touch-area-prev': \`"\${helper.t('touch_area.prev')}"\`,
    '--i18n-touch-area-next': \`"\${helper.t('touch_area.next')}"\`,
    '--i18n-touch-area-menu': \`"\${helper.t('touch_area.menu')}"\`
  });
  useStyleMemo(\`.\${modules_c21c94f2$1.root}\`, [{
    '--bg': () => \`\${store.option.customBackground ?? (store.option.darkMode ? '#000' : '#fff')}\`,
    '--scroll-mode-img-scale': () => store.option.scrollMode.imgScale,
    '--scroll-mode-spacing': () => store.option.scrollMode.spacing
  }, () => store.option.darkMode ? darkStyle : lightStyle, svg, i18n]);
};

solidJs.enableScheduling();
/** 漫画组件 */
const Manga = props => {
  useStyle(css$1);
  useCssVar();
  solidJs.onMount(() => useInit(props));
  solidJs.createEffect(() => props.show && focus());
  return (() => {
    var _el$ = web.template(\`<div>\`)();
    web.addEventListener(_el$, "wheel", handleWheel);
    web.addEventListener(_el$, "mousedown", handleMouseDown);
    web.addEventListener(_el$, "click", stopPropagation);
    var _ref$ = bindRef('root');
    typeof _ref$ === "function" && web.use(_ref$, _el$);
    _el$.addEventListener("keydown", handleKeyDown, true);
    web.insert(_el$, web.createComponent(ComicImgFlow, {}), null);
    web.insert(_el$, web.createComponent(TouchArea, {}), null);
    web.insert(_el$, web.createComponent(Scrollbar, {}), null);
    web.insert(_el$, web.createComponent(EndPage, {}), null);
    web.insert(_el$, web.createComponent(Toolbar, {}), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2$1.root,
        _v$2 = {
          [modules_c21c94f2$1.hidden]: props.show === false,
          [props.class ?? '']: Boolean(props.class),
          ...props.classList
        },
        _v$3 = helper.boolDataVal(store.isMobile),
        _v$4 = helper.boolDataVal(store.option.scrollMode.enabled),
        _v$5 = helper.boolDataVal(store.gridMode);
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _p$.t = web.classList(_el$, _v$2, _p$.t);
      _v$3 !== _p$.a && web.setAttribute(_el$, "data-mobile", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$, "data-scroll-mode", _p$.o = _v$4);
      _v$5 !== _p$.i && web.setAttribute(_el$, "data-grid-mode", _p$.i = _v$5);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
};

exports.Manga = Manga;
exports._setAbreastScrollFill = _setAbreastScrollFill;
exports._setState = _setState;
exports.abreastArea = abreastArea;
exports.abreastColumnWidth = abreastColumnWidth;
exports.abreastContentWidth = abreastContentWidth;
exports.abreastScrollFill = abreastScrollFill;
exports.abreastScrollWidth = abreastScrollWidth;
exports.abreastShowColumn = abreastShowColumn;
exports.activeImgIndex = activeImgIndex;
exports.activePage = activePage;
exports.autoPageNum = autoPageNum;
exports.bindRef = bindRef;
exports.bindScrollTop = bindScrollTop;
exports.bound = bound;
exports.checkImgSize = checkImgSize;
exports.closeScrollLock = closeScrollLock;
exports.contentHeight = contentHeight;
exports.createStateSetFn = createStateSetFn;
exports.createTranslateRange = createTranslateRange;
exports.defaultHotkeys = defaultHotkeys;
exports.doubleClickZoom = doubleClickZoom;
exports.doubleScrollLineHeight = doubleScrollLineHeight;
exports.downloadImg = downloadImg;
exports.findFillIndex = findFillIndex;
exports.focus = focus;
exports.getImg = getImg;
exports.getImgEle = getImgEle;
exports.getImgIndexs = getImgIndexs;
exports.getImgTip = getImgTip;
exports.getPageTip = getPageTip;
exports.getTurnPageDir = getTurnPageDir;
exports.handleClick = handleClick;
exports.handleComicData = handleComicData;
exports.handleImgError = handleImgError;
exports.handleImgLoaded = handleImgLoaded;
exports.handleKeyDown = handleKeyDown;
exports.handleMangaFlowDrag = handleMangaFlowDrag;
exports.handleMouseDown = handleMouseDown;
exports.handlePinchZoom = handlePinchZoom;
exports.handleScrollModeDrag = handleScrollModeDrag;
exports.handleScrollbarSlider = handleScrollbarSlider;
exports.handleTrackpadWheel = handleTrackpadWheel;
exports.handleWheel = handleWheel;
exports.handleZoomDrag = handleZoomDrag;
exports.hotkeysMap = hotkeysMap;
exports.imgAreaStyle = imgAreaStyle;
exports.imgList = imgList;
exports.imgPageMap = imgPageMap;
exports.imgShowState = imgShowState;
exports.imgTopList = imgTopList;
exports.isAbreastMode = isAbreastMode;
exports.isBottom = isBottom;
exports.isDoubleMode = isDoubleMode;
exports.isDrag = isDrag;
exports.isEnableBg = isEnableBg;
exports.isOnePageMode = isOnePageMode;
exports.isScrollMode = isScrollMode;
exports.isTop = isTop;
exports.isTranslatingAll = isTranslatingAll;
exports.isTranslatingImage = isTranslatingImage;
exports.isTranslatingToEnd = isTranslatingToEnd;
exports.jumpToImg = jumpToImg;
exports.loadingImgList = loadingImgList;
exports.nowFillIndex = nowFillIndex;
exports.pageNum = pageNum;
exports.placeholderSize = placeholderSize;
exports.preloadNum = preloadNum;
exports.renderImgList = renderImgList;
exports.resetImgState = resetImgState;
exports.resetPage = resetPage;
exports.resetUI = resetUI;
exports.resumeReadProgress = resumeReadProgress;
exports.saveReadProgress = saveReadProgress;
exports.saveScrollProgress = saveScrollProgress;
exports.scrollDomLength = scrollDomLength;
exports.scrollLength = scrollLength;
exports.scrollModTop = scrollModTop;
exports.scrollPercentage = scrollPercentage;
exports.scrollPosition = scrollPosition;
exports.scrollProgress = scrollProgress;
exports.scrollTo = scrollTo;
exports.scrollTop = scrollTop;
exports.scrollViewImg = scrollViewImg;
exports.selfhostedOptions = selfhostedOptions;
exports.selfhostedTranslation = selfhostedTranslation;
exports.setAbreastScrollFill = setAbreastScrollFill;
exports.setDefaultHotkeys = setDefaultHotkeys;
exports.setImgTranslationEnbale = setImgTranslationEnbale;
exports.setIsDrag = setIsDrag;
exports.setOption = setOption;
exports.setSelfOptions = setSelfOptions;
exports.setState = setState;
exports.showImgList = showImgList;
exports.sliderHeight = sliderHeight;
exports.sliderMidpoint = sliderMidpoint;
exports.sliderTop = sliderTop;
exports.store = store;
exports.switchDir = switchDir;
exports.switchFillEffect = switchFillEffect;
exports.switchFitToWidth = switchFitToWidth;
exports.switchFullscreen = switchFullscreen;
exports.switchGridMode = switchGridMode;
exports.switchOnePageMode = switchOnePageMode;
exports.switchScrollMode = switchScrollMode;
exports.touches = touches;
exports.translateAll = translateAll;
exports.translateCurrent = translateCurrent;
exports.translateToEnd = translateToEnd;
exports.translationAll = translationAll;
exports.translationImage = translationImage;
exports.translatorOptions = translatorOptions;
exports.turnPage = turnPage;
exports.turnPageAnimation = turnPageAnimation;
exports.turnPageFn = turnPageFn;
exports.updateImgLoadType = updateImgLoadType;
exports.updateImgSize = updateImgSize;
exports.updateImgType = updateImgType;
exports.updatePageData = updatePageData;
exports.updateSelfhostedOptions = updateSelfhostedOptions;
exports.updateShowRange = updateShowRange;
exports.watchDomSize = watchDomSize;
exports.zoom = zoom;
exports.zoomScrollModeImg = zoomScrollModeImg;
`
break;
case 'components/IconButton':
code =`
const web = require('solid-js/web');
const solidJs = require('solid-js');
const helper = require('helper');

var css = ".iconButtonItem____hash_base64_5_{align-items:center;display:flex;position:relative}.iconButton____hash_base64_5_{align-items:center;background-color:initial;border-radius:9999px;border-style:none;color:var(--text,#fff);cursor:pointer;display:flex;font-size:1.5em;height:1.5em;justify-content:center;margin:.1em;outline:none;padding:0;width:1.5em}.iconButton____hash_base64_5_:focus,.iconButton____hash_base64_5_:hover{background-color:var(--hover-bg-color,#fff3)}.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_){background-color:var(--text,#fff);color:var(--text-bg,#121212)}.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_):focus,.iconButton____hash_base64_5_.enabled____hash_base64_5_:not(.disable____hash_base64_5_):hover{background-color:var(--hover-bg-color-enable,#fffa)}.iconButton____hash_base64_5_.disable____hash_base64_5_{background-color:unset;cursor:not-allowed;opacity:.5}.iconButton____hash_base64_5_>svg{width:1em}.iconButtonPopper____hash_base64_5_{align-items:center;background-color:#303030;border-radius:.3em;color:#fff;display:flex;font-size:.8em;opacity:0;padding:.4em .5em;pointer-events:none;position:absolute;top:50%;transform:translateY(-50%);-webkit-user-select:none;user-select:none;white-space:nowrap}.iconButtonPopper____hash_base64_5_[data-placement=right]{left:calc(100% + 1.5em)}.iconButtonPopper____hash_base64_5_[data-placement=right]:before{border-right-color:var(--switch-bg,#6e6e6e);border-right-width:.5em;right:calc(100% + .5em)}.iconButtonPopper____hash_base64_5_[data-placement=left]{right:calc(100% + 1.5em)}.iconButtonPopper____hash_base64_5_[data-placement=left]:before{border-left-color:var(--switch-bg,#6e6e6e);border-left-width:.5em;left:calc(100% + .5em)}.iconButtonPopper____hash_base64_5_:before{background-color:initial;border:.4em solid #0000;content:\\"\\";pointer-events:none;position:absolute;transition:opacity .15s}.iconButtonItem____hash_base64_5_:is(:hover,:focus,[data-show=true]) .iconButtonPopper____hash_base64_5_{opacity:1}.hidden____hash_base64_5_{display:none}";
var modules_c21c94f2 = {"iconButtonItem":"iconButtonItem____hash_base64_5_","iconButton":"iconButton____hash_base64_5_","enabled":"enabled____hash_base64_5_","disable":"disable____hash_base64_5_","iconButtonPopper":"iconButtonPopper____hash_base64_5_","hidden":"hidden____hash_base64_5_"};

/** 图标按钮 */
const IconButton = _props => {
  const props = solidJs.mergeProps({
    placement: 'right'
  }, _props);
  let buttonRef;
  const handleClick = e => {
    if (props.disable) return;
    props.onClick?.(e);
    // 在每次点击后取消焦点
    buttonRef?.blur();
  };
  return (() => {
    var _el$ = web.template(\`<div><button type=button tabindex=0>\`)(),
      _el$2 = _el$.firstChild;
    web.use(ref => helper.useStyle(css, ref), _el$);
    web.addEventListener(_el$2, "click", handleClick);
    var _ref$ = buttonRef;
    typeof _ref$ === "function" ? web.use(_ref$, _el$2) : buttonRef = _el$2;
    web.insert(_el$2, () => props.children);
    web.insert(_el$, (() => {
      var _c$ = web.memo(() => !!(props.popper || props.tip));
      return () => _c$() ? (() => {
        var _el$3 = web.template(\`<div>\`)();
        web.insert(_el$3, () => props.popper || props.tip);
        web.effect(_p$ => {
          var _v$6 = [modules_c21c94f2.iconButtonPopper, props.popperClassName].join(' '),
            _v$7 = props.placement;
          _v$6 !== _p$.e && web.className(_el$3, _p$.e = _v$6);
          _v$7 !== _p$.t && web.setAttribute(_el$3, "data-placement", _p$.t = _v$7);
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$3;
      })() : null;
    })(), null);
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2.iconButtonItem,
        _v$2 = props.showTip,
        _v$3 = props.tip,
        _v$4 = modules_c21c94f2.iconButton,
        _v$5 = {
          [modules_c21c94f2.hidden]: props.hidden,
          [modules_c21c94f2.enabled]: props.enabled,
          [modules_c21c94f2.disable]: props.disable
        };
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-show", _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$2, "aria-label", _p$.a = _v$3);
      _v$4 !== _p$.o && web.className(_el$2, _p$.o = _v$4);
      _p$.i = web.classList(_el$2, _v$5, _p$.i);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
};

exports.IconButton = IconButton;
`
break;
case 'components/Fab':
code =`
const web = require('solid-js/web');
const solidJs = require('solid-js');
const helper = require('helper');

const MdMenuBook = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.45 0-2.99.22-4.28.79C1.49 5.62 1 6.33 1 7.14v11.28c0 1.3 1.22 2.26 2.48 1.94.98-.25 2.02-.36 3.02-.36 1.56 0 3.22.26 4.56.92.6.3 1.28.3 1.87 0 1.34-.67 3-.92 4.56-.92 1 0 2.04.11 3.02.36 1.26.33 2.48-.63 2.48-1.94V7.14c0-.81-.49-1.52-1.22-1.85-1.28-.57-2.82-.79-4.27-.79M21 17.23c0 .63-.58 1.09-1.2.98-.75-.14-1.53-.2-2.3-.2-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5.92 0 1.83.09 2.7.28.46.1.8.51.8.98z"></path><path d="M13.98 11.01c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.54-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.71-.83.66c-1.62-.19-3.39-.04-4.73.39-.08.01-.16.03-.23.03m0 2.66c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.53-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.71-.83.66c-1.62-.19-3.39-.04-4.73.39a1 1 0 0 1-.23.03m0 2.66c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.53-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.7-.83.66c-1.62-.19-3.39-.04-4.73.39a1 1 0 0 1-.23.03">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

var css = ".fabRoot____hash_base64_5_{font-size:1.1em;touch-action:none;transition:transform .2s}.fabRoot____hash_base64_5_[data-show=false]{pointer-events:none}.fabRoot____hash_base64_5_[data-show=false]>button{transform:scale(0)}.fabRoot____hash_base64_5_[data-trans=true]{opacity:.8}.fabRoot____hash_base64_5_[data-trans=true]:focus,.fabRoot____hash_base64_5_[data-trans=true]:focus-visible,.fabRoot____hash_base64_5_[data-trans=true]:hover{opacity:1}.fab____hash_base64_5_{align-items:center;background-color:var(--fab,#607d8b);border:none;border-radius:100%;box-shadow:0 3px 5px -1px #0003,0 6px 10px 0 #00000024,0 1px 18px 0 #0000001f;color:#fff;cursor:pointer;display:flex;font-size:1em;height:3.6em;justify-content:center;transform:scale(1);transition:transform .2s;width:3.6em}.fab____hash_base64_5_>svg{font-size:1.5em;width:1em}.fab____hash_base64_5_:focus,.fab____hash_base64_5_:focus-visible{box-shadow:0 3px 5px -1px #00000080,0 6px 10px 0 #00000057,0 1px 18px 0 #00000052;outline:none}.progress____hash_base64_5_{color:#b0bec5;display:inline-block;height:100%;position:absolute;transform:rotate(-90deg);transition:transform .3s cubic-bezier(.4,0,.2,1) 0s;width:100%}.progress____hash_base64_5_>svg{stroke:currentcolor;stroke-dasharray:290%;stroke-dashoffset:100%;stroke-linecap:round;transition:stroke-dashoffset .3s cubic-bezier(.4,0,.2,1) 0s}.progress____hash_base64_5_:hover{color:#cfd8dc}.progress____hash_base64_5_[aria-valuenow=\\"1\\"]{opacity:0;transition:opacity .2s .15s}.popper____hash_base64_5_{align-items:center;background-color:#303030;border-radius:.3em;color:#fff;display:flex;font-size:.8em;opacity:0;padding:.4em .5em;pointer-events:none;position:absolute;right:calc(100% + 1.5em);top:50%;transform:translateY(-50%) scale(0);transform-origin:right;transition:transform .23s,opacity .15s;transition-delay:var(--hide-delay);white-space:nowrap}.fabRoot____hash_base64_5_[data-placement=right] .popper____hash_base64_5_{left:calc(100% + 1.5em);right:unset;transform-origin:left}.fabRoot____hash_base64_5_:is(:hover,[data-focus=true]) .popper____hash_base64_5_{opacity:1;transform:translateY(-50%) scale(1);transition-delay:0s}.speedDial____hash_base64_5_{align-items:center;bottom:0;display:flex;flex-direction:column-reverse;font-size:1.1em;padding-bottom:120%;pointer-events:none;position:absolute;touch-action:none;width:100%;z-index:-1}.speedDial____hash_base64_5_[data-placement=bottom]{bottom:unset;flex-direction:column;padding-bottom:unset;padding-top:120%;top:0}.speedDialItem____hash_base64_5_{margin:.1em 0;opacity:0;transform:scale(0);transition-delay:var(--hide-delay);transition-duration:.23s;transition-property:transform,opacity}.fabRoot____hash_base64_5_:is(:hover:not([data-show=false]),[data-focus=true]) .speedDial____hash_base64_5_,.speedDial____hash_base64_5_:hover{pointer-events:all}:is(.fabRoot____hash_base64_5_:is(:hover:not([data-show=false]),[data-focus=true]) .speedDial____hash_base64_5_)>.speedDialItem____hash_base64_5_{opacity:unset;transform:unset;transition-delay:var(--show-delay)}.backdrop____hash_base64_5_{background:#000;height:100vh;left:0;opacity:0;pointer-events:none;position:fixed;top:0;transition:opacity .5s;width:100vw}.fabRoot____hash_base64_5_[data-focus=true] .backdrop____hash_base64_5_{pointer-events:unset}:is(.fabRoot____hash_base64_5_:hover:not([data-show=false]),.fabRoot____hash_base64_5_[data-focus=true],.speedDial____hash_base64_5_:hover) .backdrop____hash_base64_5_{opacity:.4}";
var modules_c21c94f2 = {"fabRoot":"fabRoot____hash_base64_5_","fab":"fab____hash_base64_5_","progress":"progress____hash_base64_5_","popper":"popper____hash_base64_5_","speedDial":"speedDial____hash_base64_5_","speedDialItem":"speedDialItem____hash_base64_5_","backdrop":"backdrop____hash_base64_5_"};

/**
 * Fab 按钮
 */
const Fab = _props => {
  const props = solidJs.mergeProps({
    progress: 0,
    initialShow: true,
    autoTrans: false
  }, _props);

  // 上次滚动位置
  let lastY = window.scrollY;
  const [show, setShow] = solidJs.createSignal(props.initialShow);

  // 绑定滚动事件
  const handleScroll = helper.throttle(e => {
    // 跳过非用户操作的滚动
    if (!e.isTrusted) return;
    if (window.scrollY === lastY) return;
    setShow(
    // 滚动到底部时显示
    window.scrollY + window.innerHeight >= document.body.scrollHeight ||
    // 向上滚动时显示，反之隐藏
    window.scrollY - lastY < 0);
    lastY = window.scrollY;
  }, 200);
  solidJs.onMount(() => window.addEventListener('scroll', handleScroll));
  solidJs.onCleanup(() => window.removeEventListener('scroll', handleScroll));

  // 将 forceShow 的变化同步到 show 上
  solidJs.createEffect(() => props.show && setShow(props.show));
  return (() => {
    var _el$ = web.template(\`<div><button type=button tabindex=-1><span role=progressbar><svg viewBox="22 22 44 44"><circle cx=44 cy=44 r=20.2 fill=none stroke-width=3.6>\`)(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.firstChild;
    web.use(ref => helper.useStyle(css, ref), _el$);
    web.addEventListener(_el$2, "click", () => props.onClick?.());
    web.use(ref => props.ref?.(ref), _el$2);
    web.insert(_el$2, () => props.children ?? web.createComponent(MdMenuBook, {}), _el$3);
    web.insert(_el$2, (() => {
      var _c$ = web.memo(() => !!props.tip);
      return () => _c$() ? (() => {
        var _el$7 = web.template(\`<div>\`)();
        web.insert(_el$7, () => props.tip);
        web.effect(() => web.className(_el$7, modules_c21c94f2.popper));
        return _el$7;
      })() : null;
    })(), null);
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return props.speedDial?.length;
      },
      get children() {
        var _el$5 = web.template(\`<div><div>\`)(),
          _el$6 = _el$5.firstChild;
        web.addEventListener(_el$6, "click", () => props.onBackdropClick?.());
        web.insert(_el$5, web.createComponent(solidJs.For, {
          get each() {
            return props.speedDial;
          },
          children: (SpeedDialItem, i) => (() => {
            var _el$8 = web.template(\`<div>\`)();
            web.insert(_el$8, web.createComponent(SpeedDialItem, {}));
            web.effect(_p$ => {
              var _v$14 = modules_c21c94f2.speedDialItem,
                _v$15 = \`\${(i() + 1) * 30}ms\`,
                _v$16 = \`\${(props.speedDial.length - 1 - i()) * 50}ms\`,
                _v$17 = i() * 30;
              _v$14 !== _p$.e && web.className(_el$8, _p$.e = _v$14);
              _v$15 !== _p$.t && ((_p$.t = _v$15) != null ? _el$8.style.setProperty("--show-delay", _v$15) : _el$8.style.removeProperty("--show-delay"));
              _v$16 !== _p$.a && ((_p$.a = _v$16) != null ? _el$8.style.setProperty("--hide-delay", _v$16) : _el$8.style.removeProperty("--hide-delay"));
              _v$17 !== _p$.o && web.setAttribute(_el$8, "data-i", _p$.o = _v$17);
              return _p$;
            }, {
              e: undefined,
              t: undefined,
              a: undefined,
              o: undefined
            });
            return _el$8;
          })()
        }), null);
        web.effect(_p$ => {
          var _v$ = modules_c21c94f2.speedDial,
            _v$2 = props.speedDialPlacement?.(),
            _v$3 = modules_c21c94f2.backdrop;
          _v$ !== _p$.e && web.className(_el$5, _p$.e = _v$);
          _v$2 !== _p$.t && web.setAttribute(_el$5, "data-placement", _p$.t = _v$2);
          _v$3 !== _p$.a && web.className(_el$6, _p$.a = _v$3);
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined
        });
        return _el$5;
      }
    }), null);
    web.effect(_p$ => {
      var _v$4 = modules_c21c94f2.fabRoot,
        _v$5 = props.show ?? show(),
        _v$6 = props.autoTrans,
        _v$7 = props.focus,
        _v$8 = props.placement?.(),
        _v$9 = {
          ...props.style,
          '--hide-delay': \`\${props.speedDial.length * 50}ms\`
        },
        _v$10 = modules_c21c94f2.fab,
        _v$11 = modules_c21c94f2.progress,
        _v$12 = props.progress,
        _v$13 = \`\${(1 - props.progress) * 290}%\`;
      _v$4 !== _p$.e && web.className(_el$, _p$.e = _v$4);
      _v$5 !== _p$.t && web.setAttribute(_el$, "data-show", _p$.t = _v$5);
      _v$6 !== _p$.a && web.setAttribute(_el$, "data-trans", _p$.a = _v$6);
      _v$7 !== _p$.o && web.setAttribute(_el$, "data-focus", _p$.o = _v$7);
      _v$8 !== _p$.i && web.setAttribute(_el$, "data-placement", _p$.i = _v$8);
      _p$.n = web.style(_el$, _v$9, _p$.n);
      _v$10 !== _p$.s && web.className(_el$2, _p$.s = _v$10);
      _v$11 !== _p$.h && web.className(_el$3, _p$.h = _v$11);
      _v$12 !== _p$.r && web.setAttribute(_el$3, "aria-valuenow", _p$.r = _v$12);
      _v$13 !== _p$.d && ((_p$.d = _v$13) != null ? _el$4.style.setProperty("stroke-dashoffset", _v$13) : _el$4.style.removeProperty("stroke-dashoffset"));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined
    });
    return _el$;
  })();
};

exports.Fab = Fab;
`
break;
case 'components/Toast':
code =`
const web = require('solid-js/web');
const solidJs = require('solid-js');
const helper = require('helper');
const store$1 = require('solid-js/store');

const [_state, _setState] = store$1.createStore({
  ref: null,
  list: [],
  map: {}
});
const setState = fn => _setState(store$1.produce(fn));
const store = _state;
const creatId = () => {
  let id = \`\${Date.now()}\`;
  while (Reflect.has(store.map, id)) id += '_';
  return id;
};
const dismiss = id => {
  if (!Reflect.has(store.map, id)) return;
  _setState('map', id, 'exit', true);
};

const MdCheckCircle = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2M9.29 16.29 5.7 12.7a.996.996 0 1 1 1.41-1.41L10 14.17l6.88-6.88a.996.996 0 1 1 1.41 1.41l-7.59 7.59a.996.996 0 0 1-1.41 0">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdWarning = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M4.47 21h15.06c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L2.74 18c-.77 1.33.19 3 1.73 3M12 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1m1 4h-2v-2h2z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdError = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1m1 4h-2v-2h2z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdInfo = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1m1-8h-2V7h2z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

var css = ".root____hash_base64_5_{align-items:flex-end;bottom:0;display:flex;flex-direction:column;font-size:16px;pointer-events:none;position:fixed;right:0;z-index:2147483647}.item____hash_base64_5_{align-items:center;animation:bounceInRight____hash_base64_5_ .5s 1;background:#fff;border-radius:4px;box-shadow:0 1px 10px 0 #0000001a,0 2px 15px 0 #0000000d;color:#000;cursor:pointer;display:flex;margin:1em;max-width:min(30em,100vw);overflow:hidden;padding:.8em 1em;pointer-events:auto;position:relative;width:fit-content}.item____hash_base64_5_>svg{color:var(--theme);margin-right:.5em;width:1.5em}.item____hash_base64_5_[data-exit]{animation:bounceOutRight____hash_base64_5_ .5s 1}.schedule____hash_base64_5_{background-color:var(--theme);bottom:0;height:.2em;left:0;position:absolute;transform-origin:left;width:100%}.item____hash_base64_5_[data-schedule] .schedule____hash_base64_5_{transition:transform .1s}.item____hash_base64_5_:not([data-schedule]) .schedule____hash_base64_5_{animation:schedule____hash_base64_5_ linear 1 forwards}:is(.item____hash_base64_5_:hover,.item____hash_base64_5_[data-schedule],.root____hash_base64_5_[data-paused]) .schedule____hash_base64_5_{animation-play-state:paused}.msg____hash_base64_5_{line-height:1.4em;text-align:start;white-space:break-spaces;width:fit-content;word-break:break-word}.msg____hash_base64_5_ h2{margin:0}.msg____hash_base64_5_ h3{margin:.7em 0}.msg____hash_base64_5_ ul{margin:0;text-align:left}.msg____hash_base64_5_ button{background-color:#eee;border:none;border-radius:.4em;cursor:pointer;font-size:inherit;margin:0 .5em;outline:none;padding:.2em .6em}:is(.msg____hash_base64_5_ button):hover{background:#e0e0e0}p{margin:0}@keyframes schedule____hash_base64_5_{0%{transform:scaleX(1)}to{transform:scaleX(0)}}@keyframes bounceInRight____hash_base64_5_{0%,60%,75%,90%,to{animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;transform:translate3d(3000px,0,0) scaleX(3)}60%{opacity:1;transform:translate3d(-25px,0,0) scaleX(1)}75%{transform:translate3d(10px,0,0) scaleX(.98)}90%{transform:translate3d(-5px,0,0) scaleX(.995)}to{transform:translateZ(0)}}@keyframes bounceOutRight____hash_base64_5_{20%{opacity:1;transform:translate3d(-20px,0,0) scaleX(.9)}to{opacity:0;transform:translate3d(2000px,0,0) scaleX(2)}}";
var modules_c21c94f2 = {"root":"root____hash_base64_5_","item":"item____hash_base64_5_","schedule":"schedule____hash_base64_5_","msg":"msg____hash_base64_5_"};

const iconMap = {
  info: MdInfo,
  success: MdCheckCircle,
  warn: MdWarning,
  error: MdError
};
const colorMap = {
  info: '#3a97d7',
  success: '#23bb35',
  warn: '#f0c53e',
  error: '#e45042',
  custom: '#1f2936'
};

/** 删除 toast */
const dismissToast = id => setState(state => {
  state.map[id].onDismiss?.({
    ...state.map[id]
  });
  const i = state.list.indexOf(id);
  if (i !== -1) state.list.splice(i, 1);
  Reflect.deleteProperty(state.map, id);
});

/** 重置 toast 的 update 属性 */
const resetToastUpdate = id => _setState('map', id, 'update', undefined);
const ToastItem = props => {
  /** 是否要显示进度 */
  const showSchedule = solidJs.createMemo(() => props.duration === Number.POSITIVE_INFINITY && props.schedule ? true : undefined);
  const _dismiss = e => {
    e.stopPropagation();
    if (showSchedule() && 'animationName' in e) return;
    dismiss(props.id);
  };

  // 在退出动画结束后才真的删除
  const handleAnimationEnd = () => {
    if (!props.exit) return;
    dismissToast(props.id);
  };
  let scheduleRef;
  solidJs.createEffect(() => {
    if (!props.update) return;
    resetToastUpdate(props.id);
    if (!scheduleRef) return;
    for (const animation of scheduleRef.getAnimations()) {
      animation.cancel();
      animation.play();
    }
  });
  const handleClick = e => {
    props.onClick?.();
    _dismiss(e);
  };
  return (() => {
    var _el$ = web.template(\`<div><div>\`)(),
      _el$2 = _el$.firstChild;
    _el$.addEventListener("animationend", handleAnimationEnd);
    web.addEventListener(_el$, "click", handleClick);
    web.insert(_el$, web.createComponent(web.Dynamic, {
      get component() {
        return iconMap[props.type];
      }
    }), _el$2);
    web.insert(_el$2, (() => {
      var _c$ = web.memo(() => typeof props.msg === 'string');
      return () => _c$() ? props.msg : web.createComponent(props.msg, {});
    })());
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return props.duration !== Number.POSITIVE_INFINITY || props.schedule !== undefined;
      },
      get children() {
        var _el$3 = web.template(\`<div>\`)();
        _el$3.addEventListener("animationend", _dismiss);
        var _ref$ = scheduleRef;
        typeof _ref$ === "function" ? web.use(_ref$, _el$3) : scheduleRef = _el$3;
        web.effect(_p$ => {
          var _v$ = modules_c21c94f2.schedule,
            _v$2 = \`\${props.duration}ms\`,
            _v$3 = showSchedule() ? \`scaleX(\${props.schedule})\` : undefined;
          _v$ !== _p$.e && web.className(_el$3, _p$.e = _v$);
          _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$3.style.setProperty("animation-duration", _v$2) : _el$3.style.removeProperty("animation-duration"));
          _v$3 !== _p$.a && ((_p$.a = _v$3) != null ? _el$3.style.setProperty("transform", _v$3) : _el$3.style.removeProperty("transform"));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined
        });
        return _el$3;
      }
    }), null);
    web.effect(_p$ => {
      var _v$4 = modules_c21c94f2.item,
        _v$5 = colorMap[props.type],
        _v$6 = showSchedule(),
        _v$7 = props.exit,
        _v$8 = modules_c21c94f2.msg;
      _v$4 !== _p$.e && web.className(_el$, _p$.e = _v$4);
      _v$5 !== _p$.t && ((_p$.t = _v$5) != null ? _el$.style.setProperty("--theme", _v$5) : _el$.style.removeProperty("--theme"));
      _v$6 !== _p$.a && web.setAttribute(_el$, "data-schedule", _p$.a = _v$6);
      _v$7 !== _p$.o && web.setAttribute(_el$, "data-exit", _p$.o = _v$7);
      _v$8 !== _p$.i && web.className(_el$2, _p$.i = _v$8);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
};

const Toaster = () => {
  const [visible, setVisible] = solidJs.createSignal(document.visibilityState === 'visible');
  solidJs.onMount(() => {
    helper.useStyle(css, store.ref);
    const handleVisibilityChange = () => {
      setVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    solidJs.onCleanup(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
  });
  return (() => {
    var _el$ = web.template(\`<div>\`)();
    web.use(ref => _setState('ref', ref), _el$);
    web.insert(_el$, web.createComponent(solidJs.For, {
      get each() {
        return store.list;
      },
      children: id => web.createComponent(ToastItem, web.mergeProps(() => store.map[id]))
    }));
    web.effect(_p$ => {
      var _v$ = modules_c21c94f2.root,
        _v$2 = visible() ? undefined : '';
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$, "data-paused", _p$.t = _v$2);
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$;
  })();
};
let dom;
const init = () => {
  if (dom || store.ref) return;
  dom = helper.mountComponents('toast', () => web.createComponent(Toaster, {}));
  dom.style.setProperty('z-index', '2147483647', 'important');
};

const toast = (msg, options) => {
  if (!msg) return;
  init();
  const id = options?.id ?? (typeof msg === 'string' ? msg : creatId());
  setState(state => {
    if (Reflect.has(state.map, id)) {
      Object.assign(state.map[id], {
        msg,
        ...options,
        update: true
      });
      return;
    }
    state.map[id] = {
      id,
      type: 'info',
      duration: 3000,
      msg,
      ...options
    };
    state.list.push(id);
  });

  /** 弹窗后记录一下 */
  let fn = helper.log;
  switch (options?.type) {
    case 'warn':
      fn = helper.log.warn;
      break;
    case 'error':
      fn = helper.log.error;
      break;
  }
  fn('Toast:', msg);
  if (options?.throw && typeof msg === 'string') throw new Error(msg);
};
toast.dismiss = dismiss;
toast.set = (id, options) => {
  if (!Reflect.has(store.map, id)) return;
  setState(state => Object.assign(state.map[id], options));
};
toast.success = (msg, options) => toast(msg, {
  ...options,
  exit: undefined,
  type: 'success'
});
toast.warn = (msg, options) => toast(msg, {
  ...options,
  exit: undefined,
  type: 'warn'
});
toast.error = (msg, options) => toast(msg, {
  ...options,
  exit: undefined,
  type: 'error'
});

exports.Toaster = Toaster;
exports.toast = toast;
`
break;
case 'userscript/dmzjApi':
code =`
const store = require('solid-js/store');
const solidJs = require('solid-js');
const main = require('main');
const dmzjDecrypt = require('dmzjDecrypt');
const helper = require('helper');

/** 根据漫画 id 和章节 id 获取章节数据 */
const getChapterInfo = async (comicId, chapterId) => {
  const res = await main.request(\`https://m.dmzj.com/chapinfo/\${comicId}/\${chapterId}.html\`, {
    responseType: 'json',
    errorText: '获取章节数据失败'
  });
  return res.response;
};

/** 根据漫画 id 和章节 id 获取章节评论 */
const getViewpoint = async (comicId, chapterId) => {
  try {
    const res = await main.request(\`https://manhua.dmzj.com/tpi/api/viewpoint/getViewpoint?type=0&type_id=\${comicId}&chapter_id=\${chapterId}&more=1\`, {
      responseType: 'json',
      errorText: '获取章节评论失败'
    });

    // 还有另一个 api
    // http://v3api.dmzj.com/viewPoint/0/\${comic_id}/\${chapter_id}.json

    return res.response.data.list.map(({
      title,
      num
    }) => \`\${title} [+\${num}]\`);
  } catch {
    return [];
  }
};
const getComicDetail_base = async comicId => {
  const res = await main.request(\`https://api.dmzj.com/dynamic/comicinfo/\${comicId}.json\`, {
    responseType: 'json'
  });
  const {
    info: {
      last_updatetime,
      title
    },
    list
  } = res.response.data;
  return {
    title,
    last_updatetime,
    last_update_chapter_id: undefined,
    chapters: [{
      name: '连载',
      list: list.map(({
        id,
        chapter_name,
        updatetime
      }) => ({
        id,
        title: chapter_name,
        updatetime
      }))
    }]
  };
};
const getComicDetail_v4Api = async comicId => {
  const res = await main.request(\`https://v4api.idmzj.com/comic/detail/\${comicId}?uid=2665531&disable_level=1\`);
  const {
    comicInfo: {
      last_update_chapter_id,
      last_updatetime,
      chapters,
      title
    }
  } = dmzjDecrypt(res.responseText);
  for (const chapter of Object.values(chapters)) chapter.data.sort((a, b) => a.chapter_order - b.chapter_order);
  return {
    title,
    last_updatetime,
    last_update_chapter_id,
    chapters: chapters.map(({
      data,
      title: name
    }) => ({
      name,
      list: data.map(({
        chapter_id,
        chapter_title,
        updatetime
      }) => ({
        id: chapter_id,
        title: chapter_title,
        updatetime
      }))
    }))
  };
};
const getComicDetail_traversal = async (comicId, draftData) => {
  let nextId = draftData.last_update_chapter_id;
  if (!nextId) {
    helper.log.warn('last_update_chapter_id 为空，无法通过遍历获取章节');
    return;
  }
  draftData.chapters[0] = {
    name: '连载',
    list: []
  };
  main.toast.warn('正在通过遍历获取所有章节，耗时可能较长', {
    id: 'traversalTip',
    duration: Number.POSITIVE_INFINITY
  });
  while (nextId) {
    try {
      const {
        chapter_name,
        updatetime,
        prev_chap_id
      } = await getChapterInfo(comicId, nextId);
      draftData.chapters[0].list.push({
        id: nextId,
        title: chapter_name,
        updatetime
      });
      nextId = prev_chap_id;
    } catch {
      nextId = undefined;
    }
  }
  main.toast.dismiss('traversalTip');
};

/** 返回可变 store 类型的漫画数据 */
const useComicDetail = comicId => {
  const data = store.createMutable({});
  const apiFn = [getComicDetail_v4Api, getComicDetail_base, getComicDetail_traversal];
  solidJs.onMount(async () => {
    for (const api of apiFn) {
      try {
        Object.assign(data, await api(comicId, data));
        if (data.chapters?.some(chapter => chapter.list.length)) return;
      } catch {}
    }
    main.toast.error('漫画数据获取失败', {
      duration: Number.POSITIVE_INFINITY
    });
  });
  return data;
};

/** 根据漫画拼音简称找到对应的 id */
const getComicId = async py => {
  const res = await main.request(\`https://manhua.dmzj.com/api/v1/comic2/comic/detail?\${new URLSearchParams({
    channel: 'pc',
    app_name: 'comic',
    version: '1.0.0',
    timestamp: \`\${Date.now()}\`,
    uid: '',
    comic_py: py
  }).toString()}\`, {
    responseType: 'json'
  });
  return res.response.data?.comicInfo?.id;
};

exports.getChapterInfo = getChapterInfo;
exports.getComicId = getComicId;
exports.getViewpoint = getViewpoint;
exports.useComicDetail = useComicDetail;
`
break;
case 'userscript/detectAd':
code =`
const main = require('main');
const Comlink = require('comlink');
const worker = require('worker/detectAd');
const helper = require('helper');

const getAdPage = async (list, isAdPage, adList) => {
  let i = list.length - 1;
  let normalNum = 0;
  // 只检查最后十张
  for (; i >= list.length - 10; i--) {
    // 开头肯定不会是广告
    if (i <= 2) break;
    if (adList.has(i)) continue;
    const item = list[i];
    if (!item) break;
    if (await isAdPage(item)) adList.add(i);
    // 找到连续三张正常漫画页后中断
    else if (normalNum >= 2) break;else normalNum += 1;
  }
  let adNum = 0;
  for (i = Math.min(...adList); i < list.length; i++) {
    if (adList.has(i)) {
      adNum += 1;
      continue;
    }

    // 连续两张广告后面的肯定也都是广告
    if (adNum >= 2) adList.add(i);
    // 夹在两张广告中间的肯定也是广告
    else if (adList.has(i - 1) && adList.has(i + 1)) adList.add(i);else adNum = 0;
  }
  return adList;
};
const imgToCanvas = async img => {
  if (typeof img !== 'string') {
    await helper.waitImgLoad(img);
    try {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // 没被 CORS 污染就直接使用
      if (ctx.getImageData(0, 0, 1, 1)) {
        const imgBitmap = canvas.transferToImageBitmap();
        return Comlink.transfer(imgBitmap, [imgBitmap]);
      }
    } catch {}
  }
  const url = typeof img === 'string' ? img : img.src;
  const res = await main.request(url, {
    responseType: 'blob'
  });
  const imgBitmap = await createImageBitmap(res.response);
  return Comlink.transfer(imgBitmap, [imgBitmap]);
};

/** 通过文件名判断是否是广告 */
const getAdPageByFileName = async (fileNameList, adList) => getAdPage(fileNameList, fileName => /^[zZ]+/.test(fileName), adList);
const isAdImg = imgBitmap => worker.isAdImg(Comlink.transfer(imgBitmap, [imgBitmap]));

/** 通过图片内容判断是否是广告 */
const getAdPageByContent = async (imgList, adList) => getAdPage(imgList, async img => isAdImg(await imgToCanvas(img)), adList);
const mainFn = {
  log: helper.log
};
worker.setMainFn(Comlink.proxy(mainFn), Object.keys(mainFn));

exports.getAdPageByContent = getAdPageByContent;
exports.getAdPageByFileName = getAdPageByFileName;
exports.isAdImg = isAdImg;
`
break;
case 'worker/ImageRecognition':
code =`
const getEdgeScope = (width, height) => Math.min(Math.ceil((width + height) * 0.01), 10);

/** 对指定数值取整 */
const round = (n, int) => {
  const remainder = n % int;
  return remainder < int / 2 ? n - remainder : n + (int - remainder);
};

/** 计算 rgb 的灰度 */
const toGray = (r, g, b) => Math.round(0.299 * r + 0.587 * g + 0.114 * b);

/** 获取图片的灰度表 */
const toGrayList = (imgData, roundNum) => {
  const grayList = new Uint8ClampedArray(new ArrayBuffer(imgData.length / 4));
  for (let i = 0, gi = 0; i < imgData.length; i += 4, gi++) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    grayList[gi] = round(toGray(r, g, b), roundNum);
  }
  return grayList;
};

/** 遍历图片的指定行 */
const forEachRows = (width, y, fn, start = 0, end = width) => {
  for (let i = start; i < end; i++) fn(width * y + i);
};

/** 遍历图片的指定列 */
const forEachCols = (width, height, x, fn, start = 0, end = height) => {
  for (let i = start; i < end; i++) fn(i * width + x);
};

/** 遍历图片的边缘 */
const forEachEdge = (width, height, scope, fn) => {
  for (let i = 0; i < scope; i++) {
    forEachRows(width, i, fn);
    forEachRows(width, height - i - 1, fn);
    forEachCols(width, height, i, fn, scope, height - scope);
    forEachCols(width, height, width - i - 1, fn, scope, height - scope);
  }
};
const mainFn = {};
const setMainFn = (helper, keys) => {
  for (const name of keys) Reflect.set(mainFn, name, (...args) => Reflect.apply(helper[name], helper, args));
};

/** 缩小图像 */
const resizeImg = (rawImgData, width, height) => {
  // const scale = 1;
  const scale = Math.min(200 / width, 200 / height);
  const w = Math.floor(width * scale);
  const h = Math.floor(height * scale);
  const data = new Uint8ClampedArray(new ArrayBuffer(w * h * 4));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 使用最简单的采样方式，避免出现原图所没有的颜色
      const i = (y * w + x) * 4;
      const tx = Math.floor(x / scale);
      const ty = Math.floor(y / scale);
      const target = (width * ty + tx) * 4;
      data[i] = rawImgData[target];
      data[i + 1] = rawImgData[target + 1];
      data[i + 2] = rawImgData[target + 2];
      data[i + 3] = 255;
    }
  }
  return {
    scale,
    w,
    h,
    data
  };
};

/** 通过互相比较数组项求出最终项 */
const boil = (array, compareFunc) => {
  if (!array || (array.length ?? 0) === 0) return null;
  return array.reduce(compareFunc); // eslint-disable-line unicorn/no-array-reduce
};

/** 获取颜色区域在边缘区域上的占比 */
const getAreaEdgeRatio = (pixelList, width, height) => {
  let size = 0;
  const edgeScope = getEdgeScope(width, height);
  const add = i => pixelList.has(i) && size++;
  forEachEdge(width, height, edgeScope, add);
  return size / (width * edgeScope * 2 + (height - 2 * edgeScope) * edgeScope * 2);
};

/** 根据灰度值获取图片边缘相似颜色的区域 */
const getEdgeArea = (grayList, width, height) => {
  const maximum = width * height * 0.4;
  const areaMap = new Map();

  /** 待检查相邻像素的像素 */
  const seedPixel = new Set();
  const addSeedPixel = index => {
    const gray = grayList[index];
    if (gray === undefined) return;
    seedPixel.add(index);
    if (!areaMap.has(gray)) areaMap.set(gray, new Set());
    areaMap.get(gray).add(index);
  };
  const popSeedPixel = () => {
    if (seedPixel.size === 0) return undefined;
    const index = seedPixel.values().next().value;
    seedPixel.delete(index);
    return index;
  };

  // 将边缘区域的像素设为种子
  const edgeScope = getEdgeScope(width, height);
  forEachEdge(width, height, edgeScope, addSeedPixel);

  /** 获取相邻像素 */
  const getAdjacentPixel = i => {
    const adjacentPixel = [];
    const x = i % width;
    const y = Math.floor(i / width);
    const left = x !== 0;
    const up = y >= 1;
    const right = x < width - 1;
    const down = y < height - 1;
    if (left) adjacentPixel.push(i - 1); // ←
    if (up) adjacentPixel.push(i - width); // ↑
    if (right) adjacentPixel.push(i + 1); // →
    if (down) adjacentPixel.push(i + width); // ↓
    if (left && up) adjacentPixel.push(i - width - 1); // ↖
    if (left && down) adjacentPixel.push(i + width - 1); // ↙
    if (right && up) adjacentPixel.push(i - width + 1); // ↗
    if (right && down) adjacentPixel.push(i + width + 1); // ↘

    return adjacentPixel;
  };

  // 从种子像素开始不断合并相同灰度的像素形成区域
  for (let i = popSeedPixel(); i !== undefined; i = popSeedPixel()) {
    const gray = grayList[i];
    const areaPixelList = areaMap.get(gray);
    const adjacentPixelList = getAdjacentPixel(i);
    for (const adjacentPixel of adjacentPixelList) {
      if (areaPixelList.has(adjacentPixel)) continue;
      const pixelGray = grayList[adjacentPixel];
      if (pixelGray !== gray) continue;
      addSeedPixel(adjacentPixel);
    }

    // 如果当前区域像素数量超过阈值，就直接认定其为背景
    if (areaPixelList.size > maximum) return [areaPixelList];
  }
  const areaList = [];
  for (const pixelList of areaMap.values()) {
    if (pixelList.size < 100) continue;
    areaList.push(pixelList);
  }
  return areaList;
};

/** 获取图像指定区域中的主色 */
const getAreaColor = (imgData, pixelList) => {
  const colorMap = new Map();
  const maximum = pixelList.size * 0.5;
  let maxColor = '';
  let maxCount = 0;
  for (const i of pixelList.values()) {
    const index = i * 4;
    const r = imgData[index];
    const g = imgData[index + 1];
    const b = imgData[index + 2];
    const color = \`rgb(\${r}, \${g}, \${b})\`;
    if (!colorMap.has(color)) colorMap.set(color, 0);
    const colorCount = colorMap.get(color) + 1;
    colorMap.set(color, colorCount);
    if (colorCount > maxCount) {
      maxColor = color;
      maxCount = colorCount;
    }
    if (colorCount > maximum) break;
  }
  return maxColor;
};

/** 获取图像指定矩形区域中的主色 */
const getSquareAreaColor = (imgData, _topLeftX, _topLeftY, _bottomRightX, _bottomRightY) => {
  const topLeftX = Math.floor(_topLeftX);
  const topLeftY = Math.floor(_topLeftY);
  const bottomRightX = Math.floor(_bottomRightX);
  const bottomRightY = Math.floor(_bottomRightY);
  const colorMap = new Map();
  const maximum = (bottomRightX - topLeftX) * (bottomRightY - topLeftY) * 0.5;
  let maxColor = '';
  let maxCount = 0;
  for (let x = topLeftX; x < bottomRightX; x++) {
    for (let y = topLeftY; y < bottomRightY; y++) {
      const index = (x + y * bottomRightX) * 4;
      const r = imgData[index];
      const g = imgData[index + 1];
      const b = imgData[index + 2];
      const color = \`rgb(\${r}, \${g}, \${b})\`;
      if (!colorMap.has(color)) colorMap.set(color, 0);
      const colorCount = colorMap.get(color) + 1;
      colorMap.set(color, colorCount);
      if (colorCount > maxCount) {
        maxColor = color;
        maxCount = colorCount;
      }
      if (colorCount > maximum) break;
    }
  }
  return maxColor;
};

/** 根据边缘颜色区域获取背景颜色 */
const byEdgeArea = ({
  data,
  grayList,
  width,
  height
}) => {
  const areaList = getEdgeArea(grayList, width, height);
  // if (false) mainFn.showColorArea?.(data, width, height, ...areaList);

  if (areaList.length === 0) return undefined;
  const minimum = width * height * 0.02;
  let maxArea;
  let maxRatio = 0.1;

  // 过滤总体占比和边缘占比过小的区域
  for (const pixelList of areaList) {
    if (pixelList.size < minimum) continue;
    const edgeRatio = getAreaEdgeRatio(pixelList, width, height);
    if (edgeRatio < maxRatio) continue;
    maxArea = pixelList;
    maxRatio = edgeRatio;
  }
  if (!maxArea) return undefined;
  return getAreaColor(data, maxArea);
};
const getPosAreaColor = (pos, {
  data,
  blankMargin,
  width: w,
  height: h
}) => {
  switch (pos) {
    case 'top':
      return getSquareAreaColor(data, 0, 0, w, blankMargin.top * h);
    case 'bottom':
      return getSquareAreaColor(data, 0, h - blankMargin.bottom * h, w, h);
    case 'left':
      return getSquareAreaColor(data, 0, 0, blankMargin.left * w, h);
    case 'right':
      return getSquareAreaColor(data, w - blankMargin.right * w, 0, w, h);
  }
};

/** 从足够大的空白边缘中获取背景颜色 */
const byBlankMargin = context => {
  const colorMap = {};
  for (const pos of ['top', 'bottom', 'left', 'right']) {
    if (!context.blankMargin[pos]) continue;
    const color = getPosAreaColor(pos, context);
    if (!color) continue;
    colorMap[color] = (colorMap[color] || 0) + context.blankMargin[pos];
  }

  // 过滤占比过低的空白边缘
  const colorList = Object.entries(colorMap).filter(([, v]) => v > 0.04);
  if (colorList.length === 0) return undefined;
  return boil(colorList, (a, b) => a[1] > b[1] ? a : b)?.[0];
};

/** 判断图像的背景色 */
const getBackground = context => 'blankMargin' in context && byBlankMargin(context) || byEdgeArea(context);

/** 获取图片空白边缘的长度 */
const getBlankMargin = ({
  grayList,
  width,
  height
}) => {
  let blankColor;

  // 检查指定行或列上是否全是相同颜色
  const isBlankLine = (x, y) => {
    const colorMap = new Map();
    const eachFn = i => {
      const gray = grayList[i];
      colorMap.set(gray, (colorMap.get(gray) || 0) + 1);
      // grayList[i] = Math.abs(gray - 255);
    };
    if (x < 0) forEachRows(width, y, eachFn);else forEachCols(width, height, x, eachFn);
    let maxColor;
    // 为了能跳过些微色差和漫画水印，阈值就只设为 90%
    let maxNum = height * 0.9;
    for (const [gray, num] of colorMap.entries()) {
      if (num < maxNum) continue;
      maxColor = gray;
      maxNum = num;
    }
    if (maxColor === undefined) return false;
    blankColor ||= maxColor;
    if (maxColor !== blankColor) return false;
    return true;
  };
  let left = 0;
  for (let x = 0, end = width * 0.4; x < end; x++, left++) if (!isBlankLine(x, -1)) break;
  blankColor = undefined;
  let right = 0;
  for (let x = width - 1, end = width * 0.6; x >= end; x--, right++) if (!isBlankLine(x, -1)) break;
  blankColor = undefined;
  let top = 0;
  for (let y = 0, end = height * 0.4; y < end; y++, top++) if (!isBlankLine(-1, y)) break;
  blankColor = undefined;
  let bottom = 0;
  for (let y = height - 1, end = height * 0.6; y >= end; y--, bottom++) if (!isBlankLine(-1, y)) break;

  // if (false) mainFn.showGrayList?.(grayList, width, height);

  if (left || right || top || bottom) return {
    left,
    right,
    top,
    bottom
  };
  return undefined;
};

const handleImg = async (imgData, width, height, url, option) => {
  const startTime = Date.now();
  const {
    w,
    h,
    data
  } = resizeImg(imgData, width, height);
  // if (false) mainFn.showCanvas?.(data, w, h);

  const grayList = toGrayList(data, 5);
  // if (false) mainFn.showGrayList?.(grayList, w, h);

  const context = {
    data,
    grayList,
    width: w,
    height: h
  };
  let blankMargin;
  if (option.pageFill || option.background) {
    blankMargin = getBlankMargin(context);
    if (blankMargin) {
      for (const key of ['top', 'bottom', 'left', 'right']) blankMargin[key] &&= blankMargin[key] / w;
      mainFn.setImg(url, 'blankMargin', {
        left: blankMargin.left,
        right: blankMargin.right
      });
      mainFn.updatePageData();
      context.blankMargin = blankMargin;
    } else mainFn.setImg(url, 'blankMargin', null);
  }
  let bgColor;
  if (option.background) {
    // 虽然也想支持渐变背景，但浏览器上不像手机端那样只需要显示上下背景，可以无视中间的渐变
    // 大部分时候都要显示左右区域的背景，不能和实际背景一致的话就会很突兀
    // 要是图片能一直占满屏幕的话，那还能通过单独显示上下或左右部分的背景色来实现
    // 但偏偏又有「禁止图片自动放大」功能，需要把图片的四边背景都显示出来
    bgColor = getBackground(context);
    if (bgColor) mainFn.setImg(url, 'background', bgColor);
  }
  let logText = \`\${url}\\n耗时 \${Date.now() - startTime}ms 处理完成\`;
  const resList = [];
  if (blankMargin) resList.push(\`空白边缘：\${Object.entries(blankMargin).filter(([, v]) => v).map(([k, v]) => \`\${k}:\${v && (v * 100).toFixed(2)}%\`).join(' ')}\`);
  if (bgColor) resList.push(\`背景色: \${bgColor}\`);
  if (resList.length > 0) logText += \`\\n\${resList.join('\\n')}\`;
  mainFn.log?.(logText);
};

exports.handleImg = handleImg;
exports.setMainFn = setMainFn;
`
break;
case 'worker/detectAd':
code =`
const jsQR = require('jsqr');

const mainFn = {};
const setMainFn = (helper, keys) => {
  for (const name of keys) Reflect.set(mainFn, name, (...args) => Reflect.apply(helper[name], helper, args));
};

/** 计算 rgb 的灰度 */
const toGray = (r, g, b) => Math.round(0.299 * r + 0.587 * g + 0.114 * b);

// jsQR 最为简洁，但不支持包含多个二维码的图片
// https://github.com/cozmo/jsQR/issues/24
//
// ZXing 可以扫描包含多个二维码的图片，但因为同时支持多种编码，
// 包含了很多根本不需要的代码，用在这里感觉太牛刀杀鸡了
//
// qr-scanner 基于上述两个库进行开发，是最优选。但会收到 CSP 限制而无法使用
/** 判断一张图是否是彩图 */
const isColorImg = data => {
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (!(r === g && r === b)) return true;
  }
  return false;
};

/** 二维码白名单 */
const qrCodeWhiteList = [
// fanbox
/^https:\\/\\/[^.]+\\.fanbox\\.cc/,
// twitter
/^https:\\/\\/twitter\\.com/, /^https:\\/\\/x\\.com/,
// fantia
/^https:\\/\\/fantia\\.jp/,
// 棉花糖
/^https:\\/\\/marshmallow-qa\\.com/,
// dlsite
/^https:\\/\\/www\\.dlsite\\.com/,
// hitomi
/^https:\\/\\/hitomi\\.la/];
const options = {
  inversionAttempts: 'attemptBoth'
};

/** 识别图像上的二维码 */
const getQrCode = (img, width, height) => {
  try {
    const binaryData = jsQR(img, width, height, options)?.binaryData;
    if (!binaryData) return false;
    // 因为 jsqr 默认的输出不支持特殊符号，为以防万一，手动进行转换
    const text = new TextDecoder().decode(Uint8Array.from(binaryData));
    mainFn.log(\`检测到二维码： \${text}\`);
    return text;
  } catch {
    return undefined;
  }
};

// zxing 方案
//
// import {
//   MultiFormatReader,
//   BarcodeFormat,
//   DecodeHintType,
//   RGBLuminanceSource,
//   BinaryBitmap,
//   HybridBinarizer,
// } from '@zxing/library';
//
// const hints = new Map();
// // 只识别二维码
// hints.set(DecodeHintType.POSSIBLE_FORMATS, [
//   BarcodeFormat.QR_CODE,
//   BarcodeFormat.DATA_MATRIX,
// ]);
// // 花更多时间尝试寻找条形码
// hints.set(DecodeHintType.TRY_HARDER, true);
//
// /** 识别图像上的二维码 */
// const getQrCode = (
//   data: Uint8ClampedArray,
//   width: number,
//   height: number,
// ) => {
//   try {
//     const luminance = new Uint8ClampedArray(width * height);
//     for (let i = 0; i < data.length; i += 4) {
//       const r = data[i];
//       const g = data[i + 1];
//       const b = data[i + 2];
//       luminance[i / 4] = (r + g + b) / 3;
//     }
//     const luminanceSource = new RGBLuminanceSource(luminance, width, height);
//     const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
//     const res = new MultiFormatReader().decode(binaryBitmap, hints);
//     const text = res.getText();
//     if (!text) return false;
//     mainFn.log(\`检测到二维码： \${text}\`);
//     return text;
//   } catch (error) {
//     console.log(error);
//     debugger;
//     return false;
//   }
const getImgData = img => {
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};
const scanImgBlock = (img, sx, sy, w, h) => {
  if (w === img.width && h === img.height) return getQrCode(img.data, w, h);
  const data = new Uint8ClampedArray(new ArrayBuffer(w * h * 4));
  for (let y = 0, height = sy + h; y < height; y++) for (let x = 0, width = sx + w; x < width; x++) {
    const i = (y * w + x) * 4;
    const target = ((y + sy) * img.width + (x + sx)) * 4;
    data[i] = img.data[target];
    data[i + 1] = img.data[target + 1];
    data[i + 2] = img.data[target + 2];
    data[i + 3] = img.data[target + 3];
  }
  return getQrCode(data, w, h);
};
const isAdImg = async imgBitmap => {
  const imgData = getImgData(imgBitmap);

  // 黑白图肯定不是广告
  if (!isColorImg(imgData.data)) return false;

  // 以 200 灰度为阈值，将图片二值化，以便识别彩色二维码
  for (let i = 0; i < imgData.data.length; i += 4) {
    const gray = toGray(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]);
    const val = gray < 200 ? 0 : 255;
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
    imgData.data[i + 3] = 255;
  }

  // mainFn.showCanvas?.(imgData.data, imgBitmap.width, imgBitmap.height);

  let text = getQrCode(imgData.data, imgData.width, imgData.height);

  // 分区块扫描图片
  if (!text) {
    const w = Math.floor(imgData.width / 2);
    const h = Math.floor(imgData.height / 2);
    for (const args of [[w, h],
    // ↘
    [0, h],
    // ↙
    [w, 0],
    // ↗
    [0, 0] // ↖
    ]) {
      text = scanImgBlock(imgData, ...args, w, h);
      if (text) break;
    }
  }
  if (text) return qrCodeWhiteList.every(reg => !reg.test(text));
  return false;
};

exports.isAdImg = isAdImg;
exports.setMainFn = setMainFn;
`
break;
case 'userscript/otherSite':
code =`
const web = require('solid-js/web');
const helper = require('helper');
const main = require('main');

const prevRe = /^(上一?((章|章节|話|话))|prev|prev chapter|前の章)$/i;
const nextRe = /^(下一?((章|章节|話|话))|next|next chapter|次の章)$/i;
const handleSwitchChapter = setManga => {
  let onPrev;
  let onNext;
  const checkElement = e => {
    const texts = [e.textContent, e.ariaLabel].filter(Boolean)
    // 删除可能混在其中的特殊符号
    .map(text => text.replaceAll(/[<>()《》（）「」『』]/g, '').trim());
    if (texts.length === 0) return;
    for (const text of texts) {
      if (!onPrev && prevRe.test(text)) {
        onPrev = () => e.click();
        break;
      }
      if (!onNext && nextRe.test(text)) {
        onNext = () => e.click();
        break;
      }
    }
  };
  for (const e of helper.querySelectorAll('a, button')) {
    checkElement(e);
    if (onPrev && onNext) break;
    for (const element of e.querySelectorAll('div, span, p')) {
      checkElement(element);
      if (onPrev && onNext) break;
    }
  }
  setManga({
    onPrev,
    onNext
  });
};

const getTagText = ele => {
  let text = ele.nodeName;
  if (ele.id && !/\\d/.test(ele.id)) text += \`#\${ele.id}\`;
  return text;
};

/** 获取元素仅记录了层级结构关系的选择器 */
const getEleSelector = ele => {
  const parents = [ele.nodeName];
  const root = ele.getRootNode();
  let e = ele;
  while (e.parentNode && e.parentNode !== root) {
    e = e.parentNode;
    parents.push(getTagText(e));
  }
  return parents.reverse().join('>');
};

/** 判断指定元素是否符合选择器 */
const isEleSelector = (ele, selector) => {
  const parents = selector.split('>').reverse();
  let e = ele;
  for (let i = 0; e && i < parents.length; i++) {
    if (getTagText(e) !== parents[i]) return false;
    e = e.parentNode;
  }
  return e === e.getRootNode();
};

// 目录页和漫画页的图片层级相同
// https://www.biliplus.com/manga/
// 图片路径上有 id 元素并且 id 含有漫画 id，不同话数 id 也不同
const createImgData = (oldSrc = '') => ({
  triggedNum: 0,
  observerTimeout: 0,
  oldSrc
});

/** 用于判断是否是图片 url 的正则 */
const isImgUrlRe = /^(((https?|ftp|file):)?\\/)?\\/[-\\w+&@#/%?=~|!:,.;]+[-\\w+&@#%=~|]$/;

/** 找出格式为图片 url 的元素属性 */
const getDatasetUrl = e => {
  for (const key of e.getAttributeNames()) {
    // 跳过白名单
    switch (key) {
      case 'src':
      case 'alt':
      case 'class':
      case 'style':
      case 'id':
      case 'title':
      case 'onload':
      case 'onerror':
        continue;
    }
    const val = e.getAttribute(key).trim();
    if (!isImgUrlRe.test(val)) continue;
    return val;
  }
};

/**
 *
 * 通过滚动到指定图片元素位置并停留一会来触发图片的懒加载，返回图片 src 是否发生变化
 *
 * 会在触发后重新滚回原位，当 time 为 0 时，因为滚动速度很快所以是无感的
 */
const triggerEleLazyLoad = async (e, time, isLazyLoaded, runCondition) => {
  const nowScroll = window.scrollY;
  e.scrollIntoView({
    behavior: 'instant'
  });
  e.dispatchEvent(new Event('scroll', {
    bubbles: true
  }));
  try {
    if (isLazyLoaded && time) return await helper.wait(isLazyLoaded, time);
  } finally {
    if (runCondition()) window.scroll({
      top: nowScroll,
      behavior: 'instant'
    });
  }
};
function isImageElement(e) {
  return e.tagName === 'IMG';
}

/** 判断一个元素是否已经成功触发完懒加载 */
const isLazyLoaded = (e, oldSrc) => {
  if (isImageElement(e)) {
    if (!e.src) return false;
    if (!e.offsetParent) return false;
    // 有些网站会使用 svg 占位
    if (e.src.startsWith('data:image/svg')) return false;
    if (e.naturalWidth > 500 || e.naturalHeight > 500) return true;
    if (oldSrc !== undefined && e.src !== oldSrc) return true;
  } else {
    const imgDomList = e.querySelectorAll('img');
    for (const imgDom of imgDomList) if (isLazyLoaded(imgDom, oldSrc)) return true;
  }
  return false;
};
const imgMap = new WeakMap();
// eslint-disable-next-line no-autofix/prefer-const
let imgShowObserver;
const getImg = e => imgMap.get(e) ?? createImgData();
const MAX_TRIGGED_NUM = 5;

/** 判断图片元素是否需要触发懒加载 */
const needTrigged = e => !isLazyLoaded(e, imgMap.get(e)?.oldSrc) && (imgMap.get(e)?.triggedNum ?? 0) < MAX_TRIGGED_NUM;

/** 图片懒加载触发完后调用 */
const handleTrigged = e => {
  const img = getImg(e);
  img.observerTimeout = 0;
  img.triggedNum += 1;
  if (isLazyLoaded(e, img.oldSrc) && img.triggedNum < MAX_TRIGGED_NUM) img.triggedNum = MAX_TRIGGED_NUM;
  imgMap.set(e, img);
  if (!needTrigged(e)) imgShowObserver.unobserve(e);
};

/** 监视图片是否被显示的 Observer */
imgShowObserver = new IntersectionObserver(entries => {
  for (const img of entries) {
    const e = img.target;
    if (img.isIntersecting) {
      imgMap.set(e, {
        ...getImg(e),
        observerTimeout: window.setTimeout(handleTrigged, 290, e)
      });
    } else window.clearTimeout(imgMap.get(e)?.observerTimeout);
  }
});
const turnPageScheduled = helper.createScheduled(fn => helper.throttle(fn, 1000));
/** 触发翻页 */
const triggerTurnPage = async (waitTime, runCondition) => {
  if (!turnPageScheduled()) return;
  const nowScroll = window.scrollY;
  // 滚到底部再滚回来，触发可能存在的自动翻页脚本
  window.scroll({
    top: document.body.scrollHeight,
    behavior: 'instant'
  });
  document.body.dispatchEvent(new Event('scroll', {
    bubbles: true
  }));
  if (waitTime) await helper.sleep(waitTime);
  if (runCondition()) window.scroll({
    top: nowScroll,
    behavior: 'instant'
  });
};
const waitTime = 300;

/** 触发页面上图片元素的懒加载 */
const triggerLazyLoad = helper.singleThreaded(async (state, targetImgList, runCondition) => {
  for (const e of targetImgList) {
    imgShowObserver.observe(e);
    if (!imgMap.has(e)) imgMap.set(e, createImgData(isImageElement(e) ? e.src : ''));
  }
  for (const e of targetImgList) {
    await helper.wait(runCondition);
    await triggerTurnPage(0, runCondition);
    if (!needTrigged(e)) continue;
    const datasetUrl = getDatasetUrl(e);
    if (datasetUrl) e.setAttribute('src', datasetUrl);
    if (await triggerEleLazyLoad(e, waitTime, () => isLazyLoaded(e, imgMap.get(e)?.oldSrc), runCondition)) handleTrigged(e);
  }
  await triggerTurnPage(waitTime, runCondition);
  if (targetImgList.length > 0) state.continueRun();
});


// 测试案例
// https://www.177picyy.com/html/2023/03/5505307.html
// 需要配合其他翻页脚本使用
// https://www.colamanga.com/manga-za76213/1/5.html
// 直接跳转到图片元素不会立刻触发，还需要停留20ms
// https://www.colamanga.com/manga-kg45140/1/2.html
/** 执行脚本操作。如果中途中断，将返回 true */
const otherSite = async () => {
  let laseScroll = window.scrollY;
  const {
    options,
    setComicLoad,
    setComicMap,
    setImgList,
    setManga,
    setFab,
    setOptions,
    isStored,
    mangaProps
  } = await main.useInit(window.location.hostname, {
    remember_current_site: true,
    selector: ''
  });

  // 通过 options 来迂回的实现禁止记住当前站点
  if (!options.remember_current_site) {
    await GM.deleteValue(window.location.hostname);
    return true;
  }
  if (!isStored) main.toast(() => (() => {
    var _el$ = web.template(\`<div><button>\`)(),
      _el$2 = _el$.firstChild;
    web.insert(_el$, () => helper.t('site.simple.auto_read_mode_message'), _el$2);
    web.addEventListener(_el$2, "click", () => setOptions({
      autoShow: false
    }));
    web.insert(_el$2, () => helper.t('other.disable'));
    return _el$;
  })(), {
    duration: 1000 * 7
  });

  // 为避免卡死，提供一个删除 selector 的菜单项
  const menuId = await GM.registerMenuCommand(helper.t('site.simple.simple_read_mode'), () => setOptions({
    selector: ''
  }));

  // 等待 selector 匹配到目标后再继续执行，避免在漫画页外的其他地方运行
  await helper.wait(() => !options.selector || helper.querySelectorAll(options.selector).length >= 2);
  await GM.unregisterMenuCommand(menuId);

  /** 记录传入的图片元素中最常见的那个 selector */
  const saveImgEleSelector = imgEleList => {
    if (imgEleList.length < 7) return;
    const selector = helper.getMostItem(imgEleList.map(getEleSelector));
    if (selector !== options.selector) setOptions({
      selector
    });
  };
  const blobUrlMap = new Map();
  // 处理那些 URL.createObjectURL 后马上 URL.revokeObjectURL 的图片
  const handleBlobImg = async e => {
    if (blobUrlMap.has(e.src)) return blobUrlMap.get(e.src);
    if (!e.src.startsWith('blob:')) return e.src;
    if (await helper.testImgUrl(e.src)) return e.src;
    const canvas = new OffscreenCanvas(e.naturalWidth, e.naturalHeight);
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.drawImage(e, 0, 0);
    const url = URL.createObjectURL(await helper.canvasToBlob(canvas));
    blobUrlMap.set(e.src, url);
    return url;
  };
  const handleImgUrl = async e => {
    const url = await handleBlobImg(e);
    if (url.startsWith('http:') && window.location.protocol === 'https:') return url.replace('http:', 'https:');
    return url;
  };

  /** 重复的加载占位图 */
  const placeholderImgList = new Set();
  helper.createEffectOn(() => mangaProps.imgList.filter(url => url && !placeholderImgList.has(url)), helper.throttle(imgList => {
    if (!imgList?.length || imgList.length - new Set(imgList).size <= 4) return;
    const repeatNumMap = new Map();
    for (const url of imgList) {
      const repeatNum = (repeatNumMap.get(url) ?? 0) + 1;
      repeatNumMap.set(url, repeatNum);
      if (repeatNum > 5) placeholderImgList.add(url);
    }
  }));

  /** 根据元素所在高度进行排序 */
  const eleSortFn = (a, b) => a === undefined || b === undefined ? 0 : a.getBoundingClientRect().y - b.getBoundingClientRect().y;
  const imgBlackList = [
  // 东方永夜机的预加载图片
  '#pagetual-preload',
  // 177picyy 上会在图片下加一个 noscript
  // 本来只是图片元素的 html 代码，但经过东方永夜机加载后就会变成真的图片元素，导致重复
  'noscript'];
  const getAllImg = () => helper.querySelectorAll(\`:not(\${imgBlackList.join(',')}) > img\`);

  /** 获取大概率是漫画图片的图片元素 */
  const getExpectImgList = () => helper.querySelectorAll(options.selector).filter(e => isLazyLoaded(e, imgMap.get(e)?.oldSrc) || !imgMap.has(e) || imgMap.get(e).triggedNum <= 5);

  /** 判断一个图片元素是否符合标准 */
  const isDisplayImg = e => e.offsetHeight > 100 && e.offsetWidth > 100 && (e.naturalHeight > 500 && e.naturalWidth > 500 || isEleSelector(e, options.selector));
  let imgEleList;

  /** 检查筛选符合标准的图片元素用于更新 imgList */
  const updateImgList = helper.singleThreaded(async state => {
    imgEleList = await helper.wait(() => {
      /** 大概率是漫画图片的图片元素 */
      const expectImgs = options.selector ? new Set(getExpectImgList()) : undefined;
      let imgNum = 0;
      const newImgList = [];
      for (const e of getAllImg()) {
        if (isDisplayImg(e)) {
          newImgList.push(e);
          imgNum += 1;
        } else if (expectImgs?.has(e) && needTrigged(e)) newImgList.push(undefined);
      }
      return imgNum >= 2 && newImgList.sort(eleSortFn);
    });
    if (imgEleList.length === 0) {
      setFab('show', false);
      setManga('show', false);
      return;
    }

    // 随着图片的增加，需要补上空缺位置，避免变成稀疏数组
    if (mangaProps.imgList.length < imgEleList.length) setComicMap('', 'imgList', [...mangaProps.imgList, ...Array.from({
      length: imgEleList.length - mangaProps.imgList.length
    }, () => '')]);
    // colamanga 会创建随机个数的假 img 元素，导致刚开始时高估页数，需要删掉多余的页数
    else if (mangaProps.imgList.length > imgEleList.length) setComicMap('', 'imgList', mangaProps.imgList.slice(0, imgEleList.length));
    let isEdited = false;
    await helper.plimit(imgEleList.map((e, i) => async () => {
      let newUrl = '';
      if (e) {
        newUrl = await handleImgUrl(e);
        if (placeholderImgList.has(newUrl)) newUrl = getDatasetUrl(e) ?? '';
      }
      if (newUrl === mangaProps.imgList[i]) return;
      isEdited ||= true;
      setImgList('', i, newUrl);
    }));
    if (isEdited) saveImgEleSelector(imgEleList.filter(Boolean));
    if (isEdited || imgEleList.some(e => !e || needTrigged(e))) {
      await helper.sleep(1000);
      state.continueRun();
    }
  });
  let timeout = false;

  /** 只在\`开启了阅读模式\`和\`当前可显示图片数量不足\`时通过滚动触发懒加载 */
  const runCondition = () => mangaProps.show || !timeout && mangaProps.imgList.length === 0;

  /** 触发大概率是漫画图片的懒加载 */
  const triggerExpectImg = (num, time) => helper.wait(async () => {
    let expectImgList = getExpectImgList().filter(needTrigged);
    if (num) expectImgList = expectImgList.slice(0, num);
    await triggerLazyLoad(expectImgList, runCondition);
    return expectImgList.every(e => !needTrigged(e));
  }, time);
  const triggerAllLazyLoad = helper.singleThreaded(async () => {
    // 优先触发大概率是漫画图片的懒加载
    if (options.selector) {
      await triggerExpectImg(3, 1000 * 5);
      await triggerExpectImg();
    }
    await triggerLazyLoad(getAllImg().filter(needTrigged).sort(eleSortFn), runCondition);

    // 针对不使用 img 来触发懒加载的网站，要找到图片容器元素再尝试触发懒加载
    // https://www.twmanga.com/comic/chapter/sanjiaoguanxirumen-founai/0_0.html
    if (imgEleList.length > 3) {
      let parent = imgEleList[0];
      // 从现有的图片元素开始冒泡查找，检查每个层级上是否有超过5个相似的兄弟元素
      while (parent?.parentElement) {
        const siblingList = parent.parentElement.children;
        if (siblingList.length >= 5) {
          const dataset = parent.dataset;
          let sameNum = 0;
          for (const siblingDom of siblingList) {
            if (siblingDom === parent) continue;
            if ('dataset' in siblingDom && helper.isEqual(siblingDom.dataset, dataset)) {
              sameNum++;
              if (sameNum >= 5) break;
            }
          }
          if (sameNum >= 5) {
            await triggerLazyLoad(helper.querySelectorAll(getEleSelector(parent)), runCondition);
            break;
          }
        }
        parent = parent.parentElement;
      }
    }
  });
  const handleMutation = () => {
    updateImgList();
    triggerAllLazyLoad();
    handleSwitchChapter(setManga);
  };
  /** 监视页面元素发生变化的 Observer */
  const imgDomObserver = new MutationObserver(handleMutation);
  setComicLoad(async () => {
    if (!imgEleList) {
      imgEleList = [];
      imgDomObserver.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src']
      });
      handleMutation();
      setTimeout(() => {
        timeout = true;
        if (mangaProps.imgList.length > 0) return;
        main.toast.warn(helper.t('site.simple.no_img'), {
          id: 'no_img',
          duration: Number.POSITIVE_INFINITY,
          async onClick() {
            await setOptions({
              remember_current_site: false
            });
            window.location.reload();
          }
        });
      }, 3000);
    }
    await helper.wait(() => mangaProps.imgList.length);
    main.toast.dismiss('no_img');
    return mangaProps.imgList;
  });

  // 同步滚动显示网页上的图片，用于以防万一保底触发漏网之鱼
  setManga({
    onShowImgsChange: helper.throttle(showImgs => {
      if (!mangaProps.show) return;
      imgEleList[[...showImgs].at(-1)]?.scrollIntoView({
        behavior: 'instant',
        block: 'end'
      });
    }, 1000)
  });

  // 在退出阅读模式时跳回之前的滚动位置
  helper.createEffectOn(() => mangaProps.show, show => {
    if (show) laseScroll = window.scrollY;else window.scroll({
      top: laseScroll,
      behavior: 'instant'
    });
  });
};

exports.otherSite = otherSite;
`
break;
case 'userscript/ehTagRules':
code =`
// 使用 i18n-ally 扩展查看对应的中文翻译

// 概率标签的标准：有A标签的本子中，只有 10% 的本子没有 B 标签
// 「\`A标签 -B标签\` 的搜索结果数」<「\`A标签\` 的搜索结果数」的 10%
// 有没有必要加上复杂规则呢？
// - 组合标签
//   - 单扶她 + 单女主 = 大概率「扶上女」
// - 根据条件将「大概率」限定为「必须」
//   - 单萝莉 + 贫乳 + (单女主) = 肯定无法共存
// - 把画廊类型也加进标签，方便过滤 CG 集等图库
const rules = {"prerequisite":{"(x|f):incest":["f:cousin","f:aunt","f:daughter","f:mother","f:granddaughter","f:sister","f:grandmother","f:niece"],"(x|m):incest":["m:cousin"],"f:incest":["f:inseki","f:low_incest"],"m:incest":["m:inseki","m:low_incest"],"x:incest":["x:inseki","x:low_incest"],"f:group":["f:fff_threesome","f:ttt_threesome","f:fft_threesome","f:ttf_threesome"],"m:group":["m:mmm_threesome"],"x:group":["x:mmf_threesome","x:mmt_threesome","x:ttm_threesome","x:ffm_threesome","x:mtf_threesome","x:oyakodon","x:shimaidon","x:gang_rape"],"(x|f):group":["f:oyakodon","f:shimaidon","f:multiple_straddling","f:gang_rape","f:layer_cake","f:harem"],"(x|m):group":["m:oyakodon","m:shimaidon","m:multiple_straddling","m:gang_rape","m:layer_cake","m:harem"],"f:yuri":["f:fff_threesome"],"m:yaoi":["m:group","m:mmm_threesome"],"f:futanari":["f:ttt_threesome","f:fft_threesome","f:ttf_threesome","f:full-packaged_futanari"],"f:shemale":["f:ball-less_shemale"],"f:lolicon":["f:kodomo_doushi","x:kodomo_doushi","f:oppai_loli","f:mesugaki","f:low_lolicon"],"m:shotacon":["m:kodomo_doushi","x:kodomo_doushi"],"f:blowjob":["f:multimouth_blowjob","f:blowjob_face","f:deepthroat","f:focus_blowjob"],"m:blowjob":["m:multimouth_blowjob","m:blowjob_face","m:deepthroat","m:focus_blowjob"],"f:handjob":["f:multiple_handjob"],"m:handjob":["m:multiple_handjob"],"f:assjob":["f:multiple_assjob"],"m:assjob":["m:multiple_assjob"],"f:footjob":["f:multiple_footjob"],"m:footjob":["m:multiple_footjob"],"f:paizuri":["f:focus_paizuri"],"m:paizuri":["m:focus_paizuri"],"f:anal":["f:focus_anal","f:anal_intercourse","f:tail_plug"],"m:anal":["m:focus_anal","m:anal_intercourse","m:tail_plug"],"f:rape":["f:gang_rape"],"m:rape":["m:gang_rape"],"f:bondage":["f:fanny_packing","f:shibari"],"m:bondage":["m:fanny_packing","m:shibari"],"f:inflation":["f:cumflation"],"m:inflation":["m:cumflation"],"f:lactation":["f:milking"],"m:lactation":["m:milking"],"f:piercing":["f:nipple_piercing","f:genital_piercing"],"m:piercing":["m:nipple_piercing","m:genital_piercing"],"f:big_breasts":["f:huge_breasts","f:gigantic_breasts"],"f:huge_breasts":["f:gigantic_breasts"],"f:sex_toys":["f:tail_plug"],"m:sex_toys":["m:tail_plug"],"f:swimsuit":["f:bikini"],"m:swimsuit":["m:bikini"],"f:crossdressing":["f:schoolboy_uniform"],"f:monster_girl":["f:zombie"]},"conflict":{"f:females_only":["f:futanari","f:bisexual","f:ttt_threesome","f:fft_threesome","f:ttf_threesome","x:mmf_threesome","x:mmt_threesome","x:ttm_threesome","x:mtf_threesome","x:group","m:*","x:*"],"f:sole_female":["f:ttt_threesome","f:fft_threesome","x:mmt_threesome","x:ttm_threesome","m:mmm_threesome"],"f:sole_dickgirl":["f:fff_threesome","f:ttt_threesome","f:ttf_threesome","x:mmf_threesome","x:ttm_threesome","m:mmm_threesome"]},"possibleConflict":{"f:dark_skin":["f:tanlines"],"m:dark_skin":["m:tanlines"],"f:lolicon":["f:small_breasts"],"f:breast_feeding":["f:nipple_stimulation"]},"combo":{"f:kemonomimi":["f:horse_girl","f:dog_girl","f:mouse_girl","f:bunny_girl","f:catgirl","f:cowgirl","c:amiya","c:rosmontis","c:suzuran","c:shamare","c:schwarz"],"f:tail":["f:horse_girl","c:suzuran","c:schwarz","c:yuko_yoshida"],"f:leotard":["f:bunny_girl"],"f:horns":["f:oni","c:yuko_yoshida"],"f:horse_girl":["p:uma_musume_pretty_derby"],"f:halo":["p:blue_archive"],"f:zombie":["p:zombie_land_saga"],"f:hair_buns":["c:ayumu_uehara","c:yoshiko_tsushima","c:chisato_arashi","c:ceylon"],"f:twintails":["c:yu_takasaki","c:rurino_osawa","c:sayaka_murano","c:nico_yazawa","c:nozomi_tojo","c:ruby_kurosawa","c:ria_kazuno","c:arisa_ichigaya","c:himari_uehara","c:ako_udagawa","c:reona_nyubara","c:tsukushi_futaba","c:kotone_fujita"],"f:ponytail":["c:hime_anyoji","c:eli_ayase","c:honoka_kosaka","c:kanan_matsuura","c:seira_kazuno","c:ren_hazuki","c:saaya_yamabuki","c:nijika_ijichi","c:schwarz"],"f:very_long_hair":["c:hitori_gotou","c:nijika_ijichi","c:euphyllia_magenta"],"f:lolicon":["c:suzuran","c:shamare"],"f:wings":["c:remilia_scarlet","c:flandre_scarlet","c:koakuma"],"f:vampire":["c:remilia_scarlet","c:flandre_scarlet"],"f:demon_girl":["c:koakuma","c:yuko_yoshida"],"f:thick_eyebrows":["c:suletta_mercury"],"f:glasses":["c:junna_hoshimi"],"f:beauty_mark":["c:misuzu_hataya"],"m:crossdressing":["c:mizuki_akiyama"]}};
const getTagLintRules = () => {
  const shortNamespace = new Map([['p', 'parody'], ['c', 'character'], ['g', 'group'], ['a', 'artist'], ['m', 'male'], ['f', 'female'], ['x', 'mixed'], ['o', 'other']].map(([short, full]) => [new RegExp(\`\\\\b\${short}\\\\b(?=.*:)\`), full]));
  // 将缩写的命名空间转回全拼
  const getTagName = tag => {
    let fullTag = tag;
    for (const re of shortNamespace.keys()) if (re.test(fullTag)) {
      fullTag = fullTag.replace(re, shortNamespace.get(re));
    }
    return fullTag;
  };
  const createRuleMap = (map, reverse = false) => {
    const ruleMap = new Map();
    if (reverse) for (let [targetTag, tags] of Object.entries(map)) {
      targetTag = getTagName(targetTag);
      for (let tag of tags) {
        tag = getTagName(tag);
        if (ruleMap.has(tag)) ruleMap.get(tag).add(targetTag);else ruleMap.set(tag, new Set([targetTag]));
      }
    } else for (const [tag, targetTag] of Object.entries(map)) ruleMap.set(getTagName(tag), new Set(targetTag.map(getTagName)));
    return ruleMap;
  };
  return {
    prerequisite: createRuleMap(rules.prerequisite, true),
    conflict: createRuleMap(rules.conflict),
    possibleConflict: createRuleMap(rules.possibleConflict),
    // 写的时候为了可以根据不同作品分类而没有反转
    // 但为了减少代码，在打包时反转了下，所以在用时得再反转回去
    combo: createRuleMap(rules.combo, true)
  };
};

/** 拆分多个命名空间的标签 */
const splitTagNamespace = tag => {
  if (!tag.startsWith('(')) return [tag];
  const [, namespaces, tagName] = /\\((.+?)\\)(.+)/.exec(tag);
  return namespaces.split('|').map(namespace => \`\${namespace}\${tagName}\`);
};

/** 判断是否缺少指定命名空间下的标签 */
const isMissingNamespace = (tagList, ...namespaces) => {
  for (const namespace of namespaces) for (const tag of tagList) if (tag.startsWith(namespace)) return false;
  return true;
};

/** 检查标签是否存在 */
const hasTag = (tagList, tagName) => {
  if (tagName.startsWith('(')) for (const tag of splitTagNamespace(tagName)) if (tagList.has(tag)) return true;
  if (tagName.endsWith(':*')) return !isMissingNamespace(tagList, tagName.split(':*')[0]);
  return tagList.has(tagName);
};

/** 判断是否缺少指定标签 */
const isMissingTags = (tagList, ...tags) => {
  for (const tag of tags) if (tagList.has(tag)) return false;
  return true;
};

exports.getTagLintRules = getTagLintRules;
exports.hasTag = hasTag;
exports.isMissingNamespace = isMissingNamespace;
exports.isMissingTags = isMissingTags;
exports.splitTagNamespace = splitTagNamespace;
`
break;
    case 'main':
      code =`
const solidJs = require('solid-js');
const web = require('solid-js/web');
const helper = require('helper');
const store = require('solid-js/store');
const Manga = require('components/Manga');
const Toast = require('components/Toast');
const IconButton = require('components/IconButton');
const fflate = require('fflate');
const Fab = require('components/Fab');
const request = require('request');

const triggerOptions = !web.isServer && solidJs.DEV ? { equals: false, name: "trigger" } : { equals: false };
const triggerCacheOptions = !web.isServer && solidJs.DEV ? { equals: false, internal: true } : triggerOptions;
class TriggerCache {
    #map;
    constructor(mapConstructor = Map) {
        this.#map = new mapConstructor();
    }
    dirty(key) {
        if (web.isServer)
            return;
        this.#map.get(key)?.$$();
    }
    dirtyAll() {
        if (web.isServer)
            return;
        for (const trigger of this.#map.values())
            trigger.$$();
    }
    track(key) {
        if (!solidJs.getListener())
            return;
        let trigger = this.#map.get(key);
        if (!trigger) {
            const [$, $$] = solidJs.createSignal(undefined, triggerCacheOptions);
            this.#map.set(key, (trigger = { $, $$, n: 1 }));
        }
        else
            trigger.n++;
        solidJs.onCleanup(() => {
            // remove the trigger when no one is listening to it
            if (--trigger.n === 0)
                // microtask is to avoid removing the trigger used by a single listener
                queueMicrotask(() => trigger.n === 0 && this.#map.delete(key));
        });
        trigger.$();
    }
}

const $KEYS = Symbol("track-keys");
/**
 * A reactive version of a Javascript built-in \`Set\` class.
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/set#ReactiveSet
 * @example
 * const set = new ReactiveSet([1,2,3]);
 * [...set] // reactive on any change
 * set.has(2) // reactive on change to the result
 * // apply changes
 * set.add(4)
 * set.delete(2)
 * set.clear()
 */
class ReactiveSet extends Set {
    #triggers = new TriggerCache();
    constructor(values) {
        super();
        if (values)
            for (const value of values)
                super.add(value);
    }
    [Symbol.iterator]() {
        return this.values();
    }
    get size() {
        this.#triggers.track($KEYS);
        return super.size;
    }
    has(value) {
        this.#triggers.track(value);
        return super.has(value);
    }
    keys() {
        return this.values();
    }
    *values() {
        this.#triggers.track($KEYS);
        for (const value of super.values()) {
            yield value;
        }
    }
    *entries() {
        this.#triggers.track($KEYS);
        for (const entry of super.entries()) {
            yield entry;
        }
    }
    forEach(callbackfn, thisArg) {
        this.#triggers.track($KEYS);
        super.forEach(callbackfn, thisArg);
    }
    add(value) {
        if (!super.has(value)) {
            super.add(value);
            solidJs.batch(() => {
                this.#triggers.dirty(value);
                this.#triggers.dirty($KEYS);
            });
        }
        return this;
    }
    delete(value) {
        const result = super.delete(value);
        if (result) {
            solidJs.batch(() => {
                this.#triggers.dirty(value);
                this.#triggers.dirty($KEYS);
            });
        }
        return result;
    }
    clear() {
        if (super.size) {
            super.clear();
            solidJs.batch(() => {
                this.#triggers.dirtyAll();
            });
        }
    }
}

const MdSettings = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19.5 12c0-.23-.01-.45-.03-.68l1.86-1.41c.4-.3.51-.86.26-1.3l-1.87-3.23a.987.987 0 0 0-1.25-.42l-2.15.91c-.37-.26-.76-.49-1.17-.68l-.29-2.31c-.06-.5-.49-.88-.99-.88h-3.73c-.51 0-.94.38-1 .88l-.29 2.31c-.41.19-.8.42-1.17.68l-2.15-.91c-.46-.2-1-.02-1.25.42L2.41 8.62c-.25.44-.14.99.26 1.3l1.86 1.41a7.3 7.3 0 0 0 0 1.35l-1.86 1.41c-.4.3-.51.86-.26 1.3l1.87 3.23c.25.44.79.62 1.25.42l2.15-.91c.37.26.76.49 1.17.68l.29 2.31c.06.5.49.88.99.88h3.73c.5 0 .93-.38.99-.88l.29-2.31c.41-.19.8-.42 1.17-.68l2.15.91c.46.2 1 .02 1.25-.42l1.87-3.23c.25-.44.14-.99-.26-1.3l-1.86-1.41c.03-.23.04-.45.04-.68m-7.46 3.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdClose = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdFileDownload = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M16.59 9H15V4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H7.41c-.89 0-1.34 1.08-.71 1.71l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.63-.63.19-1.71-.7-1.71M5 19c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const getExtName = mime => /.+\\/([^;]+)/.exec(mime)?.[1] ?? 'jpg';

/** 下载按钮 */
const DownloadButton = () => {
  const {
    store: state,
    _setState: setState
  } = helper.useStore({
    length: 0,
    /** undefined 表示未开始下载，等于 length 表示正在打包，-1 表示下载完成 */
    completedNum: undefined,
    errorNum: 0,
    rawTitle: document.title,
    showRawTitle: true
  });
  const progress = new helper.FaviconProgress();
  const handleDownload = async () => {
    const fileData = {};
    setState({
      errorNum: 0,
      length: Manga.imgList().length
    });
    if (state.showRawTitle) setState('rawTitle', document.title);
    const imgIndexNum = \`\${state.length}\`.length;
    for (let i = 0; i < state.length; i += 1) {
      setState('completedNum', i);
      const img = Manga.imgList()[i];
      if (Manga.store.option.translation.onlyDownloadTranslated && img.translationType !== 'show') continue;
      const index = \`\${i}\`.padStart(imgIndexNum, '0');
      const url = img.translationType === 'show' ? img.translationUrl : img.src;
      let data;
      let fileName;
      try {
        data = await Manga.downloadImg(url);
        fileName = \`\${index}.\${getExtName(data.type)}\`;
      } catch {
        fileName = \`\${index} - \${helper.t('alert.download_failed')}\`;
        setState('errorNum', num => num + 1);
      }
      fileData[fileName] = new Uint8Array((await data?.arrayBuffer()) ?? []);
    }
    if (Object.keys(fileData).length === 0) {
      Toast.toast.warn(helper.t('alert.no_img_download'));
      setState('completedNum', undefined);
      return;
    }
    setState('completedNum', state.length);
    const zipped = fflate.zipSync(fileData, {
      level: 0,
      comment: window.location.href
    });
    helper.saveAs(new Blob([zipped]), \`\${Manga.store.title || state.rawTitle}.zip\`);
    setState('completedNum', -1);
    Toast.toast(state.errorNum > 0 ? helper.t('button.download_completed_error', {
      errorNum: state.errorNum
    }) : helper.t('button.download_completed'), {
      type: state.errorNum > 0 ? 'warn' : 'success',
      onDismiss() {
        document.title = state.rawTitle;
        setState('showRawTitle', true);
        progress.recover();
      }
    });
  };
  const tip = solidJs.createMemo(() => {
    switch (state.completedNum) {
      case undefined:
        return helper.t('button.download');
      case state.length:
        return helper.t('button.packaging');
      case -1:
        return helper.t('button.download_completed');
      default:
        return \`\${helper.t('button.downloading')} - \${state.completedNum}/\${state.length}\`;
    }
  });

  // 根据下载进度更新网页标题
  helper.createEffectOn(() => state.completedNum, num => {
    let showTip = '';
    switch (num) {
      case undefined:
        return;
      case state.length:
        showTip = '📦';
        break;
      case -1:
        showTip = state.errorNum > 0 ? \`❗[\${state.errorNum}]\` : '✅';
        break;
      default:
        showTip = \`\${num}/\${state.length}\`;
    }
    document.title = \`\${showTip} - \${state.rawTitle}\`;
    setState('showRawTitle', false);
  }, {
    defer: true
  });

  // 根据下载进度更新网页图标
  helper.createEffectOn(() => state.completedNum, num => num && num > 0 && progress.update(num / state.length), {
    defer: true
  });
  return web.createComponent(IconButton.IconButton, {
    get tip() {
      return tip();
    },
    onClick: handleDownload,
    get enabled() {
      return state.completedNum !== undefined;
    },
    get children() {
      return web.createComponent(MdFileDownload, {});
    }
  });
};

let dom$1;

/**
 * 显示漫画阅读窗口
 */
const useManga = async initProps => {
  GM_addStyle(\`
    #comicRead {
      position: fixed;
      top: 0;
      left: 0;
      transform: scale(0);
      contain: strict;

      width: 100%;
      height: 100%;

      font-size: 16px;

      opacity: 0;

      transition: opacity 300ms, transform 0s 300ms;
    }

    #comicRead[show] {
      transform: scale(1);
      opacity: 1;
      transition: opacity 300ms, transform 100ms;
    }

    /* 防止其他扩展的元素显示到漫画上来 */
    #comicRead[show] ~ :not(#fab, #toast, .comicread-ignore) {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      z-index: 1 !important;
    }
  \`);
  const [props, setProps] = store.createStore({
    imgList: [],
    show: false,
    ...initProps
  });
  dom$1 = helper.mountComponents('comicRead', () => web.createComponent(Manga.Manga, props));
  dom$1.style.setProperty('z-index', '2147483647', 'important');

  // 确保 toast 可以显示在漫画之上
  const toastDom = helper.querySelector('#toast');
  if (toastDom) dom$1.after(toastDom);
  const htmlStyle = document.documentElement.style;
  let lastOverflow = htmlStyle.overflow;
  helper.createEffectOn(helper.createRootMemo(() => props.show && props.imgList.length > 0), show => {
    if (show) {
      dom$1.setAttribute('show', '');
      lastOverflow = htmlStyle.overflow;
      htmlStyle.setProperty('overflow', 'hidden', 'important');
      htmlStyle.setProperty('scrollbar-width', 'none', 'important');
    } else {
      dom$1.removeAttribute('show');
      htmlStyle.overflow = lastOverflow;
      htmlStyle.removeProperty('scrollbar-width');
    }
  }, {
    defer: true
  });
  const ExitButton = () => web.createComponent(IconButton.IconButton, {
    get tip() {
      return helper.t('button.exit');
    },
    onClick: () => props.onExit?.(),
    get children() {
      return web.createComponent(MdClose, {});
    }
  });
  setProps({
    onExit: () => setProps('show', false),
    editButtonList(list) {
      // 在设置按钮上方放置下载按钮
      list.splice(-1, 0, DownloadButton);
      return [...list,
      // 再在最下面添加分隔栏和退出按钮
      () => web.template(\`<hr>\`)(), ExitButton];
    }
  });
  return [setProps, props];
};

const MdMenuBook = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.45 0-2.99.22-4.28.79C1.49 5.62 1 6.33 1 7.14v11.28c0 1.3 1.22 2.26 2.48 1.94.98-.25 2.02-.36 3.02-.36 1.56 0 3.22.26 4.56.92.6.3 1.28.3 1.87 0 1.34-.67 3-.92 4.56-.92 1 0 2.04.11 3.02.36 1.26.33 2.48-.63 2.48-1.94V7.14c0-.81-.49-1.52-1.22-1.85-1.28-.57-2.82-.79-4.27-.79M21 17.23c0 .63-.58 1.09-1.2.98-.75-.14-1.53-.2-2.3-.2-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5.92 0 1.83.09 2.7.28.46.1.8.51.8.98z"></path><path d="M13.98 11.01c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.54-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.71-.83.66c-1.62-.19-3.39-.04-4.73.39-.08.01-.16.03-.23.03m0 2.66c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.53-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.71-.83.66c-1.62-.19-3.39-.04-4.73.39a1 1 0 0 1-.23.03m0 2.66c-.32 0-.61-.2-.71-.52-.13-.39.09-.82.48-.94 1.53-.5 3.53-.66 5.36-.45.41.05.71.42.66.83s-.42.7-.83.66c-1.62-.19-3.39-.04-4.73.39a1 1 0 0 1-.23.03">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdImageSearch = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 15v4c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h3.02c.55 0 1-.45 1-1s-.45-1-1-1H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5c0-.55-.45-1-1-1s-1 .45-1 1m-2.5 3H6.52c-.42 0-.65-.48-.39-.81l1.74-2.23a.5.5 0 0 1 .78-.01l1.56 1.88 2.35-3.02c.2-.26.6-.26.79.01l2.55 3.39c.25.32.01.79-.4.79m3.8-9.11c.48-.77.75-1.67.69-2.66-.13-2.15-1.84-3.97-3.97-4.2A4.5 4.5 0 0 0 11 6.5c0 2.49 2.01 4.5 4.49 4.5.88 0 1.7-.26 2.39-.7l2.41 2.41c.39.39 1.03.39 1.42 0s.39-1.03 0-1.42zM15.5 9a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdImportContacts = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M17.5 4.5c-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.45 0-2.99.22-4.28.79C1.49 5.62 1 6.33 1 7.14v11.28c0 1.3 1.22 2.26 2.48 1.94.98-.25 2.02-.36 3.02-.36 1.56 0 3.22.26 4.56.92.6.3 1.28.3 1.87 0 1.34-.67 3-.92 4.56-.92 1 0 2.04.11 3.02.36 1.26.33 2.48-.63 2.48-1.94V7.14c0-.81-.49-1.52-1.22-1.85-1.28-.57-2.82-.79-4.27-.79M21 17.23c0 .63-.58 1.09-1.2.98-.75-.14-1.53-.2-2.3-.2-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5.92 0 1.83.09 2.7.28.46.1.8.51.8.98z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdCloudDownload = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96M17 13l-4.65 4.65c-.2.2-.51.2-.71 0L7 13h3V9h4v4z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

let dom;
const useFab = async (initProps, options, setOptions) => {
  GM_addStyle(\`
    #fab {
      --text-bg: transparent;

      position: fixed;
      right: calc(3vw - var(--left, 0px));
      bottom: calc(6vh - var(--top, 0px));

      font-size: clamp(12px, 1.5vw, 16px);
    }
  \`);
  const [props, setProps] = store.createStore(initProps);
  helper.useStyleMemo('#fab', {
    '--left': () => \`\${options.fabPosition.left}px\`,
    '--top': () => \`\${options.fabPosition.top}px\`
  });
  const FabIcon = () => {
    switch (props.progress) {
      case undefined:
        return MdImportContacts;
      // 没有内容的书
      case 1:
      case 2:
        return MdMenuBook;
      // 有内容的书
      default:
        return props.progress > 1 ? MdCloudDownload : MdImageSearch;
    }
  };
  const handleMount = ref => {
    const handleDrag = ({
      xy: [x, y],
      last: [lx, ly]
    }) => {
      const left = options.fabPosition.left + x - lx;
      const top = options.fabPosition.top + y - ly;
      setOptions({
        fabPosition: {
          left,
          top
        }
      });
    };
    helper.useDrag({
      ref,
      handleDrag,
      setCapture: true
    });

    // 超出显示范围就恢复原位
    const observer = new IntersectionObserver(entries => {
      if (entries.length !== 1 || entries[0].isIntersecting) return;
      setOptions({
        fabPosition: {
          left: 0,
          top: 0
        }
      });
    }, {
      threshold: 0.5
    });
    observer.observe(ref);
  };
  dom = helper.mountComponents('fab', () => web.createComponent(Fab.Fab, web.mergeProps({
    ref: handleMount
  }, props, {
    get children() {
      return props.children ?? web.createComponent(web.Dynamic, {
        get component() {
          return FabIcon();
        }
      });
    }
  })));
  dom.style.setProperty('z-index', '2147483646', 'important');
  return [setProps, props];
};

const MdAutoFixHigh = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="m20.45 6 .49-1.06L22 4.45a.5.5 0 0 0 0-.91l-1.06-.49L20.45 2a.5.5 0 0 0-.91 0l-.49 1.06-1.05.49a.5.5 0 0 0 0 .91l1.06.49.49 1.05c.17.39.73.39.9 0M8.95 6l.49-1.06 1.06-.49a.5.5 0 0 0 0-.91l-1.06-.48L8.95 2a.492.492 0 0 0-.9 0l-.49 1.06-1.06.49a.5.5 0 0 0 0 .91l1.06.49L8.05 6c.17.39.73.39.9 0m10.6 7.5-.49 1.06-1.06.49a.5.5 0 0 0 0 .91l1.06.49.49 1.06a.5.5 0 0 0 .91 0l.49-1.06 1.05-.5a.5.5 0 0 0 0-.91l-1.06-.49-.49-1.06c-.17-.38-.73-.38-.9.01m-1.84-4.38-2.83-2.83a.996.996 0 0 0-1.41 0L2.29 17.46a.996.996 0 0 0 0 1.41l2.83 2.83c.39.39 1.02.39 1.41 0L17.7 10.53c.4-.38.4-1.02.01-1.41m-3.5 2.09L12.8 9.8l1.38-1.38 1.41 1.41z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdAutoFixOff = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="m22 3.55-1.06-.49L20.45 2a.5.5 0 0 0-.91 0l-.49 1.06-1.05.49a.5.5 0 0 0 0 .91l1.06.49.49 1.05a.5.5 0 0 0 .91 0l.49-1.06L22 4.45c.39-.17.39-.73 0-.9m-7.83 4.87 1.41 1.41-1.46 1.46 1.41 1.41 2.17-2.17a.996.996 0 0 0 0-1.41l-2.83-2.83a.996.996 0 0 0-1.41 0l-2.17 2.17 1.41 1.41zM2.1 4.93l6.36 6.36-6.17 6.17a.996.996 0 0 0 0 1.41l2.83 2.83c.39.39 1.02.39 1.41 0l6.17-6.17 6.36 6.36a.996.996 0 1 0 1.41-1.41L3.51 3.51a.996.996 0 0 0-1.41 0c-.39.4-.39 1.03 0 1.42">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdFlashOn = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M7 3v9c0 .55.45 1 1 1h2v7.15c0 .51.67.69.93.25l5.19-8.9a.995.995 0 0 0-.86-1.5H13l2.49-6.65A.994.994 0 0 0 14.56 2H8c-.55 0-1 .45-1 1">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdFlashOff = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M16.12 11.5a.995.995 0 0 0-.86-1.5h-1.87l2.28 2.28zm.16-8.05c.33-.67-.15-1.45-.9-1.45H8c-.55 0-1 .45-1 1v.61l6.13 6.13zm2.16 14.43L4.12 3.56a.996.996 0 1 0-1.41 1.41L7 9.27V12c0 .55.45 1 1 1h2v7.15c0 .51.67.69.93.25l2.65-4.55 3.44 3.44c.39.39 1.02.39 1.41 0 .4-.39.4-1.02.01-1.41">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdLockOpen = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6-5h-1V6c0-2.76-2.24-5-5-5-2.28 0-4.27 1.54-4.84 3.75-.14.54.18 1.08.72 1.22a1 1 0 0 0 1.22-.72A2.996 2.996 0 0 1 12 3c1.65 0 3 1.35 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m0 11c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1h10c.55 0 1 .45 1 1z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const MdLock = (props = {}) => (() => {
  var _el$ = web.template(\`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2M9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2z">\`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

const useSpeedDial = (options, setOptions, placement) => {
  const DefaultButton = props => web.createComponent(IconButton.IconButton, {
    get placement() {
      return placement();
    },
    showTip: true,
    get tip() {
      return props.showName ?? (helper.t(\`site.add_feature.\${props.optionName}\`) || props.optionName);
    },
    onClick: () => setOptions({
      [props.optionName]: !options[props.optionName]
    }),
    get children() {
      return props.children ?? (options[props.optionName] ? web.createComponent(MdAutoFixHigh, {}) : web.createComponent(MdAutoFixOff, {}));
    }
  });
  const list = Object.keys(options).map(optionName => {
    switch (optionName) {
      case 'hiddenFAB':
      case 'option':
        return null;
      case 'autoShow':
        return () => web.createComponent(DefaultButton, {
          optionName: "autoShow",
          get showName() {
            return helper.t('site.add_feature.auto_show');
          },
          get children() {
            return web.memo(() => !!options.autoShow)() ? web.createComponent(MdFlashOn, {}) : web.createComponent(MdFlashOff, {});
          }
        });
      case 'lockOption':
        return () => web.createComponent(DefaultButton, {
          optionName: "lockOption",
          get showName() {
            return helper.t('site.add_feature.lock_option');
          },
          get children() {
            return web.memo(() => !!options.lockOption)() ? web.createComponent(MdLock, {}) : web.createComponent(MdLockOpen, {});
          }
        });
      default:
        if (typeof options[optionName] !== 'boolean') return null;
        return () => web.createComponent(DefaultButton, {
          optionName: optionName
        });
    }
  }).filter(Boolean);
  return list;
};

/** 判断版本号1是否小于版本号2 */
const versionLt = (version1, version2) => {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const num1 = v1[i] ?? 0;
    const num2 = v2[i] ?? 0;
    if (num1 !== num2) return num1 < num2;
  }
  return false;
};
const migrationOption = async (name, editFn) => {
  try {
    const option = await GM.getValue(name);
    if (!option) throw new Error(\`GM.getValue Error: not found \${name}\`);
    await editFn(option, () => GM.setValue(name, option));
  } catch (error) {
    helper.log.error(\`migration \${name} option error:\`, error);
  }
};

/** 重命名配置项 */
const renameOption = async (name, list) => migrationOption(name, (option, save) => {
  for (const itemText of list) {
    const [path, newName] = itemText.split(' => ');
    helper.byPath(option, path, (parent, key) => {
      helper.log('rename Option', itemText);
      if (newName) Reflect.set(parent, newName, parent[key]);
      Reflect.deleteProperty(parent, key);
    });
  }
  return save();
});

/** 旧版本配置迁移 */
const migration = async version => {
  // 任何样式修改都得更新 css 才行，干脆直接删了
  GM.deleteValue('ehTagColorizeCss');
  GM.deleteValue('ehTagSortCss');
  const values = await GM.listValues();

  // 6 => 7
  if (versionLt(version, '7')) for (const key of values) {
    switch (key) {
      case 'Version':
      case 'Languages':
        continue;
      case 'HotKeys':
        {
          await renameOption(key, ['向上翻页 => turn_page_up', '向下翻页 => turn_page_down', '向右翻页 => turn_page_right', '向左翻页 => turn_page_left', '跳至首页 => jump_to_home', '跳至尾页 => jump_to_end', '退出 => exit', '切换页面填充 => switch_page_fill', '切换卷轴模式 => switch_scroll_mode', '切换单双页模式 => switch_single_double_page_mode', '切换阅读方向 => switch_dir', '进入阅读模式 => enter_read_mode']);
          break;
        }
      default:
        await renameOption(key, ['option.scrollbar.showProgress => showImgStatus', 'option.clickPage => clickPageTurn', 'option.clickPage.overturn => reverse', 'option.swapTurnPage => swapPageTurnKey', 'option.flipToNext => jumpToNext',
        // ehentai
        '匹配nhentai => associate_nhentai', '快捷键翻页 => hotkeys_page_turn',
        // nhentai
        '自动翻页 => auto_page_turn', '彻底屏蔽漫画 => block_totally', '在新页面中打开链接 => open_link_new_page',
        // other
        '记住当前站点 => remember_current_site']);
    }
  }

  // 8 => 9
  if (versionLt(version, '9')) for (const key of values) {
    switch (key) {
      case 'Version':
      case 'Languages':
        continue;
      case 'Hotkeys':
        {
          await renameOption(key, [
          // 原本上下快捷键是混在一起的，现在分开后要迁移太麻烦了，应该也没多少人改，就直接删了
          'turn_page_up => ', 'turn_page_down => ', 'turn_page_right => scroll_right', 'turn_page_left => scroll_left']);
          break;
        }
      default:
        await migrationOption(key, (option, save) => {
          if (typeof option.option?.scrollMode !== 'boolean') return;
          option.option.scrollMode = {
            enabled: option.option.scrollMode,
            spacing: option.option.scrollModeSpacing,
            imgScale: option.option.scrollModeImgScale,
            fitToWidth: option.option.scrollModeFitToWidth
          };
          return save();
        });
    }
  }

  // 9.3 => 9.4
  if (versionLt(version, '9.4')) await migrationOption('ehentai', (option, save) => {
    if (!Reflect.has(option, 'hotkeys_page_turn')) return;
    option.hotkeys = option.hotkeys_page_turn;
    Reflect.deleteProperty(option, 'hotkeys_page_turn');
    return save();
  });

  // 11.4.2 => 11.5
  if (versionLt(version, '11.5')) await migrationOption('Hotkeys', (option, save) => {
    for (const [name, hotkeys] of Object.entries(option)) {
      option[name] = hotkeys.map(key => key.replaceAll(/\\b[A-Z]\\b/g, match => match.toLowerCase()));
    }
    return save();
  });
};


/** 处理版本更新相关 */
const handleVersionUpdate = async () => {
  const version = await GM.getValue('Version');
  if (!version) return GM.setValue('Version', GM.info.script.version);
  if (version === GM.info.script.version) return;
  await migration(version); // 每次版本更新都执行一遍迁移

  // 只在语言为中文时弹窗提示最新更新内容
  if (helper.lang() === 'zh') {
    Toast.toast(() => /* eslint-disable i18next/no-literal-string */[(() => {
      var _el$ = web.template(\`<h2>🥳 ComicRead 已更新到 v\`)();
        _el$.firstChild;
      web.insert(_el$, () => GM.info.script.version, null);
      return _el$;
    })(), web.template(\`<h3>修复\`)(), web.template(\`<ul><li><p>修复 hitomi 失效的 bug </p></li><li><p>修复拷贝漫画移动端未正常显示上/下一话按钮的 bug\`)(), web.createComponent(solidJs.Show, {
      get when() {
        return versionLt(version, '10.8.0');
      },
      get children() {
        return [web.template(\`<h3>改动\`)(), web.template(\`<ul><li>ehentai 悬浮标签列表的透明度调节<br>由「鼠标滚轮」改为「Shift + 鼠标滚轮」\`)()];
      }
    })] /* eslint-enable i18next/no-literal-string */, {
      id: 'Version Tip',
      type: 'custom',
      duration: Number.POSITIVE_INFINITY,
      // 手动点击关掉通知后才不会再次弹出
      onDismiss: () => GM.setValue('Version', GM.info.script.version)
    });

    // 监听储存的版本数据的变动，如果和当前版本一致就关掉弹窗
    // 防止在更新版本后一次性打开多个页面，不得不一个一个关过去
    const listenerId = await GM.addValueChangeListener('Version', async (_, __, newVersion) => {
      if (newVersion !== GM.info.script.version) return;
      Toast.toast.dismiss('Version Tip');
      await GM.removeValueChangeListener(listenerId);
    });
  } else await GM.setValue('Version', GM.info.script.version);
};

/** 清理多余的配置项 */
const clear = (options, defaultOptions) => {
  let isClear = false;
  for (const key of Object.keys(options)) {
    if (Reflect.has(defaultOptions, key)) continue;
    Reflect.deleteProperty(options, key);
    isClear = true;
  }
  return isClear;
};

/**
 * 对修改站点配置的相关方法的封装
 * @param name 站点名
 * @param defaultOptions 默认配置
 */
const useSiteOptions = async (name, defaultOptions = {}) => {
  const _defaultOptions = {
    option: undefined,
    defaultOption: undefined,
    autoShow: true,
    lockOption: false,
    hiddenFAB: false,
    fabPosition: {
      top: 0,
      left: 0
    },
    ...defaultOptions
  };
  const saveOptions = await GM.getValue(name);
  const options = store.createMutable(helper.assign(_defaultOptions, saveOptions));
  const setOptions = async newOptions => {
    const lockOption = options.lockOption;
    if (newOptions) Object.assign(options, newOptions);
    if (lockOption && newOptions?.lockOption !== false) return;
    // 只保存和默认设置不同的部分
    return GM.setValue(name, helper.difference(options, _defaultOptions));
  };
  const isStored = saveOptions !== undefined;
  // 如果当前站点没有存储配置，就补充上去
  if (!isStored) await GM.setValue(name, {});
  // 否则检查是否有多余的配置
  else if (clear(options, _defaultOptions)) await setOptions();
  return {
    /** 站点配置 */
    options,
    /** 修改站点配置 */
    setOptions,
    /** 是否存过配置 */
    isStored
  };
};

const [hotkeys, setHotkeys] = solidJs.createSignal({});

/**
 * 对基础的初始化操作的封装
 * @param name 站点名
 * @param defaultOptions 默认配置
 */
const useInit = async (name, defaultOptions = {}) => {
  await helper.setInitLang();
  await handleVersionUpdate();
  const {
    options,
    setOptions,
    isStored
  } = await useSiteOptions(name, defaultOptions);
  const placement = () => -options.fabPosition.left < window.innerWidth / 2 ? 'left' : 'right';
  const [setFab, fabProps] = await useFab({
    tip: helper.t('other.read_mode'),
    speedDial: useSpeedDial(options, setOptions, placement),
    show: false,
    placement,
    speedDialPlacement: () => -options.fabPosition.top < window.innerHeight / 2 ? 'top' : 'bottom'
  }, options, setOptions);
  setHotkeys(await GM.getValue('Hotkeys', {}));
  Manga.setDefaultHotkeys(_hotkeys => ({
    ..._hotkeys,
    enter_read_mode: ['v']
  }));
  const [setManga, mangaProps] = await useManga({
    imgList: [],
    option: options.option,
    defaultOption: options.defaultOption,
    onOptionChange: option => setOptions({
      option
    }),
    hotkeys: hotkeys(),
    onHotkeysChange(newValue) {
      GM.setValue('Hotkeys', newValue);
      setHotkeys(newValue);
    }
  });
  const [comicMap, setComicMap] = store.createStore({});
  const [nowComic, switchComic] = solidJs.createSignal('');
  const setImgList = (id, i, url) => {
    // XXX: 之后用 Array.with() 替换
    const newImgList = [...comicMap[id].imgList];
    newImgList[i] = url;
    setComicMap(id, 'imgList', newImgList);
  };
  const nowImgList = helper.createRootMemo(() => {
    const comic = comicMap[nowComic()];
    if (!comic?.imgList) return undefined;
    if (!comic.adList?.size) return comic.imgList;
    return comic.imgList.filter((_, i) => !comic.adList?.has(i));
  });
  helper.createEffectOn(nowImgList, list => list && setManga('imgList', list));

  /** 当前已取得 url 的图片数量 */
  const loadImgNum = helper.createRootMemo(() => nowImgList()?.filter(Boolean)?.length);

  // 设置 Fab 的显示进度
  helper.createEffectOn([loadImgNum, () => Manga.loadingImgList().size, () => nowImgList()?.length], ([doneNum, loadNum, totalNum]) => {
    if (doneNum === undefined || totalNum === undefined) return setFab({
      progress: undefined
    });
    if (totalNum === 0) return setFab({
      progress: 0,
      tip: \`\${helper.t('other.loading_img')} - \${doneNum}/\${totalNum}\`
    });

    // 加载图片 url 阶段的进度
    if (doneNum < totalNum) return setFab({
      progress: doneNum / totalNum,
      tip: \`\${helper.t('other.loading_img')} - \${doneNum}/\${totalNum}\`
    });

    // 图片加载阶段的进度
    if (loadNum < totalNum) return setFab({
      progress: 1 + loadNum / totalNum,
      tip: \`\${helper.t('other.img_loading')} - \${loadNum}/\${totalNum}\`
    });
    return setFab({
      progress: 1 + loadNum / totalNum,
      tip: helper.t('other.read_mode'),
      show: !options.hiddenFAB && undefined
    });
  });
  let menuId;
  /** 更新显示/隐藏悬浮按钮的菜单项 */
  const updateHideFabMenu = async () => {
    await GM.unregisterMenuCommand(menuId);
    menuId = await GM.registerMenuCommand(options.hiddenFAB ? helper.t('other.fab_show') : helper.t('other.fab_hidden'), async () => {
      await setOptions({
        ...options,
        hiddenFAB: !options.hiddenFAB
      });
      setFab('show', !options.hiddenFAB && undefined);
      await updateHideFabMenu();
    });
  };
  await GM.registerMenuCommand(helper.t('site.show_settings_menu'), () => setFab({
    show: true,
    focus: true,
    tip: helper.t('site.settings_tip'),
    children: web.createComponent(MdSettings, {}),
    onBackdropClick: () => setFab({
      show: false,
      focus: false
    })
  }));

  /** 当前是否还需要判断 autoShow */
  const needAutoShow = {
    val: true
  };
  const loadComic = async (id = nowComic()) => {
    if (!Reflect.has(comicMap, id)) throw new Error('comic id error');
    try {
      setComicMap(id, 'imgList', []);
      const newImgList = await comicMap[id].getImgList();
      if (newImgList.length === 0) throw new Error(helper.t('alert.fetch_comic_img_failed'));
      setComicMap(id, 'imgList', newImgList);
    } catch (error) {
      setComicMap(id, 'imgList', undefined);
      helper.log.error(error);
      throw error;
    }
  };
  const showComic = async (id = nowComic()) => {
    if (!Reflect.has(comicMap, id)) throw new Error('comic id error');
    if (id !== nowComic()) switchComic(id);
    switch (comicMap[id].imgList?.length) {
      case 0:
        return Toast.toast.warn(helper.t('alert.repeat_load'), {
          duration: 1500
        });
      case undefined:
        {
          try {
            await loadComic(id);
            needAutoShow.val = false;
          } catch (error) {
            return Toast.toast.error(error.message);
          }
        }
    }
    setManga('show', true);
  };
  const init = () => {
    setFab({
      onClick: showComic,
      show: !options.hiddenFAB && undefined
    });
    if (needAutoShow.val && options.autoShow) showComic();
    (async () => {
      await GM.registerMenuCommand(helper.t('other.enter_comic_read_mode'), () => fabProps.onClick?.());
      await updateHideFabMenu();
    })();
    helper.linstenKeydown(e => {
      const code = helper.getKeyboardCode(e);
      if (Manga.hotkeysMap()[code] !== 'enter_read_mode') return;
      e.stopPropagation();
      e.preventDefault();
      fabProps.onClick?.();
    }, true);
  };
  return {
    options,
    setOptions,
    setFab,
    setManga,
    mangaProps,
    fabProps,
    needAutoShow,
    isStored,
    comicMap,
    setComicMap,
    setImgList,
    nowComic,
    switchComic,
    showComic,
    loadComic,
    /** 设置对应漫画的加载函数 */
    setComicLoad(getImgList, id = '') {
      setComicMap(id, {
        imgList: undefined,
        getImgList
      });
      if (menuId === undefined) return init();
    },
    dynamicLoad: (loadImgFn, length, id = '') => async () => {
      if (comicMap[id].imgList?.length) return comicMap[id].imgList;
      setComicMap(id, 'imgList', Array.from({
        length: typeof length === 'number' ? length : length()
      }).fill(''));
      // eslint-disable-next-line no-async-promise-executor
      await new Promise(async resolve => {
        try {
          await loadImgFn((i, url) => resolve(setImgList(id, i, url)));
        } catch (error) {
          Toast.toast.error(error.message);
        }
      });
      return comicMap[id].imgList;
    }
  };
};

/** 对简单站点的通用解 */
const universal = async ({
  name,
  wait: waitFn,
  getImgList,
  onPrev,
  onNext,
  onExit,
  onShowImgsChange,
  getCommentList,
  initOptions,
  SPA
}) => {
  if (SPA?.isMangaPage) helper.waitUrlChange(SPA.isMangaPage);
  if (waitFn) await helper.wait(waitFn);
  const fnMap = await useInit(name, initOptions);
  const {
    options,
    setComicLoad,
    setManga,
    setFab,
    needAutoShow,
    setComicMap,
    showComic
  } = fnMap;
  setComicLoad(() => getImgList(fnMap));
  setManga({
    onShowImgsChange
  });
  if (onExit) setManga({
    onExit(isEnd) {
      onExit?.(isEnd);
      setManga({
        show: false
      });
    }
  });
  if (!SPA) {
    if (onNext ?? onPrev) setManga({
      onNext,
      onPrev
    });
    if (getCommentList) setManga({
      commentList: await getCommentList()
    });
    return;
  }
  const {
    isMangaPage,
    getOnPrev,
    getOnNext
  } = SPA;
  helper.onUrlChange(async () => {
    if (isMangaPage && !(await isMangaPage())) {
      setFab('show', false);
      setManga({
        show: false
      });
      setComicMap('', 'imgList', undefined);
      return;
    }
    if (waitFn) await helper.wait(waitFn);
    setFab('show', undefined);
    setManga({
      onPrev: undefined,
      onNext: undefined
    });
    needAutoShow.val = options.autoShow;
    setComicMap('', 'imgList', undefined);
    if (needAutoShow.val && options.autoShow) await showComic('');
    await Promise.all([(async () => getCommentList && setManga({
      commentList: await getCommentList()
    }))(), (async () => getOnPrev && setManga({
      onPrev: await helper.wait(getOnPrev, 5000)
    }))(), (async () => getOnNext && setManga({
      onNext: await helper.wait(getOnNext, 5000)
    }))()]);
  }, SPA?.handleUrl);
};

Object.defineProperty(exports, "toast", {
    enumerable: true,
    get: () => Toast.toast
});
Object.defineProperty(exports, "request", {
    enumerable: true,
    get: () => request.request
});
exports.ReactiveSet = ReactiveSet;
exports.handleVersionUpdate = handleVersionUpdate;
exports.hotkeys = hotkeys;
exports.setHotkeys = setHotkeys;
exports.universal = universal;
exports.useInit = useInit;
exports.useSiteOptions = useSiteOptions;
exports.useSpeedDial = useSpeedDial;
`
      break;
    default:
      code = GM_getResourceText(name.replaceAll('/', '|'));
  }
  if (!code) throw new Error(`外部模块 ${name} 未在 @Resource 中声明`);
  if (name.startsWith('worker/') && supportWorker) {
    try {
      // 如果浏览器支持 worker，就将模块转为 worker
      const workerCode = `
const exports = {};
const Comlink = require('comlink');
${code}
Comlink.expose(exports);
`.replaceAll(/const (\w+?) = require\('(.+?)'\);/g, (_, varName, module) => `
let ${varName} = {};
(function (exports, module) { ${GM_getResourceText(module)} }) (
  ${varName},
  {
    set exports(value) { ${varName} = value },
    get exports() { return ${varName} }
  }
);`);
      const codeUrl = URL.createObjectURL(new Blob([workerCode], {
        type: 'text/javascript'
      }));
      setTimeout(URL.revokeObjectURL, 0, codeUrl);
      const worker = new Worker(codeUrl);
      unsafeWindow[tempName][name] = require('comlink').wrap(worker);
      return;
    } catch {
      supportWorker = false;
    }
  }

  // 通过提供 cjs 环境的变量来兼容 umd 模块加载器
  // 将模块导出变量放到 crsLib 对象里，防止污染全局作用域和网站自身的模块产生冲突
  let runCode = `
    (function (process, require, exports, module, ${gmApiList.join(', ')}) {
      ${code}
    })(
      window['${tempName}'].process,
      window['${tempName}'].require,
      window['${tempName}']['${name}'],
      ((module) => ({
        set exports(value) {
          module['${name}'] = value;
        },
        get exports() {
          return module['${name}'];
        },
      }))(window['${tempName}']),
      ${gmApiList.map(apiName => `window['${tempName}'].${apiName}`).join(', ')}
    );
  `;
  unsafeWindow[tempName] = crsLib;
  unsafeWindow[tempName][name] = {};
  evalCode(runCode);
  Reflect.deleteProperty(unsafeWindow, tempName);
};
/**
 * 创建一个外部模块的 Proxy，等到读取对象属性时才加载模块
 * @param name 外部模块名
 */
const require = name => {
  // 为了应对 rollup 打包时的工具函数 _interopNamespace，要给外部库加上 __esModule 标志
  const __esModule = {
    value: true
  };
  const selfLibProxy = () => {};
  selfLibProxy.default = {};
  const selfDefault = new Proxy(selfLibProxy, {
    get(_, prop) {
      if (prop === '__esModule') return __esModule;
      if (prop === 'default') return selfDefault;
      if (!crsLib[name]) selfImportSync(name);
      const module = crsLib[name];
      if (Reflect.has(crsLib[name], 'default') && Reflect.has(crsLib[name].default, prop)) return module.default?.[prop];
      return module?.[prop];
    },
    apply(_, __, args) {
      if (!crsLib[name]) selfImportSync(name);
      const module = crsLib[name];
      const ModuleFunc = typeof module.default === 'function' ? module.default : module;
      return ModuleFunc(...args);
    },
    construct(_, args) {
      if (!crsLib[name]) selfImportSync(name);
      const module = crsLib[name];
      const ModuleFunc = typeof module.default === 'function' ? module.default : module;
      return new ModuleFunc(...args);
    }
  });
  return selfDefault;
};
crsLib.require = require;

const languages = require('helper/languages');
const otherSite = require('userscript/otherSite');
const helper = require('helper');
const main = require('main');

/** 站点配置 */
let options;
try {
  // 匹配站点
  switch (window.location.hostname) {
    // #百合会（记录阅读历史、自动签到等）
    case 'bbs.yamibo.com':
      {
const web = require('solid-js/web');
const solidJs = require('solid-js');
const main = require('main');
const helper = require('helper');


// 多页
// https://bbs.yamibo.com/thread-43598-2-694.html
// 目录页
(async () => {
  const {
    options,
    setComicLoad,
    showComic,
    loadComic,
    setManga,
    needAutoShow
  } = await main.useInit('yamibo', {
    记录阅读进度: true,
    关闭快捷导航的跳转: true,
    修正点击页数时的跳转判定: true,
    固定导航条: true,
    自动签到: true
  });
  GM_addStyle(`#fab { --fab: #6E2B19; }

    ${options.固定导航条 ? '.header-stackup { position: fixed !important }' : ''}

    .historyTag {
      white-space: nowrap;

      border: 2px solid #6e2b19;
    }

    a.historyTag {
      font-weight: bold;

      margin-left: 1em;
      padding: 1px 4px;

      color: #6e2b19;
      border-radius: 4px 0 0 4px;
    }
    a.historyTag:last-child {
      border-radius: 4px;
    }

    div.historyTag {
      display: initial;

      margin-left: -.4em;
      padding: 1px;

      color: RGB(255, 237, 187);
      border-radius: 0 4px 4px 0;
      background-color: #6e2b19;
    }

    #threadlisttableid tbody:nth-child(2n) div.historyTag {
      color: RGB(255, 246, 215);
    }

    /* 将「回复/查看」列加宽一点 */
    .tl .num {
      width: 80px !important;
    }
    `);

  // 自动签到
  if (unsafeWindow.discuz_uid && unsafeWindow.discuz_uid !== '0' && options.自动签到) (async () => {
    const todayString = new Date().toLocaleDateString('zh-CN');
    // 判断当前日期与上次成功签到日期是否相同
    if (todayString === localStorage.getItem('signDate')) return;
    const sign = helper.querySelector('#scbar_form > input[name="formhash"]')?.value;
    if (!sign) return;
    try {
      const res = await fetch(`plugin.php?id=zqlj_sign&sign=${sign}`);
      const body = await res.text();
      if (!/成功！|打过卡/.test(body)) throw new Error('自动签到失败');
      main.toast.success('自动签到成功');
      localStorage.setItem('signDate', todayString);
    } catch {
      main.toast.error('自动签到失败');
    }
  })();
  if (options.关闭快捷导航的跳转) helper.querySelector('#qmenu a')?.setAttribute('href', 'javascript:;');

  // 判断当前页是帖子
  if (/thread(-\d+){3}|mod=viewthread/.test(document.URL)) {
    // 修复微博图床的链接
    for (const e of helper.querySelectorAll('img[file*="sinaimg.cn"]')) e.setAttribute('referrerpolicy', 'no-referrer');
    const fid = unsafeWindow.fid ?? Number(new URLSearchParams(helper.querySelector('h2 > a')?.href).get('fid') ?? '-1');

    // 限定板块启用
    if (fid === 30 || fid === 37) {
      const isFirstPage = !helper.querySelector('.pg > .prev');
      // 第一页以外不自动加载
      if (!isFirstPage) needAutoShow.val = false;
      let imgList = helper.querySelectorAll(':is(.t_fsz, .message) img');
      const updateImgList = () => {
        let i = imgList.length;
        while (i--) {
          const img = imgList[i];

          // 触发懒加载
          const file = img.getAttribute('file');
          if (file && img.src !== file) {
            img.setAttribute('src', file);
            img.setAttribute('lazyloaded', 'true');
          }

          // 测试例子：https://bbs.yamibo.com/thread-502399-1-1.html

          // 删掉表情和小图
          if (img.src.includes('static/image') || img.complete && img.naturalHeight && img.naturalWidth && img.naturalHeight < 500 && img.naturalWidth < 500) imgList.splice(i, 1);
        }
        return imgList.map(img => img.src);
      };
      setComicLoad(updateImgList);
      setManga({
        // 在图片加载完成后再检查一遍有没有小图，有就删掉
        onLoading(_imgList, img) {
          if (img && img.width < 500 && img.height < 500) return loadComic();
        },
        onExit(isEnd) {
          if (isEnd) helper.scrollIntoView('.psth, .rate, #postlist > div:nth-of-type(2)');
          setManga('show', false);
        }
      });
      if (helper.querySelector('div.pti > div.authi')) {
        helper.querySelector('div.pti > div.authi').insertAdjacentHTML('beforeend', '<span class="pipe show">|</span><a id="comicReadMode" class="show" href="javascript:;">漫画阅读</a>');
        document.getElementById('comicReadMode')?.addEventListener('click', () => showComic());
      }

      // 如果帖子内有设置目录
      if (helper.querySelector('#threadindex')) {
        // 在网页通过 ajax 更新对应内容后重新获取漫画图片
        helper.hijackFn('ajaxinnerhtml', () => {
          imgList = helper.querySelectorAll('.t_fsz img');
          if (imgList.length === 0 || updateImgList().length === 0) return;
          if (options.autoShow) showComic();
        });
      }
      const tagDom = helper.querySelector('.ptg.mbm.mtn > a');
      // 通过标签确定上/下一话
      if (tagDom) {
        const tagId = tagDom.href.split('id=')[1];
        const reg = /(?<=<th>\s<a href="thread-)\d+(?=-)/g;
        let threadList = [];

        // 先获取包含当前帖后一话在内的同一标签下的帖子id列表，再根据结果设定上/下一话
        const setPrevNext = async (pageNum = 1) => {
          const res = await main.request(`/misc.php?mod=tag&id=${tagId}&type=thread&page=${pageNum}`);
          const newList = [...res.responseText.matchAll(reg)].map(([tid]) => Number(tid));
          threadList = threadList.concat(newList);
          const index = threadList.indexOf(unsafeWindow.tid);
          if (newList.length > 0 && (index === -1 || !threadList[index + 1])) return setPrevNext(pageNum + 1);
          return setManga({
            onPrev: threadList[index - 1] ? () => window.location.assign(`thread-${threadList[index - 1]}-1-1.html`) : undefined,
            onNext: threadList[index + 1] ? () => window.location.assign(`thread-${threadList[index + 1]}-1-1.html`) : undefined
          });
        };
        setTimeout(setPrevNext);
      }
    }
    if (options.记录阅读进度) {
      const tid = unsafeWindow.tid ?? new URLSearchParams(window.location.search).get('tid') ?? /\/thread-(\d+)-\d+-\d+.html/.exec(window.location.pathname)?.[1];
      if (!tid) return;

      /** 回复数 */
      let allReplies;
      try {
        const res = await main.request(`/api/mobile/index.php?module=viewthread&tid=${tid}`, {
          responseType: 'json',
          errorText: '获取帖子回复数时出错',
          noTip: true
        });
        allReplies = Number.parseInt(res.response?.Variables?.thread?.allreplies, 10);
      } catch {}

      /** 当前所在页数 */
      const currentPageNum = Number.parseInt(helper.querySelector('#pgt strong')?.textContent ?? helper.querySelector('#dumppage')?.value ?? '1', 10);
      const cache = await helper.useCache({
        history: 'tid'
      });
      const data = await cache.get('history', `${tid}`);
      // 如果是在翻阅之前页数的内容，则跳过不处理
      if (data && currentPageNum < data.lastPageNum) return;

      // 如果有上次阅读进度的数据，则监视上次的进度之后的楼层，否则监视所有
      /** 监视楼层列表 */
      const watchFloorList = helper.querySelectorAll(data?.lastAnchor && currentPageNum === data.lastPageNum ? `#${data.lastAnchor} ~ div` : '#postlist > div, .plc.cl');
      if (watchFloorList.length === 0) return;
      let id = 0;
      /** 储存数据，但是防抖 */
      const debounceSave = saveData => {
        if (id) window.clearTimeout(id);
        id = window.setTimeout(async () => {
          id = 0;
          await cache.set('history', saveData);
        }, 200);
      };

      // 在指定楼层被显示出来后重新存储进度数据
      const observer = new IntersectionObserver(entries => {
        // 找到触发楼层
        const trigger = entries.find(e => e.isIntersecting);
        if (!trigger) return;

        // 取消触发楼层上面楼层的监视
        const triggerIndex = watchFloorList.indexOf(trigger.target);
        if (triggerIndex === -1) return;
        for (const e of watchFloorList.splice(0, triggerIndex + 1)) observer.unobserve(e);

        // 储存数据
        debounceSave({
          tid: `${tid}`,
          lastPageNum: currentPageNum,
          lastReplies: allReplies || data?.lastReplies || 0,
          lastAnchor: trigger.target.id
        });
      }, {
        rootMargin: '-160px'
      });
      for (const e of watchFloorList) observer.observe(e);
    }
    return;
  }

  // 判断当前页是板块
  if (/forum(-\d+){2}|mod=forumdisplay/.test(document.URL)) {
    if (options.修正点击页数时的跳转判定) {
      const List = helper.querySelectorAll('.tps>a');
      let i = List.length;
      while (i--) List[i].setAttribute('onClick', 'atarget(this)');
    }
    if (options.记录阅读进度) {
      const cache = await helper.useCache({
        history: 'tid'
      });
      const isMobile = !document.querySelector('#flk');
      const [updateFlag, setUpdateFlag] = solidJs.createSignal(false);
      const updateHistoryTag = () => setUpdateFlag(val => !val);
      let listSelector = 'tbody[id^=normalthread]';
      let getTid = e => e.id.split('_')[1];
      let getUrl = (data, tid) => `thread-${tid}-${data.lastPageNum}-1.html#${data.lastAnchor}`;
      if (isMobile) {
        listSelector = '.threadlist li.list';
        getTid = e => new URLSearchParams(e.children[1].getAttribute('href')).get('tid');
        getUrl = (data, tid) => `forum.php?mod=viewthread&tid=${tid}&extra=page%3D1&mobile=2&page=${data.lastPageNum}#${data.lastAnchor}`;
      }
      for (const e of helper.querySelectorAll(listSelector)) {
        const tid = getTid(e);
        web.render(
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        () => {
          const [data, setData] = solidJs.createSignal();
          helper.createEffectOn(updateFlag, () => cache.get('history', tid).then(setData));
          const url = solidJs.createMemo(() => data() ? getUrl(data(), tid) : '');
          const lastReplies = solidJs.createMemo(() => !isMobile && data() ? Number(e.querySelector('.num a').innerHTML) - data().lastReplies : 0);
          const pc = () => [(() => {
            var _el$ = web.template(`<a class=historyTag>回第<!>页 `)(),
              _el$2 = _el$.firstChild,
              _el$4 = _el$2.nextSibling;
              _el$4.nextSibling;
            web.addEventListener(_el$, "click", unsafeWindow.atarget, true);
            web.insert(_el$, () => data()?.lastPageNum, _el$4);
            web.effect(() => web.setAttribute(_el$, "href", url()));
            return _el$;
          })(), web.createComponent(solidJs.Show, {
            get when() {
              return lastReplies() > 0;
            },
            get children() {
              var _el$5 = web.template(`<div class=historyTag>+`)();
                _el$5.firstChild;
              web.insert(_el$5, lastReplies, null);
              return _el$5;
            }
          })];
          const mobile = () => (() => {
            var _el$7 = web.template(`<li><a>回第<!>页`)(),
              _el$8 = _el$7.firstChild,
              _el$9 = _el$8.firstChild,
              _el$11 = _el$9.nextSibling;
              _el$11.nextSibling;
            web.addEventListener(_el$8, "click", unsafeWindow.atarget, true);
            _el$8.style.setProperty("color", "unset");
            web.insert(_el$8, () => data()?.lastPageNum, _el$11);
            web.effect(() => web.setAttribute(_el$8, "href", url()));
            return _el$7;
          })();
          return web.createComponent(solidJs.Show, {
            get when() {
              return Boolean(data());
            },
            get children() {
              return web.createComponent(solidJs.Show, {
                when: isMobile,
                get children() {
                  return mobile();
                },
                get fallback() {
                  return pc();
                }
              });
            }
          });
        }, isMobile ? e.children[3] : e.getElementsByTagName('th')[0]);
      }

      // 切换回当前页时更新提示
      document.addEventListener('visibilitychange', updateHistoryTag);
      // 点击下一页后更新提示
      helper.querySelector('#autopbn')?.addEventListener('click', updateHistoryTag);
    }
  }
})().catch(error => helper.log.error(error));
web.delegateEvents(["click"]);

        break;
      }

    // #百合会新站
    case 'www.yamibo.com':
      {
        if (!window.location.pathname.includes('/manga/view-chapter')) break;
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) break;

        /** 总页数 */
        const totalPageNum = Number(helper.querySelector('section div:first-of-type div:last-of-type').innerHTML.split('：')[1]);
        if (Number.isNaN(totalPageNum)) throw new Error(helper.t('site.changed_load_failed'));

        /** 获取指定页数的图片 url */
        const getImg = async i => {
          const res = await main.request(`https://www.yamibo.com/manga/view-chapter?id=${id}&page=${i}`);
          return /(?<=<img id=['"]imgPic['"].+?src=['"]).+?(?=['"])/.exec(res.responseText)[0].replaceAll('&amp;', '&').replaceAll('http://', 'https://');
        };
        const loadImgFn = setImg => helper.plimit(helper.createSequence(totalPageNum).map(i => async () => setImg(i, await getImg(i + 1))));
        options = {
          name: 'newYamibo',
          getImgList: ({
            dynamicLoad
          }) => dynamicLoad(loadImgFn, totalPageNum)(),
          onNext: helper.querySelectorClick('#btnNext'),
          onPrev: helper.querySelectorClick('#btnPrev'),
          onExit: isEnd => isEnd && helper.scrollIntoView('#w1')
        };
        break;
      }

    // #动漫之家（解锁隐藏漫画）
    case 'comic.idmzj.com':
    case 'comic.dmzj.com':
    case 'manhua.idmzj.com':
    case 'manhua.dmzj.com':
      {
const web = require('solid-js/web');
const solidJs = require('solid-js');
const main = require('main');
const dmzjApi = require('userscript/dmzjApi');
const helper = require('helper');

(async () => {
  const getId = async () => {
    const [, comicPy, chapterId] = window.location.pathname.split(/\/|\./);
    if (!comicPy) {
      main.toast.error('漫画数据获取失败', {
        duration: Number.POSITIVE_INFINITY,
        throw: new Error('获取漫画拼音简称失败')
      });
    }
    const comicId = await dmzjApi.getComicId(comicPy);
    return {
      comicId,
      chapterId
    };
  };
  const handleListPage = async () => {
    await helper.waitDom('.commentBox');

    // 判断漫画被禁
    // 测试例子：https://manhua.dmzj.com/yanquan/
    if (!helper.querySelector('.cartoon_online_border > img')) return false;
    helper.querySelector('.cartoon_online_border').innerHTML = '获取漫画数据中';

    // 删掉原有的章节 dom
    for (const e of helper.querySelectorAll('.odd_anim_title ~ *')) e.remove();
    const {
      comicId
    } = await getId();
    web.render(() => {
      const comicDetail = dmzjApi.useComicDetail(comicId);
      return web.createComponent(solidJs.For, {
        get each() {
          return comicDetail.chapters;
        },
        children: ({
          name,
          list
        }) => [(() => {
          var _el$ = web.template(`<div class=photo_part><div class=h2_title2><span class="h2_icon h2_icon22"></span><h2> `)(),
            _el$2 = _el$.firstChild,
            _el$3 = _el$2.firstChild,
            _el$4 = _el$3.nextSibling,
            _el$5 = _el$4.firstChild;
          web.insert(_el$4, () => comicDetail.title, _el$5);
          web.insert(_el$4, name === '连载' ? '在线漫画全集' : `漫画其它版本：${name}`, null);
          return _el$;
        })(), (() => {
          var _el$6 = web.template(`<div class=cartoon_online_border_other><ul></ul><div class=clearfix>`)(),
            _el$7 = _el$6.firstChild;
          _el$6.style.setProperty("margin-top", "-8px");
          web.insert(_el$7, web.createComponent(solidJs.For, {
            each: list,
            children: ({
              title,
              id,
              updatetime
            }) => (() => {
              var _el$8 = web.template(`<li><a target=_blank>`)(),
                _el$9 = _el$8.firstChild;
              web.setAttribute(_el$9, "title", title);
              web.setAttribute(_el$9, "href", `https://m.dmzj.com/view/${comicId}/${id}.html`);
              web.insert(_el$9, title);
              web.effect(() => _el$9.classList.toggle("color_red", !!(updatetime === comicDetail.last_updatetime)));
              return _el$8;
            })()
          }));
          return _el$6;
        })()]
      });
    }, helper.querySelector('.middleright_mr'));
    return false;
  };

  /** 切换至上下滚动阅读 */
  const waitSwitchScroll = async () => {
    await helper.waitDom('#qiehuan_txt');
    await helper.wait(() => {
      const dom = helper.querySelector('#qiehuan_txt');
      if (!dom) return;
      if (dom.textContent !== '切换到上下滚动阅读') return true;
      dom.click();
    });
  };
  const getImgList = async () => {
    await waitSwitchScroll();
    await helper.waitDom('.comic_wraCon img');
    return helper.querySelectorAll('.comic_wraCon img').map(e => e.src);
  };
  const checkButton = selector => {
    const dom = helper.querySelector(selector);
    if (dom?.textContent) return () => dom.click();
  };
  const isMangaPage = () => {
    if (/^\/[^/]*?\/?$/.test(window.location.pathname)) return handleListPage();
    return /^\/.*?\/\d+\.shtml$/.test(window.location.pathname);
  };
  await main.universal({
    name: 'dmzj',
    getImgList,
    onExit: isEnd => isEnd && helper.scrollIntoView('#hd'),
    async getCommentList() {
      const {
        comicId,
        chapterId
      } = await getId();
      return dmzjApi.getViewpoint(comicId, chapterId);
    },
    SPA: {
      isMangaPage,
      getOnPrev: () => checkButton('.display_left #prev_chapter'),
      getOnNext: () => checkButton('.display_right #next_chapter')
    }
  });
})().catch(error => helper.log.error(error));

        break;
      }
    case 'm.idmzj.com':
    case 'm.dmzj.com':
      {
const dmzjDecrypt = require('dmzjDecrypt');
const dmzjApi = require('userscript/dmzjApi');
const main = require('main');
const helper = require('helper');

(async () => {
  // 分别处理目录页和漫画页
  switch (window.location.pathname.split('/')[1]) {
    case 'info':
      {
        // 跳过正常漫画
        if (Reflect.has(unsafeWindow, 'obj_id')) return;
        const comicId = Number.parseInt(window.location.pathname.split('/')[2], 10);
        if (Number.isNaN(comicId)) {
          document.body.innerHTML = '';
          document.body.insertAdjacentHTML('beforeend', `
            请手动输入漫画名进行搜索 <br />
            <input type="search"> <button>搜索</button> <br />
            <div id="list" />
          `);
          helper.querySelector('button').addEventListener('click', async () => {
            const comicName = helper.querySelector('input')?.value;
            if (!comicName) return;
            const res = await main.request(`https://s.acg.dmzj.com/comicsum/search.php?s=${comicName}`, {
              errorText: '搜索漫画时出错'
            });
            const comicList = JSON.parse(res.responseText.slice(20, -1));
            helper.querySelector('#list').innerHTML = comicList.map(({
              id,
              comic_name,
              comic_author,
              comic_url
            }) => `
                <b>《${comic_name}》<b/>——${comic_author}
                <a href="${comic_url}">Web端</a>
                <a href="https://m.dmzj.com/info/${id}.html">移动端</a>
              `).join('<br />');
          });
          return;
        }
        const res = await main.request(`https://v4api.idmzj.com/comic/detail/${comicId}?uid=2665531&disable_level=1`, {
          errorText: '获取漫画数据失败'
        });
        const {
          comicInfo: {
            last_updatetime,
            title,
            chapters
          }
        } = dmzjDecrypt(res.responseText);
        document.title = title;
        document.body.insertAdjacentHTML('beforeend', `<h1>${title}</h1>`);
        for (const chapter of Object.values(chapters)) {
          // 手动构建添加章节 dom
          let temp = `<h2>${chapter.title}</h2>`;
          let i = chapter.data.length;
          while (i--) temp += `<a target="_blank" title="${chapter.data[i].chapter_title}" href="https://m.dmzj.com/view/${comicId}/${chapter.data[i].chapter_id}.html" ${chapter.data[i].updatetime === last_updatetime ? 'style="color:red"' : ''}>${chapter.data[i].chapter_title}</a>`;
          document.body.insertAdjacentHTML('beforeend', temp);
        }
        document.body.childNodes[0].remove();
        GM_addStyle(`
          h1 {
            margin: 0 -20vw;
          }

          h1,
          h2 {
            text-align: center;
          }

          body {
            padding: 0 20vw;
          }

          a {
            display: inline-block;

            min-width: 4em;
            margin: 0 1em;

            line-height: 2em;
            white-space: nowrap;
          }
        `);
        break;
      }
    case 'view':
      {
        // 如果不是隐藏漫画，直接进入阅读模式
        if (unsafeWindow.comic_id) {
          GM_addStyle('.subHeader{display:none !important}');
          await main.universal({
            name: 'dmzj',
            getImgList: () => helper.querySelectorAll('#commicBox img').map(e => e.dataset.original).filter(Boolean),
            getCommentList: () => dmzjApi.getViewpoint(unsafeWindow.subId, unsafeWindow.chapterId),
            onNext: helper.querySelectorClick('#loadNextChapter'),
            onPrev: helper.querySelectorClick('#loadPrevChapter')
          });
          return;
        }
        const tipDom = document.createElement('p');
        tipDom.textContent = '正在加载中，请坐和放宽，若长时间无反应请刷新页面';
        document.body.append(tipDom);
        let data;
        let comicId;
        let chapterId;
        try {
          [, comicId, chapterId] = /(\d+)\/(\d+)/.exec(window.location.pathname);
          data = await dmzjApi.getChapterInfo(comicId, chapterId);
        } catch (error) {
          main.toast.error('获取漫画数据失败', {
            duration: Number.POSITIVE_INFINITY
          });
          tipDom.textContent = error.message;
          throw error;
        }
        tipDom.textContent = `加载完成，即将进入阅读模式`;
        const {
          folder,
          chapter_name,
          next_chap_id,
          prev_chap_id,
          comic_id,
          page_url
        } = data;
        document.title = `${chapter_name} ${folder.split('/').at(1)}`;
        const {
          setManga,
          setComicLoad
        } = await main.useInit('dmzj');
        setManga({
          // 进入阅读模式后禁止退出，防止返回空白页面
          onExit: undefined,
          onNext: next_chap_id ? () => {
            window.location.href = `https://m.dmzj.com/view/${comic_id}/${next_chap_id}.html`;
          } : undefined,
          onPrev: prev_chap_id ? () => {
            window.location.href = `https://m.dmzj.com/view/${comic_id}/${prev_chap_id}.html`;
          } : undefined,
          editButtonList: e => e
        });
        setComicLoad(() => {
          if (page_url.length > 0) return page_url;
          tipDom.innerHTML = `无法获得漫画数据，请通过 <a href="https://github.com/hymbz/ComicReadScript/issues" target="_blank">Github</a> 或 <a href="https://sleazyfork.org/zh-CN/scripts/374903-comicread/feedback#post-discussion" target="_blank">Greasy Fork</a> 进行反馈`;
          return [];
        });
        setManga('commentList', await dmzjApi.getViewpoint(comicId, chapterId));
        break;
      }
  }
})().catch(error => helper.log.error(error));

        break;
      }
    case 'www.idmzj.com':
    case 'www.dmzj.com':
      {
const dmzjApi = require('userscript/dmzjApi');
const main = require('main');
const helper = require('helper');

const turnPage = chapterId => {
  if (!chapterId) return undefined;
  return () => {
    window.open(window.location.href.replace(/(?<=\/)\d+(?=\.html)/, `${chapterId}`), '_self');
  };
};
(async () => {
  await helper.waitDom('.head_wz');
  // 只在漫画页内运行
  const comicId = helper.querySelector('.head_wz [id]')?.id;
  const chapterId = /(?<=\/)\d+(?=\.html)/.exec(window.location.pathname)?.[0];
  if (!comicId || !chapterId) return;
  const {
    setManga,
    setComicLoad
  } = await main.useInit('dmzj');
  try {
    const {
      next_chap_id,
      prev_chap_id,
      page_url
    } = await dmzjApi.getChapterInfo(comicId, chapterId);
    setComicLoad(() => page_url);
    setManga({
      onNext: turnPage(next_chap_id),
      onPrev: turnPage(prev_chap_id)
    });
  } catch {
    main.toast.error('获取漫画数据失败', {
      duration: Number.POSITIVE_INFINITY
    });
  }
})().catch(error => helper.log.error(error));

        break;
      }

    // #E-Hentai（关联 nhentai、快捷收藏、标签染色、识别广告页等）
    case 'exhentai.org':
    case 'e-hentai.org':
      {
const web = require('solid-js/web');
const solidJs = require('solid-js');
const main = require('main');
const detectAd = require('userscript/detectAd');
const helper = require('helper');
const store = require('solid-js/store');
const Manga = require('components/Manga');
const ehTagRules = require('userscript/ehTagRules');

const escHandler = [];
const setEscHandler = (order, handler) => {
  escHandler.push(Object.assign(handler, {
    order
  }));
  escHandler.sort((a, b) => b.order - a.order);
};

let hasStyle = false;
const addQuickFavorite = (favoriteButton, root, apiUrl, position) => {
  if (!hasStyle) {
    hasStyle = true;
    GM_addStyle(`
      .comidread-favorites {
        position: absolute;
        z-index: 75;
        left: 0;

        overflow: auto;
        align-content: center;

        box-sizing: border-box;
        width: 100%;
        padding-left: 0.6em;

        border: none;
        border-radius: 0;
      }

      .comidread-favorites-item {
        cursor: pointer;

        display: flex;
        align-items: center;

        width: 100%;
        margin: 1em 0;

        text-align: left;
        overflow-wrap: anywhere;
      }

      .comidread-favorites-item > input {
        pointer-events: none;
        margin: 0 0.5em 0 0;
      }

      .comidread-favorites-item > div {
        flex-shrink: 0;

        width: 15px;
        height: 15px;
        margin: 0 0.5em 0 0;

        background-image: url("https://ehgt.org/g/fav.png");
        background-repeat: no-repeat;
      }

      .gl1t > .comidread-favorites {
        padding: 1em 1.5em;
      }
    `);
  }
  root.style.position = 'relative';
  root.style.height = '100%';
  const [show, setShow] = solidJs.createSignal(false);
  const [favorites, setFavorites] = solidJs.createSignal([]);
  const updateFavorite = async () => {
    try {
      const res = await main.request(apiUrl, {
        errorText: helper.t('site.ehentai.fetch_favorite_failed')
      });
      const dom = helper.domParse(res.responseText);
      const list = [...dom.querySelectorAll('.nosel > div')];
      if (list.length === 10) list[0].querySelector('input').checked = false;
      setFavorites(list);
    } catch {
      main.toast.error(helper.t('site.ehentai.fetch_favorite_failed'));
      setFavorites([]);
    }
  };
  let hasRender = false;
  const renderDom = () => {
    if (hasRender) return;
    hasRender = true;
    const FavoriteItem = (e, index) => {
      const checked = e.querySelector('input').checked;
      const handleClick = async () => {
        if (checked) return;
        setShow(false);
        const formData = new FormData();
        formData.append('favcat', index() === 10 ? 'favdel' : `${index()}`);
        formData.append('apply', 'Apply Changes');
        formData.append('favnote', '');
        formData.append('update', '1');
        const res = await main.request(apiUrl, {
          method: 'POST',
          data: formData,
          errorText: helper.t('site.ehentai.change_favorite_failed')
        });
        main.toast.success(helper.t('site.ehentai.change_favorite_success'));

        // 修改收藏按钮样式的 js 代码
        const updateCode = /\nif\(window.opener.document.+\n/.exec(res.responseText)?.[0]?.replaceAll('window.opener.document', 'window.document');
        if (updateCode) eval(updateCode); // eslint-disable-line no-eval

        await updateFavorite();
      };
      return (() => {
        var _el$ = web.template(`<div class=comidread-favorites-item><input type=radio>`)(),
          _el$2 = _el$.firstChild;
        _el$.$$click = handleClick;
        _el$2.checked = checked;
        web.insert(_el$, web.createComponent(solidJs.Show, {
          get when() {
            return index() <= 9;
          },
          get children() {
            var _el$3 = web.template(`<div>`)();
            web.effect(_$p => (_$p = `0px -${2 + 19 * index()}px`) != null ? _el$3.style.setProperty("background-position", _$p) : _el$3.style.removeProperty("background-position"));
            return _el$3;
          }
        }), null);
        web.insert(_el$, () => e.textContent?.trim(), null);
        return _el$;
      })();
    };
    let background = 'rgba(0, 0, 0, 0)';
    let dom = root;
    while (background === 'rgba(0, 0, 0, 0)') {
      background = getComputedStyle(dom).backgroundColor;
      dom = dom.parentElement;
    }
    web.render(() => web.createComponent(solidJs.Show, {
      get when() {
        return show();
      },
      get children() {
        var _el$4 = web.template(`<span class=comidread-favorites>`)();
        background != null ? _el$4.style.setProperty("background", background) : _el$4.style.removeProperty("background");
        web.insert(_el$4, web.createComponent(solidJs.For, {
          get each() {
            return favorites();
          },
          children: FavoriteItem,
          get fallback() {
            return web.template(`<h3>loading...`)();
          }
        }));
        web.effect(_p$ => {
          var _v$ = `${position[1] - position[0]}px`,
            _v$2 = `${position[0]}px`;
          _v$ !== _p$.e && ((_p$.e = _v$) != null ? _el$4.style.setProperty("height", _v$) : _el$4.style.removeProperty("height"));
          _v$2 !== _p$.t && ((_p$.t = _v$2) != null ? _el$4.style.setProperty("top", _v$2) : _el$4.style.removeProperty("top"));
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$4;
      }
    }), root);
  };

  // 将原本的收藏按钮改为切换显示快捷收藏夹
  const rawClick = favoriteButton.onclick;
  favoriteButton.onclick = null;
  favoriteButton.addEventListener('mousedown', async e => {
    if (e.buttons !== 1 && e.buttons !== 4) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.buttons === 4) return rawClick.call(favoriteButton, e);
    renderDom();
    setShow(val => !val);
    if (show()) await updateFavorite();
  });
};

/** 快捷收藏的界面 */
const quickFavorite = pageType => {
  if (pageType === 'gallery') {
    const button = helper.querySelector('#gdf');
    const root = helper.querySelector('#gd3');
    addQuickFavorite(button, root, `${unsafeWindow.popbase}addfav`, [0, button.firstElementChild.offsetTop]);
    return;
  }

  // 列表页根据不同显示方式分别处理
  switch (pageType) {
    case 't':
      {
        for (const item of helper.querySelectorAll('.gl1t')) {
          const button = item.querySelector('[id^=posted_]');
          const top = item.firstElementChild.getBoundingClientRect().bottom - item.getBoundingClientRect().top;
          const bottom = item.lastElementChild.getBoundingClientRect().top - item.getBoundingClientRect().top;
          const apiUrl = /http.+?(?=')/.exec(button.getAttribute('onclick'))[0];
          addQuickFavorite(button, item, apiUrl, [top, bottom]);
        }
        break;
      }
    case 'e':
      {
        for (const item of helper.querySelectorAll('.gl1e')) {
          const button = item.nextElementSibling.querySelector('[id^=posted_]');
          const bottom = Number.parseInt(getComputedStyle(item).height, 10);
          const apiUrl = /http.+?(?=')/.exec(button.getAttribute('onclick'))[0];
          addQuickFavorite(button, item, apiUrl, [0, bottom]);
        }
        break;
      }
  }
};
web.delegateEvents(["click"]);

/** 关联 nhentai */
const associateNhentai = async (dynamicLoad, setComicLoad, LoadButton) => {
  /** 只处理「Doujinshi」「Manga」 */
  if (!helper.querySelector('#gdc > .cs:is(.ct2, .ct3)')) return;
  const titleDom = document.getElementById('gn');
  if (!titleDom || !helper.querySelector('#taglist tbody')) {
    if ((document.getElementById('taglist')?.children.length ?? 1) > 0) main.toast.error(helper.t('site.ehentai.html_changed_nhentai_failed'));
    return;
  }
  const [comicList, setComicList] = solidJs.createSignal();
  const comicTitle = titleDom.textContent.replaceAll(/\s+-/g, ' ');
  const tip = () => {
    if (comicList() === undefined) return 'searching...';
    if (comicList() === null) {
      const url = `https://nhentai.net/search/?q=${comicTitle}`;
      return helper.t('site.ehentai.nhentai_failed', {
        nhentai: `<a href='${url}' target="_blank"> <u> nhentai </u> </a>`
      });
    }
    if (comicList().length === 0) return 'null';
  };
  const nhTagLine = () => (() => {
    var _el$ = web.template(`<tr id=nh_tagline><td class=tc>nhentai:`)();
      _el$.firstChild;
    web.insert(_el$, web.createComponent(solidJs.Show, {
      get when() {
        return comicList()?.length;
      },
      get fallback() {
        return (// eslint-disable-next-line solid/no-innerhtml
          (() => {
            var _el$4 = web.template(`<td class=tc>`)();
            _el$4.style.setProperty("text-align", "left");
            web.effect(() => _el$4.innerHTML = tip());
            return _el$4;
          })()
        );
      },
      get children() {
        var _el$3 = web.template(`<td>`)();
        web.insert(_el$3, web.createComponent(solidJs.For, {
          get each() {
            return comicList();
          },
          children: ({
            id,
            title
          }) => (() => {
            var _el$5 = web.template(`<div class=gtl><a>`)(),
              _el$6 = _el$5.firstChild;
            web.setAttribute(_el$5, "id", `td_nh:${id}`);
            _el$5.style.setProperty("opacity", "1.0");
            web.setAttribute(_el$6, "id", `nh:${id}`);
            web.setAttribute(_el$6, "href", `https://nhentai.net/g/${id}/`);
            web.setAttribute(_el$6, "onclick", `return toggle_tagmenu(1, 'nh:${id}',this)`);
            web.insert(_el$6, id);
            web.effect(() => web.setAttribute(_el$5, "title", title.japanese || title.english));
            return _el$5;
          })()
        }));
        return _el$3;
      }
    }), null);
    return _el$;
  })();
  web.render(nhTagLine, helper.querySelector('#taglist tbody'));

  // 投票后重新渲染
  helper.hijackFn('tag_update_vote', () => {
    for (const e of helper.querySelectorAll('#nh_tagline')) e.remove();
    web.render(nhTagLine, helper.querySelector('#taglist tbody'));
  });

  // 只要带上 cf_clearance cookie 就能通过 Cloudflare 验证，但其是 httpOnly
  // 目前暴力猴还不支持 GM_Cookie，篡改猴也需要去设置里手动设置才能支持 httpOnly
  // 所以暂不处理，就嗯等
  // https://github.com/violentmonkey/violentmonkey/issues/603
  try {
    const res = await main.request(`https://nhentai.net/api/galleries/search?query=${comicTitle}`, {
      responseType: 'json',
      errorText: helper.t('site.ehentai.nhentai_error'),
      noTip: true,
      headers: {
        'User-Agent': navigator.userAgent
      }
    });
    setComicList(res.response.result);
  } catch {
    setComicList(null);
  }
  if (!comicList()?.length) return;

  // nhentai api 对应的扩展名
  const fileType = {
    j: 'jpg',
    p: 'png',
    g: 'gif',
    w: 'webp',
    b: 'bmp'
  };
  for (const {
    id,
    images,
    num_pages,
    media_id
  } of comicList()) {
    const comicId = `nh:${id}`;
    const loadImgList = setImg => {
      helper.plimit(images.pages.map((page, i) => async () => {
        const imgRes = await main.request(`https://i.nhentai.net/galleries/${media_id}/${i + 1}.${fileType[page.t]}`, {
          headers: {
            Referer: `https://nhentai.net/g/${media_id}`
          },
          responseType: 'blob'
        });
        const url = URL.createObjectURL(imgRes.response);
        setImg(i, url);
      }));
    };
    setComicLoad(dynamicLoad(loadImgList, num_pages, comicId), comicId);
  }
  const tagmenu_act_dom = document.getElementById('tagmenu_act');
  const icon = () => web.template(`<img src=https://ehgt.org/g/mr.gif class=mr alt=">">`)();
  const TagMenu = props => web.createComponent(solidJs.For, {
    get each() {
      return props.children;
    },
    children: item => [icon(), item]
  });
  let dispose;
  helper.hijackFn('_refresh_tagmenu_act', (rawFn, [a]) => {
    dispose?.();
    // 非 nhentai 标签列的用原函数去处理
    if (!a.id.startsWith('nh:')) return rawFn(a);
    if (tagmenu_act_dom.children.length > 0) tagmenu_act_dom.innerHTML = '';
    dispose = web.render(() => web.createComponent(TagMenu, {
      get children() {
        return [(() => {
          var _el$8 = web.template(`<a target=_blank>`)();
          _el$8.innerText = " Jump to nhentai";
          web.effect(() => web.setAttribute(_el$8, "href", a.href));
          return _el$8;
        })(), web.createComponent(LoadButton, {
          get id() {
            return a.id;
          }
        })];
      }
    }), tagmenu_act_dom);
  });
};

/** 快捷键翻页 */
const hotkeysPageTurn = pageType => {
  if (pageType === 'gallery') {
    setEscHandler(0, () => unsafeWindow.selected_tagname ? unsafeWindow.toggle_tagmenu() : true);
    helper.linstenKeydown(e => {
      switch (e.key) {
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          return helper.querySelector('.ptt td:last-child:not(.ptdd)')?.click();
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          return helper.querySelector('.ptt td:first-child:not(.ptdd)')?.click();
      }

      // 使用上下方向键进行投票
      if (!unsafeWindow.selected_tagid) return;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          return unsafeWindow?.tag_vote_up();
        case 'ArrowDown':
          e.preventDefault();
          return unsafeWindow?.tag_vote_down();
      }
    });
  } else {
    helper.linstenKeydown(e => {
      switch (e.key) {
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          return helper.querySelector('#unext')?.click();
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          return helper.querySelector('#uprev')?.click();
      }
    });
  }
};

const getTagSetHtml = async tagset => {
  const url = tagset ? `/mytags?tagset=${tagset}` : '/mytags';
  const res = await main.request(url, {
    fetch: true
  });
  return helper.domParse(res.responseText);
};
const collectTags = (html, tagList = []) => {
  const defaultColor = html.querySelector('#tagcolor').value.slice(1) || '0';
  const [, ...tagEleList] = [...html.getElementById('usertags_outer').children];
  for (const e of tagEleList) {
    const id = Number(e.id.split('usertag_')[1]);
    const preview = e.querySelector(`#tagpreview_${id}`);
    const {
      color: fontColor,
      borderColor
    } = preview.style;
    let [group, name] = preview.title.split(':');
    // 合并性别相关的命名空间，以便不同命名空间下的相同标签可以排在一起
    switch (group) {
      case 'female':
      case 'male':
      case 'mixed':
        group = 'gender';
    }
    const color = Number.parseInt(e.querySelector(`#tagcolor_${id}`).value.slice(1) || defaultColor, 16);
    tagList.push({
      e,
      id,
      title: preview.title,
      color,
      fontColor,
      borderColor,
      group,
      name,
      weight: Number(e.querySelector('input[id^=tagweight_]').value),
      watch: e.querySelector(`#tagwatch_${id}`).checked,
      hidden: e.querySelector(`#taghide_${id}`).checked,
      order: -1
    });
  }
  return tagList;
};
const sortTagList = tagList => {
  const collator = new Intl.Collator();
  const sortFn = (a, b) => {
    if (a.color !== b.color) return b.color - a.color;
    if (a.group !== b.group) return collator.compare(a.group, b.group);
    if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
    if (a.watch !== b.watch) return a.watch ? -1 : 1;
    if (a.weight !== b.weight) return b.weight - a.weight;
    return collator.compare(a.name, b.name);
  };

  // order 设为负数是为了在排列时能排在没有 order 值的元素前
  let i = -tagList.length;
  for (const tag of tagList.sort(sortFn)) tag.order = i++;
  return tagList;
};
const getMyTags = async () => {
  const tagSetList = [];
  // 获取所有标签集的 html
  const defaultTagSet = await getTagSetHtml();
  await Promise.all([...defaultTagSet.querySelectorAll('#tagset_outer select option')].map(async option => {
    const tagSet = option.selected ? defaultTagSet : await getTagSetHtml(option.value);
    if (tagSet.querySelector('#tagset_enable')?.checked) tagSetList.push(tagSet);
  }));
  const tagList = [];
  for (const html of tagSetList) collectTags(html, tagList);
  return sortTagList(tagList);
};
const handleMyTagsChange = new Set();
const updateMyTags = async () => {
  const tagList = await getMyTags();
  for (const fn of handleMyTagsChange) await fn(tagList);
};

// 为每个标签单独生成 css。用于方便调试时排查和修改样式时使用
// const buildTagColorCss = (
//   tag: string,
//   color: string,
//   border: string,
//   background: string,
// ) => `
//   #td_${tag} { background: ${background}; }
//   #td_${tag}.gt { border-color: ${border}; }
//   #td_${tag}:not(.gt) { border-color: ${color}; }
//   #taglist a#ta_${tag} { color: ${color} !important; position: relative; }
const buildTagList = (tagList, prefix) => `\n${[...tagList].map(tag => `${prefix}${CSS.escape(tag)}`).join(',\n')}\n`;

/** 获取最新的标签颜色数据 */
const updateTagColor = async tagList => {
  const backgroundMap = {};
  const borderMap = {};
  const colorMap = {};
  for (const tag of tagList) {
    const {
      color,
      borderColor,
      fontColor
    } = tag;
    const title = tag.title.replaceAll(' ', '_');
    (backgroundMap[color] ||= new Set()).add(title);
    (borderMap[borderColor] ||= new Set()).add(title);
    (colorMap[fontColor] ||= new Set()).add(title);
  }
  let css = '';
  for (const [background, tags] of Object.entries(backgroundMap)) {
    css += `:is(${buildTagList(tags, '#td_')})`;
    css += `{ background: #${Number(background).toString(16).padStart(6, '0')}; }\n\n`;
  }
  for (const [border, tags] of Object.entries(borderMap)) {
    // 强标签直接覆盖边框颜色
    css += `:is(${buildTagList(tags, '#td_')}).gt`;
    css += `{ border-color: ${border}; }\n\n`;
  }
  for (const [color, tags] of Object.entries(colorMap)) {
    // 弱标签将边框颜色改为字体颜色突出显示
    css += `:is(${buildTagList(tags, '#td_')}):not(.gt)`;
    css += `{ border-color: ${color}; }\n\n`;
    css += `#taglist a:is(${buildTagList(tags, '#ta_')})`;
    css += `{ color: ${color} !important; position: relative; }\n\n`;
  }
  css += `
    /* 禁用 eh 的变色效果 */
    #taglist a[id] { color: var(--tag) !important; position: relative; }
    #taglist a[id]:hover { color: var(--tag-hover) !important; }

    #taglist a[id]::after {
      content: "";
      background: var(--color);
      width: 100%;
      position: absolute;
      left: 0;
      height: 2px;
      bottom: -7px;
    }
    .tup { --color: var(--tup) }
    .tdn { --color: var(--tdn) }
    #taglist a[id][style="color: blue;"] { --color: blue; }

    /* 避免被上一行的下划线碰到 */
    #taglist div:is(.gt, .gtl, .gtw) { margin-top: 1px; }
  `;
  await GM.setValue('ehTagColorizeCss', css);
  return css;
};

/** 标签染色 */
const colorizeTag = async pageType => {
  handleMyTagsChange.add(updateTagColor);
  switch (pageType) {
    case 'gallery':
      {
        let css = location.origin === 'https://exhentai.org' ? '--tag: #DDDDDD; --tag-hover: #EEEEEE; --tup: #00E639; --tdn: #FF3333;' : '--tag: #5C0D11; --tag-hover: #8F4701; --tup: green; --tdn: red;';
        css = `#taglist { ${css} }\n\n`;
        css += await helper.getGmValue('ehTagColorizeCss', updateMyTags);
        return GM_addStyle(css);
      }
    case 'mytags':
      {
        updateMyTags();
        helper.hijackFn('usertag_callback', helper.debounce(updateMyTags));
      }

    // 除了在 mytags 里更新外，还可以在列表页检查高亮的标签和脚本存储的标签颜色数据是否对应，
    // 在发现不对应时自动更新。但目前我最常用的「缩略图」模式只会返回高亮的标签，
    // 只能检查在 mytags 里删除了标签的情况，所以暂且不实现。
    // 等之后找到办法可以在不额外发起请求的情况下在列表页获取每个画廊的所有标签时再实现
  }
};

/** 快捷评分 */
const quickRating = pageType => {
  let list;
  switch (pageType) {
    case 'gallery':
    case 'mytags':
    case 'mpv':
      return;
    case 'e':
      list = helper.querySelectorAll('#favform > table > tbody > tr');
      break;
    case 'm':
    case 'p':
    case 'l':
      list = helper.querySelectorAll('#favform > table > tbody > tr').slice(1);
      break;
    case 't':
      list = helper.querySelectorAll('.gl1t');
      break;
  }
  GM_addStyle(`
    .comidread-quick-rating {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: click;
    }
  `);
  const coordsList = ['0,0,7,16', '8,0,15,16', '16,0,23,16', '24,0,31,16', '32,0,39,16', '40,0,47,16', '48,0,55,16', '56,0,63,16', '64,0,71,16', '72,0,79,16'];

  /** 修改评分 */
  const editRating = async (url, num) => {
    try {
      const dataRes = await main.request(url, {
        errorText: helper.t('site.ehentai.change_rating_failed'),
        noTip: true
      });
      const reRes = /api_url = "(.+?)".+?gid = (\d+).+?token = "(.+?)".+?apiuid = (\d+).+?apikey = "(.+?)"/s.exec(dataRes.responseText);
      if (!reRes) throw new Error(helper.t('site.ehentai.change_rating_failed'));
      const [, api_url, gid, token, apiuid, apikey] = reRes;
      const res = await main.request(api_url, {
        method: 'POST',
        responseType: 'json',
        data: JSON.stringify({
          method: 'rategallery',
          rating: `${num}`,
          apikey,
          apiuid,
          gid,
          token
        }),
        fetch: true,
        noTip: true
      });
      main.toast.success(`${helper.t('site.ehentai.change_rating_success')}: ${res.response.rating_usr}`);
      return res.response;
    } catch {
      main.toast.error(helper.t('site.ehentai.change_rating_failed'));
      throw new Error(helper.t('site.ehentai.change_rating_failed'));
    }
  };

  /** 根据评分修改显示效果 */
  const updateRatingImage = (dom, num) => {
    // 来自 eh 详情页的 update_rating_image 函数
    let a = Math.round(num + 1);
    const b = -80 + 16 * Math.ceil(a / 2);
    a = a % 2 === 1 ? -21 : -1;
    dom.style.backgroundPosition = `${b}px ${a}px`;
  };
  const renderQuickRating = (item, ir, index) => {
    let basePosition = ir.style.backgroundPosition;
    web.render(() => (() => {
      var _el$ = web.template(`<span class=comidread-quick-rating><img src=https://ehgt.org/g/blank.gif><map>`)(),
        _el$2 = _el$.firstChild,
        _el$3 = _el$2.nextSibling;
      _el$.$$mouseout = () => {
        ir.style.backgroundPosition = basePosition;
      };
      web.setAttribute(_el$, "data-index", index);
      web.setAttribute(_el$2, "usemap", `#rating-${index}`);
      web.setAttribute(_el$3, "name", `rating-${index}`);
      web.insert(_el$3, web.createComponent(solidJs.For, {
        each: coordsList,
        children: (coords, i) => (() => {
          var _el$4 = web.template(`<area shape=rect>`)();
          _el$4.$$click = async () => {
            const res = await editRating(item.querySelector('a').href, i() + 1);
            ir.className = res.rating_cls;
            updateRatingImage(ir, res.rating_usr * 2 - 1);
            basePosition = ir.style.backgroundPosition;
          };
          _el$4.$$mouseover = () => updateRatingImage(ir, i());
          web.setAttribute(_el$4, "coords", coords);
          return _el$4;
        })()
      }));
      return _el$;
    })(), ir);
  };
  for (const [index, item] of list.entries()) {
    const ir = [...item.querySelectorAll('.ir')].at(-1);
    if (!ir) continue;
    // 快捷评分使用得并不多，所以等鼠标移上去再处理，减少性能损耗
    ir.addEventListener('mouseenter', () => renderQuickRating(item, ir, index), {
      once: true
    });
  }
};
web.delegateEvents(["mouseout", "mouseover", "click"]);

const MDLaunch = (props = {}) => (() => {
  var _el$ = web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1M14 4c0 .55.45 1 1 1h2.59l-9.13 9.13a.996.996 0 1 0 1.41 1.41L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V3h-6c-.55 0-1 .45-1 1">`)();
  web.spread(_el$, props, true, true);
  return _el$;
})();

/** 快捷查看标签定义 */
const quickTagDefine = pageType => {
  if (pageType !== 'gallery') return;
  const tagContent = store.createMutable({});
  const saveTagContent = async tag => {
    if (Reflect.has(tagContent, tag)) return;
    const url = `https://ehwiki.org/wiki/${tag.replaceAll(/[a-z]+:\s?/gi, '')}`;
    const res = await main.request(url, {
      noCheckCode: true
    });
    if (res.status !== 200) {
      tagContent[tag] = (() => {
        var _el$ = web.template(`<h3>`)();
        web.insert(_el$, () => `${res.status} - ${res.statusText}`);
        return _el$;
      })();
      return;
    }
    const html = helper.domParse(res.responseText);
    const content = html.querySelector('#mw-content-text');

    // 将相对链接转换成正确的链接
    for (const dom of content.querySelectorAll('img[src^="/"]')) dom.setAttribute('src', `https://ehwiki.org${dom.getAttribute('src')}`);
    for (const dom of content.getElementsByTagName('a')) {
      const href = dom.getAttribute('href') ?? '';
      if (href.startsWith('/')) dom.setAttribute('href', `https://ehwiki.org${href}`);
      dom.target = '_blank';
    }

    // 删掉附加图
    for (const dom of content.querySelectorAll('.thumb')) dom.remove();
    tagContent[tag] = [(() => {
      var _el$2 = web.template(`<h1><a target=_blank>`)(),
        _el$3 = _el$2.firstChild;
      web.setAttribute(_el$3, "href", url);
      web.insert(_el$3, tag, null);
      web.insert(_el$3, web.createComponent(MDLaunch, {}), null);
      return _el$2;
    })(), content];
  };
  GM_addStyle(`
    #comidread-tag-define {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      width: 100%;
      text-align: start;
      padding: 0 1em;
      box-sizing: border-box;
    }

    #taglist {
      position: relative;
    }

    #comidread-tag-define h1 {
      border-bottom: 1px solid #a2a9b1;
      margin: 0.4em 0;
    }

    #comidread-tag-define h1 svg {
      height: 0.7em;
      margin-left: 0.2em;
    }

    #comidread-tag-define ul {
      margin: 0.3em 0 0 1.6em;
      padding: 0;
    }

    #comidread-tag-define li {
      margin-bottom: 0.2em;
    }

    #comidread-tag-define div a {
      text-decoration: underline;
    }

    #comidread-tag-define dd {
      margin-left: 1.6em;
    }

    #comidread-tag-define dl {
      margin-top: 0.2em;
      margin-bottom: 0.5em;
    }
  `);
  const [show, setShow] = solidJs.createSignal(false);
  const root = helper.querySelector('#taglist');
  let background = 'rgba(0, 0, 0, 0)';
  let dom = root;
  while (background === 'rgba(0, 0, 0, 0)') {
    background = getComputedStyle(dom).backgroundColor;
    dom = dom.parentElement;
  }
  web.render(() => web.createComponent(solidJs.Show, {
    get when() {
      return show();
    },
    get children() {
      var _el$4 = web.template(`<span id=comidread-tag-define>`)();
      background != null ? _el$4.style.setProperty("background", background) : _el$4.style.removeProperty("background");
      web.insert(_el$4, () => tagContent[unsafeWindow.selected_tagname] ?? web.template(`<h3>loading...`)());
      web.effect(_$p => (_$p = `${root.scrollHeight}px`) != null ? _el$4.style.setProperty("height", _$p) : _el$4.style.removeProperty("height"));
      return _el$4;
    }
  }), root);

  // 直接覆盖原有的函数
  unsafeWindow.tag_define = async () => {
    if (!unsafeWindow.selected_tagname) return;
    if (show()) return setShow(false);
    setShow(true);
    try {
      await saveTagContent(unsafeWindow.selected_tagname);
    } catch (error) {
      console.error(error);
      setShow(false);
    }
  };
  helper.hijackFn('toggle_tagmenu', () => setShow(false));

  // Esc 关闭
  setEscHandler(2, () => show() ? setShow(false) : true);
};

const MdPictureInPicture = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" stroke-width="0"><path d="M18 7h-6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1m3-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2m-1 16.01H4c-.55 0-1-.45-1-1V5.98c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v12.03c0 .55-.45 1-1 1"/></svg>`;
const getDomPosition = dom => {
  const rect = dom.getBoundingClientRect();
  const computedStyle = getComputedStyle(dom);
  const leftBorder = Number.parseFloat(computedStyle.borderLeftWidth);
  const leftPadding = Number.parseFloat(computedStyle.paddingLeft);
  const topPadding = Number.parseFloat(computedStyle.paddingTop);
  const topBorder = Number.parseFloat(computedStyle.borderTopWidth);
  return {
    left: rect.left + leftBorder + leftPadding,
    top: rect.top + topBorder + topPadding,
    width: computedStyle.width,
    height: computedStyle.height
  };
};
const floatTagList = (pageType, mangaProps) => {
  if (pageType !== 'gallery') return;
  const gd4 = helper.querySelector('#gd4');
  const gd4Style = getComputedStyle(gd4);

  /** 背景颜色 */
  let background = 'rgba(0, 0, 0, 0)';
  let dom = gd4;
  while (background === 'rgba(0, 0, 0, 0)') {
    background = getComputedStyle(dom).backgroundColor;
    dom = dom.parentElement;
  }
  const {
    borderColor
  } = getComputedStyle(helper.querySelector('#gdt'));
  /** 边框样式 */
  const border = `1px solid ${borderColor}`;
  GM_addStyle(`
      #comicread-tag-box {
        position: fixed;
        z-index: 2147483647;

        font-size: 12px;
        text-align: justify;

        background: ${background};
        box-shadow: 0 0 15px -3px #0004;
      }

      #comicread-tag-box > #gd4 {
        margin: 0;
        padding: 0;
        border: none;
      }

      #comicread-tag-box > #ehs-introduce-box {
        position: relative;
        width: 161px;
        height: 100%;
        border-left: ${border};
      }

      /* 确保始终显示在最上层，防止和其他脚本冲突 */
      #ehs-introduce-box { z-index: 1; }

      #comicread-tag-box-placeholder {
        cursor: pointer;

        float: left;
        display: flex;
        grid-area: gd4;
        justify-content: center;

        margin: 0 0 0 10px;
        padding: 0 0 0 5px;

        border-right: 1px solid ${borderColor};
        border-left: 1px solid ${borderColor};
      }

      #comicread-tag-box-placeholder svg {
        width: 17em;
        opacity: 0.5;
      }

      /* 防止在窗口变小时确认按钮被挤出范围 */
      #tagmenu_new {
        width: fit-content;
      }
    `);
  const {
    store,
    setState,
    _setState,
    _state
  } = helper.useStore({
    open: false,
    top: 0,
    left: 0,
    opacity: 1,
    mouse: {
      x: 0,
      y: 0
    },
    bound: {
      width: 0,
      height: 0
    }
  });
  const setPos = (state, top, left) => {
    state.top = helper.clamp(-gd4.clientHeight * 0.75, top, state.bound.height);
    state.left = helper.clamp(-gd4.clientWidth * 0.75, left, state.bound.width);
  };
  const setOpacity = opacity => {
    _setState('opacity', helper.clamp(0.5, opacity, 1));
  };
  setOpacity(Number(localStorage.getItem('floatTagListOpacity')) || 1);

  // 监视鼠标位置，以便在通过快捷键唤出时出现在鼠标所在位置
  document.addEventListener('pointermove', e => {
    setState(state => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
    });
  });
  const hadnleResize = () => {
    setState(state => {
      state.bound.width = window.innerWidth - gd4.clientWidth / 4;
      state.bound.height = window.innerHeight - gd4.clientHeight / 4;
      setPos(state, state.top, state.left);
    });
  };
  window.addEventListener('resize', hadnleResize);
  hadnleResize();
  helper.useStyleMemo('#comicread-tag-box', {
    display: () => store.open ? undefined : 'none',
    top: () => `${store.top}px`,
    left: () => `${store.left}px`,
    opacity: () => store.opacity
  });

  // 防止布局偏移的占位元素
  const placeholder = gd4.cloneNode();
  placeholder.id = 'comicread-tag-box-placeholder';
  placeholder.style.display = 'none';
  placeholder.addEventListener('click', () => _setState('open', false));
  placeholder.innerHTML = MdPictureInPicture;
  gd4.before(placeholder);
  const ref = document.createElement('div');
  ref.id = 'comicread-tag-box';
  ref.classList.add('comicread-ignore');
  document.body.append(ref);

  // 使用 shift + 滚轮调整透明度
  ref.addEventListener('wheel', e => {
    if (!e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();
    setOpacity(store.opacity + (e.deltaY > 0 ? -0.05 : 0.05));
    localStorage.setItem('floatTagListOpacity', `${store.opacity}`);
  }, {
    passive: false
  });
  const initPos = {
    top: 0,
    left: 0
  };
  helper.useDrag({
    ref: gd4,
    handleDrag({
      type,
      xy: [x, y],
      initial: [ix, iy]
    }) {
      switch (type) {
        case 'down':
          if (!store.open) {
            const pos = getDomPosition(gd4);
            setState(state => {
              // state.open = true;
              state.top = pos.top;
              state.left = pos.left;
            });
          }
          initPos.top = store.top;
          initPos.left = store.left;
          break;
        case 'up':
          setState(state => {
            // 窗口移到原位附近时自动收回
            if (mangaProps.show) return;
            const rect = placeholder.getBoundingClientRect();
            if (helper.approx(state.top, rect.top, 50) && helper.approx(state.left, rect.left, 50)) state.open = false;
          });
          break;
        case 'move':
          setState(state => {
            setPos(state, initPos.top + y - iy, initPos.left + x - ix);
            state.open = true;
          });
          break;
      }
    },
    handleClick: (_, target) => target.click(),
    skip: e => !e.target.matches('#gd4, #taglist, #gwrd, td+td, [id^=comidread] *:not(a)')
  });
  let ehs;
  let ehsParent;
  const handleEhs = () => {
    if (ehs) return;
    ehs = helper.querySelector('#ehs-introduce-box');
    if (!ehs) return;
    ehsParent = ehs.parentElement;

    // 让 ehs 的自动补全列表能显示在顶部
    const autoComplete = helper.querySelector('.eh-syringe-lite-auto-complete-list');
    if (autoComplete) {
      autoComplete.classList.add('comicread-ignore');
      autoComplete.style.zIndex = '2147483647';
      document.body.append(autoComplete);
    }

    // 只在当前有标签被选中时显示 ehs 的标签介绍
    helper.hijackFn('toggle_tagmenu', () => unsafeWindow.selected_tagname || helper.querySelector('#ehs-introduce-box .ehs-close')?.click());
  };
  helper.createEffectOn(() => store.open, open => {
    handleEhs();
    if (open) {
      const {
        height,
        width
      } = gd4Style;
      placeholder.style.cssText = `height: ${height}; width: ${width};`;
      ref.style.height = height;
      gd4.style.width = width;
      ref.append(gd4);
      if (ehs) ref.append(ehs);
      document.activeElement.blur();
    } else {
      placeholder.style.cssText = `display: none;`;
      gd4.style.width = '';
      placeholder.after(gd4);
      if (ehs) ehsParent.append(ehs);
      Manga.focus();
    }
  }, {
    defer: true
  });
  Manga.setDefaultHotkeys(hotkeys => ({
    ...hotkeys,
    float_tag_list: ['q']
  }));
  setEscHandler(0, () => store.open ? _setState('open', false) : true);
  helper.linstenKeydown(e => {
    const code = helper.getKeyboardCode(e);
    if (Manga.hotkeysMap()[code] !== 'float_tag_list') return;
    e.stopPropagation();
    e.preventDefault();
    setState(state => {
      state.open = !state.open;
      if (!state.open) return;
      setPos(state, state.mouse.y - gd4.clientHeight / 2, state.mouse.x - gd4.clientWidth / 2);
    });
  });

  // 在悬浮状态下打完标签后移开焦点，以便能快速用快捷键关掉悬浮界面
  helper.hijackFn('tag_from_field', (rawFn, args) => {
    if (store.open) document.activeElement.blur();
    return rawFn(...args);
  });
  const newTagInput = helper.querySelector('#newtagfield');

  // 悬浮状态下鼠标划过自动聚焦输入框
  newTagInput.addEventListener('pointerenter', () => store.open && newTagInput.focus());

  /** 根据标签链接获取对应的标签名 */
  const getDropTag = tagUrl => {
    const tagDom = helper.querySelector(`a[href=${CSS.escape(tagUrl)}]`);
    if (!tagDom) return;
    // 有 ehs 的情况下 title 会是标签的简写
    return tagDom.title || tagDom.id.slice(3).replaceAll('_', ' ');
  };

  // 让标签可以直接拖进输入框，方便一次性点赞多个标签
  const handleDrop = e => {
    const text = e.dataTransfer.getData('text');
    const tag = getDropTag(text);
    if (!tag) return;
    e.preventDefault();
    if (!newTagInput.value.includes(tag)) newTagInput.value += `${tag}, `;
  };
  newTagInput.addEventListener('drop', handleDrop);

  // 增大拖拽标签的放置范围，不用非得拖进框
  const taglist = helper.querySelector('#taglist');
  taglist.addEventListener('dragover', e => e.preventDefault());
  taglist.addEventListener('dragenter', e => e.preventDefault());
  taglist.addEventListener('drop', handleDrop);
};

const updateSortCss = tagList => {
  let css = 'tr a :is(.gltm, .glink + div:not([class])) { display: flex; }';
  for (const {
    title,
    order
  } of tagList) css += `\n.gt[title="${title}"] { order: ${order}; }`;
  return GM.setValue('ehTagSortCss', css);
};
const sortTags = async pageType => {
  handleMyTagsChange.add(updateSortCss);
  switch (pageType) {
    case 'p':
    case 'l':
    case 't':
      return GM_addStyle(await helper.getGmValue('ehTagSortCss', updateMyTags));
    case 'mytags':
      {
        let style;
        const sortDom = tagList => {
          let css = `
          #usertags_outer { display: flex; flex-direction: column; }
          #usertags_outer > div { margin: unset; }
          #usertag_0 { order: -${tagList.length}; }`;
          for (const {
            order,
            id
          } of tagList) css += `\n#usertag_${id} { view-transition-name: _${id}; order: ${order}; }`;
          style ||= GM_addElement('style', {
            textContent: css
          });
          style.textContent = css;
        };
        handleMyTagsChange.add(tagList => {
          if (!document.startViewTransition) return sortDom(tagList);
          document.startViewTransition(() => sortDom(tagList));
        });
      }
  }
};

const tagLint = pageType => {
  if (pageType !== 'gallery') return;

  /** 是否是「Doujinshi」「Manga」「Non-H」 */
  const isManga = helper.querySelector('#gdc > .cs:is(.ct2, .ct3, .ct9)');
  const lintRules = ehTagRules.getTagLintRules();
  const [warnList, setWarnList] = solidJs.createSignal({});
  GM_addStyle(`
    #comidread-tag-lint [id^=td_] {
      display: inline-block;
      float: none;
    }
  `);
  const getTagClass = (tag, weak) => {
    if (weak === undefined) return document.getElementById(`td_${tag}`)?.className;
    return weak ? 'gtl' : 'gt';
  };
  const _Tag = props => (() => {
    var _el$ = web.template(`<div><a>`)(),
      _el$2 = _el$.firstChild;
    _el$2.$$click = e => e.preventDefault();
    web.insert(_el$2, () => props.name);
    web.effect(_p$ => {
      var _v$ = `td_${props.name}`,
        _v$2 = getTagClass(props.name, props.weak),
        _v$3 = `ta_${props.name}`,
        _v$4 = `https://exhentai.org/tag/${props.name.replaceAll('_', '+')}`;
      _v$ !== _p$.e && web.setAttribute(_el$, "id", _p$.e = _v$);
      _v$2 !== _p$.t && web.className(_el$, _p$.t = _v$2);
      _v$3 !== _p$.a && web.setAttribute(_el$2, "id", _p$.a = _v$3);
      _v$4 !== _p$.o && web.setAttribute(_el$2, "href", _p$.o = _v$4);
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$;
  })();
  const Tag = props => {
    const tags = ehTagRules.splitTagNamespace(props.name);
    return web.createComponent(solidJs.Show, {
      get when() {
        return tags.length > 1;
      },
      get fallback() {
        return _Tag(props);
      },
      get children() {
        var _el$3 = web.template(`<span>「<!> 」`)(),
          _el$4 = _el$3.firstChild,
          _el$6 = _el$4.nextSibling;
          _el$6.nextSibling;
        web.insert(_el$3, web.createComponent(solidJs.For, {
          each: tags,
          children: (name, i) => [web.memo(() => web.memo(() => !!i())() ? ` ${helper.t('other.or')} ` : ''), web.createComponent(_Tag, {
            name: name,
            get weak() {
              return props.weak;
            }
          })]
        }), _el$6);
        return _el$3;
      }
    });
  };
  const WarnItem = props => {
    const [before, middle, after] = props.text.split('[tag]');
    return web.createComponent(solidJs.Show, {
      get when() {
        return props.warnList?.size;
      },
      get children() {
        return web.createComponent(solidJs.For, {
          get each() {
            return [...props.warnList.entries()];
          },
          children: ([tag, tags]) => (() => {
            var _el$7 = web.template(`<li>`)();
            web.insert(_el$7, before, null);
            web.insert(_el$7, web.createComponent(Tag, {
              name: tag
            }), null);
            web.insert(_el$7, middle, null);
            web.insert(_el$7, web.createComponent(solidJs.For, {
              each: tags,
              children: tagName => web.createComponent(Tag, {
                name: tagName,
                get weak() {
                  return props.weak;
                }
              })
            }), null);
            web.insert(_el$7, after, null);
            return _el$7;
          })()
        });
      }
    });
  };

  /** 获取所有标签 */
  const getTaglist = () => {
    const lockTags = new Set();
    const weakTags = new Set();
    for (const tag of helper.querySelectorAll('#taglist table [id^=td_]')) {
      const [a] = tag.getElementsByTagName('a');
      // 跳过点踩的标签
      if (a.classList.contains('tdn')) continue;
      if (a.classList.contains('tup') || tag.classList.contains('gt')) lockTags.add(tag.id.slice(3));else if (tag.classList.contains('gtl')) weakTags.add(tag.id.slice(3));
    }
    return [lockTags, weakTags];
  };
  let root;
  let dispose;
  const updateLint = helper.singleThreaded(() => {
    const newWarnList = {};
    const [lockTags, weakTags] = getTaglist();
    const tagList = new Set([...lockTags, ...weakTags]);

    /** 根据指定规则检查标签并记录 */
    const checkRules = (tag, ruleName, has = false) => {
      const rules = lintRules[ruleName];
      if (!rules.has(tag)) return;
      for (const targetTag of rules.get(tag)) {
        // 检测应该存在的标签时，只检查锁定标签，方便快速点赞
        if (ehTagRules.hasTag(has ? lockTags : tagList, targetTag) === has) continue;
        newWarnList[ruleName] ||= new Map([[tag, []]]);
        const warn = newWarnList[ruleName];
        if (!warn.has(tag)) warn.set(tag, []);
        warn.get(tag).push(targetTag);
      }
    };
    for (const tag of tagList) {
      checkRules(tag, 'prerequisite', true);
      checkRules(tag, 'conflict');
      if (isManga) checkRules(tag, 'possibleConflict');
      checkRules(tag, 'combo', true);
    }
    const addOtherWarn = (text, tags) => {
      newWarnList.other ||= [];
      newWarnList.other.push([text, tags]);
    };
    const correctTags = [];
    for (const tag of weakTags) {
      // 作者、社团则要检查漫画标题中是否包含其名字
      if (/^(artist|group):/.test(tag)) {
        const title = helper.querySelector('#gd2').textContent.toLowerCase();
        if (title.includes(tag.replaceAll(/^(artist|group):|_/g, ' ').trim())) correctTags.push(tag);else {
          // 也检查经过翻译的标签名
          const showName = document.getElementById(`ta_${tag}`)?.textContent;
          if (showName && title.includes(showName)) correctTags.push(tag);
        }
      }
    }
    if (correctTags.length > 0) addOtherWarn(helper.t('eh_tag_lint.correct_tag'), correctTags);

    // 涉及到图库类型的，比较复杂的检查
    if (helper.querySelector('#gdc > .cs.ct2') && ehTagRules.isMissingNamespace(tagList, 'parody')) addOtherWarn(helper.t('eh_tag_lint.miss_parody'), ['parody:original']);
    if (isManga && ehTagRules.isMissingTags(lockTags, 'female:females_only', 'female:futanari', 'female:shemale') && ehTagRules.isMissingNamespace(tagList, 'male', 'mixed')) addOtherWarn(helper.t('eh_tag_lint.miss_female'), ['female:females_only']);
    setWarnList(newWarnList);
    if (!root?.isConnected) {
      root = document.createElement('div');
      root.id = 'comidread-tag-lint';
      helper.querySelector('#taglist').append(root);
    }
    dispose?.();
    dispose = web.render(() => web.createComponent(solidJs.Show, {
      get when() {
        return Object.keys(warnList()).length;
      },
      get children() {
        return [web.template(`<hr>`)(), (() => {
          var _el$9 = web.template(`<ul>`)();
          web.insert(_el$9, web.createComponent(solidJs.For, {
            get each() {
              return warnList().other;
            },
            children: ([text, tags]) => (() => {
              var _el$10 = web.template(`<li>`)();
              web.insert(_el$10, text, null);
              web.insert(_el$10, web.createComponent(solidJs.For, {
                each: tags,
                children: tagName => web.createComponent(Tag, {
                  name: tagName,
                  weak: true
                })
              }), null);
              return _el$10;
            })()
          }), null);
          web.insert(_el$9, web.createComponent(WarnItem, {
            get warnList() {
              return warnList().prerequisite;
            },
            get text() {
              return helper.t('eh_tag_lint.prerequisite');
            },
            weak: false
          }), null);
          web.insert(_el$9, web.createComponent(WarnItem, {
            get warnList() {
              return warnList().conflict;
            },
            get text() {
              return helper.t('eh_tag_lint.conflict');
            }
          }), null);
          web.insert(_el$9, web.createComponent(WarnItem, {
            get warnList() {
              return warnList().possibleConflict;
            },
            get text() {
              return helper.t('eh_tag_lint.possible_conflict');
            }
          }), null);
          web.insert(_el$9, web.createComponent(WarnItem, {
            get warnList() {
              return warnList().combo;
            },
            get text() {
              return helper.t('eh_tag_lint.combo');
            },
            weak: true
          }), null);
          return _el$9;
        })()];
      }
    }), root);
  });
  updateLint();

  // 投票后重新渲染
  helper.hijackFn('tag_update_vote', updateLint);
};
web.delegateEvents(["click"]);


(async () => {
  let pageType;
  if (Reflect.has(unsafeWindow, 'display_comment_field')) pageType = 'gallery';else if (location.pathname === '/mytags') pageType = 'mytags';else if (Reflect.has(unsafeWindow, 'mpvkey')) pageType = 'mpv';else pageType = helper.querySelector('option[value="t"]')?.parentElement?.value;
  if (!pageType) return;
  const {
    options,
    setComicLoad,
    dynamicLoad,
    showComic,
    comicMap,
    setComicMap,
    setImgList,
    setFab,
    setManga,
    mangaProps
  } = await main.useInit('ehentai', {
    /** 关联 nhentai */
    associate_nhentai: true,
    /** 快捷键 */
    hotkeys: true,
    /** 识别广告页 */
    detect_ad: true,
    /** 快捷收藏 */
    quick_favorite: true,
    /** 标签染色 */
    colorize_tag: false,
    /** 快捷评分 */
    quick_rating: true,
    /** 快捷查看标签定义 */
    quick_tag_define: true,
    /** 悬浮标签列表 */
    float_tag_list: false,
    /** 自动调整配置 */
    auto_adjust_option: false,
    /** 标签检查 */
    tag_lint: false,
    autoShow: false
  });
  if (pageType === 'mpv') {
    return setComicLoad(() => {
      const imgEleList = helper.querySelectorAll('.mimg[id]');
      const loadImgList = async setImg => {
        const imagelist = unsafeWindow.imagelist;
        helper.plimit(imagelist.map((_, i) => async () => {
          const url = () => imagelist[i].i;
          while (!url()) {
            if (!Reflect.has(imagelist[i], 'xhr')) {
              unsafeWindow.load_image(i + 1);
              unsafeWindow.next_possible_request = 0;
            }
            await helper.wait(url);
          }
          setImg(i, url());
        }), undefined, 4);
      };
      return dynamicLoad(loadImgList, imgEleList.length)();
    });
  }

  // 按顺序处理 esc 按键
  helper.linstenKeydown(e => {
    if (e.key !== 'Escape') return;
    for (const handler of escHandler) if (handler() !== true) return e.stopImmediatePropagation();
  });

  // 标签染色
  if (options.colorize_tag) {
    colorizeTag(pageType);
    sortTags(pageType);
  }
  // 悬浮标签列表
  if (options.float_tag_list) helper.requestIdleCallback(() => floatTagList(pageType, mangaProps));
  // 快捷收藏。必须处于登录状态
  if (unsafeWindow.apiuid !== -1 && options.quick_favorite) helper.requestIdleCallback(() => quickFavorite(pageType));
  // 快捷评分
  if (options.quick_rating) helper.requestIdleCallback(() => quickRating(pageType), 1000);
  // 快捷查看标签定义
  if (options.quick_tag_define) helper.requestIdleCallback(() => quickTagDefine(pageType), 1000);
  // 标签检查
  if (options.tag_lint) helper.requestIdleCallback(() => tagLint(pageType), 1000);

  // 自动调整阅读配置
  if (options.auto_adjust_option &&
  // 在「Doujinshi」「Manga」「Non-H」以外的分类下
  !helper.querySelector('#gdc > .cs:is(.ct2, .ct3, .ct9)')) {
    let option = {
      // 使用单页模式
      pageNum: 1,
      // 关闭图像识别
      imgRecognition: {
        enabled: false
      }
    };
    if (options.option) option = helper.assign(options.option, option);
    setManga({
      option
    });
  }

  // 不是漫画页的话
  if (pageType !== 'gallery') return options.hotkeys && hotkeysPageTurn(pageType);
  const sidebarDom = document.getElementById('gd5');

  // 限定右侧按钮框的高度，避免因为按钮太多而突出界面
  const resizeObserver = new ResizeObserver(() => {
    // 只在超出正常高度时才使用 css 限制，避免和其他脚本（如：EhAria2下载助手）冲突
    Reflect.deleteProperty(sidebarDom.dataset, 'long');
    if (sidebarDom.scrollHeight > 352) sidebarDom.dataset.long = '';
  });
  resizeObserver.observe(sidebarDom);
  GM_addStyle(`
    #gd5[data-long] {
      --scrollbar-slider: ${getComputedStyle(helper.querySelector('.gm')).borderColor};
      scrollbar-color: var(--scrollbar-slider) transparent;
      scrollbar-width: thin;
      overflow: auto;
      max-height: 352px;
      &::-webkit-scrollbar { width: 5px; height: 10px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: var(--scrollbar-slider); }
    }
    /* 在显示 ehs 时隐藏 gd5 上的滚动条，避免同时显示两个滚动条 */
    #gd5[data-long]:has(#ehs-introduce-box .ehs-content) { overflow: hidden; }
    #gmid #ehs-introduce-box { width: 100%; }
  `);
  const LoadButton = props => {
    const tip = solidJs.createMemo(() => {
      const _imgList = comicMap[props.id]?.imgList;
      const progress = _imgList?.filter(Boolean).length;
      switch (_imgList?.length) {
        case undefined:
          return ' Load comic';
        case progress:
          return ' Read';
        default:
          return ` loading - ${progress}/${_imgList.length}`;
      }
    });
    return (() => {
      var _el$ = web.template(`<a href=javascript:;>`)();
      _el$.$$click = async e => {
        await props.onClick?.(e);
        showComic(props.id);
      };
      web.insert(_el$, tip);
      return _el$;
    })();
  };

  // 关联 nhentai
  if (options.associate_nhentai) helper.requestIdleCallback(() => associateNhentai(dynamicLoad, setComicLoad, LoadButton), 1000);
  let totalImgNum = 0;
  totalImgNum = Number(helper.querySelector('.gtb .gpc')?.textContent?.replaceAll(',', '').match(/\d+/g)?.at(-1));
  if (Number.isNaN(totalImgNum)) {
    totalImgNum = Number(/(?<=<td class="gdt2">)\d+(?= pages<\/td>)/.exec((await main.request(window.location.href)).responseText)?.[0]);
  }
  if (Number.isNaN(totalImgNum)) main.toast.error(helper.t('site.changed_load_failed'));
  const ehImgList = [];
  const ehImgPageList = [];
  const ehImgFileNameList = [];
  const enableDetectAd = options.detect_ad && document.getElementById('ta_other:extraneous_ads');
  if (enableDetectAd) {
    setComicMap('', {
      adList: new main.ReactiveSet()
    });
    /** 缩略图列表 */
    const thumbnailList = [];
    for (const e of helper.querySelectorAll('#gdt > a')) {
      const index = Number(/.+-(\d+)/.exec(e.href)?.[1]) - 1;
      if (Number.isNaN(index)) continue;
      ehImgPageList[index] = e.href;
      const thumbnail = e.querySelector('[title]');
      ehImgFileNameList[index] = thumbnail.title.split(/：|: /)[1];
      thumbnailList[index] = thumbnail.tagName === 'IMG' ? thumbnail : /url\("(.+)"\)/.exec(thumbnail.style.backgroundImage)[1];
    }

    // 先根据文件名判断一次
    await detectAd.getAdPageByFileName(ehImgFileNameList, comicMap[''].adList);
    // 不行的话再用缩略图识别
    if (comicMap[''].adList.size === 0) await detectAd.getAdPageByContent(thumbnailList, comicMap[''].adList);

    // 模糊广告页的缩略图
    helper.useStyle(helper.createRootMemo(() => {
      if (!comicMap['']?.adList?.size) return '';
      return [...comicMap[''].adList].map(i => `a[href="${ehImgPageList[i]}"] [title]:not(:hover) {
              filter: blur(8px);
              clip-path: border-box;
              backdrop-filter: blur(8px);
            }`).join('\n');
    }));
  }
  const checkIpBanned = text => text.includes('IP address has been temporarily banned') && main.toast.error(helper.t('site.ehentai.ip_banned'), {
    throw: true,
    duration: Number.POSITIVE_INFINITY
  });

  /** 从图片页获取图片地址 */
  const getImgUrl = async imgPageUrl => {
    const res = await main.request(imgPageUrl, {
      fetch: true,
      errorText: helper.t('site.ehentai.fetch_img_page_source_failed')
    }, 10);
    checkIpBanned(res.responseText);
    try {
      return /id="img" src="(.+?)"/.exec(res.responseText)[1];
    } catch {
      throw new Error(helper.t('site.ehentai.fetch_img_url_failed'));
    }
  };

  /** 从详情页获取图片页的地址 */
  const getImgPageUrl = async (pageNum = 0) => {
    const res = await main.request(`${window.location.pathname}${pageNum ? `?p=${pageNum}` : ''}`, {
      fetch: true,
      errorText: helper.t('site.ehentai.fetch_img_page_url_failed')
    });
    checkIpBanned(res.responseText);
    const pageList = [...res.responseText.matchAll(
    // 缩略图有三种显示方式：
    // 使用 img 的旧版，不显示页码的单个 div，显示页码的嵌套 div
    /<a href="(.{20,50})"><(img alt=.+?|div><div |div )title=".+?: (.+?)"/gm)].map(([, url,, fileName]) => [url, fileName]);
    if (pageList.length === 0) throw new Error(helper.t('site.ehentai.fetch_img_page_url_failed'));
    return pageList;
  };
  const [loadImgsText, setLoadImgsText] = solidJs.createSignal(`1-${totalImgNum}`);
  const loadImgs = helper.createRootMemo(() =>
  // eslint-disable-next-line unicorn/explicit-length-check
  helper.extractRange(loadImgsText(), ehImgList.length || totalImgNum));
  const totalPageNum = Number(helper.querySelector('.ptt td:nth-last-child(2)').textContent);
  const loadImgList = async setImg => {
    // 在不知道每页显示多少张图片的情况下，没办法根据图片序号反推出它所在的页数
    // 所以只能一次性获取所有页数上的图片页地址
    if (ehImgPageList.length !== totalPageNum) {
      const allPageList = await helper.plimit(helper.createSequence(totalPageNum).map(pageNum => () => getImgPageUrl(pageNum)));
      ehImgPageList.length = 0;
      ehImgFileNameList.length = 0;
      for (const pageList of allPageList) {
        for (const [url, fileName] of pageList) {
          ehImgPageList.push(url);
          ehImgFileNameList.push(fileName);
        }
      }
    }
    await helper.plimit([...loadImgs()].map((i, order) => async () => {
      if (i < 0) return;
      ehImgList[i] ||= await getImgUrl(ehImgPageList[i]);
      setImg(order, ehImgList[i]);
    }));
    if (enableDetectAd) {
      await detectAd.getAdPageByFileName(ehImgFileNameList, comicMap[''].adList);
      await detectAd.getAdPageByContent(ehImgList, comicMap[''].adList);
    }
  };
  setComicLoad(dynamicLoad(loadImgList, () => loadImgs().size));
  const cache = await helper.useCache({
    pageRange: 'id'
  });
  web.render(() => {
    const hasMultiPage = sidebarDom.children[6]?.classList.contains('gsp');
    const handleClick = async e => {
      if (!e.shiftKey) return;
      e.stopPropagation();

      // eslint-disable-next-line no-alert
      const range = prompt(helper.t('other.page_range'), (await cache.get('pageRange', unsafeWindow.gid))?.range);
      if (!range) return;
      await cache.set('pageRange', {
        id: unsafeWindow.gid ?? Number(location.pathname.split('/')[2]),
        range
      });
      setLoadImgsText(range ?? `1-${totalImgNum}`);
      // 删掉当前的图片列表以便触发重新加载
      setComicMap('', 'imgList', undefined);
      showComic();
    };
    return (() => {
      var _el$2 = web.template(`<p class="g2 gsp"><img src=https://ehgt.org/g/mr.gif>`)();
        _el$2.firstChild;
      _el$2.style.setProperty("padding-bottom", "0");
      (hasMultiPage ? 0 : undefined) != null ? _el$2.style.setProperty("padding-top", hasMultiPage ? 0 : undefined) : _el$2.style.removeProperty("padding-top");
      _el$2.addEventListener("click", handleClick, true);
      web.insert(_el$2, web.createComponent(LoadButton, {
        id: ""
      }), null);
      return _el$2;
    })();
  }, sidebarDom);

  // 等加载按钮渲染好后再绑定快捷键，防止在还没准备好时就触发加载导致出错
  if (options.hotkeys) hotkeysPageTurn(pageType);

  /** 获取新的图片页地址 */
  const getNewImgPageUrl = async url => {
    const res = await main.request(url, {
      errorText: helper.t('site.ehentai.fetch_img_page_source_failed')
    });
    checkIpBanned(res.responseText);
    const nl = /nl\('(.+?)'\)/.exec(res.responseText)?.[1];
    if (!nl) throw new Error(helper.t('site.ehentai.fetch_img_url_failed'));
    const newUrl = new URL(url);
    newUrl.searchParams.set('nl', nl);
    return newUrl.href;
  };

  /** 刷新指定图片 */
  const reloadImg = helper.singleThreaded(async (_, url) => {
    const i = ehImgList.indexOf(url);
    if (i === -1) return;
    ehImgList[i] = await getImgUrl(ehImgPageList[i]);
    if (!(await helper.testImgUrl(ehImgList[i]))) {
      ehImgPageList[i] = await getNewImgPageUrl(ehImgPageList[i]);
      ehImgList[i] = await getImgUrl(ehImgPageList[i]);
      main.toast.warn(helper.t('alert.retry_get_img_url', {
        i
      }));
      if (!(await helper.testImgUrl(ehImgList[i]))) {
        await helper.sleep(500);
        return reloadImg(url);
      }
    }
    setImgList('', i, ehImgList[i]);
  });
  setManga({
    title: helper.querySelector('#gj')?.textContent || helper.querySelector('#gn')?.textContent,
    onExit(isEnd) {
      if (isEnd) helper.scrollIntoView('#cdiv');
      setManga('show', false);
    },
    onImgError: reloadImg
  });
  setFab('initialShow', options.autoShow);
})().catch(error => helper.log.error(error));
web.delegateEvents(["click"]);

        break;
      }

    // #nhentai（彻底屏蔽漫画、无限滚动）
    case 'nhentai.net':
      {
const web = require('solid-js/web');
const main = require('main');
const detectAd = require('userscript/detectAd');
const helper = require('helper');


/** 用于转换获得图片文件扩展名 */
const fileType = {
  j: 'jpg',
  p: 'png',
  g: 'gif',
  w: 'webp',
  b: 'bmp'
};
(async () => {
  const {
    options,
    setFab,
    setManga,
    setComicLoad,
    showComic,
    comicMap,
    setComicMap
  } = await main.useInit('nhentai', {
    /** 无限滚动 */
    auto_page_turn: true,
    /** 彻底屏蔽漫画 */
    block_totally: true,
    /** 在新页面中打开链接 */
    open_link_new_page: true,
    /** 识别广告页 */
    detect_ad: true
  });

  // 在漫画详情页
  if (Reflect.has(unsafeWindow, 'gallery')) {
    setManga({
      onExit(isEnd) {
        if (isEnd) helper.scrollIntoView('#comment-container');
        setManga('show', false);
      }
    });

    // 图片域名编号目前是完全随机的，每次刷新都会出现不同的编号
    // 在图片元素的 data-src 里也是随机的，加载图片时还要用 get_cdn_url 函数替换
    // 但目前实测 i1 到 i4 都能直接用，或许是反爬虫的新机制？
    const hostIndex = unsafeWindow._n_app.options.media_server;
    setComicLoad(() => _gallery.images.pages.map((img, i) => `https://i${hostIndex}.nhentai.net/galleries/${_gallery.media_id}/${i + 1}.${fileType[img.t]}`));
    setFab('initialShow', options.autoShow);
    const comicReadModeDom = (() => {
      var _el$ = web.template(`<a href=javascript:; id=comicReadMode class="btn btn-secondary"><i class="fa fa-book"></i> Read`)();
      _el$.$$click = () => showComic();
      return _el$;
    })();
    document.getElementById('download').after(comicReadModeDom);
    const enableDetectAd = options.detect_ad && helper.querySelector('#tags .tag.tag-144644');
    if (enableDetectAd) {
      setComicMap('', 'adList', new main.ReactiveSet());

      // 先使用缩略图识别
      await detectAd.getAdPageByContent(helper.querySelectorAll('.thumb-container img').map(img => img.dataset.src), comicMap[''].adList);

      // 加载了原图后再用原图识别
      helper.createEffectOn(() => comicMap[''].imgList, imgList => imgList?.length && detectAd.getAdPageByContent(imgList, comicMap[''].adList));

      // 模糊广告页的缩略图
      helper.useStyle(() => {
        if (!comicMap['']?.adList?.size) return '';
        const styleList = [...comicMap[''].adList].map(i => `
            .thumb-container:nth-of-type(${i + 1}):not(:hover) {
              filter: blur(8px);
              clip-path: border-box;
            }`);
        return styleList.join('\n');
      });
    }
    return;
  }

  // 在漫画浏览页
  if (document.getElementsByClassName('gallery').length > 0) {
    if (options.open_link_new_page) for (const e of helper.querySelectorAll('a:not([href^="javascript:"])')) e.setAttribute('target', '_blank');
    const blacklist = (unsafeWindow?._n_app ?? unsafeWindow?.n)?.options?.blacklisted_tags;
    if (blacklist === undefined) main.toast.error(helper.t('site.nhentai.tag_blacklist_fetch_failed'));
    // blacklist === null 时是未登录

    if (options.block_totally && blacklist?.length) GM_addStyle('.blacklisted.gallery { display: none; }');
    if (options.auto_page_turn) {
      let nextUrl = helper.querySelector('a.next')?.href;
      if (!nextUrl) return;
      GM_addStyle(`
        hr { bottom: 1px; box-sizing: border-box; margin: -1em auto 2em; }
        hr:last-child { position: relative; animation: load .8s linear alternate infinite; }
        hr:not(:last-child) { display: none; }
        @keyframes load { 0% { width: 100%; } 100% { width: 0; } }
      `);
      const blackSet = new Set(blacklist);
      const contentDom = document.getElementById('content');
      const getObserveDom = () => contentDom.querySelector(':is(.index-container, #favcontainer):last-of-type');
      const loadNextPage = helper.singleThreaded(async () => {
        if (!nextUrl) return;
        const res = await main.request(nextUrl, {
          fetch: true,
          errorText: helper.t('site.nhentai.fetch_next_page_failed')
        });
        const html = helper.domParse(res.responseText);
        history.replaceState(null, '', nextUrl);
        const container = html.querySelector('.index-container, #favcontainer');
        for (const galleryDom of container.querySelectorAll('.gallery')) {
          for (const img of galleryDom.getElementsByTagName('img')) img.setAttribute('src', img.dataset.src);

          // 判断是否有黑名单标签
          const tags = galleryDom.dataset.tags.split(' ').map(Number);
          if (tags.some(tag => blackSet.has(tag))) galleryDom.classList.add('blacklisted');
        }
        const pagination = html.querySelector('.pagination');
        nextUrl = pagination.querySelector('a.next')?.href;
        contentDom.append(container, pagination);
        const hr = document.createElement('hr');
        contentDom.append(hr);
        observer.disconnect();
        observer.observe(getObserveDom());
        if (!nextUrl) hr.style.animationPlayState = 'paused';
      }, {
        abandon: true
      });
      loadNextPage();
      const observer = new IntersectionObserver(entries => entries[0].isIntersecting && loadNextPage());
      observer.observe(getObserveDom());
      if (helper.querySelector('section.pagination')) contentDom.append(document.createElement('hr'));
    }
  }
})().catch(error => helper.log.error(error));
web.delegateEvents(["click"]);

        break;
      }

    // #Yurifans（自动签到）
    case 'yuri.website':
      {
const main = require('main');
const helper = require('helper');

// 单篇
// https://yuri.website/162404/
// 连载折叠
// https://yuri.website/148990/
// 需要购买
// https://yuri.website/147642/
// https://yuri.website/122684/
// 在线区
(async () => {
  const {
    options,
    setManga,
    setComicLoad,
    showComic,
    comicMap,
    needAutoShow
  } = await main.useInit('yurifans', {
    自动签到: true
  });

  // 自动签到
  if (options.自动签到) (async () => {
    // 跳过未登录的情况
    if (!globalThis.b2token) return;
    const todayString = new Date().toLocaleDateString('zh-CN');
    // 判断当前日期与上次成功签到日期是否相同
    if (todayString === localStorage.getItem('signDate')) return;
    try {
      const res = await main.request('/wp-json/b2/v1/userMission', {
        method: 'POST',
        noTip: true,
        headers: {
          Authorization: `Bearer ${b2token}`
        }
      });
      const data = JSON.parse(res.responseText);

      // 首次成功签到 或 重复签到
      if (!(data?.mission?.date || !Number.isNaN(Number(data)))) throw new Error('签到失败');
      main.toast('自动签到成功');
      localStorage.setItem('signDate', todayString);
    } catch {
      main.toast.error('自动签到失败');
    }
  })();

  // 跳过漫画区外的页面
  if (!helper.querySelector('a.post-list-cat-item[title="在线区-漫画"]')) return;

  // 需要购买的漫画
  if (helper.querySelector('.content-hidden')) {
    const imgBody = helper.querySelector('.content-hidden');
    const imgList = imgBody.getElementsByTagName('img');
    if (await helper.wait(() => imgList.length, 1000)) setComicLoad(() => [...imgList].map(e => e.src));
    return;
  }

  // 有折叠内容的漫画
  if (helper.querySelector('.xControl')) {
    needAutoShow.val = false;
    const switchChapter = async i => {
      showComic(i);
      setManga({
        onPrev: Reflect.has(comicMap, i - 1) ? () => switchChapter(i - 1) : undefined,
        onNext: Reflect.has(comicMap, i + 1) ? () => switchChapter(i + 1) : undefined
      });
    };
    for (const [i, a] of helper.querySelectorAll('.xControl > a').entries()) {
      const item = a.parentElement.nextElementSibling;
      setComicLoad(() => [...item.getElementsByTagName('img')].map(e => e.dataset.src ?? ''), i);

      // 只在打开折叠内容时进入阅读模式
      a.addEventListener('click', () => item.getAttribute('style') !== '' && switchChapter(i));
    }
    return;
  }

  // 没有折叠的单篇漫画
  await helper.wait(() => helper.querySelectorAll('.entry-content img').length);
  setComicLoad(() => helper.querySelectorAll('.entry-content img').map(e => e.dataset.src || e.src));
})();

        break;
      }

    // #拷贝漫画(copymanga)（显示最后阅读记录、解锁隐藏漫画）
    case 'mangacopy.com':
    case 'copymanga.site':
    case 'copymanga.info':
    case 'copymanga.net':
    case 'copymanga.org':
    case 'copymanga.tv':
    case 'copymanga.com':
    case 'www.mangacopy.com':
    case 'www.copymanga.site':
    case 'www.copymanga.info':
    case 'www.copymanga.net':
    case 'www.copymanga.org':
    case 'www.copymanga.tv':
    case 'www.copymanga.com':
      {
const web = require('solid-js/web');
const solidJs = require('solid-js');
const main = require('main');
const helper = require('helper');


const headers = {
  webp: '1',
  region: '1',
  'User-Agent': 'COPY/2.0.7|',
  version: '2.0.7',
  source: 'copyApp',
  referer: 'com.copymanga.app-2.0.7'
};

// 在目录页显示上次阅读记录
const handleLastChapter = comicName => {
  let a;
  const stylesheet = new CSSStyleSheet();
  document.adoptedStyleSheets.push(stylesheet);
  const updateLastChapter = async () => {
    // 因为拷贝漫画的目录是动态加载的，所以要等目录加载出来再往上添加
    if (!a) (async () => {
      a = document.createElement('a');
      const tableRight = await helper.wait(() => helper.querySelector('.table-default-right'));
      a.target = '_blank';
      tableRight.insertBefore(a, tableRight.firstElementChild);
      const span = document.createElement('span');
      span.textContent = '最後閱讀：';
      tableRight.insertBefore(span, tableRight.firstElementChild);
    })();
    a.textContent = '獲取中';
    a.removeAttribute('href');
    const res = await main.request(`/api/v3/comic2/${comicName}/query?platform=3`, {
      responseType: 'json',
      fetch: false,
      headers
    });
    const data = res.response?.results?.browse;
    if (!data) {
      a.textContent = data === null ? '無' : '未返回數據';
      return;
    }
    const lastChapterId = data.chapter_id;
    if (!lastChapterId) {
      a.textContent = '接口異常';
      return;
    }
    await stylesheet.replace(`ul a[href*="${lastChapterId}"] {
        color: #fff !important;
        background: #1790E6;
      }`);
    a.href = `${window.location.pathname}/chapter/${lastChapterId}`;
    a.textContent = data.chapter_name;
  };
  setTimeout(updateLastChapter);
  document.addEventListener('visibilitychange', updateLastChapter);
};
// 拷贝有些漫画虽然可以通过 api 获取到数据，但网页上的目录被隐藏了
//  web - https://www.mangacopy.com/comic/lianyuqingchang
//  mobile - https://www.mangacopy.com/h5/details/comic/lianyuqingchang
// 还有些漫画连网页端介绍都被删了
// 生成目录
const buildChapters = async (comicName, hiddenType) => {
  const {
    response: {
      results
    }
  } = await main.request(`/comicdetail/${comicName}/chapters`, {
    responseType: 'json',
    errorText: '加載漫畫目錄失敗',
    headers,
    fetch: false
  });
  // 解码 api 返回的数据
  const decryptData = async (cipher, key, iv) => {
    const decryptedBuffer = await crypto.subtle.decrypt({
      name: 'AES-CBC',
      iv: new TextEncoder().encode(iv)
    }, await crypto.subtle.importKey('raw', new TextEncoder().encode(key), {
      name: 'AES-CBC'
    }, false, ['decrypt']), new Uint8Array(cipher.match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16))).buffer);
    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
  };
  const data = await decryptData(results.slice(16), unsafeWindow.dio || 'xxxmanga.woo.key', results.slice(0, 16));
  helper.log(data);
  const {
    build: {
      type
    },
    groups
  } = data;
  const Group = props => {
    const chapters = Object.fromEntries(type.map(({
      id
    }) => [id, []]));
    for (const chapter of props.chapters) chapters[chapter.type].push(chapter);
    switch (hiddenType) {
      case 'mobile':
        {
          // 删掉占位置的分隔线
          for (const dom of helper.querySelectorAll('.van-divider')) dom.remove();
          return (() => {
            var _el$ = web.template(`<div class="detailsTextContentTabs van-tabs van-tabs--line">`)();
            web.insert(_el$, web.createComponent(solidJs.For, {
              each: type,
              children: ({
                id,
                name
              }) => web.createComponent(solidJs.Show, {
                get when() {
                  return chapters[id].length;
                },
                get children() {
                  return [(() => {
                    var _el$2 = web.template(`<div class=van-tabs__wrap><div role=tablist class="van-tabs__nav van-tabs__nav--line"><div role=tab class="van-tab van-tab--active"><span class="van-tab__text van-tab__text--ellipsis"><span></span></span></div><div class=van-tabs__line>`)(),
                      _el$3 = _el$2.firstChild,
                      _el$4 = _el$3.firstChild,
                      _el$5 = _el$4.firstChild,
                      _el$6 = _el$5.firstChild,
                      _el$7 = _el$4.nextSibling;
                    _el$3.style.setProperty("background", "transparent");
                    web.insert(_el$6, name);
                    _el$7.style.setProperty("width", "0.24rem");
                    _el$7.style.setProperty("transform", "translateX(187.5px) translateX(-50%)");
                    _el$7.style.setProperty("transition-duration", "0.3s");
                    return _el$2;
                  })(), (() => {
                    var _el$8 = web.template(`<div class=van-tab__pane><div class="chapterList van-grid">`)(),
                      _el$9 = _el$8.firstChild;
                    _el$9.style.setProperty("padding-left", "0.24rem");
                    web.insert(_el$9, web.createComponent(solidJs.For, {
                      get each() {
                        return chapters[id];
                      },
                      children: chapter => (() => {
                        var _el$10 = web.template(`<div class="chapterItem oneLines van-grid-item"><a class="van-grid-item__content van-grid-item__content--center"><span class=van-grid-item__text>`)(),
                          _el$11 = _el$10.firstChild,
                          _el$12 = _el$11.firstChild;
                        _el$10.style.setProperty("flex-basis", "25%");
                        _el$10.style.setProperty("padding-right", "0.24rem");
                        _el$10.style.setProperty("margin-top", "0.24rem");
                        web.insert(_el$12, () => chapter.name);
                        web.effect(_p$ => {
                          var _v$ = !!(props.last_chapter.uuid === chapter.id),
                            _v$2 = `/comic/${comicName}/chapter/${chapter.id}`;
                          _v$ !== _p$.e && _el$10.classList.toggle("red", _p$.e = _v$);
                          _v$2 !== _p$.t && web.setAttribute(_el$11, "href", _p$.t = _v$2);
                          return _p$;
                        }, {
                          e: undefined,
                          t: undefined
                        });
                        return _el$10;
                      })()
                    }));
                    return _el$8;
                  })()];
                }
              })
            }));
            return _el$;
          })();
        }
      case 'web':
        {
          return [(() => {
            var _el$13 = web.template(`<span>`)();
            web.insert(_el$13, () => props.name);
            return _el$13;
          })(), (() => {
            var _el$14 = web.template(`<div class=table-default><div class=table-default-title><ul class="nav nav-tabs"role=tablist></ul><div class=table-default-right><span>更新內容：</span><a target=_blank></a><span>更新時間：</span><span></span></div></div><div class=table-default-box><div class=tab-content>`)(),
              _el$15 = _el$14.firstChild,
              _el$16 = _el$15.firstChild,
              _el$17 = _el$16.nextSibling,
              _el$18 = _el$17.firstChild,
              _el$19 = _el$18.nextSibling,
              _el$20 = _el$19.nextSibling,
              _el$21 = _el$20.nextSibling,
              _el$22 = _el$15.nextSibling,
              _el$23 = _el$22.firstChild;
            web.insert(_el$16, web.createComponent(solidJs.For, {
              each: type,
              children: ({
                id,
                name
              }) => (() => {
                var _el$24 = web.template(`<li class=nav-item><a class=nav-link data-toggle=tab role=tab aria-selected=false>`)(),
                  _el$25 = _el$24.firstChild;
                web.insert(_el$25, name);
                web.effect(_p$ => {
                  var _v$3 = !!(chapters[id].length === 0),
                    _v$4 = `#${props.path_word}${name}`;
                  _v$3 !== _p$.e && _el$25.classList.toggle("disabled", _p$.e = _v$3);
                  _v$4 !== _p$.t && web.setAttribute(_el$25, "href", _p$.t = _v$4);
                  return _p$;
                }, {
                  e: undefined,
                  t: undefined
                });
                return _el$24;
              })()
            }));
            web.insert(_el$19, () => props.last_chapter.name);
            web.insert(_el$21, () => props.last_chapter.datetime_created);
            web.insert(_el$23, web.createComponent(solidJs.For, {
              each: type,
              children: ({
                id,
                name
              }) => (() => {
                var _el$26 = web.template(`<div role=tabpanel class="tab-pane fade"><ul>`)(),
                  _el$27 = _el$26.firstChild;
                web.insert(_el$27, web.createComponent(solidJs.For, {
                  get each() {
                    return chapters[id];
                  },
                  children: chapter => (() => {
                    var _el$28 = web.template(`<a target=_blank><li>`)(),
                      _el$29 = _el$28.firstChild;
                    _el$28.style.setProperty("display", "block");
                    web.insert(_el$29, () => chapter.name);
                    web.effect(_p$ => {
                      var _v$5 = `/comic/${comicName}/chapter/${chapter.id}`,
                        _v$6 = chapter.name;
                      _v$5 !== _p$.e && web.setAttribute(_el$28, "href", _p$.e = _v$5);
                      _v$6 !== _p$.t && web.setAttribute(_el$28, "title", _p$.t = _v$6);
                      return _p$;
                    }, {
                      e: undefined,
                      t: undefined
                    });
                    return _el$28;
                  })()
                }));
                web.effect(() => web.setAttribute(_el$26, "id", `${props.path_word}${name}`));
                return _el$26;
              })()
            }));
            web.effect(() => web.setAttribute(_el$19, "href", `/comic/${comicName}/chapter/${props.last_chapter.comic_id}`));
            return _el$14;
          })()];
        }
      default:
        {
          return web.createComponent(solidJs.For, {
            each: type,
            children: ({
              id,
              name
            }) => web.createComponent(solidJs.Show, {
              get when() {
                return chapters[id].length;
              },
              get children() {
                var _el$30 = web.template(`<div class=card><div class=card-body><h2 class=card-title></h2><ul>`)(),
                  _el$31 = _el$30.firstChild,
                  _el$32 = _el$31.firstChild,
                  _el$33 = _el$32.nextSibling;
                _el$30.style.setProperty("max-width", "100em");
                _el$30.style.setProperty("margin", "1em auto");
                web.insert(_el$32, name);
                web.insert(_el$33, web.createComponent(solidJs.For, {
                  get each() {
                    return chapters[id];
                  },
                  children: chapter => (() => {
                    var _el$34 = web.template(`<a class="btn btn-outline-primary">`)();
                    web.insert(_el$34, () => chapter.name);
                    web.effect(_p$ => {
                      var _v$7 = !!(props.last_chapter.uuid === chapter.id),
                        _v$8 = `/comic/${comicName}/chapter/${chapter.id}`;
                      _v$7 !== _p$.e && _el$34.classList.toggle("active", _p$.e = _v$7);
                      _v$8 !== _p$.t && web.setAttribute(_el$34, "href", _p$.t = _v$8);
                      return _p$;
                    }, {
                      e: undefined,
                      t: undefined
                    });
                    return _el$34;
                  })()
                }));
                return _el$30;
              }
            })
          });
        }
    }
  };
  let root;
  switch (hiddenType) {
    case 'mobile':
      root = helper.querySelector('.detailsTextContent');
      // 自动点掉隐藏漫画的提示
      for (const element of helper.querySelectorAll('button.van-dialog__confirm')) element.click();
      break;
    case 'web':
      root = helper.querySelector('.upLoop');
      break;
    default:
      root = helper.querySelector('main');
      root.textContent = '';
      GM_addStyle(`ul .btn { height: fit-content; width: fit-content; margin: 1em; }`);
      break;
  }
  web.render(() => web.createComponent(solidJs.For, {
    get each() {
      return Object.values(groups);
    },
    children: Group
  }), root);

  // 点击每个分组下第一个激活的标签
  for (const group of helper.querySelectorAll('.upLoop .table-default-title')) group.querySelector('.nav-link:not(.disabled)')?.click();
};
(async () => {
  const token = document.cookie.split('; ').find(cookie => cookie.startsWith('token='))?.replace('token=', '');
  if (token) Reflect.set(headers, 'Authorization', `Token ${token}`);
  let comicName = '';
  let id = '';
  if (window.location.href.includes('/chapter/')) [,, comicName,, id] = window.location.pathname.split('/');else if (window.location.href.includes('/comicContent/')) [,,, comicName, id] = window.location.pathname.split('/');
  if (comicName && id) {
    const {
      setComicLoad,
      setManga
    } = await main.useInit('copymanga');

    /** 漫画不存在时才会出现的提示 */
    const titleDom = helper.querySelector('main .img+.title');
    if (titleDom) titleDom.textContent = 'ComicRead 提示您：你訪問的內容暫不存在，請點選右下角按鈕嘗試加載漫畫';
    setComicLoad(async () => {
      if (titleDom) titleDom.textContent = '漫畫加載中，請坐和放寬';
      const res = await main.request(`/api/v3/comic/${comicName}/chapter2/${id}?platform=3`, {
        responseType: 'json',
        headers,
        noCheckCode: true
      });
      if (res.status !== 200) {
        const message = `漫畫加載失敗：${res.response.message || res.status}`;
        if (titleDom) titleDom.textContent = message;
        throw new Error(message);
      }
      if (titleDom) {
        titleDom.textContent = '漫畫加載成功🥳';
        const {
          chapter: {
            name: chapterName
          },
          comic: {
            name
          }
        } = res.response.results;
        document.title = `${name} - ${chapterName} - 拷貝漫畫 拷贝漫画`;
      }
      if (titleDom ?? !helper.querySelector('.comicContent-next')) {
        const {
          chapter: {
            next,
            prev
          }
        } = res.response.results;
        setManga({
          onNext: next ? () => window.location.assign(`/comic/${comicName}/chapter/${next}`) : undefined,
          onPrev: prev ? () => window.location.assign(`/comic/${comicName}/chapter/${prev}`) : undefined
        });
      } else setManga({
        onNext: helper.querySelectorClick('.comicContent-next a:not(.prev-null)'),
        onPrev: helper.querySelectorClick('.comicContent-prev:not(.index,.list) a:not(.prev-null)')
      });
      const imgList = [];
      const {
        words,
        contents
      } = res.response.results.chapter;
      for (let i = 0; i < contents.length; i++) imgList[words[i]] = contents[i].url.replace(/(?<=.*(\/|\.))c800x/, 'c1500x');
      return imgList;
    });
    const getCommentList = async () => {
      const chapter_id = window.location.pathname.split('/').at(-1);
      const res = await main.request(`/api/v3/roasts?chapter_id=${chapter_id}&limit=100&offset=0&_update=true`, {
        responseType: 'json',
        errorText: '获取漫画评论失败'
      });
      return res.response.results.list.map(({
        comment
      }) => comment);
    };
    setManga({
      commentList: await getCommentList()
    });
    return;
  }

  // 目录页
  if (!id && window.location.href.includes('/comic/')) {
    comicName = window.location.href.split('/comic/')[1];
    if (!comicName) return;
    let hiddenType;
    const isMobile = window.location.href.includes('/h5/');
    if (document.title === '404 - 拷貝漫畫') {
      // 移动端可以直接复用代码来实现相同的样式
      hiddenType = isMobile ? 'mobile' : '404';
    } else if (isMobile) {
      // 等到加载提示框消失
      await helper.wait(() => helper.querySelector('.van-toast__text')?.parentElement?.style.display === 'none');
      // 再等一会看有没有屏蔽提示
      hiddenType = await helper.wait(() => {
        // 正常隐藏
        if (helper.querySelector('.isBan')?.textContent?.includes('不提供閱覽')) return 'mobile';
        // 连介绍都没有的隐藏
        const dialog = helper.querySelector('.van-dialog__message');
        if (dialog?.textContent?.includes('漫畫未找到')) {
          dialog.textContent = '漫畫未找到!\n請坐和放寬，等待目錄生成';
          // 删掉空白占位的原目录元素
          for (const element of helper.querySelectorAll('.detailsTextContentTabs')) element.remove();
          // 虽然实际是应该算是 404 类型，但因为网页的 css 还在
          // 所以可以直接使用 mobile 的元素复用样式
          return 'mobile';
        }
      }, 1000);
    } else if (
    // 先检查有没有屏蔽提示
    Boolean(helper.querySelector('.wargin')?.textContent?.includes('不提供閱覽')) ||
    // 再等一秒看目录有没有加载出来
    !(await helper.wait(() => helper.querySelector('.upLoop .table-default-title'), 1000))) {
      // 检查漫画介绍是否正常显示
      hiddenType = helper.querySelector('.comicParticulars-title') ? 'web' : '404';
    }

    // 如果漫画被隐藏了，就自己生成目录
    if (hiddenType) {
      // 给屏蔽提示加个删除线
      const tip = helper.querySelector('.isBan, .wargin');
      if (tip) tip.style.textDecoration = 'line-through';
      // 修改 404 提示
      const titleDom = helper.querySelector('main .img+.title');
      if (titleDom) {
        titleDom.textContent = 'ComicRead 提示您：你訪問的內容暫不存在，請坐和放寬，等待目錄生成';
      }
      await buildChapters(comicName, hiddenType);
    }
    if (!isMobile && token) handleLastChapter(comicName);
  }
})();

        break;
      }

    // #[Pixiv](https://www.pixiv.net)
    case 'www.pixiv.net':
      {
        let imgList = [];
        options = {
          name: 'pixiv',
          getImgList: () => imgList,
          SPA: {
            async isMangaPage() {
              const id = Number(window.location.pathname.split('/')[2]);
              if (!id || !window.location.pathname.startsWith('/artworks/')) {
                imgList.length = 0;
                return false;
              }
              const res = await main.request(`/ajax/illust/${id}/pages`, {
                responseType: 'json'
              });
              imgList = res.response.body.map(e => e.urls.original);
              return imgList.length > 1;
            }
          },
          initOptions: {
            autoShow: false,
            defaultOption: {
              pageNum: 1
            }
          }
        };
        break;
      }

    // #[PonpomuYuri](https://www.ponpomu.com)
    case 'www.ponpomu.com':
      {
        options = {
          name: 'terraHistoricus',
          wait: () => Boolean(helper.querySelector('.comic-page-container img')),
          getImgList: () => helper.querySelectorAll('.comic-page-container img').map(e => e.dataset.srcset),
          SPA: {
            isMangaPage: () => window.location.href.includes('/comic/'),
            getOnPrev: () => helper.querySelectorClick('.prev-btn:not(.invisible) a'),
            getOnNext: () => helper.querySelectorClick('.next-btn:not(.invisible) a')
          }
        };
        break;
      }

    // #[再漫画](https://manhua.zaimanhua.com/)
    case 'manhua.zaimanhua.com':
      {
        const getImgList = () => unsafeWindow.__NUXT__.data.getChapters?.data?.chapterInfo?.page_url;
        options = {
          name: 'zaiManHua',
          wait: () => Boolean(helper.querySelector('.scrollbar-demo-item')),
          getImgList,
          SPA: {
            isMangaPage: () => window.location.pathname.startsWith('/view/'),
            getOnNext: () => helper.querySelectorClick('#prev_chapter'),
            getOnPrev: () => helper.querySelectorClick('#next_chapter')
          }
        };
        break;
      }
    case 'm.zaimanhua.com':
      {
        const getPageData = async (comicId, chapterId) => {
          const res = await main.request(`https://v4api.zaimanhua.com/app/v1/comic/chapter/${comicId}/${chapterId}`, {
            responseType: 'json'
          });
          if (res.response.errno) main.toast.error(`${helper.t('alert.comic_load_error')}: ${res.response.errmsg}`, {
            throw: true
          });
          return res.response.data.data;
        };
        const getComicData = async comicId => {
          const res = await main.request(`https://v4api.zaimanhua.com/app/v1/comic/detail/${comicId}`, {
            responseType: 'json'
          });
          if (res.response.errno) main.toast.error(`${helper.t('alert.comic_load_error')}: ${res.response.errmsg}`, {
            throw: true
          });
          return res.response.data.data;
        };
        options = {
          name: 'zaiManHua',
          async getImgList({
            setManga
          }) {
            const urlParams = new URLSearchParams(window.location.search);
            const comicId = Number(urlParams.get('comic_id'));
            const chapterId = Number(urlParams.get('chapter_id'));
            if (!comicId || !chapterId) throw new Error(helper.t('site.changed_load_failed'));

            // 设置上/下话跳转
            const comicData = await getComicData(comicId);
            const chapter = (comicData.chapters.length === 1 ? comicData.chapters[0] : comicData.chapters.find(chapter => chapter.data.find(data => data.chapter_id === chapterId))).data;
            chapter.sort((a, b) => a.chapter_order - b.chapter_order);
            const chapterIndex = chapter.findIndex(data => data.chapter_id === chapterId);
            setManga({
              onPrev: chapterIndex > 0 ? () => window.location.assign(`/pages/comic/page?comic_id=${comicId}&chapter_id=${chapter[chapterIndex - 1].chapter_id}`) : undefined,
              onNext: chapterIndex + 1 < chapter.length ? () => window.location.assign(`/pages/comic/page?comic_id=${comicId}&chapter_id=${chapter[chapterIndex + 1].chapter_id}`) : undefined
            });
            const pageData = await getPageData(comicId, chapterId);
            return pageData.page_url_hd;
          },
          SPA: {
            isMangaPage: () => window.location.pathname === '/pages/comic/page'
          }
        };
        break;
      }

    // #[明日方舟泰拉记事社](https://terra-historicus.hypergryph.com)
    case 'terra-historicus.hypergryph.com':
      {
        const apiUrl = () => `https://terra-historicus.hypergryph.com/api${window.location.pathname}`;
        const getImgUrl = i => async () => {
          const res = await main.request(`${apiUrl()}/page?pageNum=${i + 1}`);
          return JSON.parse(res.responseText).data.url;
        };
        options = {
          name: 'terraHistoricus',
          wait: () => Boolean(helper.querySelector('.HG_COMIC_READER_main')),
          async getImgList() {
            const res = await main.request(apiUrl(), {
              responseType: 'json'
            });
            const pageList = res.response.data.pageInfos;
            if (pageList.length === 0 && window.location.pathname.includes('episode')) throw new Error('获取图片列表时出错');
            return helper.plimit(helper.createSequence(pageList.length).map(getImgUrl));
          },
          SPA: {
            isMangaPage: () => window.location.href.includes('episode'),
            getOnPrev: () => helper.querySelectorClick('footer .HG_COMIC_READER_prev a'),
            getOnNext: () => helper.querySelectorClick('footer .HG_COMIC_READER_prev+.HG_COMIC_READER_buttonEp a')
          }
        };
        break;
      }

    // #[禁漫天堂](https://18comic.vip)
    case 'jmcomic-zzz.one':
    case 'jmcomic-zzz.org':
    case '18comic-mygo.org':
    case '18comic.org':
    case '18comic.vip':
      {
const main = require('main');
const helper = require('helper');

(async () => {
  // 只在漫画页内运行
  if (!window.location.pathname.includes('/photo/')) return;
  const {
    setComicLoad,
    setManga,
    dynamicLoad
  } = await main.useInit('jm');
  while (!unsafeWindow?.onImageLoaded) {
    if (document.readyState === 'complete') {
      main.toast.error('无法获取图片', {
        duration: Number.POSITIVE_INFINITY
      });
      return;
    }
    await helper.sleep(100);
  }
  setManga({
    onPrev: helper.querySelectorClick(() => helper.querySelector('.menu-bolock-ul .fa-angle-double-left')?.parentElement),
    onNext: helper.querySelectorClick(() => helper.querySelector('.menu-bolock-ul .fa-angle-double-right')?.parentElement)
  });
  const imgEleList = helper.querySelectorAll('.scramble-page:not(.thewayhome) > img');

  // 判断当前漫画是否有被分割，没有就直接获取图片链接加载
  // 判断条件来自页面上的 scramble_image 函数
  if (unsafeWindow.aid < unsafeWindow.scramble_id || unsafeWindow.speed === '1') return setComicLoad(() => imgEleList.map(e => e.dataset.original ?? ''));
  const downloadImg = async url => {
    try {
      // 使用 fetch 可以复用本地缓存，但有时候会报 cors 问题
      return await main.request(url, {
        responseType: 'blob',
        fetch: true,
        noTip: true
      }, 3);
    } catch {
      return await main.request(url, {
        responseType: 'blob',
        revalidate: true,
        fetch: false
      }, 3);
    }
  };
  const getImgUrl = async imgEle => {
    if (imgEle.src.startsWith('blob:')) return imgEle.src;
    const originalUrl = imgEle.src;
    const res = await downloadImg(imgEle.dataset.original);
    if (res.response.size === 0) {
      main.toast.warn(`下载原图时出错: ${imgEle.dataset.page}`);
      return '';
    }
    imgEle.src = URL.createObjectURL(res.response);
    try {
      await helper.waitImgLoad(imgEle, 1000 * 10);
    } catch {
      URL.revokeObjectURL(imgEle.src);
      imgEle.src = originalUrl;
      main.toast.warn(`加载原图时出错: ${imgEle.dataset.page}`);
      return '';
    }
    try {
      // 原有的 canvas 可能已被污染，直接删掉
      if (imgEle.nextElementSibling?.tagName === 'CANVAS') imgEle.nextElementSibling.remove();
      unsafeWindow.onImageLoaded(imgEle);
      const blob = await helper.canvasToBlob(imgEle.nextElementSibling, 'image/webp', 1);
      URL.revokeObjectURL(imgEle.src);
      if (!blob) throw new Error('转换图片时出错');
      return `${URL.createObjectURL(blob)}#.webp`;
    } catch (error) {
      imgEle.src = originalUrl;
      main.toast.warn(`转换图片时出错: ${imgEle.dataset.page}, ${error.message}`);
      return '';
    }
  };

  // 先等懒加载触发完毕
  await helper.wait(() => {
    const loadedNum = helper.querySelectorAll('.lazy-loaded').length;
    return loadedNum > 0 && helper.querySelectorAll('canvas').length - loadedNum <= 1;
  });
  const loadImgList = async setImg => helper.plimit(imgEleList.map((img, i) => async () => {
    setImg(i, await getImgUrl(img));
  }));
  setComicLoad(dynamicLoad(loadImgList, imgEleList.length));
})().catch(error => helper.log.error(error));

        break;
      }

    // #[漫画柜(manhuagui)](https://www.manhuagui.com)
    case 'tw.manhuagui.com':
    case 'm.manhuagui.com':
    case 'www.mhgui.com':
    case 'www.manhuagui.com':
      {
        if (!/\/comic\/\d+\/\d+\.html/.test(window.location.pathname)) break;
        let comicInfo;
        try {
          const dataScript = helper.querySelectorAll('body > script:not([src])').find(script => script.innerHTML.startsWith('window['));
          if (!dataScript) throw new Error(helper.t('site.changed_load_failed'));
          comicInfo = JSON.parse(
          // 只能通过 eval 获得数据
          // eslint-disable-next-line no-eval
          eval(dataScript.innerHTML.slice(26)).match(/(?<=.*?\(){.+}/)[0]);
        } catch {
          main.toast.error(helper.t('site.changed_load_failed'));
          break;
        }

        // 让切换章节的提示可以显示在漫画页上
        GM_addStyle(`#smh-msg-box { z-index: 2147483647 !important }`);
        const handlePrevNext = cid => {
          if (cid === 0) return undefined;
          const newUrl = window.location.pathname.replace(/(?<=\/)\d+(?=\.html)/, `${cid}`);
          return () => window.location.assign(newUrl);
        };
        options = {
          name: 'manhuagui',
          getImgList() {
            const sl = Object.entries(comicInfo.sl).map(attr => `${attr[0]}=${attr[1]}`).join('&');
            if (comicInfo.files) return comicInfo.files.map(file => `${unsafeWindow.pVars.manga.filePath}${file}?${sl}`);
            if (comicInfo.images) {
              const {
                origin
              } = new URL(helper.querySelector('#manga img').src);
              return comicInfo.images.map(url => `${origin}${url}?${sl}`);
            }
            main.toast.error(helper.t('site.changed_load_failed'), {
              throw: true
            });
            return [];
          },
          onNext: handlePrevNext(comicInfo.nextId),
          onPrev: handlePrevNext(comicInfo.prevId)
        };
        break;
      }

    // #[漫画DB(manhuadb)](https://www.manhuadb.com)
    case 'www.manhuadb.com':
      {
        if (!Reflect.has(unsafeWindow, 'img_data_arr')) break;
        options = {
          name: 'manhuaDB',
          getImgList: () => unsafeWindow.img_data_arr.map(data => `${unsafeWindow.img_host}/${unsafeWindow.img_pre}/${data.img}`),
          onPrev: () => unsafeWindow.goNumPage('pre'),
          onNext: () => unsafeWindow.goNumPage('next')
        };
        break;
      }

    // #[动漫屋(dm5)](https://www.dm5.com)
    case 'www.manhuaren.com':
    case 'm.1kkk.com':
    case 'www.1kkk.com':
    case 'tel.dm5.com':
    case 'en.dm5.com':
    case 'www.dm5.cn':
    case 'www.dm5.com':
      {
        if (!Reflect.has(unsafeWindow, 'DM5_CID')) break;
        const imgNum = unsafeWindow.DM5_IMAGE_COUNT ?? unsafeWindow.imgsLen;
        if (!(Number.isSafeInteger(imgNum) && imgNum > 0)) {
          main.toast.error(helper.t('site.changed_load_failed'));
          break;
        }
        const getPageImg = async i => {
          const res = await unsafeWindow.$.ajax({
            type: 'GET',
            url: 'chapterfun.ashx',
            data: {
              cid: unsafeWindow.DM5_CID,
              page: i,
              key: unsafeWindow.$('#dm5_key').length > 0 ? unsafeWindow.$('#dm5_key').val() : '',
              language: 1,
              gtk: 6,
              _cid: unsafeWindow.DM5_CID,
              _mid: unsafeWindow.DM5_MID,
              _dt: unsafeWindow.DM5_VIEWSIGN_DT,
              _sign: unsafeWindow.DM5_VIEWSIGN
            }
          });
          // eslint-disable-next-line no-eval
          return eval(res);
        };
        const handlePrevNext = (pcSelector, mobileText) => helper.querySelectorClick(() => helper.querySelector(pcSelector) ?? helper.querySelectorAll('.view-bottom-bar a').find(e => e.textContent?.includes(mobileText)));
        options = {
          name: 'dm5',
          getImgList({
            dynamicLoad
          }) {
            // manhuaren 和 1kkk 的移动端上会直接用一个变量存储所有图片的链接
            if (Array.isArray(unsafeWindow.newImgs) && unsafeWindow.newImgs.every(helper.isUrl)) return unsafeWindow.newImgs;
            return dynamicLoad(async setImg => {
              const imgList = new Set();
              while (imgList.size < imgNum) {
                // 因为每次会返回指定页数及上一页的图片链接，所以加个1减少请求次数
                for (const url of await getPageImg(imgList.size + 1)) {
                  if (imgList.has(url)) continue;
                  imgList.add(url);
                  setImg(imgList.size - 1, url);
                }
              }
            }, imgNum)();
          },
          onPrev: handlePrevNext('.logo_1', '上一章'),
          onNext: handlePrevNext('.logo_2', '下一章'),
          onExit: isEnd => isEnd && helper.scrollIntoView('.postlist')
        };
        break;
      }

    // #[绅士漫画(wnacg)](https://www.wnacg.com)
    case 'www.wnacg01.cc':
    case 'www.wn03.ru':
    case 'www.wnacg.com':
    case 'wnacg.com':
      {
        // 突出显示下拉阅读的按钮
        const buttonDom = helper.querySelector('#bodywrap a.btn');
        if (buttonDom) {
          buttonDom.style.setProperty('background-color', '#607d8b');
          buttonDom.style.setProperty('background-image', 'none');
        }
        if (!Reflect.has(unsafeWindow, 'imglist')) break;
        options = {
          name: 'wnacg',
          getImgList: () => unsafeWindow.imglist.filter(({
            caption
          }) => caption !== '喜歡紳士漫畫的同學請加入收藏哦！').map(({
            url
          }) => new URL(url, window.location.origin).href)
        };
        break;
      }

    // #[mangabz](https://mangabz.com)
    case 'www.mangabz.com':
    case 'mangabz.com':
      {
        if (!Reflect.has(unsafeWindow, 'MANGABZ_CID')) break;
        const imgNum = unsafeWindow.MANGABZ_IMAGE_COUNT ?? unsafeWindow.imgsLen;
        if (!(Number.isSafeInteger(imgNum) && imgNum > 0)) {
          main.toast.error(helper.t('site.changed_load_failed'));
          break;
        }
        const getPageImg = async i => {
          const res = await unsafeWindow.$.ajax({
            type: 'GET',
            url: 'chapterimage.ashx',
            data: {
              cid: unsafeWindow.MANGABZ_CID,
              page: i,
              key: '',
              _cid: unsafeWindow.MANGABZ_CID,
              _mid: unsafeWindow.MANGABZ_MID,
              _dt: unsafeWindow.MANGABZ_VIEWSIGN_DT,
              _sign: unsafeWindow.MANGABZ_VIEWSIGN
            }
          });
          // eslint-disable-next-line no-eval
          return eval(res);
        };
        const handlePrevNext = (pcSelector, mobileText) => helper.querySelectorClick(() => helper.querySelector(pcSelector) ?? helper.querySelectorAll('.bottom-bar-tool a').find(e => e.textContent?.includes(mobileText)));
        options = {
          name: 'mangabz',
          getImgList: ({
            dynamicLoad
          }) => dynamicLoad(async setImg => {
            const imgList = new Set();
            while (imgList.size < imgNum) {
              // 因为每次会返回指定页数及上一页的图片链接，所以加个1减少请求次数
              for (const url of await getPageImg(imgList.size + 1)) {
                if (imgList.has(url)) continue;
                imgList.add(url);
                setImg(imgList.size - 1, url);
              }
            }
          }, imgNum)(),
          onNext: handlePrevNext('body > .container a[href^="/"]:last-child', '下一'),
          onPrev: handlePrevNext('body > .container a[href^="/"]:first-child', '上一')
        };
        break;
      }

    // #[komiic](https://komiic.com)
    case 'komiic.com':
      {
        const query = `
        query imagesByChapterId($chapterId: ID!) {
          imagesByChapterId(chapterId: $chapterId) {
            id
            kid
            height
            width
            __typename
          }
        }`;
        const getImgList = async () => {
          const chapterId = /chapter\/(\d+)/.exec(window.location.pathname)?.[1];
          if (!chapterId) throw new Error(helper.t('site.changed_load_failed'));
          const res = await main.request('/api/query', {
            method: 'POST',
            responseType: 'json',
            headers: {
              'content-type': 'application/json'
            },
            data: JSON.stringify({
              operationName: 'imagesByChapterId',
              variables: {
                chapterId: `${chapterId}`
              },
              query
            })
          });
          return res.response.data.imagesByChapterId.map(({
            kid
          }) => `https://komiic.com/api/image/${kid}`);
        };
        const handlePrevNext = text => async () => {
          await helper.waitDom('.v-bottom-navigation__content');
          return helper.querySelectorClick('.v-bottom-navigation__content > button:not([disabled])', text);
        };
        options = {
          name: 'komiic',
          getImgList,
          SPA: {
            isMangaPage: () => /comic\/\d+\/chapter\/\d+\/images\//.test(window.location.href),
            getOnPrev: handlePrevNext('上一'),
            getOnNext: handlePrevNext('下一')
          }
        };
        break;
      }

    // #[MangaDex](https://mangadex.org)
    case 'mangadex.org':
      {
        options = {
          name: 'mangadex',
          async getImgList() {
            const chapter_id = window.location.pathname.split('/').at(2);
            const {
              response: {
                baseUrl,
                chapter: {
                  data,
                  hash
                }
              }
            } = await main.request(`https://api.mangadex.org/at-home/server/${chapter_id}?forcePort443=false`, {
              responseType: 'json'
            });
            return data.map(e => baseUrl + '/data/' + hash + '/' + e);
          },
          SPA: {
            isMangaPage: () => /^\/chapter\/.+/.test(window.location.pathname),
            getOnPrev: () => helper.querySelectorClick(`#chapter-selector > a[href^="/chapter/"]:nth-of-type(1)`),
            getOnNext: () => helper.querySelectorClick(`#chapter-selector > a[href^="/chapter/"]:nth-of-type(2)`),
            handleUrl: location => location.href.replace(/(?<=\/chapter\/.+?)\/.*/, '')
          }
        };
        break;
      }

    // #[NoyAcg](https://noy1.top)
    
    case 'noy1.top':
      {
        options = {
          name: 'NoyAcg',
          async getImgList() {
            const [,, id] = window.location.hash.split('/');

            // 随便拿一个图片来获取 cdn url
            const img = await helper.wait(() => helper.querySelector('.lazy-load-image-background img'));
            const cdn = img.src.split(id)[0];
            const imgNum = await helper.wait(() => helper.querySelectorAll('.lazy-load-image-background').length);
            return helper.range(imgNum, i => `${cdn}${id}/${i + 1}.webp`);
          },
          SPA: {
            isMangaPage: () => window.location.hash.startsWith('#/read/')
          }
        };
        break;
      }

    // #[無限動漫](https://www.comicabc.com)
    case '8.twobili.com':
    case 'a.twobili.com':
    case 'articles.onemoreplace.tw':
    case 'www.comicabc.com':
      {
        const pathStartList = ['/online/', '/ReadComic/', '/comic/'];
        if (!pathStartList.some(path => location.pathname.startsWith(path))) break;

        // by: https://sleazyfork.org/zh-CN/scripts/374903-comicread/discussions/241035
        const getImgList = () => [...unsafeWindow.xx.matchAll(/(?<= s=").+?(?=")/g)].map(([text]) => decodeURIComponent(text));
        options = {
          name: '8comic',
          getImgList,
          onNext: helper.querySelectorClick('#nextvol'),
          onPrev: helper.querySelectorClick('#prevvol')
        };
        break;
      }

    // #[新新漫画](https://www.77mh.nl)
    case 'm.77mh.me':
    case 'www.77mh.me':
    case 'm.77mh.xyz':
    case 'www.77mh.xyz':
    case 'm.77mh.nl':
    case 'www.77mh.nl':
      {
        if (!Reflect.has(unsafeWindow, 'msg')) break;
        options = {
          name: '77mh',
          async getImgList() {
            const baseUrl = unsafeWindow.img_qianz ?? unsafeWindow.ImgSvrList;
            return unsafeWindow.msg.split('|').map(path => `${baseUrl}${path}`);
          },
          onNext: helper.querySelectorClick('#pnpage > a', '下一'),
          onPrev: helper.querySelectorClick('#pnpage > a', '上一')
        };
        break;
      }

    // #[熱辣漫畫](https://www.relamanhua.org/)
    case 'www.relamanhua.org':
    case 'www.manga2024.com':
    case 'www.2024manga.com':
      {
        if (!window.location.pathname.includes('/chapter/') && !document.querySelector('.disData[contentkey]')) break;
        const getImgList = async () => {
          const [,, word,, id] = window.location.pathname.split('/');
          const res = await main.request(`https://mapi.fgjfghkk.club/api/v3/comic/${word}/chapter/${id}?platform=1&_update=true`, {
            responseType: 'json'
          });
          return res.response.results.chapter.contents.map(({
            url
          }) => url.replace('.h800x.', '.h1500x.'));
        };
        options = {
          name: 'relamanhua',
          getImgList,
          onNext: helper.querySelectorClick('.comicContent-next a:not(.prev-null)'),
          onPrev: helper.querySelectorClick('.comicContent-prev:not(.index,.list) a:not(.prev-null)')
        };
        break;
      }

    // #[hitomi](https://hitomi.la)
    case 'hitomi.la':
      {
        options = {
          name: 'hitomi',
          wait: () => unsafeWindow.galleryinfo && Reflect.has(unsafeWindow.galleryinfo, 'files') && unsafeWindow.galleryinfo.type !== 'anime',
          getImgList: () => (unsafeWindow.galleryinfo?.files).map(img => unsafeWindow.url_from_url_from_hash(unsafeWindow.galleryinfo.id, img, 'webp'))
        };
        break;
      }

    // #[SchaleNetwork](https://schale.network/)
    case 'shupogaki.moe':
    case 'hoshino.one':
    case 'niyaniya.moe':
      {
        const downloadImg = async url => new Promise(resolve => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.open('GET', url);
          xhr.onload = () => {
            resolve(URL.createObjectURL(xhr.response));
          };
          xhr.send();
        });
        const isMangaPage = () => window.location.href.includes('/g/');
        options = {
          name: 'schale',
          async getImgList({
            dynamicLoad
          }) {
            const [,, galleryId, galleryKey] = window.location.pathname.split('/');
            const detailRes = await main.request(`https://api.schale.network/books/detail/${galleryId}/${galleryKey}`, {
              fetch: true,
              responseType: 'json'
            });
            const [[w, {
              id,
              public_key
            }]] = Object.entries(detailRes.response.data)
            // 以某个时间为分界线，更早之前的漫画返回的格式是：
            // "0": { "id": 104981, "public_key": "512b76025139", "size": 185635578},
            // "780": { "id": 105099, "public_key": "e7404779e2ad", "size": 27643333 },
            // 但实际使用 0 的 id 和 key 就会报错
            // > https://niyaniya.moe/g/24388/6c159e552eb3 [Mira] EARTH GIRLS 果實 後篇 (CHINESE)
            //
            // 分界时间之后的漫画则是：
            // "0": { "size": 29206268 },
            // "780": { "id": 105242, "public_key": "577d6d6558ac", "size": 4237537, "watermarked": true },
            // 没有权限的 0 不再返回 id 和 key
            // > https://niyaniya.moe/g/24410/3f37324296e2 [Pikachi] 同性交際俱樂部 (CHINESE)
            //
            // 考虑到这可能只是更换域名迁移数据导致的临时问题
            // 所以暂且用 `Number(px) &&` 的方式忽略掉 0，等过段时间再视情况而定
            .filter(([px, data]) => Number(px) && data.id && data.public_key).sort(([, a], [, b]) => b.size - a.size);
            const {
              created_at,
              updated_at
            } = detailRes.response;
            const dataRes = await main.request(`https://api.schale.network/books/data/${galleryId}/${galleryKey}/${id}/${public_key}?v=${updated_at ?? created_at}&w=${w}`, {
              fetch: true,
              responseType: 'json'
            });
            const {
              base,
              entries
            } = dataRes.response;
            const totalPageNum = entries.length;
            return dynamicLoad(async setImg => {
              for (const [i, {
                path,
                dimensions
              }] of entries.entries()) {
                if (!isMangaPage) break;
                const startTime = performance.now();
                setImg(i, await downloadImg(`${base}${path}?w=${dimensions[0]}`));
                await helper.sleep(500 - (performance.now() - startTime));
              }
            }, totalPageNum)();
          },
          SPA: {
            isMangaPage
          }
        };
        break;
      }

    // #[kemono](https://kemono.su)
    case 'kemono.su':
    case 'kemono.party':
      {
const main = require('main');
const helper = require('helper');

(async () => {
  const isMangaPage = () => location.pathname.includes('/post/');
  await helper.waitUrlChange(isMangaPage);
  const {
    options,
    setComicLoad,
    showComic,
    switchComic,
    needAutoShow,
    setFab,
    setManga,
    setComicMap
  } = await main.useInit('kemono', {
    autoShow: false,
    defaultOption: {
      pageNum: 1
    },
    /** 加载原图 */
    load_original_image: true
  });
  setComicLoad(() => helper.querySelectorAll('.post__thumbnail a').map(e => e.href), 'original');
  setComicLoad(() => helper.querySelectorAll('.post__thumbnail img').map(e => e.src), 'thumbnail');

  // 在切换时重新获取图片
  helper.createEffectOn(() => options.load_original_image, (isOriginal, prev) => {
    if (!prev) return switchComic(isOriginal ? 'original' : 'thumbnail');
    needAutoShow.val = options.autoShow;
    showComic(isOriginal ? 'original' : 'thumbnail');
  });

  // 加上跳转至 pwa 的链接
  const zipExtension = new Set(['zip', 'rar', '7z', 'cbz', 'cbr', 'cb7']);
  for (const e of helper.querySelectorAll('.post__attachment a')) {
    if (!zipExtension.has(e.href.split('.').pop())) continue;
    const a = document.createElement('a');
    a.href = `https://comic-read.pages.dev/?url=${encodeURIComponent(e.href)}`;
    a.textContent = e.textContent.replace('Download ', 'ComicReadPWA - ');
    a.className = e.className;
    a.style.opacity = '.6';
    e.parentNode.insertBefore(a, e.nextElementSibling);
  }
  helper.onUrlChange(async () => {
    if (!isMangaPage()) {
      setFab('show', false);
      setManga({
        show: false
      });
      setComicMap('original', 'imgList', undefined);
      setComicMap('thumbnail', 'imgList', undefined);
      return;
    }
    setFab('show', undefined);
    setManga({
      onPrev: undefined,
      onNext: undefined
    });
    needAutoShow.val = options.autoShow;
    setComicMap('', 'imgList', undefined);
    if (needAutoShow.val && options.autoShow) await showComic('');
  });
})();

        break;
      }

    // #[nekohouse](https://nekohouse.su)
    case 'nekohouse.su':
      {
        options = {
          name: 'nekohouse',
          getImgList: () => helper.querySelectorAll('.fileThumb').map(e => e.getAttribute('href')),
          initOptions: {
            autoShow: false,
            defaultOption: {
              pageNum: 1
            }
          }
        };
        break;
      }

    // #[コミックグロウル](https://comic-growl.com)
    case 'comic-growl.com':
      {
        options = {
          name: 'welovemanga',
          async getImgList({
            dynamicLoad
          }) {
            const json = helper.querySelector('#episode-json')?.dataset.value;
            if (!json) throw new Error(helper.t('site.changed_load_failed'));
            const data = JSON.parse(json);
            // 「公開終了しました」的漫画
            if (!data.readableProduct.pageStructure?.pages) return [];
            const pages = data.readableProduct.pageStructure.pages.filter(({
              type
            }) => type === 'main');

            // 有些情况下图片并没有被分割打乱
            // 比如：https://comic-growl.com/episode/14079602755149645069
            // 不过只找到这一个例子，姑且先猜测是通过 choJuGiga 这个字段来判断的
            if (data.readableProduct.pageStructure.choJuGiga !== 'baku') return pages.map(({
              src
            }) => src);
            const loadImgList = async setImg => {
              for (const [i, page] of pages.entries()) {
                // by: https://greasyfork.org/zh-CN/scripts/428282-漫画下载
                // 另外网站使用的 GigaViewer 阅读器在其他很多网站上也都使用的同款
                // 之后或许可以统一适配一下
                // 除上面的脚本外也可以参考：https://github.com/eggplants/getjump
                const blob = await fetch(page.src).then(r => r.blob());
                const img = await helper.waitImgLoad(URL.createObjectURL(blob));
                const canvas = new OffscreenCanvas(page.width, page.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const raw = ctx.getImageData(0, 0, page.width, page.height);
                const target = ctx.getImageData(0, 0, page.width, page.height);
                const cellWidth = Math.floor(page.width / 32) * 8;
                const cellHeight = Math.floor(page.height / 32) * 8;
                for (let l = 0; l < 4; l++) {
                  for (let j = 0; j < 4; j++) {
                    const srcX = l * cellWidth;
                    const srcY = j * cellHeight;
                    const targetX = j * cellWidth;
                    const targetY = l * cellHeight;
                    for (let y = 0; y < cellHeight; y++) {
                      for (let x = 0; x < cellWidth; x++) {
                        const srcIndex = ((srcY + y) * page.width + (srcX + x)) * 4;
                        const targetIndex = ((targetY + y) * page.width + (targetX + x)) * 4;
                        target.data[targetIndex] = raw.data[srcIndex];
                        target.data[targetIndex + 1] = raw.data[srcIndex + 1];
                        target.data[targetIndex + 2] = raw.data[srcIndex + 2];
                        target.data[targetIndex + 3] = raw.data[srcIndex + 3];
                      }
                    }
                  }
                }
                ctx.putImageData(target, 0, 0);
                setImg(i, URL.createObjectURL(await helper.canvasToBlob(canvas)));
              }
            };
            return dynamicLoad(loadImgList, pages.length)();
          },
          SPA: {
            isMangaPage: () => window.location.pathname.startsWith('/episode/'),
            getOnPrev: () => helper.querySelectorClick('a.previous-link'),
            getOnNext: () => helper.querySelectorClick('a.next-link')
          }
        };
        break;
      }

    // #[welovemanga](https://welovemanga.one)
    case 'nicomanga.com':
    case 'weloma.art':
    case 'welovemanga.one':
      {
        if (!helper.querySelector('#listImgs, .chapter-content')) break;
        const getImgList = async () => {
          const imgList = helper.querySelectorAll('img.chapter-img:not(.ls-is-cached)').map(e => (e.dataset.src || e.dataset.srcset || e.dataset.original || e.src).trim()).filter(Boolean);
          if (imgList.length > 0 && imgList.every(url => !/loading.*\.gif/.test(url))) return imgList;
          await helper.sleep(500);
          return getImgList();
        };
        options = {
          name: 'welovemanga',
          getImgList,
          onNext: helper.querySelectorClick('.rd_top-right.next:not(.disabled)'),
          onPrev: helper.querySelectorClick('.rd_top-left.prev:not(.disabled)')
        };
        break;
      }

    // 为 pwa 版页面提供 api，以便翻译功能能正常运作
    // case 'localhost':
    case 'comic-read.pages.dev':
      {
        unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest;
        unsafeWindow.toast = main.toast;
        break;
      }
    default:
      {
        // #[Tachidesk](https://github.com/Suwayomi/Tachidesk-Sorayomi)
        if (document.querySelector(`head > meta[content="A manga reader that runs tachiyomi's extensions"]`)) {
          const jump = (mangaId, chapterId) => {
            window.location.pathname = `/manga/${mangaId}/chapter/${chapterId}`;
          };
          const getChapters = async (mangaId, chapterId) => {
            const res = await main.request('/api/graphql', {
              method: 'POST',
              data: JSON.stringify({
                operationName: 'GET_CHAPTERS',
                query: `query GET_CHAPTERS($mangaId: Int!, $chapterId: Int!) {
                chapters(condition: {
                  mangaId: $mangaId, sourceOrder: $chapterId}
                ) { nodes { pageCount } }
                manga(id: $mangaId) { chapters { totalCount } }
              }`,
                variables: {
                  mangaId,
                  chapterId
                }
              }),
              responseType: 'json'
            });
            // 可能因为 Tachidesk 是在点开指定话数后才去获取数据的
            // 所以如果有时候会拿不到数据需要等一下
            if (res.response.data.chapters.nodes[0].pageCount <= 0) {
              await helper.sleep(200);
              return getChapters(mangaId, chapterId);
            }
            return res.response.data;
          };
          options = {
            name: 'Tachidesk',
            SPA: {
              isMangaPage: () => /\/manga\/\d+\/chapter\/\d+/.test(window.location.pathname)
            },
            async getImgList({
              setManga
            }) {
              const [,, mangaId,, chapterId] = window.location.pathname.split('/').map(Number);
              const data = await getChapters(mangaId, chapterId);
              const {
                pageCount
              } = data.chapters.nodes[0];
              const chapterCount = data.manga.chapters.totalCount;
              setManga({
                onPrev: chapterId > 0 ? () => jump(mangaId, chapterId - 1) : undefined,
                onNext: chapterId < chapterCount ? () => jump(mangaId, chapterId + 1) : undefined
              });
              return helper.range(pageCount, i => `/api/v1/manga/${mangaId}/chapter/${chapterId}/page/${i}`);
            },
            // 跟随阅读进度滚动页面，避免确保能触发 Tachidesk 的进度记录
            onShowImgsChange: helper.debounce((showImgs, imgList) => {
              const lastImgUrl = imgList[[...showImgs].at(-1)].src;
              helper.querySelector(`img[src$="${lastImgUrl}"]`)?.scrollIntoView({
                behavior: 'instant',
                block: 'end'
              });
            }, 500)
          };
        } else {
          (async () => {
            if ((await GM.getValue(window.location.hostname)) !== undefined) return helper.requestIdleCallback(otherSite.otherSite);
            const menuId = await GM.registerMenuCommand(((lang) => {
switch (lang) {
  case 'en': return 'Enter simple reading mode';case 'ru': return 'Включить простой режим чтения';case 'ta': return 'எளிய வாசிப்பு பயன்முறையைப் பயன்படுத்தவும்';
  default: return '使用简易阅读模式';
}
})(await languages.getInitLang()), async () => !(await otherSite.otherSite()) && GM.unregisterMenuCommand(menuId));
          })();
        }
      }
  }
  if (options) main.universal(options);
} catch (error) {
  helper.log.error(error);
}