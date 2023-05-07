/*
* @author:@Sliverkiss
* @name:zippo会员中心
* @desc：参考cat-kun_qinglong-scripts/zippo.js改写适用于loon的签到脚本


【致谢】
本脚本使用了Chavy的Env.js，感谢！

⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
*/




const $ = new Env('zippo会员中心');

const env_name = 'zippoCookie';
const env = $.getdata(env_name);

//通知相关
var message="";

//脚本入口函数main()
async function main() {
    if (env == '') {
        //没有设置变量,直接退出
        $.msg($.name, "", `没有填写变量: ${env_name}`);
        return;
    }
    //多账号分割,这里默认是换行(\n)分割,其他情况自己实现
    //split('\n')会把字符串按照换行符分割, 并把结果存在user_ck数组里
    let user_ck = env.split('\n');

    let index = 1; //用来给账号标记序号, 从1开始
    //循环遍历每个账号
    for (let ck of user_ck) {
        if (!ck) continue; //跳过空行
        //默认用#分割openid和session_key, 前面是 openid 后面是 session_key
        let ck_info = ck.split('#');
        let openid = ck_info[0];
        let session_key = ck_info[1]; //其实session_key要不要都行, 这里为了教学就填上去
        //用一个对象代表账号, 里面存放账号信息
        let user = {
            index: index,
            openid, //简写法, 效果等同于 openid: openid,
            session_key: decodeURIComponent(session_key), //注意请求里的session_key是编码后的, 我们先解码一次
        };
        index = index + 1; //每次用完序号+1
        //开始账号任务
        await userTask(user);
        //查询用户状态
        await initmembers(user);
        //每个账号之间等1~5秒随机时间
        let rnd_time = Math.floor(Math.random() * 4000) + 1000;
        console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
        await $.wait(rnd_time);
    }
    //发送通知
    notify();
}

async function userTask(user) {
    //任务逻辑都放这里了, 与脚本入口分开, 方便分类控制并模块化
    console.log(`\n============= 账号[${user.index}]开始任务 =============`)
    message+=`\n============= 账号[${user.index}]开始任务 =============`;
    await ininttask(user);
    //后面可以自己加任务, 比如查看账户积分啥的
    //await chakanjifen(user);
    //await tom_niubi(user);
}

//任务列表
async function ininttask(user) {
    //user: 用户参数, 里面存放ck和账户信息啥的. 进阶可以用类(class)的方法的代替, 效率更高
    return new Promise((resolve) => {
        const signinRequest = {
            //签到任务调用签到接口
            url: "https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=ininttask",
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                //参数名字中间带-的需要用引号包起来, 不能直接写, 其他的可以省略引号
                'Accept-Encoding': 'gzip,compress,br,deflate', //这个一般来说不重要, 可以省却
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN', //简称UA
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            //请求体部分,注意get方法没有请求体
            //form对应application/x-www-form-urlencoded
            //json对应application/json
            //注意form会自动对内容进行编码, 不需要自己再手动编码
            body: toParams({
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid:'wxaa75ffd8c2d75da7',
            }),

            //超时设置, 超过15000毫秒自动停止请求
            timeout: 15000,
        };
        //post方法
        $.post(signinRequest, async (error, response, data) => {
            var body = response.body;
            var result = JSON.parse(body);
            //{"errcode":-6,"errmsg":"已签到","data":null}
            if (result?.errcode == 0) {
                //errcode==0的时候表示请求正常
                let tasklist = result?.data?.task || []; //取task数组,如果取不到就取空数组防止下面出错
                //遍历tasklist里面的元素, 也就是每个任务
                for (let task of tasklist) {
                    //判断不同任务类型做不同请求
                    switch (task.title) {
                        //签到任务调用签到接口
                        case '签到':
                            if (task.task_status == 0) {
                                //task_status是0的时候代表未签到,这时候才去签到
                                let rnd_time = Math.floor(Math.random() * 1000) + 1000;
                                console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
                                await $.wait(rnd_time); //随机等待
                                await signin(user);
                            } else {
                                message+=`\n账号[${user.index}]今天已签到`
                                console.log(`账号[${user.index}]今天已签到`);
                            }
                            break;
                        //其他任务调用通用任务接口
                        default:
                            if (task.task_status == 0) {
                                //task_status是0代表未完成
                                console.log(`账号[${user.index}]任务[${task.title}]未完成, 去做任务`);
                                let rnd_time = Math.floor(Math.random() * 1000) + 1000;
                                console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
                                await $.wait(rnd_time); //随机等待
                                await dotask(user, task, 1); //做任务
                                rnd_time = Math.floor(Math.random() * 1000) + 1000; //前面已经用过let定义rnd_time了,这里直接复用不要再let一次,不然会出错
                                console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
                                await $.wait(rnd_time); //随机等待
                                await dotask(user, task, 2); //领奖励
                            } else if (task.task_status == 1) {
                                //task_status是1代表已完成未领取奖励
                                console.log(`账号[${user.index}]任务[${task.title}]已完成, 未领取奖励, 去领取`);
                                let rnd_time = Math.floor(Math.random() * 1000) + 1000;
                                console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`);
                                await $.wait(rnd_time); //随机等待
                                await dotask(user, task, 2); //领奖励
                            } else {
                                //task_status是2代表已领取奖励
                                message+=`\n账号[${user.index}]任务[${task.title}]已领取奖励`
                                console.log(`账号[${user.index}]任务[${task.title}]已领取奖励`);
                            }
                            break;
                    }
                }
            } else {
                //打印请求错误信息
                console.log(result)
                console.log(`账号[${user.index}]请求任务列表出错[${result?.errcode}]: ${result?.errmsg}`);
            }
            resolve();
        });
    });
}
//签到接口
async function signin(user) {
    return new Promise((resolve) => {
        const signinRequest = {
            //签到任务调用签到接口
            url: "https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=signin",
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip,compress,br,deflate',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            body: toParams({
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid:'wxaa75ffd8c2d75da7',
            }),
        };
        //post方法
        $.post(signinRequest, (error, response, data) => {
            var body = response.body;
            var result = JSON.parse(body);
            //成功时返回{"error":0}
            if (result?.errcode == 0) {
                //obj.error是0代表完成
                message += `账号[${user.index}]签到成功`;
            } else {
                //打印请求错误信息
                $.log(response);
                //打印请求错误信息
                console.log(`账号[${user.index}]签到失败[${result?.errcode}]: ${result?.errmsg}`);
                $.msg($.name, "", "❌请重新登陆更新Cookie");
            }
            resolve();
        });
    });
}

//任务接口
async function dotask(user,task,acttype) {
    return new Promise((resolve) => {
        const signinRequest = {
            //签到任务调用签到接口
            url: "https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=dotask",
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip,compress,br,deflate',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            //请求体
            body: toParams({
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid:'wxaa75ffd8c2d75da7',
            }),
            //超时设置
            timeout: 15000,
        };
        //post方法
        $.post(signinRequest, (error, response, data) => {
            var body = response.body;
            var result = JSON.parse(body);
            //成功时返回{"error":0}
            if(result?.errcode==0) {
                message+=`\n账号[${user.index}]${str}[${task.title}]成功`
                console.log(`账号[${user.index}]${str}[${task.title}]成功`)
            } else {
                //打印请求错误信息
                message+=`\n账号[${user.index}]${str}[${task.title}]失败[${result?.errcode}]: ${result?.errmsg}`
                console.log(`账号[${user.index}]${str}[${task.title}]失败[${result?.errcode}]: ${result?.errmsg}`);
            }
            resolve();
        });
    });
}

//用户状态接口
async function initmembers(user){
    return new Promise((resolve) => {
        const signinRequest = {
            //签到任务调用签到接口
            url: "https://membercenter.zippo.com.cn/s2/interface/data.aspx?action=inintmembers",
            //请求头, 所有接口通用
            headers: {
                Connection: 'keep-alive',
                'Accept-Encoding': 'gzip,compress,br,deflate',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.32(0x1800202f) NetType/WIFI Language/zh_CN',
                Referer: 'https://servicewechat.com/wxaa75ffd8c2d75da7/56/page-frame.html',
            },
            //请求体
            body: toParams({
                openid: user.openid,
                session_key: user.session_key,
                unionid: '',
                appid:'wxaa75ffd8c2d75da7',
            }),
            //超时设置
            timeout: 15000,
        };
        //post方法
        $.post(signinRequest, (error, response, data) => {
            var body = response.body;
            var result = JSON.parse(body);
            var obj=result.data[0];
            var level="";
            switch(obj?.MemberLevel__c){
                case '1':
                    level="赤铜会员";
                    break;
                case '2':
                    level="焰银会员";
                    break;
                case '3':
                    level="烈金会员";
                    break;
                case '4':
                    level="火钻会员";
                    break;
                default:
                    level="游客";
                    break;
            }
            //成功时返回{"error":0}
            if(result?.errcode==0) {
                message+=`\n账号[${user.index}]${obj.Nick__c}\n拥有[${obj?.AvailablePoints__c}]火苗\n等级[${obj?.MemberLevel__c}]-${level}`;
                console.log(`账号[${user.index}]${obj.Nick__c}`)
                console.log(`拥有[${obj?.AvailablePoints__c}]火苗`)
                console.log(`等级[${obj?.MemberLevel__c}]-${level}`)
            } else {
                message+=`账号[${user.index}]状态信息查询失败[${result?.errcode}]: ${result?.errmsg}`
                //打印请求错误信息
                console.log(`账号[${user.index}]状态信息查询失败[${result?.errcode}]: ${result?.errmsg}`);
            }
            resolve();
        });
    });
}

//通知函数
async function notify(){
    $.msg($.name,"",message);
}


//调用main()
main();


/** --------------------------------辅助函数区域------------------------------------------- */

//把json 转为以 ‘&’ 连接的字符串
function toParams(body){
     var params = Object.keys(body).map(function (key) {
        return encodeURIComponent(key) + "=" +  encodeURIComponent(body[key]);
    }).join("&");
    return params;
}


/** ---------------------------------固定不动区域----------------------------------------- */

//From chavyleung's Env.js
function Env(name, opts) {
    class Http {
        constructor(env) {
            this.env = env;
        }

        send(opts, method = "GET") {
            opts = typeof opts === "string" ? { url: opts } : opts;
            let sender = this.get;
            if (method === "POST") {
                sender = this.post;
            }
            return new Promise((resolve, reject) => {
                sender.call(this, opts, (err, resp, body) => {
                    if (err) reject(err);
                    else resolve(resp);
                });
            });
        }

        get(opts) {
            return this.send.call(this.env, opts);
        }

        post(opts) {
            return this.send.call(this.env, opts, "POST");
        }
    }

    return new (class {
        constructor(name, opts) {
            this.name = name;
            this.http = new Http(this);
            this.data = null;
            this.dataFile = "box.dat";
            this.logs = [];
            this.isMute = false;
            this.isNeedRewrite = false;
            this.logSeparator = "\n";
            this.startTime = new Date().getTime();
            Object.assign(this, opts);
            this.log("", `🔔${this.name}, 开始!`);
        }

        isNode() {
            return "undefined" !== typeof module && !!module.exports;
        }

        isQuanX() {
            return "undefined" !== typeof $task;
        }

        isSurge() {
            return "undefined" !== typeof $httpClient && "undefined" === typeof $loon;
        }

        isLoon() {
            return "undefined" !== typeof $loon;
        }

        toObj(str, defaultValue = null) {
            try {
                return JSON.parse(str);
            } catch {
                return defaultValue;
            }
        }

        toStr(obj, defaultValue = null) {
            try {
                return JSON.stringify(obj);
            } catch {
                return defaultValue;
            }
        }

        getjson(key, defaultValue) {
            let json = defaultValue;
            const val = this.getdata(key);
            if (val) {
                try {
                    json = JSON.parse(this.getdata(key));
                } catch { }
            }
            return json;
        }

        setjson(val, key) {
            try {
                return this.setdata(JSON.stringify(val), key);
            } catch {
                return false;
            }
        }

        getScript(url) {
            return new Promise((resolve) => {
                this.get({ url }, (err, resp, body) => resolve(body));
            });
        }

        runScript(script, runOpts) {
            return new Promise((resolve) => {
                let httpapi = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                httpapi = httpapi ? httpapi.replace(/\n/g, "").trim() : httpapi;
                let httpapi_timeout = this.getdata(
                    "@chavy_boxjs_userCfgs.httpapi_timeout"
                );
                httpapi_timeout = httpapi_timeout ? httpapi_timeout * 1 : 20;
                httpapi_timeout =
                    runOpts && runOpts.timeout ? runOpts.timeout : httpapi_timeout;
                const [key, addr] = httpapi.split("@");
                const opts = {
                    url: `http://${addr}/v1/scripting/evaluate`,
                    body: {
                        script_text: script,
                        mock_type: "cron",
                        timeout: httpapi_timeout,
                    },
                    headers: { "X-Key": key, Accept: "*/*" },
                };
                this.post(opts, (err, resp, body) => resolve(body));
            }).catch((e) => this.logErr(e));
        }

        loaddata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs");
                this.path = this.path ? this.path : require("path");
                const curDirDataFilePath = this.path.resolve(this.dataFile);
                const rootDirDataFilePath = this.path.resolve(
                    process.cwd(),
                    this.dataFile
                );
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
                const isRootDirDataFile =
                    !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
                if (isCurDirDataFile || isRootDirDataFile) {
                    const datPath = isCurDirDataFile
                        ? curDirDataFilePath
                        : rootDirDataFilePath;
                    try {
                        return JSON.parse(this.fs.readFileSync(datPath));
                    } catch (e) {
                        return {};
                    }
                } else return {};
            } else return {};
        }

        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs");
                this.path = this.path ? this.path : require("path");
                const curDirDataFilePath = this.path.resolve(this.dataFile);
                const rootDirDataFilePath = this.path.resolve(
                    process.cwd(),
                    this.dataFile
                );
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
                const isRootDirDataFile =
                    !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
                const jsondata = JSON.stringify(this.data);
                if (isCurDirDataFile) {
                    this.fs.writeFileSync(curDirDataFilePath, jsondata);
                } else if (isRootDirDataFile) {
                    this.fs.writeFileSync(rootDirDataFilePath, jsondata);
                } else {
                    this.fs.writeFileSync(curDirDataFilePath, jsondata);
                }
            }
        }

        lodash_get(source, path, defaultValue = undefined) {
            const paths = path.replace(/\[(\d+)\]/g, ".$1").split(".");
            let result = source;
            for (const p of paths) {
                result = Object(result)[p];
                if (result === undefined) {
                    return defaultValue;
                }
            }
            return result;
        }

        lodash_set(obj, path, value) {
            if (Object(obj) !== obj) return obj;
            if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
            path
                .slice(0, -1)
                .reduce(
                    (a, c, i) =>
                        Object(a[c]) === a[c]
                            ? a[c]
                            : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
                    obj
                )[path[path.length - 1]] = value;
            return obj;
        }

        getdata(key) {
            let val = this.getval(key);
            // 如果以 @
            if (/^@/.test(key)) {
                const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
                const objval = objkey ? this.getval(objkey) : "";
                if (objval) {
                    try {
                        const objedval = JSON.parse(objval);
                        val = objedval ? this.lodash_get(objedval, paths, "") : val;
                    } catch (e) {
                        val = "";
                    }
                }
            }
            return val;
        }

        setdata(val, key) {
            let issuc = false;
            if (/^@/.test(key)) {
                const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
                const objdat = this.getval(objkey);
                const objval = objkey
                    ? objdat === "null"
                        ? null
                        : objdat || "{}"
                    : "{}";
                try {
                    const objedval = JSON.parse(objval);
                    this.lodash_set(objedval, paths, val);
                    issuc = this.setval(JSON.stringify(objedval), objkey);
                } catch (e) {
                    const objedval = {};
                    this.lodash_set(objedval, paths, val);
                    issuc = this.setval(JSON.stringify(objedval), objkey);
                }
            } else {
                issuc = this.setval(val, key);
            }
            return issuc;
        }

        getval(key) {
            if (this.isSurge() || this.isLoon()) {
                return $persistentStore.read(key);
            } else if (this.isQuanX()) {
                return $prefs.valueForKey(key);
            } else if (this.isNode()) {
                this.data = this.loaddata();
                return this.data[key];
            } else {
                return (this.data && this.data[key]) || null;
            }
        }

        setval(val, key) {
            if (this.isSurge() || this.isLoon()) {
                return $persistentStore.write(val, key);
            } else if (this.isQuanX()) {
                return $prefs.setValueForKey(val, key);
            } else if (this.isNode()) {
                this.data = this.loaddata();
                this.data[key] = val;
                this.writedata();
                return true;
            } else {
                return (this.data && this.data[key]) || null;
            }
        }

        initGotEnv(opts) {
            this.got = this.got ? this.got : require("got");
            this.cktough = this.cktough ? this.cktough : require("tough-cookie");
            this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar();
            if (opts) {
                opts.headers = opts.headers ? opts.headers : {};
                if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
                    opts.cookieJar = this.ckjar;
                }
            }
        }

        get(opts, callback = () => { }) {
            if (opts.headers) {
                delete opts.headers["Content-Type"];
                delete opts.headers["Content-Length"];
            }
            if (this.isSurge() || this.isLoon()) {
                if (this.isSurge() && this.isNeedRewrite) {
                    opts.headers = opts.headers || {};
                    Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
                }
                $httpClient.get(opts, (err, resp, body) => {
                    if (!err && resp) {
                        resp.body = body;
                        resp.statusCode = resp.status;
                    }
                    callback(err, resp, body);
                });
            } else if (this.isQuanX()) {
                if (this.isNeedRewrite) {
                    opts.opts = opts.opts || {};
                    Object.assign(opts.opts, { hints: false });
                }
                $task.fetch(opts).then(
                    (resp) => {
                        const { statusCode: status, statusCode, headers, body } = resp;
                        callback(null, { status, statusCode, headers, body }, body);
                    },
                    (err) => callback(err)
                );
            } else if (this.isNode()) {
                this.initGotEnv(opts);
                this.got(opts)
                    .on("redirect", (resp, nextOpts) => {
                        try {
                            if (resp.headers["set-cookie"]) {
                                const ck = resp.headers["set-cookie"]
                                    .map(this.cktough.Cookie.parse)
                                    .toString();
                                if (ck) {
                                    this.ckjar.setCookieSync(ck, null);
                                }
                                nextOpts.cookieJar = this.ckjar;
                            }
                        } catch (e) {
                            this.logErr(e);
                        }
                        // this.ckjar.setCookieSync(resp.headers['set-cookie'].map(Cookie.parse).toString())
                    })
                    .then(
                        (resp) => {
                            const { statusCode: status, statusCode, headers, body } = resp;
                            callback(null, { status, statusCode, headers, body }, body);
                        },
                        (err) => {
                            const { message: error, response: resp } = err;
                            callback(error, resp, resp && resp.body);
                        }
                    );
            }
        }

        post(opts, callback = () => { }) {
            // 如果指定了请求体, 但没指定`Content-Type`, 则自动生成
            if (opts.body && opts.headers && !opts.headers["Content-Type"]) {
                opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
            }
            if (opts.headers) delete opts.headers["Content-Length"];
            if (this.isSurge() || this.isLoon()) {
                if (this.isSurge() && this.isNeedRewrite) {
                    opts.headers = opts.headers || {};
                    Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
                }
                $httpClient.post(opts, (err, resp, body) => {
                    if (!err && resp) {
                        resp.body = body;
                        resp.statusCode = resp.status;
                    }
                    callback(err, resp, body);
                });
            } else if (this.isQuanX()) {
                opts.method = "POST";
                if (this.isNeedRewrite) {
                    opts.opts = opts.opts || {};
                    Object.assign(opts.opts, { hints: false });
                }
                $task.fetch(opts).then(
                    (resp) => {
                        const { statusCode: status, statusCode, headers, body } = resp;
                        callback(null, { status, statusCode, headers, body }, body);
                    },
                    (err) => callback(err)
                );
            } else if (this.isNode()) {
                this.initGotEnv(opts);
                const { url, ..._opts } = opts;
                this.got.post(url, _opts).then(
                    (resp) => {
                        const { statusCode: status, statusCode, headers, body } = resp;
                        callback(null, { status, statusCode, headers, body }, body);
                    },
                    (err) => {
                        const { message: error, response: resp } = err;
                        callback(error, resp, resp && resp.body);
                    }
                );
            }
        }
        /**
         *
         * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
         *    :$.time('yyyyMMddHHmmssS')
         *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
         *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
         * @param {string} fmt 格式化参数
         * @param {number} 可选: 根据指定时间戳返回格式化日期
         *
         */
        time(fmt, ts = null) {
            const date = ts ? new Date(ts) : new Date();
            let o = {
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "H+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds(),
                "q+": Math.floor((date.getMonth() + 3) / 3),
                S: date.getMilliseconds(),
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(
                    RegExp.$1,
                    (date.getFullYear() + "").substr(4 - RegExp.$1.length)
                );
            for (let k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(
                        RegExp.$1,
                        RegExp.$1.length == 1
                            ? o[k]
                            : ("00" + o[k]).substr(("" + o[k]).length)
                    );
            return fmt;
        }

        /**
         * 系统通知
         *
         * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
         *
         * 示例:
         * $.msg(title, subt, desc, 'twitter://')
         * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
         * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
         *
         * @param {*} title 标题
         * @param {*} subt 副标题
         * @param {*} desc 通知详情
         * @param {*} opts 通知参数
         *
         */
        msg(title = name, subt = "", desc = "", opts) {
            const toEnvOpts = (rawopts) => {
                if (!rawopts) return rawopts;
                if (typeof rawopts === "string") {
                    if (this.isLoon()) return rawopts;
                    else if (this.isQuanX()) return { "open-url": rawopts };
                    else if (this.isSurge()) return { url: rawopts };
                    else return undefined;
                } else if (typeof rawopts === "object") {
                    if (this.isLoon()) {
                        let openUrl = rawopts.openUrl || rawopts.url || rawopts["open-url"];
                        let mediaUrl = rawopts.mediaUrl || rawopts["media-url"];
                        return { openUrl, mediaUrl };
                    } else if (this.isQuanX()) {
                        let openUrl = rawopts["open-url"] || rawopts.url || rawopts.openUrl;
                        let mediaUrl = rawopts["media-url"] || rawopts.mediaUrl;
                        return { "open-url": openUrl, "media-url": mediaUrl };
                    } else if (this.isSurge()) {
                        let openUrl = rawopts.url || rawopts.openUrl || rawopts["open-url"];
                        return { url: openUrl };
                    }
                } else {
                    return undefined;
                }
            };
            if (!this.isMute) {
                if (this.isSurge() || this.isLoon()) {
                    $notification.post(title, subt, desc, toEnvOpts(opts));
                } else if (this.isQuanX()) {
                    $notify(title, subt, desc, toEnvOpts(opts));
                }
            }
            if (!this.isMuteLog) {
                let logs = ["", "==============📣系统通知📣=============="];
                logs.push(title);
                subt ? logs.push(subt) : "";
                desc ? logs.push(desc) : "";
                console.log(logs.join("\n"));
                this.logs = this.logs.concat(logs);
            }
        }

        log(...logs) {
            if (logs.length > 0) {
                this.logs = [...this.logs, ...logs];
            }
            console.log(logs.join(this.logSeparator));
        }

        logErr(err, msg) {
            const isPrintSack = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            if (!isPrintSack) {
                this.log("", `❗️${this.name}, 错误!`, err);
            } else {
                this.log("", `❗️${this.name}, 错误!`, err.stack);
            }
        }

        wait(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }

        done(val = {}) {
            const endTime = new Date().getTime();
            const costTime = (endTime - this.startTime) / 1000;
            this.log("", `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
            this.log();
            if (this.isSurge() || this.isQuanX() || this.isLoon()) {
                $done(val);
            }
        }
    })(name, opts);
}