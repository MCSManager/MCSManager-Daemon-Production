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
const events_1 = require("events");
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const path_1 = __importDefault(require("path"));
const system_storage_1 = __importDefault(require("../../common/system_storage"));
const life_cycle_1 = require("./life_cycle");
const preset_1 = require("./preset");
const dispatcher_1 = __importDefault(require("../commands/dispatcher"));
const start_1 = __importDefault(require("../commands/start"));
// 实例类
class Instance extends events_1.EventEmitter {
    // 初始化实例时必须通过uuid与配置类进行初始化实例，否则实例将处于不可用
    constructor(instanceUuid, config) {
        super();
        // 生命周期任务，定时任务管理器
        this.lifeCycleTaskManager = new life_cycle_1.LifeCycleTaskManager(this);
        // 预设命令管理器
        this.presetCommandManager = new preset_1.PresetCommandManager(this);
        // 实例无需持久化保存的具体信息
        this.info = {
            currentPlayers: -1,
            maxPlayers: -1,
            version: ""
        };
        if (!instanceUuid || !config)
            throw new Error("初始化实例失败，唯一标识符或配置参数为空");
        // Basic information
        this.instanceStatus = Instance.STATUS_STOP;
        this.instanceUuid = instanceUuid;
        // Action lock
        this.lock = false;
        this.config = config;
        this.process = null;
        this.startCount = 0;
    }
    // 传入实例配置，松散型动态的给实例参数设置配置项
    parameters(cfg) {
        // 若实例类型改变，则必须重置预设命令与生命周期事件
        if (cfg.type && cfg.type != this.config.type) {
            if (this.status() != Instance.STATUS_STOP)
                throw new Error("正在运行时无法修改此实例类型");
            this.configureParams(this.config, cfg, "type", String);
            this.forceExec(new dispatcher_1.default());
        }
        // 若进程类型改变，则必须重置预设命令与生命周期事件
        if (cfg.processType && cfg.processType !== this.config.processType) {
            if (this.status() != Instance.STATUS_STOP)
                throw new Error("正在运行时无法修改此实例进程类型");
            this.configureParams(this.config, cfg, "processType", String);
            this.forceExec(new dispatcher_1.default());
        }
        this.configureParams(this.config, cfg, "nickname", String);
        this.configureParams(this.config, cfg, "startCommand", String);
        this.configureParams(this.config, cfg, "stopCommand", String);
        this.configureParams(this.config, cfg, "cwd", String);
        this.configureParams(this.config, cfg, "ie", String);
        this.configureParams(this.config, cfg, "oe", String);
        this.configureParams(this.config, cfg, "endTime", String);
        this.configureParams(this.config, cfg, "fileCode", String);
        if (cfg.docker) {
            this.configureParams(this.config.docker, cfg.docker, "image", String);
            this.configureParams(this.config.docker, cfg.docker, "memory", Number);
            this.configureParams(this.config.docker, cfg.docker, "ports");
            this.configureParams(this.config.docker, cfg.docker, "maxSpace", Number);
            this.configureParams(this.config.docker, cfg.docker, "io", Number);
            this.configureParams(this.config.docker, cfg.docker, "network", Number);
            this.configureParams(this.config.docker, cfg.docker, "networkMode", String);
            this.configureParams(this.config.docker, cfg.docker, "cpusetCpus", String);
            this.configureParams(this.config.docker, cfg.docker, "cpuUsage", Number);
        }
        if (cfg.pingConfig) {
            this.configureParams(this.config.pingConfig, cfg.pingConfig, "ip", String);
            this.configureParams(this.config.pingConfig, cfg.pingConfig, "port", Number);
            this.configureParams(this.config.pingConfig, cfg.pingConfig, "type", Number);
        }
        if (cfg.eventTask) {
            this.configureParams(this.config.eventTask, cfg.eventTask, "autoStart", Boolean);
            this.configureParams(this.config.eventTask, cfg.eventTask, "autoRestart", Boolean);
            this.configureParams(this.config.eventTask, cfg.eventTask, "ignore", Boolean);
        }
        system_storage_1.default.store("InstanceConfig", this.instanceUuid, this.config);
    }
    // 修改实例信息
    configureParams(self, args, key, typeFn) {
        var _a;
        const selfDefaultValue = (_a = self[key]) !== null && _a !== void 0 ? _a : null;
        const v = args[key] != null ? args[key] : selfDefaultValue;
        // 数字类型的特殊处理
        if (typeFn === Number) {
            if (v === "" || v === null)
                self[key] = null;
            else
                self[key] = Number(v);
        }
        if (typeFn === String) {
            if (v === null) {
                self[key] = null;
            }
            else {
                self[key] = String(v);
            }
        }
        else if (typeFn) {
            self[key] = typeFn(v);
        }
        else {
            self[key] = v;
        }
    }
    setLock(bool) {
        this.lock = bool;
    }
    // 对本实例执行对应的命令
    async execCommand(command) {
        if (this.lock)
            throw new Error(`此 ${command.info} 操作无法执行，因为实例处于锁定状态，请稍后再试.`);
        if (this.status() == Instance.STATUS_BUSY)
            throw new Error(`当前实例正处于忙碌状态，无法执行任何操作.`);
        return await command.exec(this);
    }
    // 对本实例执行对应的命令 别名
    async exec(command) {
        return await this.execCommand(command);
    }
    // 强制执行命令
    async forceExec(command) {
        return await command.exec(this);
    }
    // 设置实例状态或获取状态
    status(v) {
        if (v != null)
            this.instanceStatus = v;
        return this.instanceStatus;
    }
    // 实例启动后必须执行的函数
    // 触发 open 事件和绑定 data 与 exit 事件等
    started(process) {
        this.config.lastDatetime = this.fullTime();
        process.on("data", (text) => this.emit("data", iconv_lite_1.default.decode(text, this.config.oe)));
        process.on("exit", (code) => this.stoped(code));
        this.process = process;
        this.instanceStatus = Instance.STATUS_RUNNING;
        this.emit("open", this);
        // 启动所有生命周期任务
        this.lifeCycleTaskManager.execLifeCycleTask(1);
    }
    // 实例进行任何操作异常则必须通过此函数抛出异常
    // 触发 failure 事件
    failure(error) {
        this.emit("failure", error);
        this.println("错误", error.message);
        throw error;
    }
    // 实例已关闭后必须执行的函数
    // 触发 exit 事件
    stoped(code = 0) {
        this.releaseResources();
        if (this.instanceStatus != Instance.STATUS_STOP) {
            this.instanceStatus = Instance.STATUS_STOP;
            this.emit("exit", code);
            system_storage_1.default.store("InstanceConfig", this.instanceUuid, this.config);
        }
        // 关闭所有生命周期任务
        this.lifeCycleTaskManager.execLifeCycleTask(0);
        // 若启用自动重启则立刻执行启动操作
        if (this.config.eventTask.autoRestart) {
            if (!this.config.eventTask.ignore) {
                this.forceExec(new start_1.default("Event Task: Auto Restart"))
                    .then(() => {
                    this.println("信息", "检测到实例关闭，根据主动事件机制，自动重启指令已发出...");
                })
                    .catch((err) => {
                    this.println("错误", `自动重启错误: ${err}`);
                });
            }
            this.config.eventTask.ignore = false;
        }
    }
    println(level, text) {
        const str = `\n[MCSMANAGER] [${level}] ${text}\n`;
        this.emit("data", str);
    }
    // 释放资源（主要释放进程相关的资源）
    releaseResources() {
        this.process = null;
    }
    // 销毁本实例
    destroy() {
        if (this.process && this.process.pid) {
            this.process.kill("SIGKILL");
        }
        this.process = null;
    }
    fullTime() {
        const date = new Date();
        return date.toLocaleDateString() + " " + date.getHours() + ":" + date.getMinutes();
    }
    absoluteCwdPath() {
        if (!this.config || !this.config.cwd)
            return null;
        if (path_1.default.isAbsolute(this.config.cwd))
            return path_1.default.normalize(this.config.cwd);
        return path_1.default.normalize(path_1.default.join(process.cwd(), this.config.cwd));
    }
    async usedSpace(tmp, maxDeep = 4, deep = 0) {
        // if (deep >= maxDeep) return 0;
        // let size = 0;
        // const topPath = tmp ? tmp : this.absoluteCwdPath();
        // const files = await fs.readdir(topPath);
        // for (const fileName of files) {
        //   const absPath = path.join(topPath, fileName);
        //   const info = await fs.stat(absPath);
        //   if (info.isDirectory()) {
        //     size += await this.usedSpace(absPath, maxDeep, deep + 1);
        //   } else {
        //     size += info.size;
        //   }
        // }
        return 0;
    }
    async execPreset(action, p) {
        if (this.presetCommandManager) {
            return await this.presetCommandManager.execPreset(action, p);
        }
        throw new Error(`Preset Manager does not exist`);
    }
    setPreset(action, cmd) {
        this.presetCommandManager.setPreset(action, cmd);
    }
    getPreset(action) {
        return this.presetCommandManager.getPreset(action);
    }
    clearPreset() {
        this.presetCommandManager.clearPreset();
    }
}
exports.default = Instance;
// 实例类状态常量
Instance.STATUS_BUSY = -1;
Instance.STATUS_STOP = 0;
Instance.STATUS_STOPPING = 1;
Instance.STATUS_STARTING = 2;
Instance.STATUS_RUNNING = 3;
// 实例类型常量
Instance.TYPE_UNIVERSAL = "universal"; // 通用输入输出程序
// Minecraft 服务端类型
Instance.TYPE_MINECRAFT_JAVA = "minecraft/java"; // Minecraft PC 版通用服务端
Instance.TYPE_MINECRAFT_BEDROCK = "minecraft/bedrock"; // Minecraft 基岩版
//# sourceMappingURL=instance.js.map