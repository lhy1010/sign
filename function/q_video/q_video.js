/****
 *
 * @description 腾讯视频好莱坞会员V力值签到，手机签到和领取任务及奖励。
 * @author BlueSkyClouds
 * @create_at 2022-11-30
 */

const $ = new Env('腾讯视频会员签到');
const notify = $.isNode() ? require('../sendNotify') : '';
let ref_url = ''
let _cookie = 'iip=0; pgv_pvid=7694131803; tvfe_boss_uuid=c0741ed6cbe5478e; video_platform=2; eas_sid=y1o6e6q0J5K4i4N4q9j417o0D7; LW_uid=v1a6W6n0v5x4V5C10511f7R3n7; RK=Ha9xZNUATK; ptcz=e09a751abe932412123e08d6d2ee9aa468e843de2b5e6712bbb9e9af315f8ec6; LW_sid=K1y6M6X045L4v5L2q1g0k9q1l3; uin_cookie=o0760448538; ied_qq=o0760448538; o_cookie=760448538; pac_uid=1_760448538; video_platform=2; pgv_info=ssid=s2427564780; _qpsvr_localtk=0.10188985169817366; ptui_loginuin=315808225; main_login=qq; vqq_access_token=48DBA078D06F84E13CD8B7A1A725EA88; vqq_appid=101483052; vqq_openid=97B3660797C9A5F7A4E29D6AF8AE4195; vqq_vuserid=943983936; vqq_vusession=8RmAxJ7Yxr-luDXgfrliYw.N; vqq_refresh_token=0E09B280FAA08B390102C8F0B8DD06AA; login_time_init=2022-12-26 11:10:4; video_guid=6844b0e2784e689d; vqq_next_refresh_time=6596; vqq_login_time_init=1672024205; login_time_last=2022-12-26 11:10:8'
const SEND_KEY = process.env.SEND_KEY
const auth = getAuth()
const axios = require('axios')
const UTC8 = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
let notice = timeFormat(UTC8) + "\n"

let headers = {
    'Referer': 'https://v.qq.com',
    'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BLA-AL00 Build/HUAWEIBLA-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/8.9 Mobile Safari/537.36',
    'Cookie': _cookie
}
/**
 * @description 拼接REF_URL
 */
process.env.V_REF_URL = 'https://access.video.qq.com/user/auth_refresh?vappid=11059694&vsecret=fdf61a6be0aad57132bc5cdf78ac30145b6cd2c1470b0cfe&type=qq&g_tk=&g_vstk=2098001187&g_actk=1935410555&raw=1'
if (process.env.V_REF_URL) {
    if (process.env.V_REF_URL.indexOf('https://access.video.qq.com/user/auth_refresh') > -1) {
        ref_url = process.env.V_REF_URL
    } else {
        console.log("V_REF_URL值填写错误 取消运行")
    }
    //验证V_REF_URL和cookie是否填写正确
    ref_url_ver()
} else {
    //无意义输出方便调试
    console.log("V_REF_URL值未填写 取消运行")
    //ref_url_ver()
}

/**
 * @description 封装一个解析setCookie的方法
 * @returns obj
 * @param c_list
 */
function parseSet(c_list) {
    let obj = {}
    c_list.map(t => {
        const obj = {}
        t.split(', ')[0].split(';').forEach(item => {
            const [key, val] = item.split('=')
            obj[key] = val
        })
        return obj
    }).forEach(t => obj = { ...obj, ...t })
    return obj
}

/**
 * @description 获取有效的cookie参数
 * @param {*} [c=_cookie]
 * @returns obj
 */
function getAuth(c = _cookie) {
    let needParams = [""]
    //适配微信登录
    if (_cookie) {
        if (_cookie.includes("main_login=wx")) {
            needParams = ["tvfe_boss_uuid", "video_guid", "video_platform", "pgv_pvid", "pgv_info", "pgv_pvi", "_qpsvr_localtk", "RK", "ptcz", "ptui_loginuin", "main_login", "access_token", "appid", "openid", "vuserid", "vusession"]
        } else if (_cookie.includes("main_login=qq")) {
            needParams = ["tvfe_boss_uuid", "video_guid", "video_platform", "pgv_pvid", "pgv_info", "pgv_pvi", "_qpsvr_localtk", "RK", "ptcz", "ptui_loginuin", "main_login", "vqq_access_token", "vqq_appid", "vqq_openid", "vqq_vuserid", "vqq_vusession"]
        } else {
            console.log("getAuth - 无法提取有效cookie参数")
        }
    }
    const obj = {}
    if (c) {
        c.split('; ').forEach(t => {
            const [key, val] = t.split(/\=(.*)$/, 2)
            needParams.indexOf(key) !== -1 && (obj[key] = val)
        })
    }
    return obj
}

/**
 * @description 刷新每天更新cookie参数
 * @returns
 */
function refCookie(url = ref_url) {
    return new Promise((resovle, reject) => {
        axios({ url, headers }).then(e => {
            const { vusession } = parseSet(e.headers['set-cookie'])
            const { vqq_vusession } = parseSet(e.headers['set-cookie'])
            const { access_token } = parseSet(e.headers['set-cookie'])
            //微信多一个access_token
            if (vusession) {
                auth['vusession'] = vusession
                auth['access_token'] = access_token
            } else {
                auth['vqq_vusession'] = vqq_vusession
            }
            // 刷新cookie后去签到
            resovle({
                ...headers, Cookie: Object.keys(auth).map(i => i + '=' + auth[i]).join('; ').replace("video_platform=2", "video_platform=3"),
                'Referer': 'https://film.video.qq.com/'
            })
        }).catch(reject)
    })
}

/**
 * @description 验证ref_url是否正确
 */
function ref_url_ver(url = ref_url, _cookie) {
    $.get({
        url, headers
    }, function (error, response, data) {
        if (error) {
            $.log(error);
            console.log("腾讯视频会员签到", "验证ref_url请求失败 ‼️‼️", error)
        } else {
            if (data.match(/nick/)) { //通过验证获取QQ昵称参数来判断是否正确
                console.log("验证成功，执行主程序")
                exports.main()
            } else {
                console.log("验证ref_url失败,无法获取个人资料 ref_url或Cookie失效 ‼️‼️")
                notify.sendNotify("腾讯视频会员签到", '验证ref_url失败,无法获取个人资料 ref_url或Cookie失效 ‼️‼️');
            }
        }
    })
}

// 手机端签到
function txVideoSignIn(headers) {
    $.get({
        url: `https://vip.video.qq.com/rpc/trpc.new_task_system.task_system.TaskSystem/CheckIn?rpc_data=%7B%7D`, headers
    }, function (error, response, data) {
        if (error) {
            $.log(error);
            console.log("腾讯视频会员签到", "签到请求失败 ‼️‼️", error)
        } else {
            if (data != null) {
                let jsonParsed, code, check_in_score;
                jsonParsed = JSON.parse(data);
                code = jsonParsed.ret;
                check_in_score = jsonParsed.check_in_score;
                if (code === 0 && check_in_score != undefined) {
                    notice += "腾讯视频会员手机端签到成功：签到分数：" + check_in_score + "分 🎉" + "\n"
                    console.log("腾讯视频会员手机端签到成功：签到分数：" + check_in_score + "分 🎉")
                } else if (code === -2002) {
                    console.log("腾讯视频会员手机端签到失败：重复签到 ‼️‼️")
                    notice += "腾讯视频会员手机端签到失败：重复签到 ‼️‼️" + "\n"
                } else if (code === -2007) {
                    notice += "腾讯视频会员签到：非会员无法签到"
                    console.log("腾讯视频会员签到：非会员无法签到")
                } else {
                    console.log("腾讯视频会员手机端签到失败：未知错误请查看控制台输出 ‼️‼️\n" + data)
                    notice += "腾讯视频会员手机端签到失败：未知错误请查看控制台输出 ‼️‼️" + "\n" + data
                }

            } else {
                notice += "腾讯视频会员签到：签到失败-Cookie失效 ‼️‼️" + "\n"
                console.log("腾讯视频会员签到：签到失败, Cookie失效 ‼️‼️")
            }
        }
    })
}

//观看60分钟任务签到请求
function txVideoDownTasks(headers) {
    $.get({
        url: `https://vip.video.qq.com/rpc/trpc.new_task_system.task_system.TaskSystem/ProvideAward?rpc_data=%7B%22task_id%22:1%7D`, headers
    }, function (error, response, data) {
        if (error) {
            $.log(error);
            console.log("腾讯视频会员签到", "观看任务签到请求 ‼️‼️", error)
        } else {
            if (data != null) {
                let jsonParsed, code, provide_value;
                jsonParsed = JSON.parse(data);
                code = jsonParsed.ret;
                provide_value = jsonParsed.provide_value;
                if (code === 0 && provide_value != 0) {
                    notice += "腾讯视频会员观看任务签到成功：签到分数：" + provide_value + "分 🎉" + "\n"
                    console.log("腾讯视频会员观看任务签到成功：签到分数：" + provide_value + "分 🎉")
                } else if (code === -2003) {
                    console.log("腾讯视频会员观看任务签到失败：任务未完成或重复领取 ‼️‼️")
                    notice += "腾讯视频会员观看任务签到失败：任务未完成或重复领取 ‼️‼️" + "\n"
                } else if (code === -2007) {
                    notice += "腾讯视频会员签到：非会员无法签到"
                    console.log("腾讯视频会员签到：非会员无法签到")
                } else {
                    console.log("腾讯视频会员观看任务签到成功：未知错误请查看控制台输出 ‼️‼️\n" + data)
                    notice += "腾讯视频会员观看任务签到成功：未知错误请查看控制台输出 ‼️‼️" + "\n" + data
                }
            } else {
                notice += "腾讯视频会员签到：签到失败-Cookie失效 或 脚本待更新 ‼️‼️" + "\n"
                console.log("腾讯视频会员签到：签到失败, Cookie失效 或 脚本待更新 ‼️‼️")
            }
        }
    })
}

//推送
function sendNotify() {
    //判断是否为Cookie失效时才提醒
    if (SEND_KEY) {
        if (notice.includes("Cookie失效")) {
            notify.sendNotify("腾讯视频会员签到", notice)
            //console.log("腾讯视频会员签到" + notice)
        }
    } else {
        notify.sendNotify("腾讯视频会员签到", notice)
        //console.log("腾讯视频会员签到" + notice )
    }
}

//主程序入口
exports.main = () => new Promise(
    (resovle, reject) => refCookie()
        .then(params => Promise.all([
            txVideoSignIn(params),
            setTimeout(() => { txVideoDownTasks(params) }, 5000),
            setTimeout(() => { sendNotify() }, 10000)
        ])
            .then(e => resovle())
            .catch(e => reject())
        ).catch(e => {
            console.log(e)
        })
)

function timeFormat(time) {
    let date;
    if (time) {
        date = new Date(time)
    } else {
        date = new Date();
    }
    return date.getFullYear() + '年' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '月' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate()) + '日';
}
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: i, ...r } = t; this.got[s](i, r).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
