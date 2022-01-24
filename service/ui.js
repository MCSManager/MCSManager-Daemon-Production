"use strict";
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
const readline_1 = __importDefault(require("readline"));
const protocol = __importStar(require("./protocol"));
const system_instance_1 = __importDefault(require("./system_instance"));
const config_1 = require("../entity/config");
const log_1 = __importDefault(require("./log"));
const start_1 = __importDefault(require("../entity/commands/start"));
const stop_1 = __importDefault(require("../entity/commands/stop"));
const kill_1 = __importDefault(require("../entity/commands/kill"));
const cmd_1 = __importDefault(require("../entity/commands/cmd"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log('[终端] 守护进程拥有基本的交互功能，请输入"help"查看更多信息');
function stdin() {
    rl.question("> ", (answer) => {
        try {
            const cmds = answer.split(" ");
            log_1.default.info(`[Terminal] ${answer}`);
            const result = command(cmds[0], cmds[1], cmds[2], cmds[3]);
            if (result)
                console.log(result);
            else
                console.log(`Command ${answer} does not exist, type help to get help.`);
        }
        catch (err) {
            log_1.default.error("[Terminal]", err);
        }
        finally {
            // next
            stdin();
        }
    });
}
stdin();
/**
 * Pass in relevant UI commands and output command results
 * @param {String} cmd
 * @return {String}
 */
function command(cmd, p1, p2, p3) {
    if (cmd === "instance") {
        if (p1 === "start") {
            system_instance_1.default.getInstance(p2).exec(new start_1.default("Terminal"));
            return "Done.";
        }
        if (p1 === "stop") {
            system_instance_1.default.getInstance(p2).exec(new stop_1.default());
            return "Done.";
        }
        if (p1 === "kill") {
            system_instance_1.default.getInstance(p2).exec(new kill_1.default());
            return "Done.";
        }
        if (p1 === "send") {
            system_instance_1.default.getInstance(p2).exec(new cmd_1.default(p3));
            return "Done.";
        }
        return "Parameter error";
    }
    if (cmd === "instances") {
        const objs = system_instance_1.default.instances;
        let result = "instance name | instance UUID | status code\n";
        objs.forEach((v) => {
            result += `${v.config.nickname} ${v.instanceUuid} ${v.status()}\n`;
        });
        result += "\nStatus Explanation:\n Busy=-1;Stop=0;Stopping=1;Starting=2;Running=3;\n";
        return result;
    }
    if (cmd === "sockets") {
        const sockets = protocol.socketObjects();
        let result = "IP address   |   identifier\n";
        sockets.forEach((v) => {
            result += `${v.handshake.address} ${v.id}\n`;
        });
        result += `Total ${sockets.size} online.\n`;
        return result;
    }
    if (cmd == "key") {
        return config_1.globalConfiguration.config.key;
    }
    if (cmd == "exit") {
        try {
            log_1.default.info("Preparing to shut down the daemon...");
            system_instance_1.default.exit();
            // logger.info("Data saved, thanks for using, goodbye!");
            log_1.default.info("The data is saved, thanks for using, goodbye!");
            log_1.default.info("closed.");
            process.exit(0);
        }
        catch (err) {
            log_1.default.error("Failed to end the program. Please check the file permissions and try again. If you still can't close it, please use Ctrl+C to close.", err);
        }
    }
    if (cmd == "help") {
        console.log("----------- Help document -----------");
        console.log(" instances view all instances");
        console.log(" Sockets view all linkers");
        console.log(" key view key");
        console.log(" exit to close this program (recommended method)");
        console.log(" instance start <UUID> to start the specified instance");
        console.log(" instance stop <UUID> to start the specified instance");
        console.log(" instance kill <UUID> to start the specified instance");
        console.log(" instance send <UUID> <CMD> to send a command to the instance");
        console.log("----------- Help document -----------");
        return "\n";
    }
}
//# sourceMappingURL=ui.js.map