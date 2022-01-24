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
exports.PresetCommandManager = void 0;
class PresetCommandManager {
    constructor(self) {
        this.self = self;
        this.preset = new Map();
    }
    setPreset(action, cmd) {
        this.preset.set(action, cmd);
    }
    getPreset(action) {
        return this.preset.get(action);
    }
    async execPreset(action, p) {
        const cmd = this.preset.get(action);
        if (!cmd)
            throw new Error(`预设命令 ${action} 不可用`);
        return await cmd.exec(this.self, p);
    }
    clearPreset() {
        this.preset.clear();
    }
}
exports.PresetCommandManager = PresetCommandManager;
//# sourceMappingURL=preset.js.map