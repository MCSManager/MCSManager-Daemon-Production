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
const dockerode_1 = __importDefault(require("dockerode"));
const log_1 = __importDefault(require("../../../service/log"));
const events_1 = require("events");
const fs_extra_1 = __importDefault(require("fs-extra"));
const command_parser_1 = require("../base/command_parser");
// 用户身份函数
const processUserUid = process.getuid ? process.getuid : () => 0;
const processGroupGid = process.getgid ? process.getgid : () => 0;
// 启动时错误异常
class StartupDockerProcessError extends Error {
    constructor(msg) {
        super(msg);
    }
}
// Docker 进程适配器
class DockerProcessAdapter extends events_1.EventEmitter {
    constructor(container) {
        super();
        this.container = container;
    }
    async start() {
        await this.container.start();
        this.pid = this.container.id;
        const stream = (this.stream = await this.container.attach({ stream: true, stdout: true, stderr: true, stdin: true }));
        stream.on("data", (data) => this.emit("data", data));
        stream.on("error", (data) => this.emit("data", data));
        this.wait();
    }
    write(data) {
        if (this.stream)
            this.stream.write(data);
    }
    kill(s) {
        this.container.kill();
        return true;
    }
    async destroy() {
        try {
            await this.container.remove();
        }
        catch (error) { }
    }
    wait() {
        this.container.wait(async (v) => {
            this.destroy();
            this.emit("exit", v);
        });
    }
}
class DockerStartCommand extends command_1.default {
    constructor() {
        super("DockerStartCommand");
    }
    async exec(instance, source = "Unknown") {
        const instanceStatus = instance.status();
        if (instanceStatus != instance_1.default.STATUS_STOP)
            return instance.failure(new StartupDockerProcessError("实例未处于关闭状态，无法再进行启动"));
        if (!instance.config.startCommand || !instance.config.cwd || !instance.config.ie || !instance.config.oe)
            return instance.failure(new StartupDockerProcessError("启动命令，输入输出编码或工作目录为空值"));
        if (!fs_extra_1.default.existsSync(instance.absoluteCwdPath()))
            return instance.failure(new StartupDockerProcessError("工作目录并不存在"));
        try {
            // 锁死实例
            instance.setLock(true);
            // 设置启动状态
            instance.status(instance_1.default.STATUS_STARTING);
            // 启动次数增加
            instance.startCount++;
            // 命令解析
            const commandList = command_parser_1.commandStringToArray(instance.config.startCommand);
            const cwd = instance.absoluteCwdPath();
            // 解析端口开放
            // {
            //   "PortBindings": {
            //     "22/tcp": [
            //       {
            //         "HostPort": "11022"
            //       }
            //     ]
            //   }
            // }
            // 25565:25565/tcp 8080:8080/tcp
            const portMap = instance.config.docker.ports;
            const publicPortArray = {};
            const exposedPorts = {};
            for (const iterator of portMap) {
                const elemt = iterator.split("/");
                if (elemt.length != 2)
                    continue;
                const ports = elemt[0];
                const protocol = elemt[1];
                //主机(宿主)端口:容器端口
                const publicAndPrivatePort = ports.split(":");
                if (publicAndPrivatePort.length != 2)
                    continue;
                publicPortArray[`${publicAndPrivatePort[1]}/${protocol}`] = [{ HostPort: publicAndPrivatePort[0] }];
                exposedPorts[`${publicAndPrivatePort[1]}/${protocol}`] = {};
            }
            // 内存限制
            let maxMemory = undefined;
            if (instance.config.docker.memory)
                maxMemory = instance.config.docker.memory * 1024 * 1024;
            // CPU使用率计算
            let cpuQuota = undefined;
            let cpuPeriod = undefined;
            if (instance.config.docker.cpuUsage) {
                cpuQuota = instance.config.docker.cpuUsage * 10 * 1000;
                cpuPeriod = 1000 * 1000;
            }
            // CPU 核心数校验
            let cpusetCpus = undefined;
            if (instance.config.docker.cpusetCpus) {
                const arr = instance.config.docker.cpusetCpus.split(",");
                arr.forEach((v) => {
                    if (isNaN(Number(v)))
                        throw new Error(`非法的CPU核心指定: ${v}`);
                });
                cpusetCpus = instance.config.docker.cpusetCpus;
                // Note: 检验
            }
            // 输出启动日志
            log_1.default.info("----------------");
            log_1.default.info(`会话 ${source}: 请求开启实例`);
            log_1.default.info(`实例标识符: [${instance.instanceUuid}]`);
            log_1.default.info(`启动命令: ${commandList.join(" ")}`);
            log_1.default.info(`工作目录: ${cwd}`);
            log_1.default.info(`端口: ${JSON.stringify(publicPortArray)}`);
            log_1.default.info(`内存限制: ${maxMemory} MB`);
            log_1.default.info(`类型: Docker 容器`);
            log_1.default.info("----------------");
            // 开始 Docker 容器创建并运行
            const docker = new dockerode_1.default();
            const container = await docker.createContainer({
                Image: instance.config.docker.image,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                User: `${processUserUid()}:${processGroupGid()}`,
                WorkingDir: "/workspace/",
                Cmd: commandList,
                OpenStdin: true,
                StdinOnce: false,
                ExposedPorts: exposedPorts,
                HostConfig: {
                    Memory: maxMemory,
                    Binds: [`${cwd}:/workspace/`],
                    AutoRemove: true,
                    CpusetCpus: cpusetCpus,
                    CpuPeriod: cpuPeriod,
                    CpuQuota: cpuQuota,
                    PortBindings: publicPortArray,
                }
            });
            const processAdapter = new DockerProcessAdapter(container);
            await processAdapter.start();
            instance.started(processAdapter);
            log_1.default.info(`实例 ${instance.instanceUuid} 成功启动.`);
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
exports.default = DockerStartCommand;
//# sourceMappingURL=docker%20_start.js.map