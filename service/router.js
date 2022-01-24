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
exports.navigation = exports.routerApp = void 0;
const events_1 = require("events");
const log_1 = __importDefault(require("./log"));
const ctx_1 = __importDefault(require("../entity/ctx"));
const protocol_1 = require("../service/protocol");
// Routing controller class (singleton class)
class RouterApp extends events_1.EventEmitter {
    constructor() {
        super();
        this.middlewares = [];
    }
    emitRouter(event, ctx, data) {
        try {
            // service logic routing trigger point
            super.emit(event, ctx, data);
        }
        catch (error) {
            protocol_1.responseError(ctx, error);
        }
        return this;
    }
    on(event, fn) {
        // logger.info(` Register event: ${event} `);
        return super.on(event, fn);
    }
    use(fn) {
        this.middlewares.push(fn);
    }
    getMiddlewares() {
        return this.middlewares;
    }
}
// routing controller singleton class
exports.routerApp = new RouterApp();
/**
 * Based on Socket.io for routing decentralization and secondary forwarding
 * @param {Socket} socket
 */
function navigation(socket) {
    // Full-life session variables (Between connection and disconnection)
    const session = {};
    // Register all middleware with Socket
    for (const fn of exports.routerApp.getMiddlewares()) {
        socket.use((packet, next) => {
            const protocol = packet[1];
            if (!protocol)
                return log_1.default.info(`session ${socket.id} request data protocol format is incorrect`);
            const ctx = new ctx_1.default(protocol.uuid, socket, session);
            fn(packet[0], ctx, protocol.data, next);
        });
    }
    // Register all events with Socket
    for (const event of exports.routerApp.eventNames()) {
        socket.on(event, (protocol) => {
            if (!protocol)
                return log_1.default.info(`session ${socket.id} request data protocol format is incorrect`);
            const ctx = new ctx_1.default(protocol.uuid, socket, session, event.toString());
            exports.routerApp.emitRouter(event, ctx, protocol.data);
        });
    }
    // 触发已连接事件路由
    const ctx = new ctx_1.default(null, socket, session);
    exports.routerApp.emitRouter("connection", ctx, null);
}
exports.navigation = navigation;
log_1.default.info("正在读取业务路由与相关中间件...");
// 身份验证路由顺序必须是第一位装载，这些路由顺序均不可擅自改变
require("../routers/auth_router");
require("../routers/passport_router");
require("../routers/info_router");
require("../routers/Instance_router");
require("../routers/instance_event_router");
require("../routers/file_router");
require("../routers/stream_router");
require("../routers/environment_router");
require("../routers/schedule_router");
log_1.default.info(`装载完毕, 共路由 ${exports.routerApp.eventNames().length} 个, 中间件 ${exports.routerApp.middlewares.length} 个`);
//# sourceMappingURL=router.js.map