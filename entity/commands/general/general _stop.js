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
const cmd_1 = __importDefault(require("../cmd"));
class GeneralStopCommand extends command_1.default {
    constructor() {
        super("StopCommand");
    }
    async exec(instance) {
        const stopCommand = instance.config.stopCommand;
        if (instance.status() === instance_1.default.STATUS_STOP || !instance.process)
            return instance.failure(new Error("实例未处于运行中状态，无法进行停止."));
        instance.status(instance_1.default.STATUS_STOPPING);
        if (stopCommand.toLocaleLowerCase() == "^c") {
            instance.process.kill("SIGINT");
        }
        else {
            await instance.exec(new cmd_1.default(stopCommand));
        }
        const cacheStartCount = instance.startCount;
        // 若 10 分钟后实例还处于停止中状态，则恢复状态
        setTimeout(() => {
            if (instance.status() === instance_1.default.STATUS_STOPPING && instance.startCount === cacheStartCount) {
                instance.println("ERROR", "关闭命令已发出但长时间未能关闭实例，可能是实例关闭命令错误或实例进程假死导致，现在将恢复到运行中状态，可使用强制终止指令结束进程。");
                instance.status(instance_1.default.STATUS_RUNNING);
            }
        }, 1000 * 60 * 10);
        return instance;
    }
}
exports.default = GeneralStopCommand;
//# sourceMappingURL=general%20_stop.js.map