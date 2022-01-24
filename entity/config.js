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
exports.Config = exports.globalConfiguration = void 0;
const uuid_1 = require("uuid");
const system_storage_1 = __importDefault(require("../common/system_storage"));
function builderPassword() {
    const a = `${uuid_1.v4().replace(/\-/gim, "")}`;
    const b = a.slice(0, a.length / 2 - 1);
    const c = `${uuid_1.v4().replace(/\-/gim, "")}`;
    return b + c;
}
// @Entity
class Config {
    constructor() {
        this.version = 1;
        this.ip = "";
        this.port = 24444;
        this.key = builderPassword();
    }
}
exports.Config = Config;
// 守护进程配置类
class GlobalConfiguration {
    constructor() {
        this.config = new Config();
    }
    load() {
        let config = system_storage_1.default.load("Config", Config, GlobalConfiguration.ID);
        if (config == null) {
            config = new Config();
            system_storage_1.default.store("Config", GlobalConfiguration.ID, config);
        }
        this.config = config;
    }
    store() {
        system_storage_1.default.store("Config", GlobalConfiguration.ID, this.config);
    }
}
GlobalConfiguration.ID = "global";
const globalConfiguration = new GlobalConfiguration();
exports.globalConfiguration = globalConfiguration;
//# sourceMappingURL=config.js.map