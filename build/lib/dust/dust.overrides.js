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
})();
