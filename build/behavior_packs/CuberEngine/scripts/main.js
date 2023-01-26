import { initCuberSnow } from "./CuberSnow";
import { initData } from "./Data";
import { initServerManage } from "./ServerManage";
import { initSmallGame } from "./SmallGame";
import { initTest } from "./Test";
import { tellErrorMessage, tellMessage } from "./utils";
const moduleName = "CuberEngine";
const moduleVersion = "0.1.0";
// Data
try {
    let module = initData();
    //tellMessage(moduleName, "Module §e§l" + module.moduleName + "§r(§e" + module.moduleVersion + "§r) Loaded");
}
catch (e) {
    if (e instanceof Error) {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lData§r§c: \n§e" + e.name + "\n" + e.message + "\n" + e.stack);
    }
    else if (typeof e == "string") {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lData§r§c: \n§e" + e);
    }
    else {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lData§r§c (Type:" + typeof e + ")");
    }
}
// ServerManage
try {
    let module = initServerManage();
    //tellMessage(moduleName, "Module §e§l" + module.moduleName + "§r(§e" + module.moduleVersion + "§r) Loaded");
}
catch (e) {
    if (e instanceof Error) {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lServerManage§r§c: \n§e" +
            e.name +
            "\n" +
            e.message +
            "\n" +
            e.stack);
    }
    else if (typeof e == "string") {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lServerManage§r§c: \n§e" + e);
    }
    else {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lServerManage§r§c (Type:" + typeof e + ")");
    }
}
// CuberSnow
try {
    let module = initCuberSnow();
    //tellMessage(moduleName, "Module §e§l" + module.moduleName + "§r(§e" + module.moduleVersion + "§r) Loaded");
}
catch (e) {
    if (e instanceof Error) {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lCuberSnow§r§c: \n§e" + e.name + "\n" + e.message + "\n" + e.stack);
    }
    else if (typeof e == "string") {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lCuberSnow§r§c: \n§e" + e);
    }
    else {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lCuberSnow§r§c (Type:" + typeof e + ")");
    }
}
// SmallGame
try {
    let module = initSmallGame();
    //tellMessage(moduleName, "Module §e§l" + module.moduleName + "§r(§e" + module.moduleVersion + "§r) Loaded");
}
catch (e) {
    if (e instanceof Error) {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lSmallGame§r§c: \n§e" + e.name + "\n" + e.message + "\n" + e.stack);
    }
    else if (typeof e == "string") {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lSmallGame§r§c: \n§e" + e);
    }
    else {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lSmallGame§r§c (Type:" + typeof e + ")");
    }
}
// Test
try {
    let module = initTest();
    //tellMessage(moduleName, "Module §e§l" + module.moduleName + "§r(§e" + module.moduleVersion + "§r) Loaded");
}
catch (e) {
    if (e instanceof Error) {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lTest§r§c: \n§e" + e.name + "\n" + e.message + "\n" + e.stack);
    }
    else if (typeof e == "string") {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lTest§r§c: \n§e" + e);
    }
    else {
        tellErrorMessage(moduleName, "ERROR: Catch a Exceptation when Init Module §lTest§r§c (Type:" + typeof e + ")");
    }
}
tellMessage(moduleName, "Package §e§lCuberEngine§r (§e" + moduleVersion + "§r) Loaded");

//# sourceMappingURL=../../_CuberEngineDebug/main.js.map
