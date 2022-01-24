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
const protocol = __importStar(require("../service/protocol"));
const router_1 = require("../service/router");
const system_instance_1 = __importDefault(require("../service/system_instance"));
const file_router_service_1 = require("../service/file_router_service");
// 部分路由器操作路由器验证中间件
router_1.routerApp.use((event, ctx, data, next) => {
    if (event.startsWith("file/")) {
        const instanceUuid = data.instanceUuid;
        if (!system_instance_1.default.exists(instanceUuid)) {
            return protocol.error(ctx, event, {
                instanceUuid: instanceUuid,
                err: `实例 ${instanceUuid} 不存在`
            });
        }
    }
    next();
});
// 列出指定实例工作目录的文件列表
router_1.routerApp.on("file/list", (ctx, data) => {
    try {
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        fileManager.cd(data.target);
        const overview = fileManager.list();
        protocol.response(ctx, overview);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 创建目录
router_1.routerApp.on("file/mkdir", (ctx, data) => {
    try {
        const target = data.target;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        fileManager.mkdir(target);
        protocol.response(ctx, true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 复制文件
router_1.routerApp.on("file/copy", async (ctx, data) => {
    try {
        // [["a.txt","b.txt"],["cxz","zzz"]]
        const targets = data.targets;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        for (const target of targets) {
            fileManager.copy(target[0], target[1]);
        }
        protocol.response(ctx, true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 移动文件
router_1.routerApp.on("file/move", async (ctx, data) => {
    try {
        // [["a.txt","b.txt"],["cxz","zzz"]]
        const targets = data.targets;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        for (const target of targets) {
            await fileManager.move(target[0], target[1]);
        }
        protocol.response(ctx, true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 删除文件
router_1.routerApp.on("file/delete", async (ctx, data) => {
    try {
        const targets = data.targets;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        for (const target of targets) {
            // 异步删除
            fileManager.delete(target);
        }
        protocol.response(ctx, true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 编辑文件
router_1.routerApp.on("file/edit", async (ctx, data) => {
    try {
        const target = data.target;
        const text = data.text;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        const result = await fileManager.edit(target, text);
        protocol.response(ctx, result ? result : true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 压缩/解压文件
router_1.routerApp.on("file/compress", async (ctx, data) => {
    try {
        const source = data.source;
        const targets = data.targets;
        const type = data.type;
        const fileManager = file_router_service_1.getFileManager(data.instanceUuid);
        if (type === 1) {
            // 异步执行
            fileManager
                .zip(source, targets)
                .then(() => { })
                .catch((error) => {
                protocol.responseError(ctx, error);
            });
        }
        else {
            // 异步执行
            fileManager
                .unzip(source, targets)
                .then(() => { })
                .catch((error) => {
                protocol.responseError(ctx, error);
            });
        }
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
//# sourceMappingURL=file_router.js.map