// ==UserScript==
// @name         VDI Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  VDI Web Client Auto Login
// @author       KuoAnn
// @match        https://vdizone1/portal/webclient/index.html*
// @match        https://cubvdi.cathaybk.com.tw/portal/webclient/index.html*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=cloud.vmwarehorizon.com
// @downloadURL  https://github.com/KuoAnn/TamperScripts/raw/main/src/VDIAutoLogin.user.js
// @updateURL    https://github.com/KuoAnn/TamperScripts/raw/main/src/VDIAutoLogin.user.js
// @grant        none
// ==/UserScript==
const usr = "";
const pwd = "";
const pin = "0000";
const secret = "1234567890123456";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

(function () {
    if (usr === "" || pwd === "") {
        alert("請設定帳密");
    }

    let params = new URLSearchParams(window.location.search);
    let goto = params.get("goto");
    console.log(`goto=${goto}`);

    autoLogin(goto);

    async function autoLogin(goto) {
        try {
            let count = 0;
            while (count++ <= 20) {
                const eleSecUserName = document.getElementById("securUsername");
                if (eleSecUserName) {
                    console.log("input #securUsername=" + usr);
                    eleSecUserName.focus();
                    eleSecUserName.value = usr;
                    eleSecUserName.blur();
                    const elePassCode = document.getElementById("passcode");
                    if (elePassCode) {
                        const otp = md5(Math.floor(new Date().getTime() / 10000) + secret + pin).substr(0, 6);
                        console.log("input #passcode=" + otp);
                        inputNgText(elePassCode, otp);
                    }
                    console.log("login layer1");
                    await delay(200);
                    document.getElementById("securLoginButton").click();
                }

                const elePassword = document.getElementById("password");
                if (elePassword) {
                    console.log("input #password=" + pwd);
                    inputNgText(elePassword, pwd);
                    console.log("login layer2");
                    await delay(200);
                    document.getElementById("loginButton").click();
                }

                if (goto) {
                    console.log("try jump");
                    const ele = document.querySelector(`div[title=${goto}]`);
                    if (ele) {
                        await delay(200);
                        ele.click();
                        break;
                    }
                }
                await delay(500);
            }
        } catch (e) {
            console.error(e);
        }
    }
})();

const inputNgText = function (ele, text) {
    ele.focus();
    ele.value = text;
    ele.blur();
    ele.dispatchEvent(new Event("input", { bubbles: true }));
};

const md5 = new (function () {
    var l = "length",
        h = ["0123456789abcdef", 0x0f, 0x80, 0xffff, 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476],
        x = [
            [0, 1, [7, 12, 17, 22]],
            [1, 5, [5, 9, 14, 20]],
            [5, 3, [4, 11, 16, 23]],
            [0, 7, [6, 10, 15, 21]],
        ],
        A = function (x, y, z) {
            return (((x >> 16) + (y >> 16) + ((z = (x & h[3]) + (y & h[3])) >> 16)) << 16) | (z & h[3]);
        },
        B = function (s) {
            var n = ((s[l] + 8) >> 6) + 1,
                b = new Array(1 + n * 16).join("0").split("");
            for (var i = 0; i < s[l]; i++) b[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
            return (b[i >> 2] |= h[2] << ((i % 4) * 8)), (b[n * 16 - 2] = s[l] * 8), b;
        },
        R = function (n, c) {
            return (n << c) | (n >>> (32 - c));
        },
        C = function (q, a, b, x, s, t) {
            return A(R(A(A(a, q), A(x, t)), s), b);
        },
        F = function (a, b, c, d, x, s, t) {
            return C((b & c) | (~b & d), a, b, x, s, t);
        },
        G = function (a, b, c, d, x, s, t) {
            return C((b & d) | (c & ~d), a, b, x, s, t);
        },
        H = function (a, b, c, d, x, s, t) {
            return C(b ^ c ^ d, a, b, x, s, t);
        },
        I = function (a, b, c, d, x, s, t) {
            return C(c ^ (b | ~d), a, b, x, s, t);
        },
        _ = [F, G, H, I],
        S = (function () {
            with (Math) for (var i = 0, a = [], x = pow(2, 32); i < 64; a[i] = floor(abs(sin(++i)) * x));
            return a;
        })(),
        X = function (n) {
            for (var j = 0, s = ""; j < 4; j++) s += h[0].charAt((n >> (j * 8 + 4)) & h[1]) + h[0].charAt((n >> (j * 8)) & h[1]);
            return s;
        };
    return function (s) {
        var $ = B("" + s),
            a = [0, 1, 2, 3],
            b = [0, 3, 2, 1],
            v = [h[4], h[5], h[6], h[7]];
        for (var i, j, k, N = 0, J = 0, o = [].concat(v); N < $[l]; N += 16, o = [].concat(v), J = 0) {
            for (i = 0; i < 4; i++)
                for (j = 0; j < 4; j++)
                    for (k = 0; k < 4; k++, a.unshift(a.pop()))
                        v[b[k]] = _[i](v[a[0]], v[a[1]], v[a[2]], v[a[3]], $[N + (((j * 4 + k) * x[i][1] + x[i][0]) % 16)], x[i][2][k], S[J++]);
            for (i = 0; i < 4; i++) v[i] = A(v[i], o[i]);
        }
        return X(v[0]) + X(v[1]) + X(v[2]) + X(v[3]);
    };
})();
