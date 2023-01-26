// Data for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 3.0.0

// Copyright CuberQAQ. All rights reserved.

import { http, HttpClient, HttpRequest, HttpResponse, HttpHeader, HttpRequestMethod } from "@minecraft/server-net";
import { tellErrorMessage, tellMessage, tellSuccessMessage } from "./utils";
import { world } from "@minecraft/server";

const moduleName = "Data";
const moduleVersion = "0.1.1";
var data: any = {};
var backupInfo: any = {};

interface BackupInfoType {
  path: string;
  append: string;
  creater: string;
  auto: boolean;
}

function initData() {
  reloadData();
  reloadBackupInfo();
  return { moduleName, moduleVersion };
}
function reloadData() {
  let req = new HttpRequest("http://localhost:25641/data.json");
  req.setMethod(HttpRequestMethod.GET);
  req.addHeader("reload", "true");
  req.setTimeout(60);
  http.request(req).then(
    (res) => {
      if (res.status == 200) {
        // tellSuccessMessage(moduleName, "HTTP Get Data Succeeded. [" + res.status + "]");
        data = JSON.parse(decodeURIComponent(res.body));
      } else {
        tellErrorMessage(moduleName, "HTTP Get Data Failed. [" + res.status + "]");
      }
    },
    (res) => {
      tellErrorMessage(moduleName, "HTTP GET Data Failed. [NULL] " + res);
    }
  );
}
function reloadBackupInfo() {
  let req = new HttpRequest("http://localhost:25641/backup/info.json");
  req.setMethod(HttpRequestMethod.GET);
  //req.addHeader("reload", "true");
  req.setTimeout(60);
  http.request(req).then(
    (res) => {
      if (res.status == 200) {
        // tellSuccessMessage(moduleName, "HTTP Get Data Succeeded. [" + res.status + "]");
        backupInfo = JSON.parse(decodeURIComponent(res.body));
      } else {
        tellErrorMessage(moduleName, "HTTP Get BackupInfo Failed. [" + res.status + "]");
      }
    },
    (res) => {
      tellErrorMessage(moduleName, "HTTP GET BackupInfo Failed. [NULL] " + res);
    }
  );
}
function backup(info: BackupInfoType, append?: string) {
  let require = new HttpRequest("http://127.0.0.1:25641/backup");
  require.setMethod(HttpRequestMethod.POST);
  require.addHeader("key", "31415926535897932384626");
  if (append) require.addHeader("append", append);
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
      } else tellErrorMessage(moduleName, "HTTP Create Backup Failed [" + response.status + "]");
      return [false, response.body];
    },
    // fail
    (response) => {
      tellErrorMessage(moduleName, "HTTP Create Backup Failed [PROMIST_FAILURE]");
      return [false, "外部备份接口连接失败"];
    }
  );
}
function restore(path: string, append: string) {
  let require = new HttpRequest("http://127.0.0.1:25641/restore");
  require.setMethod(HttpRequestMethod.GET);
  require.addHeader("key", "31415926535897932384626");
  require.addHeader("path", path);
  require.addHeader("reload", "true");
  if (append) require.addHeader("append", append);
  require.addHeader("Content-Type", "application/json; charset=utf-8");
  require.setTimeout(10);
  return http.request(require).then(
    // success
    (response) => {
      if (response.status == 200) {
        return [true, response.body];
        // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
      } else tellErrorMessage(moduleName, "HTTP Save Data Failed [" + response.status + "]");
      return [false, response.body];
    },
    // fail
    (response) => {
      tellErrorMessage(moduleName, "HTTP Save Data Failed [PROMIST_FAILURE]");
      return [false, "外部备份接口连接失败"];
    }
  );
}
function delBackup(path: string, append: string) {
  let require = new HttpRequest("http://127.0.0.1:25641/delBackup");
  require.setMethod(HttpRequestMethod.GET);
  require.addHeader("key", "31415926535897932384626");
  require.addHeader("path", path);
  require.addHeader("reload", "true");
  if (append) require.addHeader("append", append);
  require.addHeader("Content-Type", "application/json; charset=utf-8");
  require.setTimeout(30);
  return http.request(require).then(
    // success
    (response) => {
      if (response.status == 200) {
        return [true, response.body];
        // tellSuccessMessage(moduleName, "HTTP Save Data Success [" + response.status + "]");
      } else tellErrorMessage(moduleName, "HTTP Delete Backup Failed [" + response.status + "]");
      return [false, response.body];
    },
    // fail
    (response) => {
      tellErrorMessage(moduleName, "HTTP Delete Backup Failed [PROMIST_FAILURE]");
      return [false, "外部备份接口连接失败"];
    }
  );
}
async function saveData(append?: string) {
  let require = new HttpRequest("http://127.0.0.1:25641/data.json");
  require.setMethod(HttpRequestMethod.POST);
  require.addHeader("upgrade", "save");
  if (append) require.addHeader("append", append);
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
async function saveBackupInfo(append?: string) {
  let require = new HttpRequest("http://127.0.0.1:25641/backup/info.json");
  require.setMethod(HttpRequestMethod.POST);
  require.addHeader("upgrade", "save");
  if (append) require.addHeader("append", append);
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

export {
  initData,
  data,
  saveData,
  reloadData,
  backupInfo,
  saveBackupInfo,
  reloadBackupInfo,
  restore,
  backup,
  delBackup,
};
