// CuberSnow for Minecraft Bedrock Edition
// Author: CuberQAQ <https://github.com/CuberQAQ>
// Liscence: GPLv3 https://www.gnu.org/licenses/gpl-3.0.html
// Based on GameTest Framework (https://learn.microsoft.com/zh-cn/minecraft/creator/scriptapi/)
// Version: 3.0.0
// Copyright CuberQAQ. All rights reserved.
import { world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { anaylseError, getDate, getPlayerScore, isAdmin, tellErrorMessage, tellMessage } from "./utils";
import { backup, backupInfo, data, delBackup, reloadBackupInfo, reloadData, restore, saveData, } from "./Data";
import { clearEntity } from "./ServerManage";
// import { mkdir } from "fs-extra";
const overworld = world.getDimension("overworld");
const moduleName = "CuberSnow";
const moduleVersion = "3.1.0";
const senderName = "§b§l雪球菜单";
const snowScripts = {
    test: async function (player, list_key) {
        tellMessage(moduleName, "Script Test.");
        return true;
    },
    enterAdminOptions: async function (player, list_key) {
        if (!isAdmin(player.nameTag)) {
            // 非管理员
            let msfrNotAdmin = await new MessageFormData()
                .title("提示")
                .body("暂未获得管理员权限\n如有疑问请联系CuberQAQ或其他管理员")
                .button1("返回上一级")
                .button2("退出菜单")
                .show(player);
            if (msfrNotAdmin.selection == 2 || msfrNotAdmin.canceled)
                return true;
            return false;
        }
        else
            return showSnowList(player, "admin");
    },
    admin_snow_editItem: async function (player, list_key) {
        while (true) {
            // 定义选择选项用的函数(列出所有菜单，让人选)
            async function chooseListFromAll(operation_name) {
                // 选择列表
                let afdChooseList = new ActionFormData().title("请选择" + operation_name + "选项所在列表");
                let keyList = [];
                for (let item in data.snow) {
                    if (data.snow[item].lock == undefined || data.snow[item].lock == false) {
                        keyList.push(item);
                        afdChooseList = afdChooseList.button(data.snow[item].name);
                    }
                }
                let afrChooseList = await afdChooseList.show(player);
                if (afrChooseList.canceled || afrChooseList.selection == undefined)
                    return undefined;
                return keyList[afrChooseList.selection];
            }
            // 定义选择选项用的函数(通过进入主界面选择) 【未完成】
            async function chooseListFromTree(operation_name) {
                // 选择列表
                let afdChooseList = new ActionFormData().title("请选择" + operation_name + "选项所在列表");
                let keyList = [];
                for (let item in data.snow) {
                    if (data.snow[item].lock == undefined || data.snow[item].lock == false) {
                        keyList.push(item);
                        afdChooseList = afdChooseList.button(data.snow[item].name);
                    }
                }
                let afrChooseList = await afdChooseList.show(player);
                if (afrChooseList.canceled || afrChooseList.selection == undefined)
                    return undefined;
                return keyList[afrChooseList.selection];
            }
            // 定义选择选项用的函数
            async function chooseItem(targetListObj, operation_name) {
                if (!targetListObj || !(targetListObj.list instanceof Array)) {
                    throw new Error("Strange targetListObj in [chooseItem]");
                }
                // 选择选项
                let afdChooseItem = new ActionFormData().title("编辑菜单 -" + targetListObj.name).body("" + operation_name);
                let length = targetListObj.list.length;
                for (let i = 0; i < length; ++i) {
                    afdChooseItem = afdChooseItem.button(targetListObj.list[i].name, (targetListObj.list[i].icon ?? "") != "" ? "textures/blocks/" + targetListObj.list[i].icon : undefined);
                }
                let afrChooseItem = await afdChooseItem.show(player);
                // 若退出
                if (afrChooseItem.canceled || afrChooseItem.selection == undefined) {
                    return undefined;
                }
                return afrChooseItem.selection;
            }
            // 定义编辑或者添加菜单用的函数
            async function editItem(operation_name, raw_data) {
                // 选项的编辑界面
                // 子界面1 name tag type
                let resultItem = {
                    name: "",
                    type: "tp",
                };
                // 未指定则提供简单模板
                if (raw_data == undefined)
                    raw_data = {
                        name: "",
                        type: "null",
                    };
                while (true) {
                    let afrItemEditor1 = await new ModalFormData()
                        .title("" + operation_name + "选项")
                        .textField("§l显示名称§r\n可用双S符号调色，\\n换行。最多两行，每行最多约16个汉字(32个字母)", "输入显示名称", raw_data?.name)
                        .textField("权限标签(拥有标签才可以执行选项)", '多个标签请用英文逗号","隔开', raw_data?.tag?.length
                        ? (() => {
                            let result = "";
                            let length = raw_data.tag.length;
                            for (let i = 0; i < length; ++i) {
                                result += raw_data.tag[i];
                                if (i != length - 1)
                                    result += ",";
                            }
                            return result;
                        })()
                        : undefined)
                        .dropdown("选项类型", ["传送(tp)", "命令(commands)", "函数(function)", "菜单跳转(route)", "脚本(script)"], (() => {
                        switch (raw_data?.type) {
                            case "tp":
                                return 0;
                            case "commands":
                                return 1;
                            case "function":
                                return 2;
                            case "route":
                                return 3;
                            case "script":
                                return 4;
                            default:
                                return 0;
                        }
                    })())
                        .textField("图标位置(资源包 textures/blocks/ 下不含后缀的PNG图片名)", "留空为无图标", raw_data.icon)
                        .show(player);
                    if (afrItemEditor1.canceled || afrItemEditor1.formValues == undefined) {
                        return undefined;
                    }
                    if (afrItemEditor1.formValues[0] == "") {
                        let msfr = await new MessageFormData()
                            .title("错误")
                            .body("选项名字不可为空")
                            .button1("确定")
                            .button2("退出")
                            .show(player);
                        if (msfr.canceled || msfr.selection == 2) {
                            return undefined;
                        }
                        continue;
                    }
                    resultItem.name = afrItemEditor1.formValues[0].replace(/\\n/g, "\n");
                    let tagList = afrItemEditor1.formValues[1].replace(/ /g, "").replace(/,$/, "").split(",") ?? [];
                    if (tagList.length == 1 && tagList[0] == "") {
                        tagList = [];
                    }
                    resultItem.tag = tagList;
                    switch (afrItemEditor1.formValues[2]) {
                        case 0:
                            resultItem.type = "tp";
                            break;
                        case 1:
                            resultItem.type = "commands";
                            break;
                        case 2:
                            resultItem.type = "function";
                            break;
                        case 3:
                            resultItem.type = "route";
                            break;
                        case 4:
                            resultItem.type = "script";
                            break;
                        default:
                            throw new Error("[Admin] afrItemEditor1.formValues[2] ERROR @" + player.name);
                            return;
                    }
                    // icon
                    if (afrItemEditor1.formValues[3].trim() != "") {
                        resultItem.icon = afrItemEditor1.formValues[3].trim();
                    }
                    break;
                }
                while (true) {
                    switch (resultItem.type) {
                        case "tp":
                            {
                                let afrItemEditor2 = await new ModalFormData()
                                    .title("" + operation_name + "选项")
                                    .textField("§l传送点名称(传送后在聊天栏中显示)", "输入传送点名称，不输默认为选项名称", raw_data.show_name)
                                    .textField("§l传送点X坐标", "X坐标", "" + (raw_data?.type == "tp" ? raw_data.location?.x : ""))
                                    .textField("§l传送点Y坐标", "Y坐标", "" + (raw_data?.type == "tp" ? raw_data.location?.y : ""))
                                    .textField("§l传送点Z坐标", "Z坐标", "" + (raw_data?.type == "tp" ? raw_data.location?.z : ""))
                                    .dropdown("目的地维度", ["主世界(overworld)", "末地(the_end)", "下界(nether)"], (() => {
                                    if (raw_data.type == "tp") {
                                        switch (raw_data.dimension) {
                                            case "overworld":
                                                return 0;
                                            case "the_end":
                                                return 1;
                                            case "nether":
                                                return 2;
                                            default:
                                                return 0;
                                        }
                                    }
                                    else {
                                        return 0;
                                    }
                                })())
                                    .toggle("传送信息公开显示", raw_data.type == "tp" ? raw_data.show : true)
                                    .show(player);
                                if (afrItemEditor2.canceled || afrItemEditor2.formValues == undefined) {
                                    return undefined;
                                }
                                if (
                                // 若坐标为空
                                afrItemEditor2.formValues[1].trim() == "" ||
                                    afrItemEditor2.formValues[2].trim() == "" ||
                                    afrItemEditor2.formValues[3].trim() == "") {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("传送点坐标不可为空")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                if (
                                // 若坐标不为纯数字
                                isNaN(Number(afrItemEditor2.formValues[1])) ||
                                    isNaN(Number(afrItemEditor2.formValues[2])) ||
                                    isNaN(Number(afrItemEditor2.formValues[3]))) {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("传送点坐标必须为数字")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return;
                                    }
                                    continue;
                                }
                                if (afrItemEditor2.formValues[0].trim() != "") {
                                    resultItem.show_name = afrItemEditor2.formValues[0].trim();
                                }
                                resultItem.location = {
                                    x: Number(afrItemEditor2.formValues[1]),
                                    y: Number(afrItemEditor2.formValues[2]),
                                    z: Number(afrItemEditor2.formValues[3]),
                                };
                                switch (afrItemEditor2.formValues[4]) {
                                    case 0:
                                        resultItem.dimension = "overworld";
                                        break;
                                    case 1:
                                        resultItem.dimension = "the_end";
                                        break;
                                    case 2:
                                        resultItem.dimension = "nether";
                                        break;
                                    default:
                                        tellErrorMessage(moduleName, "[Admin] afrItemEditor2.formValues[3] ERROR @" + player.name);
                                        return undefined;
                                }
                                resultItem.show = afrItemEditor2.formValues[5];
                            }
                            break;
                        case "commands":
                            {
                                let afrItemEditor2 = await new ModalFormData()
                                    .title("" + operation_name + "选项")
                                    .textField('§l执行指令§r§o\n指令前不加"/"，多条指令用\\s分割', "输入指令", "" +
                                    (raw_data?.type == "commands"
                                        ? (() => {
                                            if (raw_data.commands == undefined)
                                                return "";
                                            let str = "";
                                            let length = raw_data.commands.length;
                                            for (let i = 0; i < length; ++i) {
                                                str += raw_data.commands[i].trim();
                                                if (i != length - 1)
                                                    str += " \\s ";
                                            }
                                            return str;
                                        })()
                                        : ""))
                                    .toggle("执行后退出菜单", raw_data.type == "commands" ? raw_data.close ?? true : true)
                                    .show(player);
                                if (afrItemEditor2.formValues == undefined || afrItemEditor2.canceled) {
                                    return undefined;
                                }
                                // 若指令为空
                                if (afrItemEditor2.formValues[0].trim() == "") {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("指令不可为空")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                // 分割
                                let cmdList = afrItemEditor2.formValues[0].trim().split("\\s");
                                // 去除空格和空指令
                                let length = cmdList.length;
                                for (let i = 0; i < length; ++i) {
                                    cmdList[i] = cmdList[i].trim();
                                    if (cmdList[i] == "") {
                                        cmdList.splice(i, 1);
                                        --i;
                                        --length;
                                    }
                                }
                                // 若处理后指令为空
                                if (length == 0) {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("请输入有效的指令")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                // 保存！
                                resultItem.commands = cmdList;
                                resultItem.close = afrItemEditor2.formValues[1] ?? true;
                            }
                            break;
                        case "function":
                            {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("function 将在未来支持(反正没人用)")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                                return undefined;
                            }
                            break;
                        case "route":
                            {
                                // 选择方式
                                let afdItemEditor2 = new ActionFormData()
                                    .title("" + operation_name + "选项")
                                    .body("通过何种方式选择跳转目标菜单？\n \n ")
                                    .button("目标菜单列表")
                                    .button("直接输入键名")
                                    .button("创建特殊跳转选项");
                                if (raw_data.type == "route") {
                                    afdItemEditor2 = afdItemEditor2.button("保持原有设置");
                                }
                                let afrItemEditor2 = await afdItemEditor2.show(player);
                                if (afrItemEditor2.selection == undefined || afrItemEditor2.canceled) {
                                    return undefined;
                                }
                                // 通过不同方式选择目标菜单
                                switch (afrItemEditor2.selection) {
                                    case 0: // 目标菜单列表
                                        {
                                            let destination = await chooseListFromAll("跳转");
                                            if (destination == undefined || destination == "")
                                                return undefined;
                                            resultItem.destination = destination;
                                        }
                                        break;
                                    case 1: // 直接输入键名
                                        {
                                            let afrItemEditor2 = await new ModalFormData()
                                                .title("" + operation_name + "选项")
                                                .textField("输入目标跳转菜单的键名", "输入键名", "" + (raw_data?.type == "route" ? raw_data.destination ?? "" : ""))
                                                .toggle("检查是否存在", true)
                                                .show(player);
                                            if (afrItemEditor2.formValues == undefined || afrItemEditor2.canceled) {
                                                return undefined;
                                            }
                                            if (afrItemEditor2.formValues[0] == undefined || afrItemEditor2.formValues[0].trim() == "") {
                                                let msfr = await new MessageFormData()
                                                    .title("错误")
                                                    .body("目标菜单键名不可为空")
                                                    .button1("确定")
                                                    .button2("退出")
                                                    .show(player);
                                                if (msfr.canceled || msfr.selection == 2) {
                                                    return undefined;
                                                }
                                                continue;
                                            }
                                            // 检查是否存在
                                            if (afrItemEditor2.formValues[1] == true) {
                                                if (!data.snow[afrItemEditor2.formValues[0]]) {
                                                    let msfr = await new MessageFormData()
                                                        .title("错误")
                                                        .body("目标菜单不存在")
                                                        .button1("确定")
                                                        .button2("退出")
                                                        .show(player);
                                                    if (msfr.canceled || msfr.selection == 2) {
                                                        return undefined;
                                                    }
                                                    continue;
                                                }
                                            }
                                            // 保存
                                            resultItem.destination = afrItemEditor2.formValues[0].trim();
                                        }
                                        break;
                                    case 2: // 创建特殊跳转选项
                                        {
                                            // 选择方式
                                            let afrItemEditor2 = await new ActionFormData()
                                                .title("" + operation_name + "选项")
                                                .body("选择特殊跳转类型\n \n ")
                                                .button("返回上一级菜单")
                                                .button("退出菜单")
                                                .show(player);
                                            if (afrItemEditor2.selection == undefined || afrItemEditor2.canceled) {
                                                return undefined;
                                            }
                                            switch (afrItemEditor2.selection) {
                                                case 0: //返回上一级菜单
                                                    {
                                                        resultItem.destination = "#back";
                                                    }
                                                    break;
                                                case 1: //退出菜单
                                                    {
                                                        resultItem.destination = "#exit";
                                                    }
                                                    break;
                                                default:
                                                    tellErrorMessage(moduleName, "[Admin] afrItemEditor2.selection ERROR @" + player.name);
                                                    return undefined;
                                            }
                                        }
                                        break;
                                    case 3: // 保持原有设置
                                        {
                                            if (
                                            // 若原有设置不存在
                                            raw_data.type != "route" ||
                                                raw_data.destination == undefined ||
                                                raw_data.destination.trim() == "") {
                                                let msfr = await new MessageFormData()
                                                    .title("错误")
                                                    .body("原有设置不存在")
                                                    .button1("确定")
                                                    .button2("退出")
                                                    .show(player);
                                                if (msfr.canceled || msfr.selection == 2) {
                                                    return undefined;
                                                }
                                            }
                                            resultItem.destination = raw_data.destination;
                                        }
                                        break;
                                    default:
                                        throw new Error("[Admin] afrItemEditor2.selection ERROR @" + player.name);
                                        return;
                                }
                            }
                            break;
                        case "script":
                            {
                                let afrItemEditor2 = await new ModalFormData()
                                    .title("" + operation_name + "选项")
                                    .textField("输入目标脚本的函数名(位于snowScripts下的函数名)", "输入键名", "" + (raw_data?.type == "script" ? raw_data.script ?? "" : ""))
                                    .toggle("检查是否存在", true)
                                    .show(player);
                                if (afrItemEditor2.formValues == undefined || afrItemEditor2.canceled) {
                                    return undefined;
                                }
                                if (afrItemEditor2.formValues[0] == undefined || afrItemEditor2.formValues[0].trim() == "") {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("目标脚本函数名不可为空")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                // 检查是否存在
                                if (afrItemEditor2.formValues[1] == true) {
                                    if (!snowScripts[afrItemEditor2.formValues[0]]) {
                                        let msfr = await new MessageFormData()
                                            .title("错误")
                                            .body("目标脚本函数不存在")
                                            .button1("确定")
                                            .button2("退出")
                                            .show(player);
                                        if (msfr.canceled || msfr.selection == 2) {
                                            return undefined;
                                        }
                                        continue;
                                    }
                                }
                                // 保存
                                resultItem.script = afrItemEditor2.formValues[0].trim();
                            }
                            break;
                    }
                    break;
                } // while 2
                // 完成
                let msfrFinish = await new MessageFormData()
                    .title("提示")
                    .body("请核对以下JSON信息，决定是否保存:\n" + JSON.stringify(resultItem))
                    .button1("保存更改")
                    .button2("放弃更改")
                    .show(player);
                if (msfrFinish.canceled)
                    return;
                if (msfrFinish.selection == 1) {
                    return resultItem;
                }
                if (msfrFinish.selection == 2) {
                    return undefined;
                }
                // 子界面1 name tag type
            }
            // 选择菜单
            let targetListKey = await chooseListFromAll("目标");
            if (targetListKey == undefined)
                return false;
            // 选择操作
            let afrChooseOperation = await new ActionFormData()
                .title("请选择要进行的编辑操作")
                .button("修改选项")
                .button("添加选项")
                .button("删除选项")
                .button("移动选项")
                .show(player);
            // 若退出
            if (afrChooseOperation.canceled || afrChooseOperation.selection == undefined) {
                return false;
            }
            switch (afrChooseOperation.selection) {
                case 0: // 修改选项
                    {
                        let targetItemIndex = await chooseItem(data.snow[targetListKey], "选择要修改的选项");
                        if (targetItemIndex == undefined) {
                            return false;
                        }
                        let resultItem = await editItem("修改", data.snow[targetListKey].list[targetItemIndex]);
                        if (resultItem == undefined) {
                            return false;
                        }
                        data.snow[targetListKey].list[targetItemIndex] = resultItem;
                        saveData("@" + player.nameTag);
                    }
                    break;
                case 1: // 添加选项
                    {
                        let resultItem = await editItem("添加");
                        if (resultItem == undefined) {
                            return false;
                        }
                        data.snow[targetListKey].list.push(resultItem);
                        saveData("@" + player.nameTag);
                    }
                    break;
                case 2: // 删除选项
                    {
                        let targetItemIndex = await chooseItem(data.snow[targetListKey], "选择要删除的选项");
                        if (targetItemIndex == undefined) {
                            return false;
                        }
                        let msgResponse = await new MessageFormData()
                            .title("警告")
                            .body("确定删除此选项？")
                            .button1("确定删除")
                            .button2("还是算了")
                            .show(player);
                        if (msgResponse.selection == 1) {
                            data.snow[targetListKey].list.splice(targetItemIndex, 1);
                            saveData("@" + player.nameTag);
                        }
                        else {
                            return false;
                        }
                    }
                    break;
                case 3: // 移动选项
                    {
                        // 选择移动源
                        let originalItemIndex = await chooseItem(data.snow[targetListKey], "选择要移动的选项"); // TODO
                        if (originalItemIndex == undefined) {
                            return false;
                        }
                        // 选择目标列表
                        let destListKey = await chooseListFromAll("目标");
                        if (destListKey == undefined)
                            return false;
                        // 目标列表与源列表相同
                        let same = destListKey == targetListKey;
                        // 选择目标选项
                        let destListObj = data.snow[destListKey];
                        if (same) {
                            var tempItemObj = data.snow[destListKey].list.splice(originalItemIndex, 1)[0];
                        }
                        destListObj.list.push({ name: "", type: "null" });
                        let destItemIndex = await chooseItem(destListObj, "选择插入位置(所选按钮上方)");
                        if (destItemIndex == undefined)
                            return false;
                        let msgResponse = await new MessageFormData()
                            .title("提示")
                            .body("§l确定将选项: §r\n" +
                            data.snow[targetListKey].list[originalItemIndex] +
                            "\n从[" +
                            data.snow[destListKey].snow +
                            "第" +
                            (originalItemIndex + 1) +
                            "项 移动至[" +
                            data.snow[destListKey].name +
                            "]第" +
                            (destItemIndex + 1) +
                            "项?")
                            .button1("确定移动")
                            .button2("还是算了")
                            .show(player);
                        if (msgResponse.selection == 1) {
                            let itemObj = null;
                            if (same) {
                                itemObj = tempItemObj;
                            }
                            else {
                                itemObj = data.snow[targetListKey].list.splice(originalItemIndex, 1)[0];
                            }
                            data.snow[destListKey].list.splice(destItemIndex, 0, itemObj);
                            data.snow[destListKey].list.pop();
                            saveData("@" + player.nameTag);
                        }
                        else {
                            if (same)
                                data.snow[destListKey].list.splice(originalItemIndex, 0, tempItemObj);
                            data.snow[destListKey].list.pop();
                            return false;
                        }
                    }
                    break;
            }
            break;
        }
        return false;
    },
    admin_snow_editList: async function (player, list_key) {
        // 定义选择选项用的函数(列出所有菜单，让人选)
        async function chooseListFromAll(operation_name) {
            // 选择列表
            let afdChooseList = new ActionFormData().title("" + operation_name + "列表");
            let keyList = [];
            for (let item in data.snow) {
                if (data.snow[item].lock == undefined || data.snow[item].lock == false) {
                    keyList.push(item);
                    afdChooseList = afdChooseList.button(data.snow[item].name);
                }
            }
            let afrChooseList = await afdChooseList.show(player);
            if (afrChooseList.canceled || afrChooseList.selection == undefined)
                return undefined;
            return keyList[afrChooseList.selection];
        }
        // 定义选择菜单的函数
        async function chooseList(operation_name) {
            while (true) {
                // 选择方式
                let afrItemEditor2 = await new ActionFormData()
                    .title("" + operation_name + "列表")
                    .body("通过何种方式选择选择目标菜单？\n \n ")
                    .button("目标菜单列表")
                    .button("直接输入键名")
                    .show(player);
                if (afrItemEditor2.selection == undefined || afrItemEditor2.canceled) {
                    return undefined;
                }
                // 通过不同方式选择目标菜单
                switch (afrItemEditor2.selection) {
                    case 0: // 目标菜单列表
                        {
                            let targetListKey = await chooseListFromAll("跳转");
                            if (targetListKey == undefined || targetListKey == "")
                                return undefined;
                            return targetListKey;
                        }
                        break;
                    case 1: // 直接输入键名
                        {
                            let afrItemEditor2 = await new ModalFormData()
                                .title("" + operation_name + "选项")
                                .textField("输入目标菜单键名", "输入键名")
                                .toggle("允许修改上锁菜单", false)
                                .show(player);
                            if (afrItemEditor2.formValues == undefined || afrItemEditor2.canceled) {
                                return undefined;
                            }
                            if (afrItemEditor2.formValues[0] == undefined || afrItemEditor2.formValues[0].trim() == "") {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("目标菜单键名不可为空")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                                if (msfr.canceled || msfr.selection == 2) {
                                    return undefined;
                                }
                                continue;
                            }
                            // 检查是否存在
                            if (!data.snow[afrItemEditor2.formValues[0]]) {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("目标菜单不存在")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                                if (msfr.canceled || msfr.selection == 2) {
                                    return undefined;
                                }
                                continue;
                            }
                            // 检查是否上锁
                            if (data.snow[afrItemEditor2.formValues[0]].lock == true) {
                                if (afrItemEditor2.formValues[1] == undefined || afrItemEditor2.formValues[1] == false) {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("菜单已上锁，无法进行操作")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                else {
                                    if (isAdmin(player.nameTag)) {
                                        let msfr = await new MessageFormData()
                                            .title("警告")
                                            .body("目标菜单已上锁，请谨慎编辑!")
                                            .button1("确定")
                                            .button2("退出")
                                            .show(player);
                                        if (msfr.canceled || msfr.selection == 2) {
                                            return undefined;
                                        }
                                    }
                                    else {
                                        let msfr = await new MessageFormData()
                                            .title("错误")
                                            .body("菜单已上锁，无法进行操作")
                                            .button1("确定")
                                            .button2("退出")
                                            .show(player);
                                        if (msfr.canceled || msfr.selection == 2) {
                                            return undefined;
                                        }
                                        continue;
                                    }
                                }
                            }
                            // 返回
                            return afrItemEditor2.formValues[0];
                        }
                        break;
                    default:
                        throw new Error("[Admin] afrItemEditor2.selection ERROR @" + player.name);
                        return;
                }
            }
        }
        // 定义编辑菜单的函数
        async function editList(operation_name, check_repeat, raw_data) {
            // tellMessage(moduleName, JSON.stringify(raw_data));
            // 结果
            let resultKey = "";
            let resultList = {
                name: "",
                title: "",
                body: "",
                show_back: false,
                list: [],
            };
            // 若没给raw_data 用简单模板代替
            if (raw_data == undefined) {
                raw_data = {
                    snow_list: { name: "", title: "", body: "", show_back: false, list: [] },
                    key: "",
                };
            }
            while (true) {
                let afrListEditor1 = await new ModalFormData()
                    .title("" + operation_name + "列表")
                    .textField("§l列表键名§r\n不会被显示出来，为该菜单的唯一身份标识，不可重复\n同时作为JSON中该列表的键名", "输入列表键名", raw_data.key)
                    .textField("§l列表名称(可选)§r\n不会被显示出来，自助编辑菜单时方便标记\n可用双S符号调色，\\n换行。最多两行，每行最多约16个汉字(32个字母)", "输入显示名称, 不填默认为键名", raw_data.snow_list.name)
                    .textField("§l列表标题§r\n进入列表时的窗口标题\n可用双S符号调色", "输入显示名称", raw_data.snow_list.title)
                    .textField("§l提示文字(可选)§r\n显示在窗口内部上方的一段文字\n可用双S符号调色，\\n换行，具体字符不限", "输入提示文字", raw_data.snow_list.body)
                    .toggle("显示返回上一级菜单按钮", raw_data.snow_list.show_back)
                    .toggle("锁定菜单(仅管理员)", raw_data.snow_list.lock ?? false)
                    .show(player);
                if (afrListEditor1.canceled || afrListEditor1.formValues == undefined) {
                    return undefined;
                }
                // 若键名为空
                if (afrListEditor1.formValues[0].trim() == "") {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("列表键名不可为空")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                resultKey = afrListEditor1.formValues[0];
                // 查询键名是否重复
                if (check_repeat) {
                    let keyExist = false;
                    for (let key in data.snow) {
                        if (key == resultKey) {
                            keyExist = true;
                            break;
                        }
                    }
                    if (keyExist) {
                        let msfr = await new MessageFormData()
                            .title("错误")
                            .body("列表键名重复")
                            .button1("确定")
                            .button2("退出")
                            .show(player);
                        if (msfr.canceled || msfr.selection == 2) {
                            return undefined;
                        }
                        continue;
                    }
                }
                // 若上锁 查询是否为管理员
                if (afrListEditor1.formValues[5] && !isAdmin(player.nameTag)) {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("非管理员无法创建锁定列表")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                // 列表名字
                let listName = afrListEditor1.formValues[1].trim();
                resultList.name = listName == "" ? resultKey : listName;
                // 列表标题
                resultList.title = afrListEditor1.formValues[2];
                // 列表提示文字
                resultList.body = afrListEditor1.formValues[3];
                // 显示返回按钮
                resultList.show_back = afrListEditor1.formValues[4];
                // 成员选项
                resultList.list = raw_data.snow_list.list;
                // 上锁
                if (afrListEditor1.formValues[5]) {
                    resultList.lock = true;
                }
                // 完成
                let msfrFinish = await new MessageFormData()
                    .title("提示")
                    .body("请核对以下JSON信息，决定是否保存:\n" + JSON.stringify(resultList))
                    .button1("保存更改")
                    .button2("放弃更改")
                    .show(player);
                if (msfrFinish.canceled)
                    return;
                if (msfrFinish.selection == 1) {
                    return { snow_list: resultList, key: resultKey };
                }
                if (msfrFinish.selection == 2) {
                    return undefined;
                }
                return undefined;
            }
        }
        // 选择操作
        let afrChooseOperation = await new ActionFormData()
            .title("请选择要进行的操作")
            .button("添加列表")
            .button("删除列表")
            .button("编辑列表")
            .show(player);
        // 若退出
        if (afrChooseOperation.canceled || afrChooseOperation.selection == undefined) {
            return false;
        }
        switch (afrChooseOperation.selection) {
            case 0: // 添加列表
                {
                    let resultListData = await editList("添加", true);
                    if (resultListData == undefined)
                        return false;
                    data.snow[resultListData.key] = resultListData.snow_list;
                    saveData("@" + player.nameTag);
                }
                break;
            case 1: // 删除列表
                {
                    // 选择目标列表
                    let targetListKey = await chooseList("删除");
                    if (targetListKey == undefined) {
                        return false;
                    }
                    // 选择安全删除操作
                    let afrSafeResponse = await new ModalFormData()
                        .title("安全删除")
                        .toggle("对已上锁菜单执行下列操作(仅管理员)", false)
                        .toggle("删除所有跳转至目标菜单的选项", true)
                        .show(player);
                    if (afrSafeResponse.canceled || afrSafeResponse.formValues == undefined)
                        return false;
                    // 警告
                    let msgResponse = await new MessageFormData()
                        .title("警告")
                        .body("§l确定删除菜单?§r\n目标菜单键名: " + targetListKey + "\n菜单名称: " + data.snow[targetListKey].name)
                        .button1("确定删除")
                        .button2("还是算了")
                        .show(player);
                    // 安全删除操作
                    if (afrSafeResponse.formValues[1] == true) {
                        let ignoreLocked = afrSafeResponse.formValues[0] == false || !isAdmin(player.nameTag);
                        // 遍历菜单
                        for (let key in data.snow) {
                            if (ignoreLocked && data.snow[key].lock == true)
                                continue;
                            let length = data.snow[key].list.length;
                            // 遍历选项
                            for (let i = 0; i < length; ++i) {
                                if (data.snow[key].list[i].type == "route" && data.snow[key].list[i].destination == targetListKey) {
                                    data.snow[key].list.splice(i, 1);
                                    --length;
                                    --i;
                                }
                            }
                        }
                    }
                    // 删除并保存
                    if (msgResponse.selection == 1) {
                        data.snow[targetListKey] = undefined;
                        await saveData("@" + player.nameTag);
                        reloadData(); // TODO
                    }
                    else {
                        return false;
                    }
                }
                break;
            case 2: // 编辑列表
                {
                    // 选择菜单
                    let targetListKey = await chooseList("编辑");
                    if (targetListKey == undefined) {
                        return false;
                    }
                    // 编辑菜单
                    let resultListData = await editList("编辑", false, {
                        key: targetListKey,
                        snow_list: data.snow[targetListKey],
                    });
                    if (resultListData == undefined)
                        return false;
                    if (targetListKey != resultListData.key) {
                        data.snow[targetListKey] = undefined;
                    }
                    data.snow[resultListData.key] = resultListData.snow_list;
                    saveData("@" + player.nameTag);
                }
                break;
            default:
                throw new Error("[Admin] afrChooseOperation.selection ERROR @" + player.name);
                return true;
        }
        return false;
    },
    admin_settings_newPlayer: async function (player, list_key) {
        while (true) {
            let mfr = await new ModalFormData()
                .title("新成员管理")
                .textField("新成员判定标签\n§o无标签则判定为新成员", "输入标签", data.settings.new_player.limit_tag)
                .toggle("允许使用雪球菜单", data.settings.new_player.allow_snow)
                .textField("§l新人建筑区坐标\n§r起始点X坐标", "输入坐标", "" + data.settings.new_player.allow_area.begin_x)
                .textField("起始点Z坐标", "输入坐标", "" + data.settings.new_player.allow_area.begin_z)
                .textField("结束点X坐标", "输入坐标", "" + data.settings.new_player.allow_area.end_x)
                .textField("结束点Z坐标", "输入坐标", "" + data.settings.new_player.allow_area.end_z)
                .toggle("雪球菜单访客模式", data.settings.new_player.guest_snow)
                .show(player);
            if (mfr.canceled || mfr.formValues == undefined)
                return false;
            if (mfr.formValues[0].trim() == "") {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("判定标签不可为空")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2) {
                    return false;
                }
                continue;
            }
            if (mfr.formValues[2].trim() == "" ||
                isNaN(Number(mfr.formValues[2].trim())) ||
                mfr.formValues[3].trim() == "" ||
                isNaN(Number(mfr.formValues[3].trim())) ||
                mfr.formValues[4].trim() == "" ||
                isNaN(Number(mfr.formValues[4].trim())) ||
                mfr.formValues[5].trim() == "" ||
                isNaN(Number(mfr.formValues[5].trim()))) {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("请输入正确坐标")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2) {
                    return false;
                }
                continue;
            }
            data.settings.new_player.limit_tag = mfr.formValues[0];
            data.settings.new_player.allow_snow = mfr.formValues[1];
            data.settings.new_player.allow_area.begin_x = Number(mfr.formValues[2].trim());
            data.settings.new_player.allow_area.begin_z = Number(mfr.formValues[3].trim());
            data.settings.new_player.allow_area.end_x = Number(mfr.formValues[4].trim());
            data.settings.new_player.allow_area.end_z = Number(mfr.formValues[5].trim());
            data.settings.new_player.guest_snow = mfr.formValues[6];
            saveData("@" + player.name);
            // let msfr = await new MessageFormData()
            //   .title("提示")
            //   .body("在服务端执行reload后生效")
            //   .button1("确定")
            //   .button2("退出")
            //   .show(player);
            return false;
        }
    },
    admin_settings_world: async function (player, list_key) {
        let mfr = await new ModalFormData()
            .title("世界选项")
            .toggle("允许爆炸", data.settings.world.allow_explode)
            .show(player);
        if (mfr.canceled || mfr.formValues == undefined)
            return false;
        data.settings.world.allow_explode = mfr.formValues[0];
        saveData("@" + player.name);
        return false;
    },
    admin_userManager: async function (player, list_key) {
        let afr = await new ActionFormData()
            .title("玩家信息列表")
            .body("如何选择目标玩家")
            .button("在线玩家列表")
            .button("输入玩家ID")
            .show(player);
        if (afr.canceled || afr.selection == undefined)
            return false;
        // 在线玩家数组
        let playerList = [];
        for (let item of world.getPlayers()) {
            playerList.push(item);
            // tellMessage(moduleName, "Push Player: " + item.name);
        }
        let targetPlayer = "";
        let resultData = {};
        if (afr.selection == 0) {
            // 在线玩家列表
            let afd2 = new ActionFormData().title("玩家信息列表").body("选择一个在线玩家以查看信息");
            for (let i = 0; i < playerList.length; ++i) {
                afd2 = afd2.button(playerList[i].name);
            }
            let afr2 = await afd2.show(player);
            if (afr2.canceled || afr2.selection == undefined)
                return false;
            targetPlayer = playerList[afr2.selection].name;
            // tellMessage(moduleName, "targetPlayer = " + targetPlayer);
            resultData = data.players[targetPlayer];
        }
        else if (afr.selection == 1) {
            // 输入玩家ID
            while (true) {
                let mfr = await new ModalFormData().title("玩家信息列表").textField("玩家ID", "输入玩家ID").show(player);
                if (mfr.canceled || mfr.formValues == undefined)
                    return false;
                if (mfr.formValues[0].trim() == "") {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("玩家ID不可为空")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return false;
                    }
                    continue;
                }
                if (!data.players[mfr.formValues[0].trim()]) {
                    let msfr = await new MessageFormData()
                        .title("提示")
                        .body("玩家ID:" + mfr.formValues[0].trim() + "\n该玩家信息不存在")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return false;
                    }
                    continue;
                    // if (msfr.selection == 2) continue;
                }
                targetPlayer = mfr.formValues[0].trim();
                // resultData = {
                //   job: "无",
                //   goodat: "未知",
                //   money: 0,
                //   place: "无籍贯",
                //   last_login: 0,
                //   last_checkin: 0,
                //   checkin_times: 0,
                // };
                // break;
                resultData = data.players[targetPlayer];
                break;
            } // while
        } // else if
        //查看和编辑
        let job = data.players[targetPlayer]
            ? data.players[targetPlayer].job ?? data.settings.players.default_job
            : data.settings.players.default_job;
        let goodat = data.players[targetPlayer]
            ? data.players[targetPlayer].goodat ?? data.settings.players.default_goodat
            : data.settings.players.default_goodat;
        let place = data.players[targetPlayer]
            ? data.players[targetPlayer].place ?? data.settings.players.default_place
            : data.settings.players.default_place;
        let online_time = getPlayerScore(world.scoreboard.getObjective("time"), targetPlayer) ?? "null";
        let money = data.players[targetPlayer]
            ? data.players[targetPlayer].money ?? data.settings.players.default_money
            : data.settings.players.default_money;
        let checkin_times = data.players[targetPlayer]
            ? data.players[targetPlayer].checkin_times ?? data.settings.players.default_checkin_times
            : data.settings.players.default_checkin_times;
        let bCheckin = false;
        let bOnline = playerList.find((item) => {
            return item.name == targetPlayer;
        })
            ? true
            : false;
        let last_login = bOnline
            ? "在线中"
            : data.players[targetPlayer]
                ? (() => {
                    if (!data.players[targetPlayer].last_login || data.players[targetPlayer].last_login == "0")
                        return "从未上线";
                    let date = new Date(data.players[targetPlayer].last_login);
                    date.setTime(date.getTime() + 28800000);
                    return ("" +
                        date.getFullYear() +
                        "年" +
                        (date.getMonth() + 1) +
                        "月" +
                        date.getDate() +
                        "日 §l" +
                        date.getHours() +
                        ":" +
                        (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
                        "§r");
                })()
                : "从未上线";
        let last_checkin = data.players[targetPlayer]
            ? data.players[targetPlayer].last_checkin > 0
                ? (() => {
                    let date = data.players[targetPlayer].last_checkin;
                    return Math.floor(date / 10000) + "年" + (Math.floor(date / 100) % 100) + "月" + (date % 100) + "日";
                })()
                : "从未签到"
            : "从未签到";
        if (data.players[targetPlayer]) {
            if (data.players[targetPlayer].last_checkin == getDate()) {
                bCheckin = true;
            }
        }
        //显示
        let afd2 = new ActionFormData()
            .title("玩家信息")
            .body("" +
            "\n§r§l玩家ID:             §r§e" +
            targetPlayer +
            "\n§r§l职业:               §r§e" +
            job +
            "\n§r§l特长:               §r§e" +
            goodat +
            "\n§r§l所在籍:             §r§e" +
            place +
            "\n§r§l在线总时长:         §r§e" +
            online_time +
            " 分钟" +
            "\n§r§l金币:               §r§e" +
            money +
            "\n§r§l签到总天数:         §r§e" +
            checkin_times +
            "\n§r§l最近一次上线:       §r§e" +
            last_login +
            "\n§r§l最近一次签到:       §r§e" +
            last_checkin +
            "\n\n§r§e" +
            (bCheckin ? "今日已签到" : "今日未签到"))
            .button("返回上一级");
        if (isAdmin(player.nameTag)) {
            afd2 = afd2.button("编辑信息");
        }
        let afr2 = await afd2.show(player);
        if (afr2.canceled || afr2.selection == undefined || afr2.selection == 0)
            return false;
        if (afr2.selection == 1 && isAdmin(player.name)) {
            while (true) {
                // 编辑信息
                let mfr = await new ModalFormData()
                    .title("编辑玩家[" + targetPlayer + "]信息")
                    .textField("职位", "在此输入", job)
                    .textField("特长", "在此输入", goodat)
                    .textField("所在籍", "在此输入", place)
                    .textField("金币", "在此输入", "" + money)
                    .show(player);
                if (mfr.canceled || mfr.formValues == undefined)
                    return false;
                if (isNaN(Number(mfr.formValues[3]))) {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("金币必须为数字！")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return false;
                    }
                    if (msfr.selection == 1)
                        continue;
                }
                resultData.job = mfr.formValues[0].trim() == "" ? data.settings.players.default_job : mfr.formValues[0].trim();
                resultData.goodat =
                    mfr.formValues[1].trim() == "" ? data.settings.players.default_goodat : mfr.formValues[1].trim();
                resultData.place =
                    mfr.formValues[2].trim() == "" ? data.settings.players.default_place : mfr.formValues[2].trim();
                resultData.money = Number(mfr.formValues[3].trim());
                // 完成
                let msfrFinish = await new MessageFormData()
                    .title("提示")
                    .body("请核对以下JSON信息，决定是否保存:\n" + JSON.stringify(resultData))
                    .button1("保存更改")
                    .button2("放弃更改")
                    .show(player);
                if (msfrFinish.canceled)
                    return false;
                if (msfrFinish.selection == 1) {
                    data.players[targetPlayer] = resultData;
                    await saveData("@" + player.name);
                    reloadData();
                }
                return false;
            }
        }
        return true;
    },
    admin_sweeper_runAll: async function (player, list_key) {
        tellMessage(data.settings.entity_clear.sender, "§e@" + player.name + "§r 喊我扫地啦！");
        data.settings.entity_clear.config.forEach((config) => {
            if (!config.enable)
                return;
            clearEntity(config);
        });
        return false;
    },
    admin_sweeper_manage: async function (player, list_key) {
        async function chooseConfig() {
            let length = data.settings.entity_clear.config.length;
            let afd = new ActionFormData().title("配置管理").body("请选择一个配置");
            if (length == 0) {
                afd = afd.button("(无配置)");
            }
            else {
                data.settings.entity_clear.config.forEach((config) => {
                    afd = afd.button(config.name);
                });
            }
            let afr = await afd.show(player);
            if (afr.canceled || afr.selection == undefined)
                return undefined;
            return afr.selection;
        }
        async function chooseList(config) {
            let length = config.list.length;
            if (length == 0) {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("该配置无实体组，请先至少添加一个实体组！")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                return undefined;
            }
            let afd = new ActionFormData().title("选择一个实体组");
            for (let i = 0; i < length; ++i) {
                afd = afd.button(config.list[i].name);
            }
            let afr = await afd.show(player);
            if (afr.canceled == true || afr.selection == undefined)
                return undefined;
            return afr.selection;
        }
        async function editConfigHead(config = {
            // default config
            enable: true,
            name: "新配置",
            show: "新配置",
            display: true,
            time: 300,
            forecast: true,
            foretime: 15,
            last_clear: 0,
            forecasted: false,
            list: [],
        }) {
            while (true) {
                let mdr = await new ModalFormData()
                    .title("编辑配置-运行规则")
                    .toggle("启用此配置", config.enable)
                    .textField("配置名称", "输入配置名称", config.name)
                    .textField('显示名称(如："即将清理XXX"的XXX)', "输入显示名称", config.show)
                    .toggle("清理时在聊天栏中提示", config.display)
                    .textField("清理周期(秒)", "输入清理周期", "" + config.time)
                    .toggle("清理前提醒", config.forecast)
                    .slider("清理前多久提醒(秒)", 3, 300, 1, config.foretime)
                    .show(player);
                if (mdr.canceled || mdr.formValues == undefined)
                    return undefined;
                if (mdr.formValues[1].trim() == "") {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("配置名字不可为空")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                if (mdr.formValues[2].trim() == "") {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("显示名称不可为空")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                if (mdr.formValues[4].trim() == "" ||
                    isNaN(Number(mdr.formValues[4].trim())) ||
                    Number(mdr.formValues[4].trim()) <= 0) {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("不正确的清理周期！")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                if (mdr.formValues[6] >= Number(mdr.formValues[4].trim())) {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("清理前提醒时间大于或等于运行周期！")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                config.enable = mdr.formValues[0];
                config.name = mdr.formValues[1];
                config.show = mdr.formValues[2];
                config.display = mdr.formValues[3];
                config.time = mdr.formValues[4];
                config.forecast = mdr.formValues[5];
                config.foretime = mdr.formValues[6];
                return config;
                break;
            }
        }
        async function editConfig(config = {
            // default config
            enable: true,
            name: "新配置",
            show: "",
            display: true,
            time: 300,
            forecast: true,
            foretime: 15,
            last_clear: 0,
            forecasted: false,
            list: [],
        }) {
            let resultConfig = {
                enable: config.enable,
                name: config.name,
                show: config.show,
                display: config.display,
                time: config.time,
                forecast: config.forecast,
                foretime: config.foretime,
                last_clear: config.last_clear,
                forecasted: config.forecasted,
                list: [],
            };
            // 深拷贝
            let length = config.list.length;
            for (let i = 0; i < length; ++i) {
                let item = { name: config.list[i].name, types: new Array() };
                let length2 = config.list[i].types.length;
                for (let j = 0; j < length2; ++j) {
                    item.types.push(config.list[i].types[j].concat());
                }
                resultConfig.list.push(item);
            }
            while (true) {
                let afr = await new ActionFormData()
                    .title("编辑配置:" + config.name)
                    .body("请选择一个选项")
                    .button("运行规则")
                    .button("管理实体")
                    .button("删除实体")
                    .button("添加实体")
                    .show(player);
                if (afr.canceled || afr.selection == undefined)
                    return undefined;
                switch (afr.selection) {
                    case 0: //运行规则
                        if (!(await editConfigHead(resultConfig))) {
                            return undefined;
                        }
                        break;
                    case 1: //管理实体
                        {
                            let targetList = await chooseList(config);
                            if (targetList == undefined)
                                return false;
                            let length = config.list[targetList].types.length;
                            if (length == 0) {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("该实体组无可用实体，请先至少添加一个实体！")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                                return undefined;
                            }
                            let mfd = new ModalFormData().title("要清除哪些实体？");
                            for (let i = 0; i < length; ++i) {
                                mfd = mfd.toggle("" +
                                    config.list[targetList].types[i][0] +
                                    (config.list[targetList].types[i][2] ? " (" + config.list[targetList].types[i][2] + ")" : ""), config.list[targetList].types[i][1]);
                            }
                            let mfr = await mfd.show(player);
                            if (mfr.canceled == true || mfr.formValues == undefined)
                                return undefined;
                            for (let i = 0; i < length; ++i) {
                                resultConfig.list[targetList].types[i][1] = mfr.formValues[i];
                            }
                        }
                        break;
                    case 2: //删除实体
                        {
                            let targetList = await chooseList(config);
                            if (targetList == undefined)
                                return false;
                            let length = config.list[targetList].types.length;
                            if (length == 0) {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("该实体组无可用实体，请先至少添加一个实体！")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                                return undefined;
                            }
                            let mfd = new ActionFormData().title("编辑配置-删除实体");
                            for (let i = 0; i < length; ++i) {
                                mfd = mfd.button("" +
                                    config.list[targetList].types[i][0] +
                                    (config.list[targetList].types[i][2] ? " (" + config.list[targetList].types[i][2] + ")" : ""));
                            }
                            let mfr = await mfd.show(player);
                            if (mfr.canceled == true || mfr.selection == undefined)
                                return undefined;
                            let msgResponse = await new MessageFormData()
                                .title("警告")
                                .body("确定删除实体：" +
                                "" +
                                config.list[targetList].types[mfr.selection][0] +
                                (config.list[targetList].types[mfr.selection][2]
                                    ? " (" + config.list[targetList].types[mfr.selection][2] + ")"
                                    : "") +
                                "？")
                                .button1("确定删除")
                                .button2("还是算了")
                                .show(player);
                            if (msgResponse.selection == 1) {
                                resultConfig.list[targetList].types.splice(mfr.selection, 1);
                            }
                            else {
                                return undefined;
                            }
                        }
                        break;
                    case 3: //添加实体
                        {
                            let targetList = await chooseList(config);
                            if (targetList == undefined)
                                return false;
                            while (true) {
                                let mfr = await new ModalFormData()
                                    .title("编辑配置-添加实体")
                                    .textField("实体ID", "输入实体ID")
                                    .toggle("清除该实体", true)
                                    .textField("实体中文备注(选填)", "输入实体中文备注")
                                    .show(player);
                                if (mfr.canceled || mfr.formValues == undefined)
                                    return undefined;
                                if (mfr.formValues[0].trim() == "") {
                                    let msfr = await new MessageFormData()
                                        .title("错误")
                                        .body("实体ID不可为空")
                                        .button1("确定")
                                        .button2("退出")
                                        .show(player);
                                    if (msfr.canceled || msfr.selection == 2) {
                                        return undefined;
                                    }
                                    continue;
                                }
                                if (mfr.formValues[2].trim() == "")
                                    resultConfig.list[targetList].types.push([mfr.formValues[0].trim(), mfr.formValues[1]]);
                                else
                                    resultConfig.list[targetList].types.push([
                                        mfr.formValues[0].trim(),
                                        mfr.formValues[1],
                                        mfr.formValues[2].trim(),
                                    ]);
                                break;
                            }
                        }
                        break;
                } // switch
                // 完成
                let msfrFinish = await new MessageFormData()
                    .title("提示")
                    .body("请核对以下JSON信息，决定是否保存:\n" + JSON.stringify(resultConfig))
                    .button1("保存更改")
                    .button2("放弃更改")
                    .show(player);
                if (msfrFinish.canceled)
                    return;
                if (msfrFinish.selection == 1) {
                    return resultConfig;
                }
                return undefined;
            } // while
        }
        let afr = await new ActionFormData()
            .title("配置管理")
            .body("请选择一个选项")
            .button("编辑配置")
            .button("添加配置")
            .button("删除配置")
            .show(player);
        if (afr.canceled || afr.selection == undefined)
            return false;
        switch (afr.selection) {
            case 0: //编辑配置
                {
                    let targetConfig = await chooseConfig();
                    if (targetConfig == undefined) {
                        return false;
                    }
                    let resultConfig = await editConfig(data.settings.entity_clear.config[targetConfig]);
                    if (resultConfig == undefined) {
                        return false;
                    }
                    data.settings.entity_clear.config[targetConfig] = resultConfig;
                    await saveData("@" + player.name);
                    reloadData();
                }
                break;
            case 1: //添加配置
                {
                    let resultConfig = await editConfigHead();
                    if (resultConfig == undefined) {
                        return false;
                    }
                    data.settings.entity_clear.config.push(resultConfig);
                    saveData("@" + player.name);
                }
                break;
            case 2: //删除配置
                {
                    let targetConfig = await chooseConfig();
                    if (targetConfig == undefined) {
                        return false;
                    }
                    let msgResponse = await new MessageFormData()
                        .title("警告")
                        .body("确定删除配置：" + data.settings.entity_clear.config[targetConfig].name + "？")
                        .button1("确定删除")
                        .button2("还是算了")
                        .show(player);
                    if (msgResponse.selection == 1) {
                        data.settings.entity_clear.config.splice(targetConfig, 1);
                        saveData("@" + player.nameTag);
                    }
                    else {
                        return false;
                    }
                }
                break;
        }
        return false;
    },
    admin_sweeper_settings: async function (player, list_key) {
        while (true) {
            let mfr = await new ModalFormData()
                .title("实体清除-全局设置")
                .textField("实体清除机器人名字", "输入名字", data.settings.entity_clear.sender)
                .toggle("启用实体清除", data.settings.entity_clear.enable)
                .show(player);
            if (mfr.canceled || mfr.formValues == undefined)
                return false;
            if (mfr.formValues[0].trim() == "") {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("实体清除机器人名字不可为空")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2) {
                    return false;
                }
                continue;
            }
            data.settings.entity_clear.sender = mfr.formValues[0].trim();
            data.settings.entity_clear.enable = mfr.formValues[1];
            saveData("@" + player.name);
            return false;
        }
    },
    getLightBlock: async function (player, list_key) {
        let mfr = await new ModalFormData()
            .title("获取光明方块")
            .slider("亮度", 0, 15, 1, 15)
            .slider("数量", 1, 64, 1, 64)
            .show(player);
        if (mfr.canceled || mfr.formValues == undefined)
            return false;
        player.runCommandAsync("give @s light_block " + mfr.formValues[1] + " " + mfr.formValues[0]);
        return false;
    },
    checkIn: async function (player, list_key) {
        let bCheckin = false;
        if (data.players[player.name]) {
            if (data.players[player.name].last_checkin == getDate()) {
                bCheckin = true;
            }
        }
        if (bCheckin) {
            // 已经签到过了
            let msgResponse = await new MessageFormData()
                .title("提示")
                .body("§l你已经签到过了，明天再来吧！")
                .button1("返回上一级")
                .button2("退出菜单")
                .show(player);
            if (msgResponse.canceled || msgResponse.selection == 1) {
                return false;
            }
            return true;
        }
        else {
            // 未签到
            data.players[player.name].last_checkin = getDate();
            data.players[player.name].money += 10;
            data.players[player.name].checkin_times += 1;
            saveData("@" + player.name);
            tellMessage("§a§l系统", "§l§e" + player.name + " §r今日§l§a已签到§r！ (金币+§e10§r)");
            let msgResponse = await new MessageFormData()
                .title("提示")
                .body("§a§l签到成功!§r(金币§e+10§r)\n" +
                "\n签到总天数: " +
                data.players[player.name].checkin_times +
                "\n当前金币:  " +
                data.players[player.name].money)
                .button1("返回上一级")
                .button2("退出菜单")
                .show(player);
            if (msgResponse.canceled || msgResponse.selection == 1) {
                return false;
            }
            return true;
        }
    },
    backup_add: async function (player, list_key) {
        let resultBackup = {
            path: "" +
                (() => {
                    let date = new Date();
                    date.setTime(date.getTime() + 28800000);
                    return (date.getFullYear() * 100000000 +
                        (date.getMonth() + 1) * 1000000 +
                        date.getDate() * 10000 +
                        date.getHours() * 100 +
                        date.getMinutes());
                })(),
            append: "",
            creater: player.name,
            auto: false,
        };
        while (true) {
            let mfr = await new ModalFormData()
                .title("备份存档")
                .textField("备份名称(同时作为存档文件夹名称)", "输入备份名称", resultBackup.path)
                .textField("备注", "输入备注", resultBackup.append)
                .show(player);
            if (mfr.canceled || mfr.formValues == undefined)
                return false;
            if (mfr.formValues[0].trim() == "") {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("备份名称不可为空")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2) {
                    return false;
                }
                continue;
            }
            let path = mfr.formValues[0].trim();
            if (backupInfo.list.forEach((e) => {
                return e.path == path;
            })) {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("备份名称重复")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2) {
                    return false;
                }
                continue;
            }
            resultBackup.path = mfr.formValues[0];
            resultBackup.append = mfr.formValues[1];
            let msfr = await new MessageFormData()
                .title("提示")
                .body("确定备份存档？\n备份名称: " + resultBackup.path + "\n备注: " + resultBackup.append)
                .button1("确定")
                .button2("退出")
                .show(player);
            if (msfr.canceled || msfr.selection == 2) {
                return false;
            }
            // 创建备份
            let resultArray = await backup(resultBackup, "@" + player.nameTag);
            reloadBackupInfo();
            if (resultArray[0]) {
                let msfr = await new MessageFormData()
                    .title("提示")
                    .body("备份创建完成")
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                return false;
            }
            else {
                let msfr = await new MessageFormData()
                    .title("提示")
                    .body("备份创建失败:" + resultArray[1])
                    .button1("确定")
                    .button2("退出")
                    .show(player);
                if (msfr.canceled || msfr.selection == 2)
                    return false;
                continue;
            }
            // break;
        } // while
    },
    backup_list: async function (player, list_key) {
        async function editBackupInfo(info = {
            path: "" +
                (() => {
                    let date = new Date();
                    date.setTime(date.getTime() + 28800000);
                    return (date.getFullYear() * 100000000 +
                        (date.getMonth() + 1) * 1000000 +
                        date.getDate() * 10000 +
                        date.getHours() * 100 +
                        date.getMinutes());
                })(),
            append: "",
            creater: player.name,
            auto: false,
        }) {
            let resultInfo = {
                ...info,
            };
            while (true) {
                let mfr = await new ModalFormData()
                    .title("备份存档")
                    .textField("备份名称(同时作为存档文件夹名称)", "输入备份名称", info.path)
                    .textField("备注", "输入备注", info.append)
                    .show(player);
                if (mfr.canceled || mfr.formValues == undefined)
                    return undefined;
                if (mfr.formValues[0].trim() == "") {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("备份名称不可为空")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                let path = mfr.formValues[0].trim();
                if (backupInfo.list.forEach((e) => {
                    return e.path == path;
                })) {
                    let msfr = await new MessageFormData()
                        .title("错误")
                        .body("备份名称重复")
                        .button1("确定")
                        .button2("退出")
                        .show(player);
                    if (msfr.canceled || msfr.selection == 2) {
                        return undefined;
                    }
                    continue;
                }
                resultInfo.path = mfr.formValues[0].trim();
                resultInfo.append = mfr.formValues[1];
                return resultInfo;
                // let msfr = await new MessageFormData()
                //   .title("警告")
                //   .body("确定备份存档？\n备份名称: " + resultInfo.path + "\n备注: " + resultInfo.append)
                //   .button1("确定")
                //   .button2("退出")
                //   .show(player);
                // if (msfr.canceled || msfr.selection == 2) {
                //   return undefined;
                // }
                // break;
            } // while
        }
        async function chooseBackupInfo() {
            let length = backupInfo.list.length;
            let afd = new ActionFormData().title("备份列表").body("选择一个备份");
            if (length == 0) {
                afd = afd.button("(列表为空)");
            }
            else {
                for (let i = 0; i < length; ++i) {
                    let date = new Date(backupInfo.list[i].utc);
                    date.setTime(date.getTime() + 28800000);
                    let createDate = "" +
                        date.getFullYear() +
                        "/" +
                        (date.getMonth() + 1) +
                        "/" +
                        date.getDate() +
                        " " +
                        date.getHours() +
                        ":" +
                        (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
                    afd = afd.button("§l" +
                        backupInfo.list[i].path +
                        "§r" +
                        (backupInfo.list[i].auto ? "(自动备份)" : "") +
                        "\n" +
                        "§o@" +
                        backupInfo.list[i].creater +
                        "  " +
                        createDate);
                } // for
                let afr = await afd.show(player);
                if (length == 0 || afr.canceled || afr.selection == undefined) {
                    return undefined;
                }
                return afr.selection;
            }
        }
        while (true) {
            // 选择
            let targetInfo = await chooseBackupInfo();
            if (targetInfo == undefined)
                return false;
            // 查看 选择操作
            let date = new Date(backupInfo.list[targetInfo].utc);
            date.setTime(date.getTime() + 28800000);
            let createDate = "" +
                date.getFullYear() +
                "年" +
                (date.getMonth() + 1) +
                "月" +
                date.getDate() +
                "日 §l" +
                date.getHours() +
                ":" +
                (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
                "§r";
            let afr = await new ActionFormData()
                .title("备份详细")
                .body("备份名称(路径): " +
                backupInfo.list[targetInfo].path +
                "\n备份创建者: " +
                backupInfo.list[targetInfo].creater +
                "\n自动创建: " +
                (backupInfo.list[targetInfo].auto ? "是" : "否") +
                "\n备份创建时间: " +
                createDate +
                "\n备份大小: " +
                (backupInfo.list[targetInfo].size / 1024 / 1024).toFixed(2) +
                " MB" +
                "\n备注: " +
                backupInfo.list[targetInfo].append)
                .button("立即回档")
                .button("删除备份")
                .show(player);
            if (afr.canceled || afr.selection == undefined)
                continue;
            switch (afr.selection) {
                // case 0: // 编辑信息
                //   {
                //     let resultInfo = await editBackupInfo({
                //       path: backupInfo.list[targetInfo].path,
                //       creater: backupInfo.list[targetInfo].creater,
                //       append: backupInfo.list[targetInfo].append,
                //       auto: backupInfo.list[targetInfo].auto,
                //     });
                //     if (resultInfo == undefined) continue;
                //     backupInfo.list[targetInfo].path = resultInfo.path;
                //     backupInfo.list[targetInfo].append = resultInfo.append;
                //     saveBackupInfo();
                //     // reloadBackupInfo();
                //     return false;
                //   }
                //   break;
                case 0: // 立即回档
                    {
                        let mdr = await new ModalFormData().title("立即回档").textField("回档原因", "请输入回档原因").show(player);
                        if (mdr.canceled || mdr.formValues == undefined) {
                            continue;
                        }
                        let callback = async (e) => {
                            if (e[0]) {
                                // 成功
                                tellMessage("§b§l系统", "由 §e§l@" +
                                    player.name +
                                    " §r发起的回档请求已被接收\n§a目标备份名称: §r" +
                                    backupInfo.list[targetInfo ?? ""].path +
                                    "\n§a§l目标备份备注: §r" +
                                    backupInfo.list[targetInfo ?? ""].append +
                                    "\n§a§l目标备份创建者: §r" +
                                    backupInfo.list[targetInfo ?? ""].creater +
                                    "\n§a§l目标备份创建时间: §r" +
                                    createDate +
                                    "\n§a§l回档原因: " +
                                    (mdr.formValues == undefined ? "无" : mdr.formValues[0]));
                                tellMessage("§b§l系统", "服务器将在 §e§l10秒§r 后§c§l自动关闭§r，并在回档完成后§a§l自动重启§r！");
                                let msfr = await new MessageFormData()
                                    .title("提示")
                                    .body("回档请求成功: " + e[1] + "\n将在十秒后自动关闭游戏服务端，并在回档完成后重新启动。")
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                            }
                            else {
                                let msfr = await new MessageFormData()
                                    .title("错误")
                                    .body("回档请求失败: " + e[1])
                                    .button1("确定")
                                    .button2("退出")
                                    .show(player);
                            }
                        };
                        callback(await restore(backupInfo.list[targetInfo].path, "@" + player.name + " Result: " + mdr.formValues[0]));
                        return true;
                    }
                    break;
                case 1: // 删除备份
                    {
                        let msfr = await new MessageFormData()
                            .title("提示")
                            .body("确定要删除此备份？")
                            .button1("确定")
                            .button2("退出")
                            .show(player);
                        if (msfr.canceled || msfr.selection == undefined || msfr.selection == 2) {
                            continue;
                        }
                        // 删除操作
                        let resultArray = await delBackup(backupInfo.list[targetInfo].path, "@" + player.name);
                        reloadBackupInfo();
                        if (resultArray[0]) {
                            let msfr = await new MessageFormData()
                                .title("提示")
                                .body("备份删除完成")
                                .button1("确定")
                                .button2("退出")
                                .show(player);
                            if (msfr.canceled || msfr.selection == 2)
                                return false;
                            continue;
                        }
                        else {
                            let msfr = await new MessageFormData()
                                .title("提示")
                                .body("备份删除失败:" + resultArray[1])
                                .button1("确定")
                                .button2("退出")
                                .show(player);
                            if (msfr.canceled || msfr.selection == 2)
                                return false;
                            continue;
                        }
                    }
                    break;
            } // switch
        } // while
    },
    backup_settings: async function (player, list_key) {
        while (true) {
            let mdr = await new ModalFormData()
                .title("备份设置")
                .toggle("自动备份", backupInfo.auto_backup)
                .slider("自动备份", 1, 72, 1, backupInfo);
        }
    },
};
const strScripts = {
    test: async function (player, list_key) {
        tellMessage(moduleName, "Script Test.");
        return "test";
    },
    getUserBody: async function (player, list_key) {
        let name = player.name;
        if (data == undefined)
            return "获取信息失败";
        let job = data.players[player.name]
            ? data.players[player.name].job ?? data.settings.players.default_job
            : data.settings.players.default_job;
        let goodat = data.players[player.name]
            ? data.players[player.name].goodat ?? data.settings.players.default_goodat
            : data.settings.players.default_goodat;
        let place = data.players[player.name]
            ? data.players[player.name].place ?? data.settings.players.default_place
            : data.settings.players.default_place;
        let online_time = getPlayerScore(world.scoreboard.getObjective("time"), player) ?? "null";
        let money = data.players[player.name]
            ? data.players[player.name].money ?? data.settings.players.default_money
            : data.settings.players.default_money;
        let checkin_times = data.players[player.name]
            ? data.players[player.name].checkin_times ?? data.settings.players.default_checkin_times
            : data.settings.players.default_checkin_times;
        let bCheckin = false;
        if (data.players[player.name]) {
            if (data.players[player.name].last_checkin == getDate()) {
                bCheckin = true;
            }
        }
        return ("\n§r§l玩家ID:             §r§e" +
            name +
            "\n§r§l职业:               §r§e" +
            job +
            "\n§r§l特长:               §r§e" +
            goodat +
            "\n§r§l所在籍:             §r§e" +
            place +
            "\n§r§l在线总时长:         §r§e" +
            online_time +
            " 分钟" +
            "\n§r§l金币:               §r§e" +
            money +
            "\n§r§l签到总天数:         §r§e" +
            checkin_times +
            "\n\n§r§e" +
            (bCheckin ? "今日已签到" : "今日未签到"));
    },
    getSweeperBody: async function (player, list_key) {
        return ("§a§l欢迎使用扫地姬！§r\n我们的职责是§e§l清理服务器的多余喵~！§r\n扫地姬§b§l累计清理实体数§r: §l§r喵~" +
            data.settings.entity_clear.total_clear +
            "§r\n请选择一个选项喵~：");
    },
    getBackupBody: async function (player, list_key) {
        let date = new Date(backupInfo.last_backup_utc);
        date.setTime(date.getTime() + 28800000);
        return ("欢迎来到备份管理" +
            "\n§r§l当前备份存档总数:       §r§e" +
            backupInfo.list.length +
            "\n§r§l服务器磁盘已使用空间:   §r§e" +
            (backupInfo.disk.used_size / 1024 / 1024 / 1024).toFixed(2) +
            "GB / " +
            (backupInfo.disk.total_size / 1024 / 1024 / 1024).toFixed(2) +
            "GB" +
            "\n§r§l服务器磁盘剩余空间:     §r§e" +
            (backupInfo.disk.free_size / 1024 / 1024 / 1024).toFixed(2) +
            "GB" +
            "\n§r§l自动备份:               §r§e" +
            (backupInfo.auto_backup ? "开启" : "关闭") +
            "\n§r§l上一次备份时间:         §r§e" +
            ((backupInfo.last_backup_utc ?? 0) == 0
                ? "从未备份"
                : date.getFullYear() +
                    "年" +
                    (date.getMonth() + 1) +
                    "月" +
                    date.getDate() +
                    "日 §l" +
                    date.getHours() +
                    ":" +
                    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
                    "§r" +
                    (backupInfo.last_auto ? "(自动备份)" : "")) +
            "\n\n§r请选择一个选项");
    },
};
const SpecialRoute = {
    BACK: "#back",
    EXIT: "#exit",
};
const runBeforeTp = {};
function addRunBeforeTp(key, func) {
    if (runBeforeTp[key])
        return false;
    runBeforeTp[key] = func;
    return true;
}
async function analyseSnowString(str, player, list_key, index) {
    if (/^#script /.test(str)) {
        let script_key = str.replace(/^#script /, "");
        // 判断是否存在
        if (script_key == undefined || script_key == "") {
            throw new Error("(Anaylse String) No Script Specified. @" + player.name + "\nList Key: " + list_key + "\nSelect Index: " + index);
        }
        let exist = false;
        for (let key in strScripts) {
            if (key == script_key) {
                exist = true;
                break;
            }
        }
        if (exist == false)
            throw new Error("(Anaylse String) Script Not Exist. @" + player.name + "\nList Key: " + list_key + "\nSelect Index: " + index);
        // 执行并获取结果
        return strScripts[script_key](player, list_key);
    }
    return str;
}
/**
 * 显示雪球菜单的一个列表
 * @param player 执行主体玩家
 * @param list_key 列表的名称 对应json中snow下的键名
 * @returns 是否要退出菜单
 */
async function showSnowList(player, list_key) {
    // 判断data.snow是否存在
    if (data.snow == undefined) {
        throw new Error("Incorrect Data Format: [data.snow] Undefined.");
    }
    // 判断菜单是否存在
    let exist = false;
    for (let key in data.snow) {
        if (key == list_key) {
            exist = true;
            break;
        }
    }
    if (exist == false) {
        throw new Error("Snow List [" + list_key + "] not Exist");
    }
    let timer = 0;
    while (true) {
        // 显示菜单
        let actionFormData = new ActionFormData().title(data.snow[list_key].title);
        if (data.snow[list_key].body != "") {
            // Body 文字
            actionFormData = actionFormData.body(await analyseSnowString(data.snow[list_key].body, player, list_key));
        }
        if (data.snow[list_key].show_back) {
            // 返回按钮
            actionFormData = actionFormData.button("返回上一级");
        }
        // 主体按钮
        let length = data.snow[list_key].list.length;
        if (length == 0) {
            actionFormData = actionFormData.button("(列表为空)");
        }
        else {
            for (let i = 0; i < length; ++i) {
                actionFormData = actionFormData.button(await analyseSnowString(data.snow[list_key].list[i].name, player, list_key, i), (data.snow[list_key].list[i].icon ?? "") != ""
                    ? "textures/blocks/" + data.snow[list_key].list[i].icon
                    : undefined);
            }
        }
        // 显示
        let actionFormResponse = await actionFormData.show(player);
        // 处理 Response
        if (actionFormResponse.canceled || actionFormResponse.selection == undefined) {
            return true;
        }
        if (data.snow[list_key].show_back && actionFormResponse.selection == 0)
            return false; // 返回上一级菜单
        if (length > 0) {
            let index = data.snow[list_key].show_back ? actionFormResponse.selection - 1 : actionFormResponse.selection;
            // 判断权限
            if (data.snow[list_key].list[index].tag != undefined && data.snow[list_key].list[index].tag.length > 0) {
                if (
                // 若玩家有其中的所有tag 就会返回undefined
                data.snow[list_key].list[index].tag.find((tag) => {
                    return !player.hasTag(tag);
                }) != undefined) {
                    // 存在任意tag不被玩家所拥有
                    let msfrNoTag = await new MessageFormData()
                        .title("提示")
                        .body("暂未获得使用该选项的权限\n如有疑问请联系管理员")
                        .button1("确定")
                        .button2("退出菜单")
                        .show(player);
                    if (msfrNoTag.canceled || msfrNoTag.selection == 2) {
                        return true; // 退出菜单
                    }
                    break; // 确定
                }
            }
            switch (data.snow[list_key].list[index].type) {
                case "tp":
                    {
                        // 运行前置函数
                        for (let key in runBeforeTp) {
                            let result = await runBeforeTp[key](player, list_key);
                            // tellMessage(moduleName, "cancel: " + result.cancel + " reason: " + (result.cancelReason ?? "无"));
                            if (result.cancel) {
                                // let msfr = await new MessageFormData()
                                //   .title("提示")
                                //   .body("传送失败\n原因:" + (result.cancelReason ?? "未知"))
                                //   .button1("确定")
                                //   .button2("退出")
                                //   .show(player);
                                // if (msfr.selection == 1 || msfr.canceled) return false;
                                // if (msfr.selection == 2) return true;
                                return false;
                            }
                        }
                        // 传送
                        player.teleport(data.snow[list_key].list[index].location, world.getDimension(data.snow[list_key].list[index].dimension), 0, 0);
                        // 显示
                        if (data.snow[list_key].list[index].show) {
                            tellMessage(senderName, "§e§l" +
                                player.name +
                                " §r传送到了 §a§l" +
                                (data.snow[list_key].list[index].show_name ?? data.snow[list_key].list[index].name));
                        }
                        // 播放声音
                        player.playSound("random.levelup", { volume: 100000 });
                        // 提示并退出
                        player.runCommandAsync("title @s actionbar §a§l传送完成");
                        return true;
                    }
                    break;
                case "commands":
                    {
                        // 执行命令
                        data.snow[list_key].list[index].commands.forEach((command) => {
                            player.runCommandAsync(command);
                        });
                        // 退出
                        if (data.snow[list_key].list[index].close) {
                            return true;
                        }
                    }
                    break;
                case "function":
                    {
                        // TODO
                    }
                    break;
                case "script":
                    {
                        let targetScriptKey = data.snow[list_key].list[index].script;
                        if (targetScriptKey == undefined || targetScriptKey == "") {
                            throw new Error("No Script Specified. @" + player.name + "\nList Key: " + list_key + "\nSelect Index: " + index);
                        }
                        // 判断是否存在
                        let exist = false;
                        for (let key in snowScripts) {
                            if (key == targetScriptKey) {
                                exist = true;
                                break;
                            }
                        }
                        if (exist == false)
                            throw new Error("Script Not Exist. @" + player.name + "\nList Key: " + list_key + "\nSelect Index: " + index);
                        // 执行脚本
                        let quit = true;
                        try {
                            quit = await snowScripts[targetScriptKey](player, list_key);
                        }
                        catch (e) {
                            // 标记错误后重新抛出
                            tellErrorMessage(moduleName, "Error in Script §o§l" + targetScriptKey);
                            throw e;
                        }
                        // 退出菜单
                        if (quit) {
                            return true;
                        }
                    }
                    break;
                case "route":
                    {
                        let destination = data.snow[list_key].list[index].destination;
                        // 若没有给定 Destination
                        if (destination == "" || destination == undefined) {
                            throw new Error("(Route) No Destination Specified. @" +
                                player.name +
                                "\nList Key: " +
                                list_key +
                                "\nSelect Index: " +
                                index);
                        }
                        // 判断是否为特殊跳转选项
                        for (let key in SpecialRoute) {
                            if (destination == SpecialRoute[key]) {
                                switch (key) {
                                    case "BACK":
                                        return false;
                                    case "EXIT":
                                        return true;
                                    default:
                                        throw new Error("Unable to Deal with SpecialRoute." + key);
                                }
                            }
                        }
                        // 跳转执行
                        if ((await showSnowList(player, destination)) == true)
                            return true;
                    }
                    break;
                default:
                    throw new Error("Snow Item Error! \nList Key: " +
                        list_key +
                        "\nSelect Index: " +
                        index +
                        "\nItem JSON: " +
                        JSON.stringify(data.snow[list_key].list[index] ?? "ITEM_UNDEFINED"));
            }
        }
    }
    return true;
}
async function showSnowMenu(player, entry_list_key) {
    try {
        await showSnowList(player, entry_list_key ?? data.snow_main);
    }
    catch (e) {
        anaylseError(moduleName, e, "Error In [showSnowMenuNew]");
    }
}
function initCuberSnow() {
    // world.events.beforeChat.subscribe((e) => {
    //   if (e.message == "#") {
    //     e.cancel = true;
    //     showSnowMenuNew(e.sender);
    //   }
    // });
    world.events.beforeItemUse.subscribe(async (e) => {
        if (e.item.typeId != "minecraft:snowball" || e.source.typeId != "minecraft:player")
            return;
        if (!e.source.hasTag(data.settings.new_player.limit_tag)) {
            if (!data.settings.new_player.allow_snow) {
                let msfr = await new MessageFormData()
                    .title("错误")
                    .body("未获得使用雪球菜单的权限\n如有疑问请联系管理员")
                    .button1("确定")
                    .button2("退出")
                    .show(e.source);
                return;
            }
            if (data.settings.new_player.guest_snow) {
                e.source.runCommandAsync("kill @e[type=snowball, c=1]");
                showSnowMenu(e.source, "newPlayer_home");
                return;
            }
        }
        e.source.runCommandAsync("kill @e[type=snowball, c=1]");
        showSnowMenu(e.source);
    });
    world.events.beforeChat.subscribe((e) => {
        if (e.message.startsWith("#签到") || e.message.startsWith("#checkin")) {
            let bCheckin = false;
            if (data.players[e.sender.name]) {
                if (data.players[e.sender.name].last_checkin == getDate()) {
                    bCheckin = true;
                }
            }
            if (bCheckin) {
                // 已经签到过了
                tellMessage("§b§l提示", "§e@" + e.sender.name + " §r你已经签到过了，明天再来吧！");
            }
            else {
                // 未签到
                data.players[e.sender.name].last_checkin = getDate();
                data.players[e.sender.name].money += 10;
                data.players[e.sender.name].checkin_times += 1;
                saveData("@" + e.sender.name);
                tellMessage("§a§l系统", "§l§e" + e.sender.name + " §r今日§l§a已签到§r！ (金币+§e10§r)");
            }
        }
    });
    return { moduleName, moduleVersion };
}
export { initCuberSnow, showSnowMenu, addRunBeforeTp };

//# sourceMappingURL=../../_CuberEngineDebug/CuberSnow.js.map
