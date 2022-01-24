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
const router_1 = require("../service/router");
const protocol = __importStar(require("../service/protocol"));
const config_1 = require("../entity/config");
const log_1 = __importDefault(require("../service/log"));
// 最迟验证时间
const AUTH_TIMEOUT = 6000;
// 认证类型标识
const TOP_LEVEL = "TOP_LEVEL";
// 顶级权限认证中间件（任何权限验证中间件此为第一位）
router_1.routerApp.use(async (event, ctx, _, next) => {
    const socket = ctx.socket;
    // 放行所有数据流控制器
    if (event.startsWith("stream"))
        return next();
    // 除 auth 控制器是公开访问，其他业务控制器必须得到授权才可访问
    if (event === "auth")
        return await next();
    if (!ctx.session)
        throw new Error("Session does not exist in authentication middleware.");
    if (ctx.session.key === config_1.globalConfiguration.config.key && ctx.session.type === TOP_LEVEL && ctx.session.login && ctx.session.id) {
        return await next();
    }
    log_1.default.warn(`会话 ${socket.id}(${socket.handshake.address}) 试图无权限访问 ${event} 现已阻止.`);
    return protocol.error(ctx, "error", "权限不足，非法访问");
});
// 日志输出中间件
// routerApp.use((event, ctx, data, next) => {
//   try {
//     const socket = ctx.socket;
//     logger.info(`收到 ${socket.id}(${socket.handshake.address}) 的 ${event} 指令.`);
//     logger.info(` - 数据: ${JSON.stringify(data)}.`);
//   } catch (err) {
//     logger.error("日志记录错误:", err);
//   } finally {
//     next();
//   }
// });
// 身份认证控制器
router_1.routerApp.on("auth", (ctx, data) => {
    if (data === config_1.globalConfiguration.config.key) {
        // 身份认证通过，注册会话为可信会话
        log_1.default.info(`会话 ${ctx.socket.id}(${ctx.socket.handshake.address}) 验证身份成功`);
        loginSuccessful(ctx, data);
        protocol.msg(ctx, "auth", true);
    }
    else {
        protocol.msg(ctx, "auth", false);
    }
});
// 已连接事件，用于超时身份认证关闭
router_1.routerApp.on("connection", (ctx) => {
    const session = ctx.session;
    setTimeout(() => {
        if (!session.login) {
            ctx.socket.disconnect();
            log_1.default.info(`会话 ${ctx.socket.id}(${ctx.socket.handshake.address}) 因长时间未验证身份而断开连接`);
        }
    }, AUTH_TIMEOUT);
});
// 登录成功后必须执行此函数
function loginSuccessful(ctx, data) {
    ctx.session.key = data;
    ctx.session.login = true;
    ctx.session.id = ctx.socket.id;
    ctx.session.type = TOP_LEVEL;
    return ctx.session;
}
//# sourceMappingURL=auth_router.js.map