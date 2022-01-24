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
const docker_service_1 = require("../service/docker_service");
const protocol = __importStar(require("../service/protocol"));
const router_1 = require("../service/router");
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const log_1 = __importDefault(require("../service/log"));
const os_1 = __importDefault(require("os"));
// 获取本系统镜像列表
router_1.routerApp.on("environment/images", async (ctx, data) => {
    try {
        if (os_1.default.platform() === "win32")
            return protocol.responseError(ctx, "[Unsupported] Windows 系统暂不支持此功能");
        const docker = new docker_service_1.DockerManager().getDocker();
        const result = await docker.listImages();
        protocol.response(ctx, result);
    }
    catch (error) {
        protocol.responseError(ctx, "无法获取镜像信息，请确保您已正确安装Docker环境");
    }
});
// 获取本系统容器列表
router_1.routerApp.on("environment/containers", async (ctx, data) => {
    try {
        const docker = new docker_service_1.DockerManager().getDocker();
        const result = await docker.listContainers();
        protocol.response(ctx, result);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 创建镜像
router_1.routerApp.on("environment/new_image", async (ctx, data) => {
    if (os_1.default.platform() === "win32")
        return protocol.responseError(ctx, "[Unsupported] Windows 系统暂不支持此功能");
    try {
        const dockerFileText = data.dockerFile;
        const name = data.name;
        const tag = data.tag;
        // 初始化镜像文件目录和 Dockerfile
        const uuid = uuid_1.v4();
        const dockerFileDir = path_1.default.normalize(path_1.default.join(process.cwd(), "tmp", uuid));
        if (!fs.existsSync(dockerFileDir))
            fs.mkdirsSync(dockerFileDir);
        // 写入 DockerFile
        const dockerFilepath = path_1.default.normalize(path_1.default.join(dockerFileDir, "Dockerfile"));
        await fs.writeFile(dockerFilepath, dockerFileText, { encoding: "utf-8" });
        log_1.default.info(`守护进程正在创建镜像 ${name}:${tag} DockerFile 如下:\n${dockerFileText}\n`);
        // 预先响应
        protocol.response(ctx, true);
        // 开始创建
        const dockerImageName = `${name}:${tag}`;
        try {
            await new docker_service_1.DockerManager().startBuildImage(dockerFileDir, dockerImageName);
            log_1.default.info(`创建镜像 ${name}:${tag} 完毕`);
        }
        catch (error) {
            log_1.default.info(`创建镜像 ${name}:${tag} 错误:${error}`);
        }
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 删除镜像
router_1.routerApp.on("environment/del_image", async (ctx, data) => {
    try {
        const imageId = data.imageId;
        const docker = new docker_service_1.DockerManager().getDocker();
        const image = docker.getImage(imageId);
        if (image) {
            log_1.default.info(`守护进程正在删除镜像 ${imageId}`);
            await image.remove();
        }
        else {
            throw new Error("Image does not exist");
        }
        protocol.response(ctx, true);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
// 获取所有镜像任务进度
router_1.routerApp.on("environment/progress", async (ctx) => {
    try {
        const data = {};
        docker_service_1.DockerManager.builerProgress.forEach((v, k) => {
            data[k] = v;
        });
        protocol.response(ctx, data);
    }
    catch (error) {
        protocol.responseError(ctx, error);
    }
});
//# sourceMappingURL=environment_router.js.map