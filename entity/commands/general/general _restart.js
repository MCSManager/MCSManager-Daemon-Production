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
const instance_1 = __importDefault(require("../../instance/instance"));
const command_1 = __importDefault(require("../base/command"));
class GeneralRestartCommand extends command_1.default {
    constructor() {
        super("GeneralRestartCommand");
    }
    async exec(instance) {
        try {
            instance.println("INFO", "重启实例计划开始执行...");
            await instance.execPreset("stop");
            instance.setLock(true);
            const startCount = instance.startCount;
            // 每秒检查实例状态，如果实例状态为已停止，则立刻重启服务器
            const task = setInterval(async () => {
                try {
                    if (startCount !== instance.startCount) {
                        throw new Error("重启实例状态错误，实例已被启动过，上次状态的重启计划取消");
                    }
                    if (instance.status() !== instance_1.default.STATUS_STOPPING && instance.status() !== instance_1.default.STATUS_STOP) {
                        throw new Error("重启实例状态错误，实例状态应该为停止中状态，现在变为正在运行，重启计划取消");
                    }
                    if (instance.status() === instance_1.default.STATUS_STOP) {
                        instance.println("INFO", "检测到服务器已停止，正在重启实例...");
                        await instance.execPreset("start");
                        instance.setLock(false);
                        clearInterval(task);
                    }
                }
                catch (error) {
                    clearInterval(task);
                    instance.setLock(false);
                    throw error;
                }
            }, 1000);
        }
        catch (error) {
            instance.setLock(false);
            instance.failure(error);
        }
    }
}
exports.default = GeneralRestartCommand;
//# sourceMappingURL=general%20_restart.js.map