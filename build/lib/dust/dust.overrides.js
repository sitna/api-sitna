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
        params = params || {};
        var obj = params['with'] || context.current();
        
        for (var k in obj.split(',')) {
            if (context.current().toLowerCase().startsWith(k.toLowerCase()))
                return true;
        }
        return false;
    }
})();
