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
const compress_1 = require("../common/compress");
const os_1 = __importDefault(require("os"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const ERROR_MSG_01 = "非法访问路径";
const MAX_EDIT_SIZE = 1024 * 1024 * 4;
class FileManager {
    constructor(topPath = "", fileCode) {
        this.topPath = topPath;
        this.fileCode = fileCode;
        this.cwd = ".";
        if (!path_1.default.isAbsolute(topPath)) {
            this.topPath = path_1.default.normalize(path_1.default.join(process.cwd(), topPath));
        }
        else {
            this.topPath = path_1.default.normalize(topPath);
        }
        if (!fileCode) {
            if (os_1.default.platform() === "win32")
                this.fileCode = "gbk";
            else
                this.fileCode = "utf-8";
        }
    }
    toAbsolutePath(fileName = "") {
        return path_1.default.normalize(path_1.default.join(this.topPath, this.cwd, fileName));
    }
    checkPath(fileNameOrPath) {
        const destAbsolutePath = this.toAbsolutePath(fileNameOrPath);
        const topAbsolutePath = this.topPath;
        return destAbsolutePath.indexOf(topAbsolutePath) === 0;
    }
    check(destPath) {
        return this.checkPath(destPath) && fs_extra_1.default.existsSync(this.toAbsolutePath(destPath));
    }
    cd(dirName) {
        if (!this.check(dirName))
            throw new Error(ERROR_MSG_01);
        this.cwd = path_1.default.normalize(path_1.default.join(this.cwd, dirName));
    }
    list() {
        const fileNames = fs_extra_1.default.readdirSync(this.toAbsolutePath());
        const files = [];
        const dirs = [];
        fileNames.forEach((name) => {
            const info = fs_extra_1.default.statSync(this.toAbsolutePath(name));
            if (info.isFile()) {
                files.push({
                    name: name,
                    type: 1,
                    size: info.size,
                    time: info.atime.toString()
                });
            }
            else {
                dirs.push({
                    name: name,
                    type: 0,
                    size: info.size,
                    time: info.atime.toString()
                });
            }
        });
        files.sort((a, b) => (a.name > b.name ? 1 : -1));
        dirs.sort((a, b) => (a.name > b.name ? 1 : -1));
        const resultList = dirs.concat(files);
        return resultList;
    }
    async readFile(fileName) {
        if (!this.check(fileName))
            throw new Error(ERROR_MSG_01);
        const absPath = this.toAbsolutePath(fileName);
        const buf = await fs_extra_1.default.readFile(absPath);
        const text = iconv_lite_1.default.decode(buf, this.fileCode);
        return text;
    }
    async writeFile(fileName, data) {
        if (!this.check(fileName))
            throw new Error(ERROR_MSG_01);
        const absPath = this.toAbsolutePath(fileName);
        const buf = iconv_lite_1.default.encode(data, this.fileCode);
        return await fs_extra_1.default.writeFile(absPath, buf);
    }
    async copy(target1, target2) {
        if (!this.checkPath(target2) || !this.check(target1))
            throw new Error(ERROR_MSG_01);
        const targetPath = this.toAbsolutePath(target1);
        target2 = this.toAbsolutePath(target2);
        return await fs_extra_1.default.copy(targetPath, target2);
    }
    mkdir(target) {
        if (!this.checkPath(target))
            throw new Error(ERROR_MSG_01);
        const targetPath = this.toAbsolutePath(target);
        return fs_extra_1.default.mkdirSync(targetPath);
    }
    async delete(target) {
        if (!this.check(target))
            throw new Error(ERROR_MSG_01);
        const targetPath = this.toAbsolutePath(target);
        return new Promise((r, j) => {
            fs_extra_1.default.remove(targetPath, (err) => {
                if (!err)
                    r(true);
                else
                    j(err);
            });
        });
    }
    async move(target, destPath) {
        if (!this.check(target))
            throw new Error(ERROR_MSG_01);
        if (!this.checkPath(destPath))
            throw new Error(ERROR_MSG_01);
        const targetPath = this.toAbsolutePath(target);
        destPath = this.toAbsolutePath(destPath);
        await fs_extra_1.default.move(targetPath, destPath);
    }
    async unzip(sourceZip, destDir) {
        if (!this.check(sourceZip) || !this.checkPath(destDir))
            throw new Error(ERROR_MSG_01);
        return await compress_1.decompress(this.toAbsolutePath(sourceZip), this.toAbsolutePath(destDir), this.fileCode);
    }
    async zip(sourceZip, files) {
        if (!this.checkPath(sourceZip))
            throw new Error(ERROR_MSG_01);
        const sourceZipPath = this.toAbsolutePath(sourceZip);
        const filesPath = [];
        for (const iterator of files) {
            if (this.check(iterator))
                filesPath.push(this.toAbsolutePath(iterator));
        }
        return await compress_1.compress(sourceZipPath, filesPath, this.fileCode);
    }
    async edit(target, data) {
        if (!this.check(target))
            throw new Error(ERROR_MSG_01);
        if (!data) {
            const absPath = this.toAbsolutePath(target);
            const info = fs_extra_1.default.statSync(absPath);
            if (info.size > MAX_EDIT_SIZE) {
                throw new Error("超出最大文件编辑限制");
            }
            return await this.readFile(target);
        }
        else {
            return await this.writeFile(target, data);
        }
    }
    rename(target, newName) {
        if (!this.check(target))
            throw new Error(ERROR_MSG_01);
        if (!this.checkPath(newName))
            throw new Error(ERROR_MSG_01);
        const targetPath = this.toAbsolutePath(target);
        const newPath = this.toAbsolutePath(newName);
        fs_extra_1.default.renameSync(targetPath, newPath);
    }
    static checkFileName(fileName) {
        const blackKeys = ["/", "\\", "|", "?", "*", ">", "<", ";", '"', "'"];
        for (const ch of blackKeys) {
            if (fileName.includes(ch))
                return false;
        }
        return true;
    }
}
exports.default = FileManager;
//# sourceMappingURL=system_file.js.map