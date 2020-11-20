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
                const version = options.version || '1.0.0';
                switch (version) {
                    case '0.4.0':
                        return WPS.buildExecuteQuery040(options);
                    default:
                        return WPS.buildExecuteQuery100(options);
                }
            },
            buildExecuteQuery100: function (options) {
                options = options || {};
                var xml = [];
                xml.push(
`<?xml version= "1.0" encoding= "UTF-8" ?>
<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
<ows:Identifier>${options.process}</ows:Identifier>
<wps:DataInputs>`
                );
                var dataInputs = options.dataInputs;
                if (dataInputs) {
                    for (var key in dataInputs) {
                        if (dataInputs.hasOwnProperty(key)) {
                            var data = dataInputs[key];
                            if (data !== void (0)) {
                                xml.push(
`<wps:Input>
<ows:Identifier>${key}</ows:Identifier>
<wps:Data>`
                                );
                                if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
                                    xml.push(`<wps:LiteralData>${data}</wps:LiteralData>`);
                                }
                                else {
                                    if (data.mimeType && data.value) {
                                        xml.push(`<wps:ComplexData mimeType="${data.mimeType}"><![CDATA[${data.value}]]></wps:ComplexData>`);
                                    }
                                }
                                xml.push(
`</wps:Data>
</wps:Input>`
                                );
                            }
                        }
                    }
                }
                xml.push(
`</wps:DataInputs>
<wps:ResponseForm>
<wps:RawDataOutput mimeType="${options.responseType}">
<ows:Identifier>result</ows:Identifier>
</wps:RawDataOutput>
</wps:ResponseForm>
</wps:Execute>`
                );
                return xml.join('');
            },
            buildExecuteQuery040: function (options) {
                options = options || {};
                var xml = [];
                xml.push(
`<?xml version= "1.0" encoding= "UTF-8" ?>
<wps:Execute service="WPS" version="0.4.0" store="false" status="false" xmlns:wps="http://www.opengeospatial.net/wps" xmlns:ows="http://www.opengis.net/ows" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengeospatial.net/wps..wpsExecute.xsd">
<ows:Identifier>${options.process}</ows:Identifier>
<wps:DataInputs>`
                );
                var dataInputs = options.dataInputs;
                if (dataInputs) {
                    for (var key in dataInputs) {
                        if (dataInputs.hasOwnProperty(key)) {
                            var data = dataInputs[key];
                            if (data !== void (0)) {
                                xml.push(
`<wps:Input>
<ows:Identifier>${key}</ows:Identifier>
<ows:Title>${key}</ows:Title>`
                                );
                                var dataType;
                                const typeofData = typeof data;
                                if (typeofData === 'string' || typeofData === 'number' || typeofData === 'boolean') {
                                    switch (typeof data) {
                                        case 'number':
                                            dataType = 'urn:ogc:def:dataType:OGC:0.0:Double';
                                            break;
                                        case 'boolean':
                                            dataType = 'urn:ogc:def:dataType:OGC:0.0:Boolean';
                                            break;
                                        default:
                                            dataType = 'urn:ogc:def:dataType:OGC:0.0:String';
                                            break;
                                    }
                                    xml.push(`<wps:LiteralValue dataType="${dataType}" uom="${dataType}">${data}</wps:LiteralValue>`);
                                }
                                else {
                                    if (data.mimeType && data.value) {
                                        xml.push(`<wps:ComplexValue format="${data.mimeType}"><![CDATA[${data.value}]]></wps:ComplexValue>`);
                                    }
                                }
                                xml.push('</wps:Input>');
                            }
                        }
                    }
                }
                xml.push(
`</wps:DataInputs>';
<wps:OutputDefinitions>
<wps:Output format="${options.responseType}"`
                );
                if (options.output && options.output.uom) {
                    xml.push(` uom="${options.output.uom}"`);
                }
                xml.push(
` encoding="UTF-8" schema="http://schemas.opengis.net/gml/3.0.0/base/gml.xsd">
<ows:Identifier>result</ows:Identifier>
<ows:Title>result</ows:Title>
</wps:Output>
</wps:OutputDefinitions>
</wps:Execute>`
                );
                return xml.join('');
            }
        };
        return WPS;
});