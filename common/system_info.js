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
exports.systemInfo = void 0;
const os_1 = __importDefault(require("os"));
const os_utils_1 = __importDefault(require("os-utils"));
const fs_1 = __importDefault(require("fs"));
// 系统详细信息每一段时间更新一次
const info = {
    type: os_1.default.type(),
    hostname: os_1.default.hostname(),
    platform: os_1.default.platform(),
    release: os_1.default.release(),
    uptime: os_1.default.uptime(),
    cwd: process.cwd(),
    loadavg: os_1.default.loadavg(),
    freemem: 0,
    cpuUsage: 0,
    memUsage: 0,
    totalmem: 0,
    processCpu: 0,
    processMem: 0
};
// 定时刷新缓存
setInterval(() => {
    if (os_1.default.platform() === "linux") {
        return setLinuxSystemInfo();
    }
    if (os_1.default.platform() === "win32") {
        return setWindowsSystemInfo();
    }
    return otherSystemInfo();
}, 3000);
function otherSystemInfo() {
    info.freemem = os_1.default.freemem();
    info.totalmem = os_1.default.totalmem();
    info.memUsage = (os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem();
    os_utils_1.default.cpuUsage((p) => (info.cpuUsage = p));
}
function setWindowsSystemInfo() {
    info.freemem = os_1.default.freemem();
    info.totalmem = os_1.default.totalmem();
    info.memUsage = (os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem();
    os_utils_1.default.cpuUsage((p) => (info.cpuUsage = p));
}
function setLinuxSystemInfo() {
    var _a;
    try {
        // 基于 /proc/meminfo 的内存数据读取
        const data = fs_1.default.readFileSync("/proc/meminfo", { encoding: "utf-8" });
        const list = data.split("\n");
        const infoTable = {};
        list.forEach((line) => {
            const kv = line.split(":");
            if (kv.length === 2) {
                const k = kv[0].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
                let v = kv[1].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
                v = v.replace(/kb/gim, "").replace(/mb/gim, "").replace(/gb/gim, "");
                let vNumber = parseInt(v);
                if (isNaN(vNumber))
                    vNumber = 0;
                infoTable[k] = vNumber;
            }
        });
        const memAvailable = (_a = infoTable["memavailable"]) !== null && _a !== void 0 ? _a : infoTable["memfree"];
        const memTotal = infoTable["memtotal"];
        info.freemem = memAvailable * 1024;
        info.totalmem = memTotal * 1024;
        info.memUsage = (info.totalmem - info.freemem) / info.totalmem;
        os_utils_1.default.cpuUsage((p) => (info.cpuUsage = p));
    }
    catch (error) {
        // 若读取错误，则自动采用默认通用读取法
        otherSystemInfo();
    }
}
function systemInfo() {
    return info;
}
exports.systemInfo = systemInfo;
//# sourceMappingURL=system_info.js.map