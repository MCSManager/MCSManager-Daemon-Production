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
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const instance_1 = __importDefault(require("../entity/instance/instance"));
const events_1 = __importDefault(require("events"));
const kill_1 = __importDefault(require("../entity/commands/kill"));
const log_1 = __importDefault(require("./log"));
const uuid_1 = require("uuid");
const system_storage_1 = __importDefault(require("../common/system_storage"));
const Instance_config_1 = __importDefault(require("../entity/instance/Instance_config"));
const instance_stream_1 = __importDefault(require("../common/instance_stream"));
const query_wrapper_1 = require("../common/query_wrapper");
const dispatcher_1 = __importDefault(require("../entity/commands/dispatcher"));
const system_instance_control_1 = __importDefault(require("./system_instance_control"));
const start_1 = __importDefault(require("../entity/commands/start"));
const INSTANCE_DATA_DIR = path_1.default.join(process.cwd(), "data/InstanceData");
if (!fs_extra_1.default.existsSync(INSTANCE_DATA_DIR)) {
    fs_extra_1.default.mkdirsSync(INSTANCE_DATA_DIR);
}
class InstanceSubsystem extends events_1.default {
    constructor() {
        super();
        this.LOG_DIR = "data/InstanceLog/";
        this.instances = new Map();
        this.instanceStream = new instance_stream_1.default();
    }
    // 开机自动启动
    autoStart() {
        this.instances.forEach((instance) => {
            if (instance.config.eventTask.autoStart) {
                instance
                    .exec(new start_1.default())
                    .then(() => {
                    log_1.default.info(`实例 ${instance.config.nickname} ${instance.instanceUuid} 自动启动指令已发出`);
                })
                    .catch((reason) => {
                    log_1.default.error(`实例 ${instance.config.nickname} ${instance.instanceUuid} 自动启动时错误: ${reason}`);
                });
            }
        });
    }
    // init all instances from local files
    loadInstances() {
        const instanceConfigs = system_storage_1.default.list("InstanceConfig");
        instanceConfigs.forEach((uuid) => {
            const instanceConfig = system_storage_1.default.load("InstanceConfig", Instance_config_1.default, uuid);
            const instance = new instance_1.default(uuid, instanceConfig);
            // 所有实例全部进行功能调度器
            instance
                .forceExec(new dispatcher_1.default())
                .then((v) => { })
                .catch((v) => { });
            this.addInstance(instance);
        });
        // 处理自动启动
        this.autoStart();
    }
    createInstance(cfg) {
        const newUuid = uuid_1.v4().replace(/-/gim, "");
        const instance = new instance_1.default(newUuid, new Instance_config_1.default());
        // 实例工作目录验证与自动创建
        if (!cfg.cwd || cfg.cwd === ".") {
            cfg.cwd = path_1.default.normalize(`${INSTANCE_DATA_DIR}/${instance.instanceUuid}`);
            if (!fs_extra_1.default.existsSync(cfg.cwd))
                fs_extra_1.default.mkdirsSync(cfg.cwd);
        }
        // 针对中文操作系统编码自动选择
        if (os_1.default.platform() === "win32") {
            cfg.ie = cfg.oe = cfg.fileCode = "gbk";
        }
        else {
            cfg.ie = cfg.oe = cfg.fileCode = "utf-8";
        }
        // 根据参数构建并初始化类型
        instance.parameters(cfg);
        instance.forceExec(new dispatcher_1.default());
        this.addInstance(instance);
        return instance;
    }
    addInstance(instance) {
        if (instance.instanceUuid == null)
            throw new Error("无法新增某实例，因为实例UUID为空");
        if (this.instances.has(instance.instanceUuid)) {
            throw new Error(`The application instance ${instance.instanceUuid} already exists.`);
        }
        this.instances.set(instance.instanceUuid, instance);
        // Dynamically monitor the newly added instance output stream and pass it to its own event stream
        instance.on("data", (...arr) => {
            this.emit("data", instance.instanceUuid, ...arr);
        });
        instance.on("exit", (...arr) => {
            this.emit("exit", {
                instanceUuid: instance.instanceUuid,
                instanceName: instance.config.nickname
            }, ...arr);
        });
        instance.on("open", (...arr) => {
            this.emit("open", {
                instanceUuid: instance.instanceUuid,
                instanceName: instance.config.nickname
            }, ...arr);
        });
        instance.on("failure", (...arr) => {
            this.emit("failure", {
                instanceUuid: instance.instanceUuid,
                instanceName: instance.config.nickname
            }, ...arr);
        });
    }
    removeInstance(instanceUuid, deleteFile) {
        const instance = this.getInstance(instanceUuid);
        if (instance) {
            instance.destroy();
            // 销毁记录
            this.instances.delete(instanceUuid);
            system_storage_1.default.delete("InstanceConfig", instanceUuid);
            // 删除计划任务
            system_instance_control_1.default.deleteInstanceAllTask(instanceUuid);
            // 异步删除文件
            if (deleteFile)
                fs_extra_1.default.remove(instance.config.cwd, (err) => { });
            return true;
        }
        throw new Error("Instance does not exist");
    }
    forward(targetInstanceUuid, socket) {
        try {
            this.instanceStream.requestForward(socket, targetInstanceUuid);
        }
        catch (err) { }
    }
    stopForward(targetInstanceUuid, socket) {
        try {
            this.instanceStream.cannelForward(socket, targetInstanceUuid);
        }
        catch (err) { }
    }
    forEachForward(instanceUuid, callback) {
        this.instanceStream.forwardViaCallback(instanceUuid, (_socket) => {
            callback(_socket);
        });
    }
    getInstance(instanceUuid) {
        return this.instances.get(instanceUuid);
    }
    getQueryMapWrapper() {
        return new query_wrapper_1.QueryMapWrapper(this.instances);
    }
    exists(instanceUuid) {
        return this.instances.has(instanceUuid);
    }
    async exit() {
        for (const iterator of this.instances) {
            const instance = iterator[1];
            if (instance.status() != instance_1.default.STATUS_STOP) {
                log_1.default.info(`Instance ${instance.config.nickname} (${instance.instanceUuid}) is running or busy, and is being forced to end.`);
                await instance.execCommand(new kill_1.default());
            }
            system_storage_1.default.store("InstanceConfig", instance.instanceUuid, instance.config);
            log_1.default.info(`Instance ${instance.config.nickname} (${instance.instanceUuid}) saved successfully.`);
        }
    }
}
exports.default = new InstanceSubsystem();
//# sourceMappingURL=system_instance.js.map