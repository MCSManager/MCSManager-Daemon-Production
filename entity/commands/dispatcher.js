"use strict";
/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  According to the GPL, it is forbidden to delete all copyright notices,
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const instance_1 = __importDefault(require("../instance/instance"));
const command_1 = __importDefault(require("./base/command"));
const players_1 = __importDefault(require("./task/players"));
const mc_update_1 = __importDefault(require("../minecraft/mc_update"));
const mc_getplayer_1 = __importDefault(require("../minecraft/mc_getplayer"));
const nullfunc_1 = __importDefault(require("./nullfunc"));
const general__start_1 = __importDefault(require("./general/general _start"));
const general__stop_1 = __importDefault(require("./general/general _stop"));
const general__kill_1 = __importDefault(require("./general/general _kill"));
const general__command_1 = __importDefault(require("./general/general _command"));
const general__restart_1 = __importDefault(require("./general/general _restart"));
const docker__start_1 = __importDefault(require("./docker/docker _start"));
const time_1 = __importDefault(require("./task/time"));
const mc_getplayer_bedrock_1 = __importDefault(require("../minecraft/mc_getplayer_bedrock"));
// 实例功能调度器
// 根据不同的类型调度分配不同的功能
class FuntionDispatcher extends command_1.default {
    constructor() {
        super("FuntionDispatcher");
    }
    async exec(instance) {
        // 初始化所有模块
        instance.lifeCycleTaskManager.clearLifeCycleTask();
        instance.clearPreset();
        // 实例必须装载的组件
        instance.lifeCycleTaskManager.registerLifeCycleTask(new time_1.default());
        // 根据实例启动类型来进行基本操作方式的预设
        if (!instance.config.processType || instance.config.processType === "general") {
            instance.setPreset("start", new general__start_1.default());
            instance.setPreset("write", new general__command_1.default());
            instance.setPreset("stop", new general__stop_1.default());
            instance.setPreset("kill", new general__kill_1.default());
            instance.setPreset("restart", new general__restart_1.default());
        }
        if (instance.config.processType === "docker") {
            instance.setPreset("start", new docker__start_1.default());
            instance.setPreset("write", new general__command_1.default());
            instance.setPreset("stop", new general__stop_1.default());
            instance.setPreset("kill", new general__kill_1.default());
            instance.setPreset("restart", new general__restart_1.default());
        }
        // 根据不同类型设置不同预设功能与作用
        if (instance.config.type.includes(instance_1.default.TYPE_UNIVERSAL)) {
            instance.setPreset("update", new nullfunc_1.default());
            instance.setPreset("getPlayer", new nullfunc_1.default());
        }
        if (instance.config.type.includes(instance_1.default.TYPE_MINECRAFT_JAVA)) {
            instance.setPreset("update", new mc_update_1.default());
            instance.setPreset("getPlayer", new mc_getplayer_1.default());
            instance.lifeCycleTaskManager.registerLifeCycleTask(new players_1.default());
        }
        if (instance.config.type.includes(instance_1.default.TYPE_MINECRAFT_BEDROCK)) {
            instance.setPreset("update", new nullfunc_1.default());
            instance.setPreset("getPlayer", new mc_getplayer_bedrock_1.default());
            instance.lifeCycleTaskManager.registerLifeCycleTask(new players_1.default());
        }
    }
}
exports.default = FuntionDispatcher;
//# sourceMappingURL=dispatcher.js.map