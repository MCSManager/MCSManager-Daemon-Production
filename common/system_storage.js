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
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class StorageSubsystem {
    /**
     * 根据类定义和标识符储存成本地文件
     */
    store(category, uuid, object) {
        const dirPath = path_1.default.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
        if (!fs_extra_1.default.existsSync(dirPath))
            fs_extra_1.default.mkdirsSync(dirPath);
        const filePath = path_1.default.join(dirPath, `${uuid}.json`);
        const data = JSON.stringify(object, null, 4);
        fs_extra_1.default.writeFileSync(filePath, data, { encoding: "utf-8" });
    }
    /**
     * 根据类定义和标识符实例化成对象
     */
    load(category, classz, uuid) {
        const dirPath = path_1.default.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
        if (!fs_extra_1.default.existsSync(dirPath))
            fs_extra_1.default.mkdirsSync(dirPath);
        const filePath = path_1.default.join(dirPath, `${uuid}.json`);
        if (!fs_extra_1.default.existsSync(filePath))
            return null;
        const data = fs_extra_1.default.readFileSync(filePath, { encoding: "utf-8" });
        const dataObject = JSON.parse(data);
        const target = new classz();
        for (const v of Object.keys(target)) {
            if (dataObject[v] !== undefined)
                target[v] = dataObject[v];
        }
        return target;
    }
    /**
     * 通过类定义返回所有与此类有关的标识符
     */
    list(category) {
        const dirPath = path_1.default.join(StorageSubsystem.STIRAGE_DATA_PATH, category);
        if (!fs_extra_1.default.existsSync(dirPath))
            fs_extra_1.default.mkdirsSync(dirPath);
        const files = fs_extra_1.default.readdirSync(dirPath);
        const result = new Array();
        files.forEach((name) => {
            result.push(name.replace(path_1.default.extname(name), ""));
        });
        return result;
    }
    /**
     * 通过类定义删除指定类型的标识符实例
     */
    delete(category, uuid) {
        const filePath = path_1.default.join(StorageSubsystem.STIRAGE_DATA_PATH, category, `${uuid}.json`);
        if (!fs_extra_1.default.existsSync(filePath))
            return;
        fs_extra_1.default.removeSync(filePath);
    }
}
StorageSubsystem.STIRAGE_DATA_PATH = path_1.default.normalize(path_1.default.join(process.cwd(), "data"));
StorageSubsystem.STIRAGE_INDEX_PATH = path_1.default.normalize(path_1.default.join(process.cwd(), "data", "index"));
exports.default = new StorageSubsystem();
//# sourceMappingURL=system_storage.js.map