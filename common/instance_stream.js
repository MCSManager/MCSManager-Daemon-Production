"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 应用实例数据流转发适配器
class InstanceStreamListener {
    constructor() {
        // Instance uuid -> Socket[]
        this.listenMap = new Map();
    }
    requestForward(socket, instanceUuid) {
        if (this.listenMap.has(instanceUuid)) {
            const sockets = this.listenMap.get(instanceUuid);
            for (const iterator of sockets)
                if (iterator.id === socket.id)
                    throw new Error(`此 Socket ${socket.id} 已经存在于指定实例监听表中`);
            sockets.push(socket);
        }
        else {
            this.listenMap.set(instanceUuid, [socket]);
        }
    }
    cannelForward(socket, instanceUuid) {
        if (!this.listenMap.has(instanceUuid))
            throw new Error(`指定 ${instanceUuid} 并不存在于监听表中`);
        const socketList = this.listenMap.get(instanceUuid);
        socketList.forEach((v, index) => {
            if (v.id === socket.id)
                socketList.splice(index, 1);
        });
    }
    forward(instanceUuid, data) {
        const sockets = this.listenMap.get(instanceUuid);
        sockets.forEach((socket) => {
            if (socket && socket.connected)
                socket.emit("instance/stdout", data);
        });
    }
    forwardViaCallback(instanceUuid, callback) {
        if (this.listenMap.has(instanceUuid)) {
            const sockets = this.listenMap.get(instanceUuid);
            sockets.forEach((socket) => {
                if (socket && socket.connected)
                    callback(socket);
            });
        }
    }
    hasListenInstance(instanceUuid) {
        return this.listenMap.has(instanceUuid) && this.listenMap.get(instanceUuid).length > 0;
    }
}
exports.default = InstanceStreamListener;
//# sourceMappingURL=instance_stream.js.map