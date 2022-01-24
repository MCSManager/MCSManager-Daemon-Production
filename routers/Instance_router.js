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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const protocol = __importStar(require("../service/protocol"));
const router_1 = require("../service/router");
const system_instance_1 = __importDefault(require("../service/system_instance"));
const log_1 = __importDefault(require("../service/log"));
const path_1 = __importDefault(require("path"));
const start_1 = __importDefault(require("../entity/commands/start"));
const stop_1 = __importDefault(require("../entity/commands/stop"));
const cmd_1 = __importDefault(require("../entity/commands/cmd"));
const kill_1 = __importDefault(require("../entity/commands/kill"));
const process_info_1 = __importDefault(require("../entity/commands/process_info"));
const system_file_1 = __importDefault(require("../service/system_file"));
const process_config_1 = require("../entity/instance/process_config");
const restart_1 = __importDefault(require("../entity/commands/restart"));
// 部分实例操作路由器验证中间件
router_1.routerApp.use((event, ctx, data, next) => {
    if (event == "instance/new" && data)
        return next();
    if (event == "instance/overview")
        return next();
    if (event == "instance/select")
        return next();
    // 类 AOP
    if (event.startsWith("instance")) {
        if (data.instanceUuids)
            return next();
        const instanceUuid = data.instanceUuid;
        if (!system_instance_1.default.exists(instanceUuid)) {
            return protocol.error(ctx, event, {
                instanceUuid: instanceUuid,
                err: `The operation failed, the instance ${instanceUuid} does not exist.`
            });
        }
    }
    next();
});
// 获取本守护进程实例列表（查询式）
router_1.routerApp.on("instance/select", (ctx, data) => {
    const page = data.page || 1;
    const pageSize = data.pageSize || 1;
    const condition = data.condition;
    const overview = [];
    // 关键字条件查询
    const queryWrapper = system_instance_1.default.getQueryMapWrapper();
    let result = queryWrapper.select((v) => {
        if (!v.config.nickname.includes(condition.instanceName))
            return false;
        return true;
    });
    // 分页功能
    const pageResult = queryWrapper.page(result, page, pageSize);
    // 过滤不需要的数据
    pageResult.data.forEach((instance) => {
        overview.push({
            instanceUuid: instance.instanceUuid,
            started: instance.startCount,
            status: instance.status(),
            config: instance.config,
            info: instance.info
        });
    });
    protocol.response(ctx, {
        page: pageResult.page,
        pageSize: pageResult.pageSize,
        maxPage: pageResult.maxPage,
        data: overview
    });
});
// 获取本守护进程实例总览
router_1.routerApp.on("instance/overview", (ctx) => {
    const overview = [];
    system_instance_1.default.instances.forEach((instance) => {
        overview.push({
            instanceUuid: instance.instanceUuid,
            started: instance.startCount,
            status: instance.status(),
            config: instance.config,
            info: instance.info
        });
    });
    protocol.msg(ctx, "instance/overview", overview);
});
// 获取本守护进程部分实例总览
router_1.routerApp.on("instance/section", (ctx, data) => {
    const instanceUuids = data.instanceUuids;
    const overview = [];
    system_instance_1.default.instances.forEach((instance) => {
        instanceUuids.forEach((targetUuid) => {
            if (targetUuid === instance.instanceUuid) {
                overview.push({
                    instanceUuid: instance.instanceUuid,
                    started: instance.startCount,
                    status: instance.status(),
                    config: instance.config,
                    info: instance.info
                });
            }
        });
    });
    protocol.msg(ctx, "instance/section", overview);
});
// 查看单个实例的详细情况
router_1.routerApp.on("instance/detail", async (ctx, data) => {
    try {
        const instanceUuid = data.instanceUuid;
        const instance = system_instance_1.default.getInstance(instanceUuid);
        let processInfo = null;
        let space = null;
        try {
            // 可能因文件权限导致错误的部分，避免影响整个配置的获取
            processInfo = await instance.forceExec(new process_info_1.default());
            space = await instance.usedSpace(null, 2);
        }
        catch (err) { }
        protocol.msg(ctx, "instance/detail", {
            instanceUuid: instance.instanceUuid,
            started: instance.startCount,
            status: instance.status(),
            config: instance.config,
            info: instance.info,
            space,
            processInfo
        });
    }
    catch (err) {
        protocol.error(ctx, "instance/detail", { err: err.message });
    }
});
// 新建应用实例
router_1.routerApp.on("instance/new", (ctx, data) => {
    const config = data;
    try {
        const newInstance = system_instance_1.default.createInstance(config);
        protocol.msg(ctx, "instance/new", { instanceUuid: newInstance.instanceUuid, config: newInstance.config });
    }
    catch (err) {
        protocol.error(ctx, "instance/new", { instanceUuid: null, err: err.message });
    }
});
// 更新实例数据
router_1.routerApp.on("instance/update", (ctx, data) => {
    const instanceUuid = data.instanceUuid;
    const config = data.config;
    try {
        system_instance_1.default.getInstance(instanceUuid).parameters(config);
        protocol.msg(ctx, "instance/update", { instanceUuid });
    }
    catch (err) {
        protocol.error(ctx, "instance/update", { instanceUuid: instanceUuid, err: err.message });
    }
});
// 请求转发某实例所有IO数据
router_1.routerApp.on("instance/forward", (ctx, data) => {
    const targetInstanceUuid = data.instanceUuid;
    const isforward = data.forward;
    try {
        // InstanceSubsystem.getInstance(targetInstanceUuid);
        if (isforward) {
            log_1.default.info(`会话 ${ctx.socket.id} 请求转发实例 ${targetInstanceUuid} IO 流`);
            system_instance_1.default.forward(targetInstanceUuid, ctx.socket);
        }
        else {
            log_1.default.info(`会话 ${ctx.socket.id} 请求取消转发实例 ${targetInstanceUuid} IO 流`);
            system_instance_1.default.stopForward(targetInstanceUuid, ctx.socket);
        }
        protocol.msg(ctx, "instance/forward", { instanceUuid: targetInstanceUuid });
    }
    catch (err) {
        protocol.error(ctx, "instance/forward", { instanceUuid: targetInstanceUuid, err: err.message });
    }
});
// 开启实例
router_1.routerApp.on("instance/open", async (ctx, data) => {
    const disableResponse = data.disableResponse;
    for (const instanceUuid of data.instanceUuids) {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        try {
            await instance.exec(new start_1.default(ctx.socket.id));
            if (!disableResponse)
                protocol.msg(ctx, "instance/open", { instanceUuid });
        }
        catch (err) {
            if (!disableResponse) {
                log_1.default.error(`实例${instanceUuid}启动时错误: `, err);
                protocol.error(ctx, "instance/open", { instanceUuid: instanceUuid, err: err.message });
            }
        }
    }
});
// 关闭实例
router_1.routerApp.on("instance/stop", async (ctx, data) => {
    const disableResponse = data.disableResponse;
    for (const instanceUuid of data.instanceUuids) {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        try {
            await instance.exec(new stop_1.default());
            //Note: 去掉此回复会导致前端响应慢，因为前端会等待面板端消息转发
            if (!disableResponse)
                protocol.msg(ctx, "instance/stop", { instanceUuid });
        }
        catch (err) {
            if (!disableResponse)
                protocol.error(ctx, "instance/stop", { instanceUuid: instanceUuid, err: err.message });
        }
    }
});
// 重启实例
router_1.routerApp.on("instance/restart", async (ctx, data) => {
    const disableResponse = data.disableResponse;
    for (const instanceUuid of data.instanceUuids) {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        try {
            await instance.exec(new restart_1.default());
            if (!disableResponse)
                protocol.msg(ctx, "instance/restart", { instanceUuid });
        }
        catch (err) {
            if (!disableResponse)
                protocol.error(ctx, "instance/restart", { instanceUuid: instanceUuid, err: err.message });
        }
    }
});
// 终止实例方法
router_1.routerApp.on("instance/kill", async (ctx, data) => {
    const disableResponse = data.disableResponse;
    for (const instanceUuid of data.instanceUuids) {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        if (!instance)
            continue;
        try {
            await instance.forceExec(new kill_1.default());
            if (!disableResponse)
                protocol.msg(ctx, "instance/kill", { instanceUuid });
        }
        catch (err) {
            if (!disableResponse)
                protocol.error(ctx, "instance/kill", { instanceUuid: instanceUuid, err: err.message });
        }
    }
});
// 向应用实例发送命令
router_1.routerApp.on("instance/command", async (ctx, data) => {
    const disableResponse = data.disableResponse;
    const instanceUuid = data.instanceUuid;
    const command = data.command || "";
    const instance = system_instance_1.default.getInstance(instanceUuid);
    try {
        await instance.exec(new cmd_1.default(command));
        if (!disableResponse)
            protocol.msg(ctx, "instance/command", { instanceUuid });
    }
    catch (err) {
        if (!disableResponse)
            protocol.error(ctx, "instance/command", { instanceUuid: instanceUuid, err: err.message });
    }
});
// 删除实例
router_1.routerApp.on("instance/delete", (ctx, data) => {
    const instanceUuids = data.instanceUuids;
    const deleteFile = data.deleteFile;
    for (const instanceUuid of instanceUuids) {
        try {
            system_instance_1.default.removeInstance(instanceUuid, deleteFile);
        }
        catch (err) { }
    }
    protocol.msg(ctx, "instance/delete", instanceUuids);
});
// 向应用实例发送数据流
router_1.routerApp.on("instance/stdin", (ctx, data) => {
    // 本路由采用兼容性低且直接原始的方式来进行写数据
    // 因为此路由将会接收到每个字符
    const instance = system_instance_1.default.getInstance(data.instanceUuid);
    try {
        if (data.ch == "\r")
            return instance.process.write("\n");
        instance.process.write(data.ch);
    }
    catch (err) { }
});
router_1.routerApp.on("instance/process_config/list", (ctx, data) => {
    const instanceUuid = data.instanceUuid;
    const files = data.files;
    const result = [];
    try {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        const fileManager = new system_file_1.default(instance.absoluteCwdPath());
        for (const filePath of files) {
            if (fileManager.check(filePath)) {
                result.push({
                    file: filePath,
                    check: true
                });
            }
        }
        protocol.response(ctx, result);
    }
    catch (err) {
        protocol.responseError(ctx, err);
    }
});
// 获取或更新实例指定文件的内容
router_1.routerApp.on("instance/process_config/file", (ctx, data) => {
    const instanceUuid = data.instanceUuid;
    const fileName = data.fileName;
    const config = data.config || null;
    const fileType = data.type;
    try {
        const instance = system_instance_1.default.getInstance(instanceUuid);
        const fileManager = new system_file_1.default(instance.absoluteCwdPath());
        if (!fileManager.check(fileName))
            throw new Error("文件不存在或路径错误，文件访问被拒绝");
        const filePath = path_1.default.normalize(path_1.default.join(instance.absoluteCwdPath(), fileName));
        const processConfig = new process_config_1.ProcessConfig({
            fileName: fileName,
            redirect: fileName,
            path: filePath,
            type: fileType,
            info: null,
            fromLink: null
        });
        if (config) {
            processConfig.write(config);
            return protocol.response(ctx, true);
        }
        else {
            const json = processConfig.read();
            return protocol.response(ctx, json);
        }
    }
    catch (err) {
        protocol.responseError(ctx, err);
    }
});
// 获取实例终端日志
router_1.routerApp.on("instance/outputlog", async (ctx, data) => {
    const instanceUuid = data.instanceUuid;
    try {
        const filePath = path_1.default.join(system_instance_1.default.LOG_DIR, `${instanceUuid}.log`);
        if (fs_extra_1.default.existsSync(filePath)) {
            const text = await fs_extra_1.default.readFile(filePath, { encoding: "utf-8" });
            return protocol.response(ctx, text);
        }
        protocol.responseError(ctx, new Error("终端日志文件不存在"));
    }
    catch (err) {
        protocol.responseError(ctx, err);
    }
});
//# sourceMappingURL=Instance_router.js.map