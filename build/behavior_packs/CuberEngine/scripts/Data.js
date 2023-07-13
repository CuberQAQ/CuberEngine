// Data for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 3.0.0
// Copyright CuberQAQ. All rights reserved.
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";
import { tellErrorMessage } from "./utils";
import { system } from "@minecraft/server";
const moduleName = "Data";
const moduleVersion = "0.1.1";
var data = null;
var permissionList = null;
var backupInfo = {};
function initData() {
    reloadData();
    reloadPermission();
    reloadBackupInfo();
    return { moduleName, moduleVersion };
}
function reloadData() {
    console.log("[CuberEngine] Reload Data...");
    let req = new HttpRequest("http://localhost:25641/data.json");
    req.setMethod(HttpRequestMethod.Get);
    req.addHeader("reload", "true");
    req.setTimeout(60);
    http.request(req).then((res) => {
        if (res.status == 200) {
            console.log("[CuberEngine] HTTP Get Data Succeeded.");
            // tellSuccessMessage(moduleName, "HTTP Get Data Succeeded. [" + res.status + "]");
            data = JSON.parse(decodeURIComponent(res.body));
        }
        else {
            console.error("[CuberEngine] HTTP Get Data Failed.");
            tellErrorMessage(moduleName, "HTTP Get Data Failed. [" + res.status + "]");
        }
    }, (res) => {
        console.error("[CuberEngine] HTTP Get Data Failed.");
        tellErrorMessage(moduleName, "HTTP GET Data Failed. [NULL] " + res);
    });
}
function reloadPermission() {
    console.log("[CuberEngine] Reload Permission List...");
    let req = new HttpRequest("http://localhost:25641/permission.json");
    req.setMethod(HttpRequestMethod.Get);
    req.addHeader("reload", "true");
    req.setTimeout(60);
    http.request(req).then((res) => {
        if (res.status == 200) {
            console.log("[CuberEngine] HTTP Get Permission List Succeeded.");
            // tellSuccessMessage(moduleName, "HTTP Get Data Succeeded. [" + res.status + "]");
            permissionList = JSON.parse(decodeURIComponent(res.body));
        }
        else {
            console.error("[CuberEngine] HTTP Get Permission List Failed.");
            tellErrorMessage(moduleName, "HTTP Get Permission List Failed. [" + res.status + "]");
        }
    }, (res) => {
        console.error("[CuberEngine] HTTP Get Permission List Failed.");
        tellErrorMessage(moduleName, "HTTP Get Permission List Failed. [NULL] " + res);
    });
}
function reloadBackupInfo() {
    console.log("[CuberEngine] Reload Backup Info...");
    let req = new HttpRequest("http://localhost:25641/backup/info.json");
    req.setMethod(HttpRequestMethod.Get);
    //req.addHeader("reload", "true");
    req.setTimeout(60);
    http.request(req).then((res) => {
        if (res.status == 200) {
            console.log("[CuberEngine] HTTP Get Data Succeeded.");
            // tellSuccessMessage(moduleName, "HTTP Get Data Succeeded. [" + res.status + "]");
            backupInfo = JSON.parse(decodeURIComponent(res.body));
        }
        else {
            console.error("[CuberEngine] HTTP Get BackupInfo Failed.");
            tellErrorMessage(moduleName, "HTTP Get BackupInfo Failed. [" + res.status + "]");
        }
    }, (res) => {
        console.error("[CuberEngine] HTTP Get BackupInfo Failed.");
        tellErrorMessage(moduleName, "HTTP GET BackupInfo Failed. [NULL] " + res);
    });
}
function backup(info, append) {
    let require = new HttpRequest("http://127.0.0.1:25641/backup");
    require.setMethod(HttpRequestMethod.Post);
    require.addHeader("key", "31415926535897932384626");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    //require.addHeader("cookie", encodeURIComponent(JSON.stringify(data)));
    require.setBody(JSON.stringify(info));
    // require.setBody(encodeURIComponent(JSON.stringify(data)));
    require.setTimeout(60);
    return http.request(require).then(
    // success
    (response) => {
        if (response.status == 200) {
            return [true, response.body];
            // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
        }
        else
            tellErrorMessage(moduleName, "HTTP Create Backup Failed [" + response.status + "]");
        return [false, response.body];
    }, 
    // fail
    (response) => {
        tellErrorMessage(moduleName, "HTTP Create Backup Failed [PROMIST_FAILURE]");
        return [false, "外部备份接口连接失败"];
    });
}
function sudo(command, append) {
    system.run(() => {
        var require = new HttpRequest("http://127.0.0.1:25641/sudo");
        require.setMethod(HttpRequestMethod.Post);
        require.addHeader("key", "31415926535897932384626");
        if (append)
            require.addHeader("append", append);
        require.addHeader("Content-Type", "application/json; charset=utf-8");
        //require.addHeader("cookie", encodeURIComponent(JSON.stringify(data)));
        require.setBody(JSON.stringify({ command }));
        // require.setBody(encodeURIComponent(JSON.stringify(data)));
        require.setTimeout(60);
        // require.setBody(encodeURIComponent(JSON.stringify(data)));
        return http.request(require).then(
        // success
        (response) => {
            if (response.status == 200) {
                return [true, response.body];
                // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
            }
            else
                tellErrorMessage(moduleName, "HTTP Remote Command Failed [" + response.status + "]");
            return [false, response.body];
        }, 
        // fail
        (response) => {
            tellErrorMessage(moduleName, "HTTP Remote Command Failed [PROMIST_FAILURE]");
            return [false, "外部接口连接失败"];
        });
    });
}
function restore(path, append) {
    let require = new HttpRequest("http://127.0.0.1:25641/restore");
    require.setMethod(HttpRequestMethod.Get);
    require.addHeader("key", "31415926535897932384626");
    require.addHeader("path", path);
    require.addHeader("reload", "true");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    require.setTimeout(10);
    return http.request(require).then(
    // success
    (response) => {
        if (response.status == 200) {
            return [true, response.body];
            // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
        }
        else
            tellErrorMessage(moduleName, "HTTP Save Data Failed [" + response.status + "]");
        return [false, response.body];
    }, 
    // fail
    (response) => {
        tellErrorMessage(moduleName, "HTTP Save Data Failed [PROMIST_FAILURE]");
        return [false, "外部备份接口连接失败"];
    });
}
function delBackup(path, append) {
    let require = new HttpRequest("http://127.0.0.1:25641/delBackup");
    require.setMethod(HttpRequestMethod.Get);
    require.addHeader("key", "31415926535897932384626");
    require.addHeader("path", path);
    require.addHeader("reload", "true");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    require.setTimeout(30);
    return http.request(require).then(
    // success
    (response) => {
        if (response.status == 200) {
            return [true, response.body];
            // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
        }
        else
            tellErrorMessage(moduleName, "HTTP Delete Backup Failed [" + response.status + "]");
        return [false, response.body];
    }, 
    // fail
    (response) => {
        tellErrorMessage(moduleName, "HTTP Delete Backup Failed [PROMIST_FAILURE]");
        return [false, "外部备份接口连接失败"];
    });
}
async function saveData(append) {
    let require = new HttpRequest("http://127.0.0.1:25641/data.json");
    require.setMethod(HttpRequestMethod.Post);
    require.addHeader("upgrade", "save");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    //require.addHeader("cookie", encodeURIComponent(JSON.stringify(data)));
    require.setBody(JSON.stringify(data));
    // require.setBody(encodeURIComponent(JSON.stringify(data)));
    require.setTimeout(60);
    let response = await http.request(require);
    if (response.status != 200) {
        tellErrorMessage(moduleName, "HTTP Save Data Failed [" + response.status + "]");
    }
}
async function savePermission(append) {
    let require = new HttpRequest("http://127.0.0.1:25641/permission.json");
    require.setMethod(HttpRequestMethod.Post);
    require.addHeader("upgrade", "save");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    //require.addHeader("cookie", encodeURIComponent(JSON.stringify(data)));
    require.setBody(JSON.stringify(permissionList));
    // require.setBody(encodeURIComponent(JSON.stringify(data)));
    require.setTimeout(60);
    let response = await http.request(require);
    if (response.status != 200) {
        tellErrorMessage(moduleName, "HTTP Save Permission List Failed [" + response.status + "]");
    }
}
async function saveBackupInfo(append) {
    let require = new HttpRequest("http://127.0.0.1:25641/backup/info.json");
    require.setMethod(HttpRequestMethod.Post);
    require.addHeader("upgrade", "save");
    if (append)
        require.addHeader("append", append);
    require.addHeader("Content-Type", "application/json; charset=utf-8");
    //require.addHeader("cookie", encodeURIComponent(JSON.stringify(data)));
    require.setBody(JSON.stringify(backupInfo));
    // require.setBody(encodeURIComponent(JSON.stringify(data)));
    require.setTimeout(20);
    let response = await http.request(require);
    if (response.status != 200) {
        tellErrorMessage(moduleName, "HTTP Save BackupInfo Failed [" + response.status + "]");
    }
}
export { initData, data, permissionList, saveData, savePermission, reloadPermission, reloadData, backupInfo, saveBackupInfo, reloadBackupInfo, restore, backup, delBackup, sudo, };

//# sourceMappingURL=../../_CuberEngineDebug/Data.js.map
