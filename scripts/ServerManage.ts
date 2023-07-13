// ServerManage for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 3.0.0

// Copyright CuberQAQ. All rights reserved.
import { Player, world, system, GameMode } from "@minecraft/server";
import { data, saveData } from "./Data";
import { addRunBeforeTp } from "./CuberSnow";
import { anaylseError, delayBox, getGamemode, setTimeout, tellMessage } from "./utils";
import { MessageFormData } from "@minecraft/server-ui";
const moduleName = "ServerManage";
const moduleVersion = "0.1.0";
const overworld = world.getDimension("overworld");

interface EntityClearConfigListType {
  name: string;
  types: Array<[string, boolean, string?]>;
}
interface EntityClearConfigType {
  name: string;
  show: string;
  display: boolean;
  enable: boolean;
  time: number;
  last_clear: number;
  forecasted: boolean;
  forecast: boolean;
  foretime: number;
  list: Array<EntityClearConfigListType>;
}

async function clearEntity(config: EntityClearConfigType) {
  config.forecasted = false;
  config.last_clear = new Date().getTime();
  if (config.display) {
    tellMessage(data.settings.entity_clear.sender, "即将清理§e§l" + (config.show ?? config.name) + "§r喵~...");
  }
  // Run Clear Task
  let total_clear = 0;
  for (let j = 0; j < config.list.length; ++j) {
    let typesLength = config.list[j].types.length;
    for (let i = 0; i < typesLength; ++i) {
      if (config.list[j].types[i][1]) {
        try {
          total_clear += (
            await overworld.runCommandAsync("kill @e[tag=!nclear,type=" + config.list[j].types[i][0] + "]")
          ).successCount;
        } catch (e) {
          if (!(typeof e == "string" && e.trim() == "No targets matched selector")) {
            anaylseError(moduleName, e, "In Entity Clear Task");
          }
        }
      }
    }
  }
  tellMessage(
    data.settings.entity_clear.sender,
    "" + (config.show ?? config.name) + "§a§l清理完成！§r本次共清理§e§l" + total_clear + "§r个实体喵~"
  );
  data.settings.entity_clear.total_clear += total_clear;
  saveData();
}
function initServerManage() {
  world.afterEvents.blockBreak.subscribe((e) => {
    if (!e.player.hasTag(data.settings.new_player.limit_tag)) {
      if (
        e.dimension != overworld ||
        e.block.x < data.settings.new_player.allow_area.begin_x ||
        e.block.x > data.settings.new_player.allow_area.end_x ||
        e.block.z < data.settings.new_player.allow_area.begin_z ||
        e.block.z > data.settings.new_player.allow_area.end_z
      ) {
        // e.block.setType(e.brokenBlockPermutation.type);
        e.block.setPermutation(e.brokenBlockPermutation);
        e.player.runCommandAsync(
          'tellraw @a {"rawtext":[{"text":"§c不允许在新人建筑区外破坏方块 @' + e.player.name + '"}]}'
        );
      }
    }
  });
  world.afterEvents.blockPlace.subscribe((e) => {
    if (!e.player.hasTag(data.settings.new_player.limit_tag)) {
      if (
        e.dimension != overworld ||
        e.block.x < data.settings.new_player.allow_area.begin_x ||
        e.block.x > data.settings.new_player.allow_area.end_x ||
        e.block.z < data.settings.new_player.allow_area.begin_z ||
        e.block.z > data.settings.new_player.allow_area.end_z
      ) {
        e.player.runCommandAsync("setblock " + e.block.x + " " + e.block.y + " " + e.block.z + " air");
        e.player.runCommandAsync(
          'tellraw @a {"rawtext":[{"text":"§c不允许在新人建筑区外放置方块 @' + e.player.name + '"}]}'
        );
      }
    }
  });
  world.beforeEvents.itemUse.subscribe((e) => {
    if (e.source instanceof Player) {
      e.source.location.x;
      if (
        !e.source.hasTag(data.settings.new_player.limit_tag) &&
        (e.source.dimension != overworld ||
          e.source.location.x < data.settings.new_player.allow_area.begin_x ||
          e.source.location.x > data.settings.new_player.allow_area.end_x ||
          e.source.location.z < data.settings.new_player.allow_area.begin_z ||
          e.source.location.z > data.settings.new_player.allow_area.end_z)
      ) {
        if (e.itemStack.typeId != "minecraft:snowball") {
          e.cancel = true;
          e.source.runCommandAsync(
            'tellraw @s {"rawtext":[{"text":"§c不允许在新人建筑区外使用工具 @' + e.source.name + '"}]}'
          );
        }
      }
    }
  });
  world.beforeEvents.explosion.subscribe((e) => {
    if (!data.settings.world.allow_explode) {
      e.source?.runCommandAsync('tellraw @a {"rawtext":[{"text":"§c不允许发生爆炸"}]}');
      e.cancel = true;
    }
  });
  // 玩家数据初始化
  world.afterEvents.playerSpawn.subscribe((e) => {
    if (data.players[e.player.name] == undefined) {
      tellMessage(moduleName, "初始化个人信息 §e@" + e.player.name);
      // e.player.runCommandAsync('scoreboard players add "' + e.player.name + '" time 0');
      data.players[e.player.name] = {
        job: data.settings.players.default_job,
        score_id: e.player.scoreboardIdentity?.id,
        goodat: data.settings.players.default_goodat,
        money: data.settings.players.default_money,
        place: data.settings.players.default_place,
        last_login: new Date().getTime(), // UTC ms
        last_checkin: 0, // YYYYMMDD
        checkin_times: 0,
      };
      world.getPlayers({ name: e.player.name })[0].runCommandAsync("give @s snowball 16");
      delayBox(saveData);
    } else {
      data.players[e.player.name].last_login = new Date().getTime();
      delayBox(saveData);
    }
  });
  world.afterEvents.entityHitBlock.subscribe((e) => {
    e.hitBlock?.trySetPermutation(e.hitBlock.permutation);
  });
  addRunBeforeTp("serverManage_newPlayer", async (player, list_key) => {
    if (data.settings.new_player.change_gamemode && !player.hasTag(data.settings.new_player.limit_tag)) {
      if (!((await getGamemode(player)) == GameMode.spectator)) {
        let msfr = await new MessageFormData()
          .title("提示")
          .body("即将进入旁观者模式，聊天栏输入#exit可返回新人建筑区并退出旁观者模式")
          .button1("明白了")
          .button2("取消传送")
          .show(player);
        if (msfr.selection == 0) {
          player.runCommandAsync("gamemode spectator");
          tellMessage("§b§l提示", "§e§l" + player.name + "§r 正在参观地图!");
          return { cancel: false };
        }
        return { cancel: true, cancelReason: "取消传送" };
      }
    }
    return { cancel: false };
  });
  world.beforeEvents.chatSend.subscribe(async (e) => {
    if (e.message.trim() == "#exit") {
      tellMessage("§b§l雪球菜单", "§e§l" + e.sender.name + "§r 返回了 §a§l新人建筑区");
      // tellMessage(
      //   moduleName,
      //   "x:" + (data.settings.new_player.allow_area.end_x - data.settings.new_player.allow_area.begin_x) / 2
      // );
      // tellMessage(
      //   moduleName,
      //   "x2:" +
      //     (data.settings.new_player.allow_area.begin_x +
      //       (data.settings.new_player.allow_area.end_x - data.settings.new_player.allow_area.begin_x) / 2)
      // );
      let cmd =
        "tp " +
        (data.settings.new_player.allow_area.begin_x +
          (data.settings.new_player.allow_area.end_x - data.settings.new_player.allow_area.begin_x) / 2) +
        " 200 " +
        (data.settings.new_player.allow_area.begin_z +
          (data.settings.new_player.allow_area.end_z - data.settings.new_player.allow_area.begin_z) / 2);
      e.sender.runCommandAsync(cmd);
      e.sender.runCommandAsync("gamemode 1");

      // tellMessage(moduleName, "§e" + e.sender.name + "§r 返回了 §a新人建筑区2");
      // try {
      //   var gamemode = await getGamemode(e.sender);
      // } catch (e) {
      //   anaylseError(moduleName, e, "wtf?");
      // }
      // if (gamemode != GameMode.survival && gamemode != GameMode.adventure) {
      //   tellMessage(moduleName, "§e" + e.sender.name + "§r 返回了 §a新人建筑区3");
      //   e.sender.runCommandAsync("gamemode 1");
      //   e.sender.runCommandAsync(
      //     "tp " +
      //       (data.settings.new_player.end_x - data.settings.new_player.begin_x) / 2 +
      //       " 200 " +
      //       (data.settings.new_player.end_z - data.settings.new_player.begin_z) / 2
      //   );
      // }
    }
  });
  // 实体清除
  var tick = 20;
  system.runInterval(() => {
    let nowTime = new Date().getTime();
    if (!data.settings) return;
    data.settings.entity_clear.config.forEach((config: EntityClearConfigType) => {
      // tellMessage(moduleName, "nowTime - config.last_clear = " + (nowTime - config.last_clear));
      if (!config.enable) return;
      if (
        config.forecast &&
        !config.forecasted &&
        nowTime - config.last_clear >= (config.time - config.foretime) * 1000
      ) {
        tellMessage(
          data.settings.entity_clear.sender,
          "还有§c" + config.foretime + "秒§r就要清理§e§l" + config.show ?? config.name + "§r了喵！"
        );
        config.forecasted = true;
      }
      if (nowTime - config.last_clear >= config.time * 1000) {
        clearEntity(config);
      }
    });
  }, 20);

  return { moduleName, moduleVersion };
}
export { initServerManage, clearEntity };
