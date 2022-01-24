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
exports.ProcessConfig = void 0;
const yaml_1 = __importDefault(require("yaml"));
const properties_1 = __importDefault(require("properties"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const CONFIG_FILE_ENCODE = "utf-8";
class ProcessConfig {
    constructor(iProcessConfig) {
        this.iProcessConfig = iProcessConfig;
        iProcessConfig.path = path_1.default.normalize(iProcessConfig.path);
    }
    // 自动根据类型解析本地文件并返回配置对象
    read() {
        const text = fs_extra_1.default.readFileSync(this.iProcessConfig.path, { encoding: CONFIG_FILE_ENCODE });
        if (this.iProcessConfig.type === "yml") {
            return yaml_1.default.parse(text);
        }
        if (this.iProcessConfig.type === "properties") {
            return properties_1.default.parse(text);
        }
        if (this.iProcessConfig.type === "json") {
            return JSON.parse(text);
        }
        if (this.iProcessConfig.type === "txt") {
            return text;
        }
    }
    // 自动根据参数对象保存到本地配置文件
    write(object) {
        let text = "";
        if (this.iProcessConfig.type === "yml") {
            text = yaml_1.default.stringify(object);
        }
        if (this.iProcessConfig.type === "properties") {
            text = properties_1.default.stringify(object);
            text = text.replace(/ = /gim, "=");
        }
        if (this.iProcessConfig.type === "json") {
            text = JSON.stringify(object);
        }
        if (this.iProcessConfig.type === "txt") {
            text = object.toString();
        }
        if (!text)
            throw new Error("写入内容为空，可能是配置文件类型不支持");
        fs_extra_1.default.writeFileSync(this.iProcessConfig.path, text, { encoding: CONFIG_FILE_ENCODE });
    }
    exists() {
        return fs_extra_1.default.existsSync(this.iProcessConfig.path);
    }
}
exports.ProcessConfig = ProcessConfig;
//# sourceMappingURL=process_config.js.map