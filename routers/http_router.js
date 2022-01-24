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
const router_1 = __importDefault(require("@koa/router"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const mission_passport_1 = require("../service/mission_passport");
const system_instance_1 = __importDefault(require("../service/system_instance"));
const system_file_1 = __importDefault(require("../service/system_file"));
const router = new router_1.default();
// 定义 HTTP 首页展示路由
router.all("/", async (ctx) => {
    ctx.body = "MCSManager Deamon: Status: OK. | reference: https://mcsmanager.com/";
    ctx.status = 200;
});
// 文件下载路由
router.get("/download/:key/:fileName", async (ctx) => {
    const key = ctx.params.key;
    try {
        // 从任务中心取任务
        const mission = mission_passport_1.missionPassport.getMission(key, "download");
        if (!mission)
            throw new Error((ctx.body = "No task, Access denied | 无下载任务，非法访问"));
        const instance = system_instance_1.default.getInstance(mission.parameter.instanceUuid);
        if (!instance)
            throw new Error("实例不存在");
        const cwd = instance.config.cwd;
        const fileRelativePath = mission.parameter.fileName;
        const ext = path_1.default.extname(fileRelativePath);
        // 检查文件跨目录安全隐患
        const fileManager = new system_file_1.default(cwd);
        if (!fileManager.check(fileRelativePath))
            throw new Error((ctx.body = "Access denied | 参数不正确"));
        // 开始给用户下载文件
        ctx.type = ext;
        ctx.body = fs_extra_1.default.createReadStream(fileManager.toAbsolutePath(fileRelativePath));
        // 任务已执行，销毁护照
        mission_passport_1.missionPassport.deleteMission(key);
    }
    catch (error) {
        ctx.body = `下载出错: ${error.message}`;
        ctx.status = 500;
    }
    finally {
        mission_passport_1.missionPassport.deleteMission(key);
    }
});
// 文件上载路由
router.post("/upload/:key", async (ctx) => {
    const key = ctx.params.key;
    const unzip = ctx.query.unzip;
    try {
        // 领取任务 & 检查任务 & 检查实例是否存在
        const mission = mission_passport_1.missionPassport.getMission(key, "upload");
        if (!mission)
            throw new Error("Access denied 0x061");
        const instance = system_instance_1.default.getInstance(mission.parameter.instanceUuid);
        if (!instance)
            throw new Error("Access denied 0x062");
        const uploadDir = mission.parameter.uploadDir;
        const cwd = instance.config.cwd;
        const file = ctx.request.files.file;
        if (file) {
            // 确认存储位置
            const fullFileName = file.name;
            const fileSaveRelativePath = path_1.default.normalize(path_1.default.join(uploadDir, fullFileName));
            // 文件名特殊字符过滤(杜绝任何跨目录入侵手段)
            if (!system_file_1.default.checkFileName(fullFileName))
                throw new Error("Access denied 0x063");
            // 检查文件跨目录安全隐患
            const fileManager = new system_file_1.default(cwd);
            if (!fileManager.checkPath(fileSaveRelativePath))
                throw new Error("Access denied 0x064");
            const fileSaveAbsolutePath = fileManager.toAbsolutePath(fileSaveRelativePath);
            // 禁止覆盖原文件
            // if (fs.existsSync(fileSaveAbsolutePath)) throw new Error("文件存在，无法覆盖");
            // 将文件从临时文件夹复制到指定目录
            const reader = fs_extra_1.default.createReadStream(file.path);
            const upStream = fs_extra_1.default.createWriteStream(fileSaveAbsolutePath);
            reader.pipe(upStream);
            reader.on("close", () => {
                if (unzip) {
                    // 如果需要解压则进行解压任务
                    const filemanager = new system_file_1.default(instance.config.cwd);
                    filemanager.unzip(fullFileName, "");
                }
            });
            return (ctx.body = "OK");
        }
        ctx.body = "未知原因: 上传失败";
    }
    catch (error) {
        ctx.body = error.message;
        ctx.status = 500;
    }
    finally {
        mission_passport_1.missionPassport.deleteMission(key);
    }
});
exports.default = router;
//# sourceMappingURL=http_router.js.map