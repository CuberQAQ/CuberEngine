import { world } from "@minecraft/server";
import { anaylseError, isAdmin, tellErrorMessage, tellMessage, tellSuccessMessage, test } from "./utils";
import { http, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";
import { backupInfo, data, reloadData, saveData, sudo } from "./Data";
import { clearEntity } from "./ServerManage";
const overworld = world.getDimension("overworld");
const nether = world.getDimension("nether");
const the_end = world.getDimension("the_end");
const moduleName = "Test";
const moduleVersion = "1.0.0";
const testJson = {
    snow: {
        lists: [
            {
                name: "transport",
            },
        ],
    },
};
const fileName = "test.json";
function initTest() {
    world.beforeEvents.chatSend.subscribe(async (e) => {
        try {
            if (/^#cuber /.test(e.message)) {
                if (isAdmin(e.sender.name)) {
                    if (/^#cuber net/.test(e.message)) {
                        tellMessage(moduleName, "Net Test Start");
                        let req = new HttpRequest("http://localhost:25641/data.json");
                        req.setMethod(HttpRequestMethod.Get);
                        req.addHeader("reload", "true");
                        req.setTimeout(60);
                        http.request(req).then((response) => {
                            if (response.status == 200) {
                                tellSuccessMessage(moduleName, "Net Test Succeeded. [" +
                                    response.status +
                                    "] \n§r" +
                                    "BODY: " +
                                    response.body +
                                    "\nBODY(Decoded): " +
                                    decodeURIComponent(response.body));
                            }
                            else {
                                tellErrorMessage(moduleName, "Net Test Failed. [" + response.status + "]");
                            }
                        }, () => {
                            tellErrorMessage(moduleName, "Net Test Failed. [PROMIST_FAILURE]");
                        });
                    }
                    else if (/^#cuber save/.test(e.message)) {
                        tellMessage(moduleName, "Net Test Save");
                        let request = new HttpRequest("http://localhost:25641/data.json");
                        request.setMethod(HttpRequestMethod.Post);
                        request.addHeader("upgrade", "save");
                        request.addHeader("Content-Type", "application/json; charset=utf-8");
                        request.addHeader("cookie", encodeURIComponent(e.message.replace(/^#cuber save/, "")));
                        request.setTimeout(60);
                        http.request(request).then((response) => {
                            test(() => {
                                if (response.status == 200) {
                                    tellSuccessMessage(moduleName, "Data Save Succeeded. [" + response.status + "]: §r" + response.body);
                                }
                                else {
                                    tellErrorMessage(moduleName, "Data Save Failed. [" + response.status + "]");
                                }
                            }, moduleName);
                        }, () => {
                            tellErrorMessage(moduleName, "Data Save Failed. [PROMISE_FAILURE]");
                        });
                    }
                    else if (/^#cuber send/.test(e.message)) {
                        tellMessage(moduleName, "Net Test Send");
                        let request = new HttpRequest("http://localhost:25641/ring");
                        request.addHeader("cookie", encodeURIComponent(e.message.replace(/^#cuber send/, "")));
                        request.setTimeout(60);
                        request.setMethod(HttpRequestMethod.Post);
                        http.request(request).then((response) => {
                            test(() => {
                                if (response.status == 200) {
                                    tellSuccessMessage(moduleName, "Net Send Succeeded. [" + response.status + "]: §r" + decodeURIComponent(response.body));
                                }
                                else {
                                    tellErrorMessage(moduleName, "Net Send Failed. [" + response.status + "]");
                                }
                            }, moduleName);
                        }, () => {
                            tellErrorMessage(moduleName, "Net Send Failed. [PROMISE_FAILURE]");
                        });
                    }
                    else if (/^#cuber reload/.test(e.message)) {
                        reloadData();
                    }
                    else if (/^#cuber backupInfo/.test(e.message)) {
                        tellMessage("BackupInfo", JSON.stringify(backupInfo));
                    }
                    else if (/^#cuber flyable/.test(e.message)) {
                        tellMessage(moduleName, "@" + e.sender.name + " Can Fly: " + e.sender.hasComponent("minecraft:can_fly"));
                    }
                    else if (/^#cuber spectator/.test(e.message)) {
                        tellMessage(moduleName, "successCount=" + (await e.sender.runCommandAsync("testfor @s[m=spectator]")).successCount);
                    }
                    else if (/^#cuber tickTest1/.test(e.message)) {
                        for (let i = 0; i < 100; ++i) {
                            await overworld.runCommandAsync('scoreboard players add "测试" test 1');
                        }
                    }
                    else if (/^#cuber sweep/.test(e.message)) {
                        tellMessage("§b§l扫地姬", "§e@" + e.sender.name + "§r 喊我扫地啦！");
                        data.settings.entity_clear.config.forEach((config) => {
                            if (!config.enable)
                                return;
                            clearEntity(config);
                        });
                        return false;
                    }
                    else if (/^#cuber killpig/.test(e.message)) {
                        tellMessage(moduleName, "successCount=" + (await overworld.runCommandAsync("kill @e[type=pig]")).successCount);
                    }
                    else {
                        tellErrorMessage(moduleName, "Admin Test Command Undefined");
                    }
                }
                else {
                    tellErrorMessage(moduleName, "Refuse to Run Admin Test Command");
                }
            }
            else if (e.message.startsWith("#snow")) {
                e.sender.runCommandAsync("give @s snowball 16");
            }
            else if (e.message.trim() == "#op") {
                if (e.sender.hasTag("op")) {
                    tellMessage("§b§l服务姬", "赋予 §e§l@" + e.sender.name + " §r操作员权限！");
                    sudo("op " + e.sender.name, e.sender.name);
                }
                else {
                    tellMessage("§b§l服务姬", "@" + e.sender.name + " §r权限不足，无法获取§c§l操作员权限§r！");
                }
            }
            else if (e.message.trim() == "#deop") {
                if (e.sender.hasTag("op")) {
                    tellMessage("§b§l服务姬", "夺去 §e§l@" + e.sender.name + " §r操作员权限！");
                    sudo("deop " + e.sender.name, e.sender.name);
                }
                else {
                    tellMessage("§b§l服务姬", "@" + e.sender.name + " §r权限不足，无法执行此命令！");
                }
            }
            else if (e.message.startsWith("#sudo")) {
                if (isAdmin(e.sender.name)) {
                    let command = e.message.replace(/^#sudo/, "").trim();
                    tellMessage("§c§lSudo", "§e§l@" + e.sender.name + " §r运行服务端命令： " + command);
                    sudo(command, e.sender.name);
                }
                else {
                    tellErrorMessage(moduleName, "Refuse to Run SuperUser Command");
                }
            }
            else if (e.message.trim() == "#reload") {
                if (e.sender.hasTag("op")) {
                    tellMessage("§b§l服务姬", "正在重载插件...");
                    sudo("reload", e.sender.name);
                }
                else {
                    tellErrorMessage(moduleName, "非管理员无法执行此命令");
                }
            }
            else if (e.message.trim() == "#home") {
                if (data.players[e.sender.name].home_spot == undefined) {
                    tellMessage("§b§l系统", "§e§l@" + e.sender.name + " §r你还§c没有设置个人传送点§r，试试#sethome吧");
                }
                else {
                    tellMessage("§b§l系统", "§e§l@" + e.sender.name + " §r传送到了 §a§l个人传送点");
                    // e.sender.teleport(
                    //   { ...data.players[e.sender.name].home_spot },
                    //   {
                    //     dimension: world.getDimension(data.players[e.sender.name].home_spot.dimension),
                    //     rotation: {
                    //       x: 0,
                    //       y: 0,
                    //     },
                    //   }
                    // );
                    e.sender.runCommandAsync("execute in " +
                        data.players[e.sender.name].home_spot.dimension +
                        " run tp " +
                        data.players[e.sender.name].home_spot.x +
                        " " +
                        data.players[e.sender.name].home_spot.y +
                        " " +
                        data.players[e.sender.name].home_spot.z +
                        " 0 0");
                }
            }
            else if (e.message.trim() == "#sethome") {
                let dimension = "overworld";
                switch (e.sender.dimension) {
                    case overworld:
                        dimension = "overworld";
                        break;
                    case the_end:
                        dimension = "the_end";
                        break;
                    case nether:
                        dimension = "nether";
                        break;
                }
                data.players[e.sender.name].home_spot = { ...e.sender.location, dimension };
                tellMessage("§b§l系统", "§e§l@" + e.sender.name + " §r个人传送点 §a§l设置成功");
                saveData("@" + e.sender.name + " #sethome");
            }
        }
        catch (e) {
            anaylseError(moduleName, e, "In beforeChat subscribe");
        }
    });
    return { moduleName, moduleVersion };
}
export { initTest };

//# sourceMappingURL=../../_CuberEngineDebug/Test.js.map
