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
exports.decompress = exports.compress = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const compressing = __importStar(require("compressing"));
const child_process_1 = __importDefault(require("child_process"));
// 跨平台的高效率/低效率结合的解压缩方案
async function nodeCompress(zipPath, files, fileCode = "utf-8") {
    const stream = new compressing.zip.Stream();
    files.forEach((v) => {
        stream.addEntry(v, {});
    });
    const destStream = fs_extra_1.default.createWriteStream(zipPath);
    stream.pipe(destStream);
}
async function nodeDecompress(sourceZip, destDir, fileCode = "utf-8") {
    return await compressing.zip.uncompress(sourceZip, destDir, {
        zipFileNameEncoding: fileCode
    });
}
async function compress(sourceZip, files, fileCode) {
    // TODO 与系统集成的解压缩功能
    // if (system === "win32") {
    //   await _7zipCompress(sourceZip, files);
    // } else {
    // }
    return await nodeCompress(sourceZip, files, fileCode);
}
exports.compress = compress;
async function decompress(zipPath, dest, fileCode) {
    // if (system === "win32") {
    //   await _7zipDecompress(zipPath, dest);
    // } else {
    // }
    return await nodeDecompress(zipPath, dest, fileCode);
}
exports.decompress = decompress;
async function _7zipCompress(zipPath, files) {
    const cmd = `7z.exe a ${zipPath} ${files.join(" ")}`.split(" ");
    console.log(`[7zip 压缩任务] ${cmd.join(" ")}`);
    return new Promise((resolve, reject) => {
        const p = cmd.splice(1);
        const process = child_process_1.default.spawn(cmd[0], [...p], {
            cwd: "./7zip/"
        });
        if (!process || !process.pid)
            return reject(false);
        process.on("exit", (code) => {
            if (code)
                return reject(false);
            return resolve(true);
        });
    });
}
async function _7zipDecompress(sourceZip, destDir) {
    // ./7z.exe x archive.zip -oD:\7-Zip
    const cmd = `7z.exe x ${sourceZip} -o${destDir}`.split(" ");
    console.log(`[7zip 解压任务] ${cmd.join(" ")}`);
    return new Promise((resolve, reject) => {
        const process = child_process_1.default.spawn(cmd[0], [cmd[1], cmd[2], cmd[3]], {
            cwd: "./7zip/"
        });
        if (!process || !process.pid)
            return reject(false);
        process.on("exit", (code) => {
            if (code)
                return reject(false);
            return resolve(true);
        });
    });
}
//# sourceMappingURL=compress.js.map