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
const node_schedule_1 = __importDefault(require("node-schedule"));
const system_instance_1 = __importDefault(require("./system_instance"));
const system_storage_1 = __importDefault(require("../common/system_storage"));
const log_1 = __importDefault(require("./log"));
const start_1 = __importDefault(require("../entity/commands/start"));
const stop_1 = __importDefault(require("../entity/commands/stop"));
const cmd_1 = __importDefault(require("../entity/commands/cmd"));
const restart_1 = __importDefault(require("../entity/commands/restart"));
const kill_1 = __importDefault(require("../entity/commands/kill"));
// @Entity
// 计划任务配置数据实体类
class TaskConfig {
    constructor() {
        this.instanceUuid = "";
        this.name = "";
        this.count = 1;
        this.time = "";
        this.action = "";
        this.payload = "";
        this.type = 1;
    }
}
class IntervalJob {
    constructor(callback, time) {
        this.callback = callback;
        this.time = time;
        this.job = 0;
        this.job = setInterval(callback, time * 1000);
    }
    cancel() {
        clearInterval(this.job);
    }
}
// 计划任务实例类
class Task {
    constructor(config, job) {
        this.config = config;
        this.job = job;
    }
}
class InstanceControlSubsystem {
    constructor() {
        this.taskMap = new Map();
        this.taskJobMap = new Map();
        // 初始化所有持久化数据并逐一装载到内存
        system_storage_1.default.list("TaskConfig").forEach((uuid) => {
            const config = system_storage_1.default.load("TaskConfig", TaskConfig, uuid);
            this.registerScheduleJob(config, false);
        });
    }
    registerScheduleJob(task, needStore = true) {
        const key = `${task.instanceUuid}`;
        if (!this.taskMap.has(key)) {
            this.taskMap.set(key, []);
        }
        if (!this.checkTask(key, task.name))
            throw new Error("已存在重复的任务");
        let job;
        if (needStore)
            log_1.default.info(`创建计划任务 ${task.name}:\n${JSON.stringify(task)}`);
        if (task.type === 1) {
            // task.type=1: 时间间隔型计划任务，采用内置定时器实现
            job = new IntervalJob(() => {
                this.action(task);
                if (task.count === -1)
                    return;
                if (task.count === 1) {
                    job.cancel();
                    this.deleteTask(key, task.name);
                }
                else {
                    task.count--;
                    this.updateTaskConfig(key, task.name, task);
                }
            }, Number(task.time));
        }
        else {
            // task.type=1: 指定时间型计划任务，采用 node-schedule 库实现
            job = node_schedule_1.default.scheduleJob(task.time, () => {
                this.action(task);
                if (task.count === -1)
                    return;
                if (task.count === 1) {
                    job.cancel();
                    this.deleteTask(key, task.name);
                }
                else {
                    task.count--;
                    this.updateTaskConfig(key, task.name, task);
                }
            });
        }
        const newTask = new Task(task, job);
        this.taskMap.get(key).push(newTask);
        if (needStore) {
            system_storage_1.default.store("TaskConfig", newTask.config.name, newTask.config);
        }
        if (needStore)
            log_1.default.info(`创建计划任务 ${task.name} 完毕`);
    }
    listScheduleJob(instanceUuid) {
        const key = `${instanceUuid}`;
        const arr = this.taskMap.get(key) || [];
        const res = [];
        arr.forEach((v) => {
            res.push(v.config);
        });
        return res;
    }
    async action(task) {
        try {
            const payload = task.payload;
            const instanceUuid = task.instanceUuid;
            const instance = system_instance_1.default.getInstance(instanceUuid);
            // 若实例已被删除则需自动销毁
            if (!instance) {
                return this.deleteScheduleTask(task.instanceUuid, task.name);
            }
            const instanceStatus = instance.status();
            // logger.info(`执行计划任务: ${task.name} ${task.action} ${task.time} ${task.count} `);
            if (task.action === "start") {
                if (instanceStatus === 0) {
                    instance.exec(new start_1.default("ScheduleJob"));
                }
            }
            if (task.action === "stop") {
                if (instanceStatus === 3) {
                    instance.exec(new stop_1.default());
                }
            }
            if (task.action === "restart") {
                if (instanceStatus === 3) {
                    instance.exec(new restart_1.default());
                }
            }
            if (task.action === "command") {
                if (instanceStatus === 3) {
                    instance.exec(new cmd_1.default(payload));
                }
            }
            if (task.action === "kill") {
                instance.exec(new kill_1.default());
            }
        }
        catch (error) {
            log_1.default.error(`实例 ${task.instanceUuid} 计划任务 ${task.name} 执行错误: \n ${error} `);
        }
    }
    deleteInstanceAllTask(instanceUuid) {
        const tasks = this.listScheduleJob(instanceUuid);
        if (tasks)
            tasks.forEach((v) => {
                this.deleteScheduleTask(instanceUuid, v.name);
            });
    }
    deleteScheduleTask(instanceUuid, name) {
        const key = `${instanceUuid}`;
        this.deleteTask(key, name);
    }
    deleteTask(key, name) {
        this.taskMap.get(key).forEach((v, index, arr) => {
            if (v.config.name === name) {
                v.job.cancel();
                arr.splice(index, 1);
            }
        });
        system_storage_1.default.delete("TaskConfig", name);
    }
    checkTask(key, name) {
        let f = true;
        this.taskMap.get(key).forEach((v, index, arr) => {
            if (v.config.name === name)
                f = false;
        });
        return f;
    }
    updateTaskConfig(key, name, data) {
        const list = this.taskMap.get(key);
        for (const index in list) {
            const t = list[index];
            if (t.config.name === name) {
                list[index].config = data;
                break;
            }
        }
    }
}
exports.default = new InstanceControlSubsystem();
//# sourceMappingURL=system_instance_control.js.map