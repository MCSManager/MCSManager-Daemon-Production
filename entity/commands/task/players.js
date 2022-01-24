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
Object.defineProperty(exports, "__esModule", { value: true });
class RefreshPlayer {
    constructor() {
        this.name = "RefreshPlayer";
        this.status = 0;
        this.task = null;
    }
    async start(instance) {
        this.task = setInterval(async () => {
            // {
            //   host: 'localhost',
            //   port: 28888,
            //   status: true,
            //   version: '1.17.1',
            //   motd: 'A Minecraft Server',
            //   current_players: '0',
            //   max_players: '20',
            //   latency: 1
            // }
            try {
                const result = await instance.execPreset("getPlayer");
                if (!result)
                    return;
                instance.info.maxPlayers = result.max_players ? result.max_players : -1;
                instance.info.currentPlayers = result.current_players ? result.current_players : -1;
                instance.info.version = result.version ? result.version : "";
            }
            catch (error) { }
        }, 3000);
    }
    async stop(instance) {
        instance.info.maxPlayers = -1;
        instance.info.currentPlayers = -1;
        instance.info.version = "";
        clearInterval(this.task);
    }
}
exports.default = RefreshPlayer;
//# sourceMappingURL=players.js.map