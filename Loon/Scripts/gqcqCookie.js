/*
 * @name 广汽传祺获取Cookie
 * @version v1.0.1
 * @description 摆脱手动抓cookie，自动获取广汽传祺token
 * @author sliverkiss
 * @homepage https://github.com/Sliverkiss/helloworld
 * @thanks Pwnint32,一些loon脚本编写参考
 * @license MIT
 */

//通知相关
function getCookie(){
    const Headers= $request.headers;
    const token=Headers.token;
    console.log("捕获到的token如下"+token);
    $notification.post('广汽传祺', '获取Cookie成功', token);
    $persistentStore.write(token, 'gqcq_data');
}
getCookie();

