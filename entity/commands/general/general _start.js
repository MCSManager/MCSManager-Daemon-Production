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
const os_1 = __importDefault(require("os"));
const instance_1 = __importDefault(require("../../instance/instance"));
const log_1 = __importDefault(require("../../../service/log"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const command_1 = __importDefault(require("../base/command"));
const events_1 = __importDefault(require("events"));
const child_process_1 = require("child_process");
const command_parser_1 = require("../base/command_parser");
// 启动时错误异常
class StartupError extends Error {
    constructor(msg) {
        super(msg);
    }
}
// Docker 进程适配器
class ProcessAdapter extends events_1.default {
    constructor(process) {
        super();
        this.process = process;
        this.pid = this.process.pid;
        process.stdout.on("data", (text) => this.emit("data", text));
        process.stderr.on("data", (text) => this.emit("data", text));
        process.on("exit", (code) => this.emit("exit", code));
    }
    write(data) {
        return this.process.stdin.write(data);
    }
    kill(s) {
        if (os_1.default.platform() === "win32") {
            return child_process_1.exec(`taskkill /PID ${this.pid} /T /F`, (err, stdout, stderr) => {
                log_1.default.info(`实例进程 ${this.pid} 正在使用指令强制结束.`);
                log_1.default.info(`实例进程 ${this.pid} 强制结束结果:\n Error: ${err}\n Stdout: ${stdout}`);
            });
        }
        if (os_1.default.platform() === "linux") {
            return child_process_1.exec(`kill -s 9 ${this.pid}`, (err, stdout, stderr) => {
                log_1.default.info(`实例进程 ${this.pid} 正在使用指令强制结束.`);
                log_1.default.info(`实例进程 ${this.pid} 强制结束结果:\n Error: ${err}\n Stdout: ${stdout}`);
            });
        }
        if (s)
            this.process.kill(s);
        else
            this.process.kill("SIGKILL");
    }
    async destroy() {
        try {
            if (this.process && this.process.stdout && this.process.stderr) {
                // 移除所有动态新增的事件监听者
                for (const eventName of this.process.stdout.eventNames())
                    this.process.stdout.removeAllListeners(eventName);
                for (const eventName of this.process.stderr.eventNames())
                    this.process.stderr.removeAllListeners(eventName);
                for (const eventName of this.process.eventNames())
                    this.process.removeAllListeners(eventName);
                this.process.stdout.destroy();
                this.process.stderr.destroy();
            }
        }
        catch (error) { }
    }
}
class GeneralStartCommand extends command_1.default {
    constructor() {
        super("StartCommand");
    }
    async exec(instance, source = "Unknown") {
        const instanceStatus = instance.status();
        if (instanceStatus != instance_1.default.STATUS_STOP)
            return instance.failure(new StartupError("实例未处于关闭状态，无法再进行启动"));
        if (!instance.config.startCommand || !instance.config.cwd || !instance.config.ie || !instance.config.oe)
            return instance.failure(new StartupError("启动命令，输入输出编码或工作目录为空值"));
        if (!fs_extra_1.default.existsSync(instance.absoluteCwdPath()))
            return instance.failure(new StartupError("工作目录并不存在"));
        try {
            instance.setLock(true);
            // 设置启动状态
            instance.status(instance_1.default.STATUS_STARTING);
            // 启动次数增加
            instance.startCount++;
            // 命令解析
            const commandList = command_parser_1.commandStringToArray(instance.config.startCommand);
            const commandExeFile = commandList[0];
            const commnadParameters = commandList.slice(1);
            log_1.default.info("----------------");
            log_1.default.info(`会话 ${source}: 请求开启实例.`);
            log_1.default.info(`实例标识符: [${instance.instanceUuid}]`);
            log_1.default.info(`启动命令: ${JSON.stringify(commandList)}`);
            log_1.default.info(`工作目录: ${instance.config.cwd}`);
            log_1.default.info("----------------");
            // 创建子进程
            // 参数1直接传进程名或路径（含空格），无需双引号
            const process = child_process_1.spawn(commandExeFile, commnadParameters, {
                cwd: instance.config.cwd,
                stdio: "pipe",
                windowsHide: true
            });
            // 子进程创建结果检查
            if (!process || !process.pid) {
                throw new StartupError(`进程启动失败，进程PID为空，请检查启动命令和相关参数.`);
            }
            // 创建进程适配器
            const processAdapter = new ProcessAdapter(process);
            // 产生开启事件
            instance.started(processAdapter);
            log_1.default.info(`实例 ${instance.instanceUuid} 成功启动 PID: ${process.pid}.`);
        }
        catch (err) {
            instance.instanceStatus = instance_1.default.STATUS_STOP;
            instance.releaseResources();
            return instance.failure(err);
        }
        finally {
            instance.setLock(false);
        }
    }
}
exports.default = GeneralStartCommand;
//# sourceMappingURL=general%20_start.js.map