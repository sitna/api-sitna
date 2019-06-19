(function () {
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
        if (typeof (key) === "string" && key.toLowerCase().indexOf(value.toLowerCase())===0) {
            chunk = chunk.render(body, context);
        }
        else if (skip) {
            chunk = chunk.render(skip, context);
        }
        return chunk;
    };
})();
