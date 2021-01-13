(function () {

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (stringBuscada, posicion) {
            posicion = posicion || 0;
            return this.indexOf(stringBuscada, posicion) === posicion;
        };
    }

    dust.helpers.iterate = function (chunk, context, bodies, params) {
        params = params || {};
        var obj = params['on'] || context.current();
        var excludedKeys = params.excludedKeys != null ? params.excludedKeys.split(',') : null;

        for (var k in obj) {
            if (excludedKeys == null || excludedKeys.indexOf(k) < 0) {
                chunk = chunk.render(bodies.block, context.push({ key: k, value: obj[k] }));
            }
        }
        return chunk;
    }
    dust.helpers.startsWith = function (chunk, context, bodies, params) {
        var body = bodies.block, skip = bodies['else'], key = params["key"], value = params["value"];
        if (typeof (key) === "string" && key.toLowerCase().indexOf(value.toLowerCase()) === 0) {
            chunk = chunk.render(body, context);
        }
        else if (skip) {
            chunk = chunk.render(skip, context);
        }
        return chunk;
    };
    dust.helpers.isObject = function (chunk, context, bodies, params) {
        params = params || {};
        var body = bodies.block, skip = bodies['else'], obj = params["object"] || context.current();
        if (obj instanceof Array && bodies['array']) {
            chunk = chunk.render(bodies['array'], context);
        }
        else if (obj instanceof Object) {
            chunk = chunk.render(body, context);
        }
        else if (skip) {
            chunk = chunk.render(skip, context);
        }
        return chunk;
    }
    dust.helpers.isKeyKalue = function (chunk, context, bodies, params) {
        params = params || {};
        var body = bodies.block, skip = bodies['else'], obj = params["object"] || context.current();
        if (obj.hasOwnProperty("value") && !(obj["value"] instanceof Object))
            chunk.render(body, context);
        else if (skip)
            chunk.render(skip, context);
        return chunk;
    }
    var ids = [];
    dust.filters.objectId = function (value) {
        let found = ids.find((item) => { return item.obj === value });
        if (!found)
            ids.push(found = { "obj": value, id: TC.getUID() })
        return found.id;
    }
})();
