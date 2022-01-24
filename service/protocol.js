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
exports.broadcast = exports.socketObjects = exports.delGlobalSocket = exports.addGlobalSocket = exports.stringify = exports.parse = exports.error = exports.msg = exports.responseError = exports.response = exports.Packet = void 0;
const ctx_1 = __importDefault(require("../entity/ctx"));
const log_1 = __importDefault(require("./log"));
// 定义网络协议与常用发送/广播/解析功能，客户端也应当拥有此文件
const STATUS_OK = 200;
const STATUS_ERR = 500;
// 全局 Socket 储存
const globalSocket = new Map();
class Packet {
    constructor(uuid = null, status = 200, event = null, data = null) {
        this.uuid = uuid;
        this.status = status;
        this.event = event;
        this.data = data;
    }
}
exports.Packet = Packet;
function response(ctx, data) {
    const packet = new Packet(ctx.uuid, STATUS_OK, ctx.event, data);
    ctx.socket.emit(ctx.event, packet);
}
exports.response = response;
function responseError(ctx, err) {
    let errinfo = "";
    if (err)
        errinfo = err.toString();
    else
        errinfo = err;
    const packet = new Packet(ctx.uuid, STATUS_ERR, ctx.event, errinfo);
    log_1.default.error(`会话 ${ctx.socket.id}(${ctx.socket.handshake.address})/${ctx.event} 响应数据时异常:\n`, err);
    ctx.socket.emit(ctx.event, packet);
}
exports.responseError = responseError;
function msg(ctx, event, data) {
    const packet = new Packet(ctx.uuid, STATUS_OK, event, data);
    ctx.socket.emit(event, packet);
}
exports.msg = msg;
function error(ctx, event, err) {
    const packet = new Packet(ctx.uuid, STATUS_ERR, event, err);
    log_1.default.error(`会话 ${ctx.socket.id}(${ctx.socket.handshake.address})/${event} 响应数据时异常:\n`, err);
    ctx.socket.emit(event, packet);
}
exports.error = error;
function parse(text) {
    if (typeof text == "object") {
        return new Packet(text.uuid || null, text.status, text.event, text.data);
    }
    const obj = JSON.parse(text);
    return new Packet(null, obj.status, obj.event, obj.data);
}
exports.parse = parse;
function stringify(obj) {
    return JSON.stringify(obj);
}
exports.stringify = stringify;
function addGlobalSocket(socket) {
    globalSocket.set(socket.id, socket);
}
exports.addGlobalSocket = addGlobalSocket;
function delGlobalSocket(socket) {
    globalSocket.delete(socket.id);
}
exports.delGlobalSocket = delGlobalSocket;
function socketObjects() {
    return globalSocket;
}
exports.socketObjects = socketObjects;
// 全局 Socket 广播
function broadcast(event, obj) {
    globalSocket.forEach((socket) => {
        msg(new ctx_1.default(null, socket), event, obj);
    });
}
exports.broadcast = broadcast;
//# sourceMappingURL=protocol.js.map