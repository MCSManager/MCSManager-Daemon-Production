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
exports.DockerManager = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
class DockerManager {
    constructor(p) {
        this.docker = null;
        this.docker = new dockerode_1.default(p);
    }
    getDocker() {
        return this.docker;
    }
    static setBuilerProgress(imageName, status) {
        DockerManager.builerProgress.set(imageName, status);
    }
    static getBuilerProgress(imageName) {
        return DockerManager.builerProgress.get(imageName);
    }
    async startBuildImage(dockerFileDir, dockerImageName) {
        try {
            // 设置当前镜像创建进度
            DockerManager.setBuilerProgress(dockerImageName, 1);
            // 发出创建镜像指令
            const stream = await this.docker.buildImage({
                context: dockerFileDir,
                src: ["Dockerfile"]
            }, { t: dockerImageName });
            // 等待创建完毕
            await new Promise((resolve, reject) => {
                this.docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
            });
            // 设置当前镜像创建进度
            DockerManager.setBuilerProgress(dockerImageName, 2);
        }
        catch (error) {
            // 设置当前镜像创建进度
            DockerManager.setBuilerProgress(dockerImageName, -1);
        }
    }
}
exports.DockerManager = DockerManager;
// 1=正在创建 2=创建完毕 -1=创建错误
DockerManager.builerProgress = new Map();
//# sourceMappingURL=docker_service.js.map