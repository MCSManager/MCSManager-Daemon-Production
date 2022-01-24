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
// Using SLT (Server List Ping) provided by Minecraft.
// Since it is part of the protocol it is always enabled contrary to Query
// More information at: https://wiki.vg/Server_List_Ping#Response
// Github: https://github.com/Vaksty/mcping
const net_1 = __importDefault(require("net"));
function formatMotd(motd) {
    let noSpaces = motd.replace(/\u0000/g, "");
    Buffer.from(noSpaces);
    // let noColor = noSpaces.toString().replace(/[^\x00-\x7F]/g, '');
    // console.log(Buffer.from(motd, 'utf8').toString('hex'));
    // console.log(noColor);
}
class MCServStatus {
    constructor(port, host) {
        this.port = port;
        this.host = host;
        this.status = {
            online: null,
            version: null,
            motd: null,
            current_players: null,
            max_players: null,
            latency: null
        };
    }
    getStatus() {
        return new Promise((resolve, reject) => {
            var start_time = new Date().getTime();
            const client = net_1.default.connect(this.port, this.host, () => {
                this.status.latency = Math.round(new Date().getTime() - start_time);
                // 0xFE packet identifier for a server list ping
                // 0x01 server list ping's payload (always 1)
                let data = Buffer.from([0xfe, 0x01]);
                client.write(data);
            });
            // The client can also receive data from the server by reading from its socket.
            client.on("data", (response) => {
                // Check the readme for a simple explanation
                var server_info = response.toString().split("\x00\x00");
                this.status = {
                    host: this.host,
                    port: this.port,
                    status: true,
                    version: server_info[2].replace(/\u0000/g, ""),
                    motd: server_info[3].replace(/\u0000/g, ""),
                    current_players: server_info[4].replace(/\u0000/g, ""),
                    max_players: server_info[5].replace(/\u0000/g, ""),
                    latency: this.status.latency
                };
                formatMotd(server_info[3]);
                // Request an end to the connection after the data has been received.
                client.end();
                resolve(this.status);
            });
            client.on("end", () => {
                // console.log('Requested an end to the TCP connection');
            });
            client.on("error", (err) => {
                reject(err);
            });
        });
    }
    async asyncStatus() {
        let status = await this.getStatus();
        return status;
    }
}
exports.default = MCServStatus;
//# sourceMappingURL=mcping.js.map