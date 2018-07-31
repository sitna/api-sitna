var TC = TC || {};
TC.format = TC.format || {};
(function (root, factory) {
    if (typeof exports === "object") { // CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) { // AMD
        define([], factory);
    } else {
        root.WPS = factory();
    }
})(TC.format, function () {
        var WPS = {
            buildExecuteQuery: function (options) {
                options = options || {};
                var html = [];
                html[html.length] = '<?xml version= "1.0" encoding= "UTF-8" ?>';
                html[html.length] = '<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">'
                html[html.length] = '<ows:Identifier>' + options.process + '</ows:Identifier>';
                html[html.length] = '<wps:DataInputs>';
                var dataInputs = options.dataInputs;
                if (dataInputs) {
                    for (var key in dataInputs) {
                        if (dataInputs.hasOwnProperty(key)) {
                            var data = dataInputs[key];
                            if (data !== void (0)) {
                                html[html.length] = '<wps:Input>';
                                html[html.length] = '<ows:Identifier>' + key + '</ows:Identifier>';
                                html[html.length] = '<wps:Data>';
                                if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
                                    html[html.length] = '<wps:LiteralData>' + data + '</wps:LiteralData>';
                                }
                                else {
                                    if (data.mimeType && data.value) {
                                        html[html.length] = '<wps:ComplexData mimeType="' + data.mimeType + '"><![CDATA[' + data.value + ']]></wps:ComplexData>';
                                    }
                                }
                                html[html.length] = '</wps:Data>';
                                html[html.length] = '</wps:Input>';
                            }
                        }
                    }
                }
                html[html.length] = '</wps:DataInputs>';
                html[html.length] = '<wps:ResponseForm>';
                html[html.length] = '<wps:RawDataOutput mimeType="' + options.responseType + '">';
                html[html.length] = '<ows:Identifier>result</ows:Identifier>';
                html[html.length] = '</wps:RawDataOutput>';
                html[html.length] = '</wps:ResponseForm>'
                html[html.length] = '</wps:Execute>';
                return html.join('');
            }
        };
        return WPS;
});