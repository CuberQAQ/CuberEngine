// Utils for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 1.0.0

// Copyright CuberQAQ. All rights reserved.

import {
  Entity,
  GameMode,
  Player,
  ScoreboardIdentityType,
  ScoreboardObjective,
  World,
  system,
  world,
} from "@minecraft/server";
import { data, permissionList } from "./Data";

const adminList = ["Justin Ai06", "CuberQAQ", "ChristianBez787", "jf2542"];

function tellErrorMessage(sender: string, message: string) {
  world
    .getDimension("overworld")
    .runCommandAsync(
      'tellraw @a {"rawtext":[{"text":"[§e' +
        sender.replace(/"/g, '\\"') +
        "§r] §c" +
        message.replace(/"/g, '\\"') +
        '"}]} '
    );
  // world.broadcastClientMessage(sender, message);
}
function tellSuccessMessage(sender: string, message: string) {
  world
    .getDimension("overworld")
    .runCommandAsync(
      'tellraw @a {"rawtext":[{"text":"[§e' +
        sender.replace(/"/g, '\\"') +
        "§r] §a" +
        message.replace(/"/g, '\\"') +
        '"}]} '
    );
  // world.broadcastClientMessage(sender, message);
}
function anaylseError(module_name: string, error: any, append?: string) {
  if (error instanceof Error) {
    tellErrorMessage(
      module_name,
      "Catch an Error in Module [" +
        module_name +
        "]:\nError Name: " +
        error.name +
        "\nError Message: " +
        error.message +
        "\nError Stack: " +
        error.stack +
        (append ? "\nAppend Message: " + append : "")
    );
  } else if (typeof error == "string") {
    tellErrorMessage(
      module_name,
      "Catch an Error in Module [" +
        module_name +
        "]\nError String: " +
        error +
        (append ? "\nAppend Message: " + append : "")
    );
  } else {
    tellErrorMessage(
      module_name,
      "Catch an Error in Module [" +
        module_name +
        "]\nError Type: " +
        typeof error +
        "\nJSON stringify: " +
        ((e) => {
          // try to Transform error from Any to Json String
          try {
            return JSON.stringify(e);
          } catch (e) {
            return "Transform Failed";
          }
        })(error) +
        (append ? "\nAppend Message: " + append : "")
    );
  }
  throw error;
}
function tellMessage(sender: string, message: string) {
  try {
    world
      .getDimension("overworld")
      .runCommandAsync(
        'tellraw @a {"rawtext":[{"text":"[§e' +
          sender.replace(/"/g, '\\"') +
          "§r] " +
          message.replace(/"/g, '\\"') +
          '"}]} '
      );
    // world.broadcastClientMessage(sender, message);
  } catch (e) {
    anaylseError("UTILS", e, "In tellMessage");
  }
}
function isAdmin(nameTag: string) {
  return adminList.find((item) => item == nameTag) ? true : false;
}
function test(func: () => any, module_name?: string, append?: string) {
  try {
    func();
  } catch (e) {
    anaylseError(module_name ?? "UTILS_TEST", e, "(Test Function)" + (append ?? ""));
  }
}
// 妈的，新版本没法在event里调用敏感api 可以套层壳
function delayBox(func: Function, delay_tick: number = 0) {
  if (delay_tick == 0) {
    return new Promise<undefined>((resolve: Function, reject: Function) => {
      system.run(() => {
        try {
          func();
          resolve();
        } catch (e) {
          anaylseError("DelayBox", e, "Error When Run Function in DelayBox");
          reject();
        }
      });
    });
  } else {
    return new Promise<undefined>((resolve: Function, reject: Function) => {
      system.runTimeout(() => {
        try {
          func();
          resolve();
        } catch (e) {
          anaylseError("DelayBox", e, "Error When Run Function in DelayBox");
          reject();
        }
      }, delay_tick);
    });
  }
}
function permissionTest(player_name: string, permission_key: string): boolean {
  if (!permissionList) {
    tellErrorMessage("Permission", "Permission list Undefined!");
    return false;
  }
  if (!permissionList[permission_key]) {
    tellErrorMessage("Permission", "Unknown Permission Key: " + permission_key);
    return false;
  }
  if (permissionList[permission_key].find((value) => value == player_name)) {
    return true;
  } else {
    return false;
  }
}
function getPlayerScore(objective: ScoreboardObjective, target?: Player | Entity | string): number | undefined {
  if (!target || !objective) return undefined;
  let participants = objective.getParticipants();
  if (!participants) return undefined;
  if (typeof target == "string") {
    if (!data.players[target]) return undefined;
    let targetId = data.players[target].score_id;
    let participant = participants.find((item) => {
      if (item.type == ScoreboardIdentityType.Player) {
        return item.id == targetId;
      } else {
        return false;
      }
    });
    if (participant == undefined) return undefined;
    else return objective.getScore(participant);
  } else if (target instanceof Player) {
    let participant = participants.find((item) => {
      if (item.type == ScoreboardIdentityType.Player) {
        try {
          // tellMessage("getScore", "item.id=" + item.id);
          // tellMessage("getScore", "target.id=" + target.id);
          return item.id == target.scoreboardIdentity?.id;
        } catch (e) {
          anaylseError("getScore", e, "item:" + item.displayName);
        }
      }
      return false;
    });
    if (participant == undefined) return undefined;
    else return objective.getScore(participant);
  }
}
async function getGamemode(player: Player): Promise<GameMode | undefined> {
  try {
    (await player.runCommandAsync("testfor @s[m=1]")).successCount;
    //tellMessage("Gamemode", "@" + player.name + " creative");
    return GameMode.creative;
  } catch (error) {}
  try {
    (await player.runCommandAsync("testfor @s[m=spectator]")).successCount;
    //tellMessage("Gamemode", "@" + player.name + " spectator");
    return GameMode.spectator;
  } catch (error) {}
  try {
    (await player.runCommandAsync("testfor @s[m=0]")).successCount;
    //tellMessage("Gamemode", "@" + player.name + " survival");
    return GameMode.survival;
  } catch (error) {}
  try {
    (await player.runCommandAsync("testfor @s[m=2]")).successCount;
    //tellMessage("Gamemode", "@" + player.name + " adventure");
    return GameMode.adventure;
  } catch (error) {}
  //tellMessage("Gamemode", "@" + player.name + " unknown");
}
/**
 * 返回日期数字
 * @returns Date Number YYYYMMDD
 */
function getDate(utc?: number): number {
  let date = utc ? new Date(utc) : new Date();
  date.setTime(date.getTime() + 28800000);
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
/**
 * 延迟执行函数
 * @param {function} func 延迟执行函数
 * @param {number} ticktime game-tick
 * @returns {Promise}
 * @example 异步模块，使用promise封装，基于tick事件
 */
const setTimeout = function (func: Function, ticktime: number = 0): void {
  system.runTimeout(func(), ticktime);
};
export {
  tellErrorMessage,
  tellSuccessMessage,
  tellMessage,
  isAdmin,
  anaylseError,
  test,
  getPlayerScore,
  getDate,
  getGamemode,
  setTimeout,
  delayBox,
};
