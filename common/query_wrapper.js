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
exports.QueryWrapper = exports.LocalFileSource = exports.MySqlSource = exports.QueryMapWrapper = void 0;
// 供给路由层使用的MAP型查询接口
class QueryMapWrapper {
    constructor(map) {
        this.map = map;
    }
    select(condition) {
        const result = [];
        this.map.forEach((v) => {
            if (condition(v))
                result.push(v);
        });
        return result;
    }
    page(data, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        let size = data.length;
        let maxPage = 0;
        while (size > 0) {
            size -= pageSize;
            maxPage++;
        }
        return {
            page,
            pageSize,
            maxPage,
            data: data.slice(start, end)
        };
    }
}
exports.QueryMapWrapper = QueryMapWrapper;
// MYSQL 数据源
class MySqlSource {
}
exports.MySqlSource = MySqlSource;
// 本地文件数据源（内嵌式微型数据库）
class LocalFileSource {
    constructor(data) {
        this.data = data;
    }
    selectPage(condition, page = 1, pageSize = 10) {
        const result = [];
        this.data.forEach((v) => {
            for (const key in condition) {
                const dataValue = v[key];
                const targetValue = condition[key];
                if (targetValue[0] == "%") {
                    if (!dataValue.includes(targetValue.slice(1, targetValue.length - 1)))
                        return false;
                }
                else {
                    if (targetValue !== dataValue)
                        return false;
                }
            }
            result.push(v);
        });
        return this.page(result, page, pageSize);
    }
    page(data, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        let size = data.length;
        let maxPage = 0;
        while (size > 0) {
            size -= pageSize;
            maxPage++;
        }
        return {
            page,
            pageSize,
            maxPage,
            total: data.length,
            data: data.slice(start, end)
        };
    }
    select(condition) {
        return null;
    }
    update(condition, data) { }
    delete(condition) { }
    insert(data) { }
}
exports.LocalFileSource = LocalFileSource;
// 供给路由层使用的统一数据查询接口
class QueryWrapper {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    selectPage(condition, page = 1, pageSize = 10) {
        return this.dataSource.selectPage(condition, page, pageSize);
    }
}
exports.QueryWrapper = QueryWrapper;
//# sourceMappingURL=query_wrapper.js.map