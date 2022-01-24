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

  禁止删除任何版权声明，请前往官方网站了解更多。
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
const version_1 = require("./service/version");
version_1.initVersionManager();
const VERSION = version_1.getVersion();
console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __  /_  __ \\  __  /_  __  /  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
________                                                /____/                                          
___  __ \\_____ ____________ ________________ 
__  / / /  __  /  _ \\_  __  __ \\  __ \\_  __ \\
_  /_/ // /_/ //  __/  / / / / / /_/ /  / / /
/_____/ \\__,_/ \\___//_/ /_/ /_/\\____//_/ /_/   

 + Released under the GPL-3.0 License
 + Copyright 2022 Suwings
 + Version ${VERSION}
`);
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const log_1 = __importDefault(require("./service/log"));
log_1.default.info(`欢迎使用 MCSManager 守护进程`);
const config_1 = require("./entity/config");
const router = __importStar(require("./service/router"));
const koa = __importStar(require("./service/http"));
const protocol = __importStar(require("./service/protocol"));
const system_instance_1 = __importDefault(require("./service/system_instance"));
// 初始化全局配置服务
config_1.globalConfiguration.load();
const config = config_1.globalConfiguration.config;
// 初始化 HTTP 服务
const koaApp = koa.initKoa();
const httpServer = http_1.default.createServer(koaApp.callback());
httpServer.listen(config.port, config.ip);
// 初始化 Websocket 服务到 HTTP 服务
const io = new socket_io_1.Server(httpServer, {
    serveClient: false,
    pingInterval: 5000,
    pingTimeout: 5000,
    cookie: false,
    path: "/socket.io",
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
// 初始化应用实例系统 & 装载应用实例
try {
    log_1.default.info("正在读取本地应用实例中");
    system_instance_1.default.loadInstances();
    log_1.default.info(`所有应用实例已加载，总计 ${system_instance_1.default.instances.size} 个`);
}
catch (err) {
    log_1.default.error("读取本地实例文件失败:", err);
    process.exit(-1);
}
// 注册 Websocket 连接事件
io.on("connection", (socket) => {
    log_1.default.info(`会话 ${socket.id}(${socket.handshake.address}) 已连接.`);
    // Join the global Socket object
    protocol.addGlobalSocket(socket);
    // Socket.io request is forwarded to the custom routing controller
    router.navigation(socket);
    // Disconnect event
    socket.on("disconnect", () => {
        // Remove from the global Socket object
        protocol.delGlobalSocket(socket);
        for (const name of socket.eventNames())
            socket.removeAllListeners(name);
        log_1.default.info(`会话 ${socket.id}(${socket.handshake.address}) 已断开`);
    });
});
// Error report monitoring
process.on("uncaughtException", function (err) {
    log_1.default.error(`错误报告 (uncaughtException):`, err);
});
// Error report monitoring
process.on("unhandledRejection", (reason, p) => {
    log_1.default.error(`错误报告 (unhandledRejection):`, reason, p);
});
// Started up
log_1.default.info(`守护进程现已成功启动`);
log_1.default.info("================================");
log_1.default.info(`访问地址 ${config.ip ? config.ip : "localhost"}:${config.port}`);
log_1.default.info(`访问密钥 ${config.key}`);
log_1.default.info("密钥作为守护进程唯一认证手段");
log_1.default.info("================================");
console.log("");
// 装载 终端界面UI
require("./service/ui");
process.on("SIGINT", function () {
    try {
        console.log("\n\n\n\n");
        log_1.default.warn("SIGINT close process signal detected.");
        system_instance_1.default.exit();
        log_1.default.info("The data is saved, thanks for using, goodbye!");
        log_1.default.info("Closed.");
    }
    catch (err) {
        log_1.default.error("ERROR:", err);
    }
    finally {
        process.exit(0);
    }
});
//# sourceMappingURL=app.js.map