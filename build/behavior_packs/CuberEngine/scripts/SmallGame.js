// SmallGame for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 3.0.0
// Copyright CuberQAQ. All rights reserved.
import { world, } from "@minecraft/server";
import { showSnowMenu } from "./CuberSnow";
import { tellMessage } from "./utils";
const moduleName = "SmallGame";
const moduleVersion = "0.1.0";
function initSmallGame() {
    world.events.blockBreak.subscribe((e) => {
        if (e.player.hasTag("zq_l") || e.player.hasTag("zq_h")) {
            if (e.brokenBlockPermutation.type.id == "minecraft:leaves") {
                e.block.setPermutation(e.brokenBlockPermutation.clone());
                showSnowMenu(e.player, "zq");
            }
            else if (e.brokenBlockPermutation.type.id != "minecraft:wool") {
                e.player.runCommandAsync('tellraw @s {"rawtext":[{"text":"§c不允许破坏此方块:' + e.brokenBlockPermutation.type + '"}]}');
                e.block.setType(e.brokenBlockPermutation.type);
            }
        }
    });
    world.events.entityHurt.subscribe((e) => {
        // tellMessage(moduleName, "entityHurt e.cause = " + e.cause);
        // tellMessage(moduleName, "entityHurt e.damage = " + e.damage);
        // tellMessage(moduleName, "entityHurt e.damagingEntity.nameTag = " + e.damagingEntity.nameTag);
        // tellMessage(moduleName, "entityHurt e.hurtEntity.nameTag = " + e.hurtEntity.nameTag);
        // tellMessage(moduleName, "entityHurt e.projectile.nameTag = " + e.projectile.typeId);
        if (e.hurtEntity.hasTag("msss")) {
            {
                // tellMessage(
                //   moduleName,
                //   "玩家当前血量: " + (e.hurtEntity.getComponent("minecraft:health") as EntityHealthComponent)?.current
                // );
                // tellMessage(moduleName, "伤害扣血: " + e.damage);
                if (e.hurtEntity.getComponent("minecraft:health")?.current <= 0) {
                    tellMessage("§c密室杀手", "§e§l" + e.hurtEntity.nameTag + "§r 死了!");
                }
                else if (e.damagingEntity.hasTag("msss") && e.projectile.typeId == "minecraft:arrow") {
                    e.hurtEntity.runCommandAsync("kill");
                    // tellMessage(
                    //   "密室杀手",
                    //   "§e§l" + e.hurtEntity.nameTag + " §r被 §e§l" + e.damagingEntity.nameTag + " §r一箭§c§l射杀了！"
                    // );
                    // tellMessage("§c密室杀手", "§e§l" + e.hurtEntity.nameTag + "§r 死了!");
                }
                else if (e.damagingEntity.hasTag("msss") && e.projectile.typeId == "minecraft:thrown_trident") {
                    e.hurtEntity.runCommandAsync("kill");
                    // tellMessage(
                    //   "密室杀手",
                    //   "§e§l" + e.hurtEntity.nameTag + " §r被 §e§l" + e.damagingEntity.nameTag + " §r用三叉戟§c§l穿透了！"
                    // );
                    // tellMessage("§c密室杀手", "§e§l" + e.hurtEntity.nameTag + "§r 死了!");
                }
            }
        }
        else if (e.hurtEntity.hasTag("msss2")) {
            {
                if (e.hurtEntity.getComponent("minecraft:health")?.current <= 0) {
                    tellMessage("§c密室杀手", "§e§l" + e.hurtEntity.nameTag + "§r 死了!");
                }
                else if (e.damagingEntity.hasTag("msss2_zt") &&
                    e.projectile.typeId == "minecraft:arrow" &&
                    e.hurtEntity.hasTag("msss2_ss")) {
                    e.hurtEntity.runCommandAsync("kill");
                }
                else if (e.damagingEntity.hasTag("msss2_ss") &&
                    e.projectile.typeId == "minecraft:thrown_trident" &&
                    e.hurtEntity.hasTag("msss2_zt")) {
                    e.hurtEntity.runCommandAsync("kill");
                }
            }
        }
    });
    return { moduleName, moduleVersion };
}
export { initSmallGame };

//# sourceMappingURL=../../_CuberEngineDebug/SmallGame.js.map
