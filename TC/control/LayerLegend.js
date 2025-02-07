import TC from '../../TC';
import Consts from '../Consts';
//import { Defaults } from '../Cfg';
import Util from '../Util';
import WebComponentControl from './WebComponentControl';
import ImageMagnifier from './ImageMagnifier';
import { fivePointStarPoints, crossPoints } from '../tool/WellKnowNameFactory';
import Factory from '../tool/WellKnowNameFactory';
import { line as lineTemplate, polygon as polygonTemplate } from '../tool/WellKnowNameTemplates';


TC.control = TC.control || {};

const className = 'tc-ctl-layer-legend';
const elementName = 'sitna-layer-legend';
const loadingClassName = 'tc-ctl-layer-legend-loading';

const _defaultPolygonValues = {
    fill: "transparent",
    stroke: "transparent",
    "stroke-width": 1
}
const _defaultCircleValues = {
    fill: "transparent",
    stroke: "transparent",
    "stroke-width": 1
}
const _pathDefaultStyle = {
    "fill": "transparent",
    "stroke-opacity": "1",
    "stroke-width": 1
};
const _symbolDefaultWidth = 20;
const _symbolDefaultHeight = 20;
const svgTemplate = '<svg xmlns="http://www.w3.org/2000/svg" height="{height}" width="{width}" {viewBox}>{inner}</svg>';
const circlePattern = '<circle cx="{x}" cy="{y}" r="{r}" {style} />';

const createStyles = function (symbolizer) {
    const _styles = [];
    delete symbolizer["mark"];
    for (var i in symbolizer) {
        if (!(symbolizer[i] instanceof Object)) {
            if (i === "stroke-width" && Number(symbolizer[i]) < 1)
                symbolizer[i] = 1;
            _styles.push(i + '="' + symbolizer[i] + '"');
        }

        else if (symbolizer[i] instanceof Array)
            _styles.push(i + '="' + symbolizer[i].join(" ") + '"');
        else {
            if (symbolizer[i]["rotation"]) {
                _styles.push('transform="rotate(' + symbolizer[i]["rotation"] + ')"');
                _styles.push('transform-origin="50% 50%"');
            }
            if (symbolizer[i]["opacity"] && Number(symbolizer[i]["opacity"]) < 1) {
                _styles.push('opacity="' + symbolizer[i]["opacity"] +'"');
            }
        }
    }
    return _styles.join(' ');
}

const createTransform = function (symbol) {
    const transformation = [];
    if (symbol.rotation) {
        transformation.push("rotate(" + symbol.rotation + "deg)");        
    }
    if (transformation.length) {
        return 'style="transform:' + transformation.join(";") + ';transform-origin: 50% 50%' + '"';
    } else {
        return "";
    }
}

const wktToPath = (wkt, size, origin) => {
    let wktFormat = new ol.format.WKT();
    const coordinates = wktFormat.readGeometry(wkt.substring(wkt.lastIndexOf("/") + 1)).getCoordinates();
    const geometryType = wkt.substring(wkt.lastIndexOf("/") + 1, wkt.indexOf("("));    
    const pathCoordinates = (coords) => {
        return coords.reduce((vi, va, i) => { va = va.map((i, index) => { return (i * size) + (index ? origin : 0) }); return vi + (i ? " L" : "") + va }, "M")
    };
    switch (geometryType.toUpperCase()) {
        case "LINESTRING":
            return pathCoordinates(coordinates);
        case "MULTILINESTRING":
            return coordinates.reduce((vi, va, i) => { return vi + (i ? " " : "") + pathCoordinates(va) }, "");
        case "POLYGON":
            return coordinates.reduce((vi, va, i) => { return vi + (i ? " " : "") + pathCoordinates(va) }, "");            
        case "MULTIPOLYGON":
            return coordinates.reduce((vi, va, i) => { return vi + (i ? " " : "") + va.reduce((vi, va, i) => { return vi + (i ? " " : "") + pathCoordinates(va) }, "") }, "");

    }
    return "";
};

const createPatterns = function (graphicFill, patternId,vendorOptions) {
    const getLinePattern = (graphic, size) => {
        const linePattern = '<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" shape-rendering="crispEdges" {style} />';        
        switch (graphic.mark) {
            case "shape://slash":
                return TC.Util.formatTemplate(linePattern, { x1: size, y1: 0, x2: 0, y2: size, style: createStyles(graphic) });
            case "shape://backslash":
                return TC.Util.formatTemplate(linePattern, { x1: 0, y1: 0, x2: size, y2: size, style: createStyles(graphic) });
            case "shape://vertline":
                return TC.Util.formatTemplate(linePattern, { x1: size/2, y1: 0, x2: size/2, y2: size, style: createStyles(graphic) });
            case "shape://horline":
                return TC.Util.formatTemplate(linePattern, { x1: 0, y1: size / 2, x2: size, y2: size / 2, style: createStyles(graphic) });
            case "shape://dot":
                return TC.Util.formatTemplate(circlePattern, { x: 0, y: 0, r:size, style: createStyles(graphic) });
        }
    }    
    const getShapePattern = (graphic, size) => {        
        switch (graphic.mark) {            
            case "shape://dot":
                return TC.Util.formatTemplate(circlePattern, { x: size / 2, y: size / 2, r: 1, style: createStyles(graphic) });
            //case "shape://oarrow":

        }
    }
    const getFontPattern = (graphic, size) => {
        const textPattern = '<text x="0" y="{size}" font-family="{font}" font-size="{size}px" {style} >&#{char};</text>';
        const regex = /ttf:\/\/(?<font>.+)\#(?<char>\d+)/gmi;
        const groups = regex.exec(graphic.mark).groups;
        return TC.Util.formatTemplate(textPattern, { size: size, font: groups.font, char: groups.char, style: createStyles(graphic) });
    };
    const size = Number(graphicFill.size) + (Number(vendorOptions?.["graphic-margin"] || 0) * 2);
    var result = TC.Util.formatTemplate('<defs><pattern id="{patternId}" x = "0" y = "{y}" width = "{w}" height = "{h}" patternUnits = "userSpaceOnUse" >', {
        w: size, h: size , patternId: patternId,
        y: size
    });    
    graphicFill.graphics.forEach((graphic) => {
        switch (graphic.mark) {
            case "shape://slash":
            case "shape://backslash":
            case "shape://vertline":
            case "shape://horline":
                result += getLinePattern(graphic, size);
                break;
            case "shape://dot":
                result += getShapePattern(graphic, size);
                break;
            case undefined:
            default:
                if (graphic.mark?.startsWith("ttf")) {
                    result += getFontPattern(graphic, Number(graphicFill.size));
                }
                break;
        }
    });
    result += "</pattern></defs >";
    return result;

}
const getGraphicStroke = async function (line, size) {

    const returned = [];
    const baseLineTemplate = '<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="url(#{patternId})" shape-rendering="crispEdges" stroke-width="{h}" {style} />';
    const patternId = TC.getUID();
       
    const arrPromises= line["graphic-stroke"].graphics.map(async (graphic) => {
        const arrowPattern = (_size,offset) => {
            const ratio = 13 / 15;
            return '<path d="M' + (_size - offset) + ' ' + (ratio * _size) / 2 + ' L' + (1 + offset) + ' ' + (ratio * _size - offset) + ' L' + (1 + offset) + ' ' + (1 + offset) + ' Z" {style} transform="translate(0 ' + ((_symbolDefaultHeight - _size)/2) + ')" />';
        };
        const transform = (params) => {
            if (params) {
                let transformString = [];
                if (params.rotate)
                    transformString.push(TC.Util.formatTemplate('rotate({angle} {x} {y})', { angle: params.rotate, x: size / 2, y: size / 2 }));
                if (params.translate)
                    transformString.push(TC.Util.formatTemplate('translate({x} {y})', { x: params.translate[0], y: params.translate[1] }));
                return transformString.length === 0 ? "" : 'transform="' + transformString.join(' ') + '"';
            }
            else return "";
        }
        switch (true) {
            case !!graphic["external-graphic-url"]:
                try {
                    return (await getImageSymbolizer(graphic, line["graphic-stroke"].size, true)).data;
                }
                catch (err) {
                    return "";
                }                
            case graphic.mark === "shape://oarrow": {
                let offset = (Number(graphic["stroke-dasharray"][0]) - (Number(line["graphic-stroke"].size) / size) * Number(graphic["stroke-dasharray"][0]));
                return TC.Util.formatTemplate(arrowPattern(Number(graphic["stroke-dasharray"][0]), offset / 2), { style: createStyles(Object.assign({}, graphic, { "stroke-dasharray": "" })) });
            }
            case graphic.mark?.startsWith("extshape"):
                if (graphic.mark.endsWith("emicircle")) {
                    let size = 5;
                    return TC.Util.formatTemplate('<path d="M{w},{h} a1,1 0 0,0 -{size},0" {style} />', { w: ((size / 2) + (size / 2)), h: size / 2, size: size, style: createStyles(graphic) });
                }
                return "";
                //aki habria que controlar el resto de formas 
            case graphic.mark === "triangle": {
                const transformParams = {
                    "translate": [(_symbolDefaultHeight - size) / 2, 0]
                }
                transformParams["rotate"] = line["graphic-stroke"].rotation;
                return TC.Util.formatTemplate('<path d="M0 {W} L{W} {W} L{w2} 0 Z" {style} {transform} />', { w2: size / 2, W: size, style: createStyles(graphic), transform: transform(transformParams) });
            }
            case graphic.mark?.startsWith("wkt"):
                return TC.Util.formatTemplate('<path d="{path}" {style} />', { path: wktToPath(graphic.mark, line["graphic-stroke"].size, _symbolDefaultHeight / 2), style: createStyles(Object.assign({}, _pathDefaultStyle, graphic)) });
            case graphic.mark === "circle":
                return TC.Util.formatTemplate(circlePattern, { r: size / 2, x: size / 2 + (Number(graphic["stroke-width"] || 0) / 2), y: _symbolDefaultHeight/2 , style: createStyles(Object.assign({}, _pathDefaultStyle, graphic)) });
            default:
                return "";
        }
    });
    const defaultGraphicStroke = async (graphicStroke) => {
        if (graphicStroke.url) {

            return (await getImageSymbolizer(graphicStroke, 20)).data;
        }
        else return "";
    };
    const aux = await Promise.all(arrPromises);

    returned.push(TC.Util.formatTemplate('<defs><pattern id="{patternId}" x = "{x}" y = "{y}" width = "{w}" height = "{h}" patternUnits = "userSpaceOnUse">{innerPath}</pattern></defs>', {
        //w: Math.min(_symbolDefaultWidth, size),
        w: line["stroke-dasharray"]?.[1] || _symbolDefaultWidth,
        h: Math.max(size, _symbolDefaultHeight),
        y: 0,//_symbolDefaultHeight,
        x: line["stroke-dasharray"]?.[0] || 0,
        patternId: patternId,
        innerPath: aux.join(' ') || (await defaultGraphicStroke(line["graphic-stroke"]))
    }));
    
    returned.push(TC.Util.formatTemplate(baseLineTemplate, { y: Math.max(size, _symbolDefaultHeight) / 2, w: _symbolDefaultWidth, h: Math.max(size, _symbolDefaultHeight), patternId: patternId, style:"" }));
    return returned;
}

const getDefaultLegend =async function (i, url,fecthFnc) {
    const _x = -5;
    const _y = -5 - (i * (_symbolDefaultWidth + 10));    
    const imageTemplate = '<image x="{x}" y="{y}" href="{src}" />';
    const legentOptionIndex = url.indexOf("LEGEND_OPTIONS=") + "LEGEND_OPTIONS=".length
    const _url = new URL(url.substring(0, legentOptionIndex) + "forceTitles%3Aoff%3BforceLabels%3Aon%3B" + url.substring(legentOptionIndex) + "&WIDTH=30&HEIGHT=30", document.location).href;

    const toDataURL = url => fecthFnc(url)
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        }));
    const base64data = await toDataURL(_url);
    return TC.Util.formatTemplate(imageTemplate, { x: _x, y: _y, width: _symbolDefaultWidth + 10, height: _symbolDefaultHeight + 10, src: base64data });
}

const internalCreateSymbolizer = async function (rule, text,layer,index) {

    const retorno = [];
    let exceptionalWidth = _symbolDefaultWidth;
    let exceptionalHeight = _symbolDefaultHeight;

    let size = null;

    //const symbolizersProms = (rule.graphics && !TC.Util.isEmptyObject(rule.graphics) && !rule.symbolizers.every(symbol => symbol.Text)) ? [getImageSymbolizer(rule.graphics)] :
    const symbolizersProms = ([...(rule?.symbolizers || []), ...(rule.graphics && !TC.Util.isEmptyObject(rule.graphics) ? [rule.graphics] : [])]).map(async (symbol, _idx, symbols) => { 
        
        if (symbol.Raster?.colormap) {
            const rectangleTemplate = '<rect width="{width}" height="{height}" fill="{color}" />';
            await symbol.Raster.colormap.entries.map(async function (entry) {
                retorno.push({
                    src: 'data:image/svg+xml;base64,' + window.btoa(TC.Util.formatTemplate(svgTemplate, {
                        width: _symbolDefaultWidth,
                        height: _symbolDefaultHeight,
                        viewBox: '',
                        inner: TC.Util.formatTemplate(rectangleTemplate, {
                            width: _symbolDefaultWidth,
                            height: _symbolDefaultHeight,
                            color: entry.color
                        })
                    })),
                    value: entry.label
                })
            })
        }
        else {
            const innerText = [];
            try {
                
                //size = new Number(symbols.reduce((vi, va) => { return (!va?.Point?.size || va?.Point?.size <= vi) ? vi : va.Point.size }, 0)) || 
                size = new Number(symbols.reduce((vi, va) => { return (!va?.Point?.size || new Number(va?.Point?.size) <= vi) ? vi : new Number(va.Point.size) }, 0) ||
                    symbols.reduce((vi, va) => { return (!va?.Line?.["graphic-stroke"]?.size || va?.Line?.["graphic-stroke"]?.size <= vi) ? vi : va.Line?.["graphic-stroke"].size }, 0) || _symbolDefaultWidth)
                if (size > _symbolDefaultHeight) {
                    exceptionalHeight = size;
                }
                if (symbol.Line) {
                    if (symbol.Line["graphic-stroke"]) {
                        if (symbol.Line["graphic-stroke"].graphics?.length) {
                            innerText.push(await getGraphicStroke(symbol.Line, size));
                        }
                        else {
                            try {
                                const imageSymbol = await getImageSymbolizer(symbol.Line["graphic-stroke"].graphics[0]);
                                exceptionalWidth = Math.max(exceptionalWidth, imageSymbol.imageSize.width);
                                exceptionalHeight = Math.max(exceptionalWidth, imageSymbol.imageSize.height);
                                innerText.push(imageSymbol.data);
                            }
                            catch (err) {
                                innerText.push("");
                            }
                        }
                    }
                    else
                        innerText.push(TC.Util.formatTemplate(lineTemplate, { x1: 0, y1: Math.max(exceptionalHeight, _symbolDefaultHeight) / 2, x2: Math.max(exceptionalWidth, _symbolDefaultWidth), y2: Math.max(exceptionalHeight, _symbolDefaultHeight) / 2, style: createStyles(symbol.Line) }));
                }
                if (symbol.Point) {
                    const factory = new Factory(_symbolDefaultHeight, _symbolDefaultWidth);
                    for (var i = 0; i < symbol.Point?.graphics.length; i++) {
                        if (symbol.Point?.graphics[i].mark) {
                            const graphic = symbol.Point.graphics[i];
                            const margin = graphic["stroke-width"] ? Math.max(Number(graphic["stroke-width"]), 1) : 0;
                            if (size > _symbolDefaultWidth) {
                                exceptionalHeight = exceptionalWidth = size + (margin * 2);                                
                            }
                                
                            switch (graphic.mark) {
                                case "square":
                                    innerText.push(factory.square(size, exceptionalWidth, createStyles(Object.assign({}, _defaultCircleValues, graphic)), createTransform(symbol.Point)));
                                    //innerText.push(TC.Util.formatTemplate(squareTemplate, { x: (Math.max(_symbolDefaultWidth, size) - symbol.Point.size) / 2, y: (Math.max(_symbolDefaultHeight, size) - symbol.Point.size) / 2, width: symbol.Point.size, height: symbol.Point.size, style: createStyles(Object.assign({}, _defaultCircleValues, graphic)), transform: createTransform(symbol.Point) }))
                                    break;
                                case "triangle":
                                    innerText.push(factory.triangle(size, exceptionalWidth,createStyles(Object.assign({}, _defaultCircleValues, graphic)), createTransform(symbol.Point)));
                                    break;
                                case "star":
                                    innerText.push(factory.star(size, exceptionalWidth, createStyles(Object.assign({}, _defaultCircleValues, graphic)), createTransform(symbol.Point)));
                                    break;
                                case "cross":
                                    innerText.push(factory.cross(size, exceptionalWidth, createStyles(Object.assign({}, _defaultCircleValues, graphic)), createTransform(symbol.Point)))
                                    break;
                                case "circle":                                                                    
                                    innerText.push(factory.circle(size, exceptionalWidth, createStyles(Object.assign({}, _defaultCircleValues, graphic)), createTransform(symbol.Point)))
                                    break;
                                default:
                                    if (graphic.mark.startsWith("ttf://") && Util.fontSupported(graphic.mark.slice("ttf://".length, graphic.mark.lastIndexOf("#")))) {
                                        innerText.push(getFontSymbolizer(graphic, symbol.Point.size))

                                    }
                                    else {
                                        const imageSymbol = await getImageSymbolizer(symbol.Point, size);
                                        exceptionalWidth = Math.max(exceptionalWidth, imageSymbol.imageSize.width);
                                        exceptionalHeight = Math.max(exceptionalWidth, imageSymbol.imageSize.height);
                                        innerText.push(imageSymbol.data);
                                    }
                                    break;
                            }
                        }
                        else {
                            try {
                                const imageSymbol = await getImageSymbolizer(symbol.Point?.graphics[i], size);
                                exceptionalWidth = Math.max(exceptionalWidth, imageSymbol.imageSize.width);
                                exceptionalHeight = Math.max(exceptionalWidth, imageSymbol.imageSize.height);
                                innerText.push(imageSymbol.data);
                            }
                            catch (err) {
                                innerText.push("");
                            }

                        }
                    }
                }
                if (symbol.Polygon) {
                    var patternsDef = '';
                    if (symbol.Polygon["vendor-options"]) {                   
                        return [await getDefaultLegend(index, layer.getLegendFormatUrl(name, false, true), layer.proxificationTool.fetchImageAsBlob.bind(layer.proxificationTool))];
                    }
                    else {
                        if (symbol.Polygon["graphic-fill"]?.graphics?.length) {
                            const patternId = TC.getUID();
                            patternsDef = createPatterns(symbol.Polygon["graphic-fill"], patternId, symbol.Polygon["vendor-options"]);
                            //delete symbol.Polygon["graphic-fill"];
                            symbol.Polygon["fill"] = "url(#" + patternId + ")";
                        }
                        const factory = new Factory(_symbolDefaultHeight, _symbolDefaultWidth);
                        innerText.push(patternsDef + factory.square(_symbolDefaultWidth, _symbolDefaultWidth, createStyles(Object.assign({}, _defaultPolygonValues, symbol.Polygon)),""));
                        //innerText.push(patternsDef + TC.Util.formatTemplate(polygonTemplate, {
                        //    width: _symbolDefaultWidth, height: _symbolDefaultHeight, style: createStyles(Object.assign({}, _defaultPolygonValues, symbol.Polygon))
                        //}));
                    }
                }
                //if (symbol.Text && !symbols.filter((s) => s !== symbol).find((s) => s["external-graphic-url"])) {
                if (symbol.Text) {
                    if (symbol.Text?.fonts.some(font => Util.fontSupported(font['font-family'])))
                        innerText.push(await getTextSymbolizer(symbol.Text, symbols.filter((s) => s !== symbol && !s["external-graphic-type"]).length ? "x" : null));
                    else {
                        try {
                            const imageSymbol = await getImageSymbolizer(symbol.Text.graphics[0], size, true);
                            exceptionalWidth = Math.max(exceptionalWidth, imageSymbol.imageSize.width);
                            exceptionalHeight = Math.max(exceptionalHeight, imageSymbol.imageSize.height);
                            innerText.push(imageSymbol.data);
                        }
                        catch (err) {
                            innerText.push("");
                        }
                    }
                }

            }

            catch (exception) {
                //if (symbol["external-graphic-url"]) {
                if (symbol["external-graphic-url"] && !symbols.filter((s) => s !== symbol).every((t) => t.Text)) {
                    try {
                        const imageSymbol = await getImageSymbolizer(symbol, size, true);
                        exceptionalWidth = Math.max(exceptionalWidth, imageSymbol.imageSize.width);
                        exceptionalHeight = Math.max(exceptionalHeight, imageSymbol.imageSize.height);
                        innerText.push(imageSymbol.data);
                    }
                    catch (err) {
                        innerText.push("");
                    }
                }
            }
            return innerText;
        }
        });
    if (!symbolizersProms)
        return [];
    const aux = await Promise.all(symbolizersProms);
    if (aux.every((v) => !v))
        return retorno;
    const textSymbol = aux.find(a => a.find && a.find(b => b.indexOf("text") >= 0 && b.indexOf("pattern")<0));
    var _txtWidth;
    //medir textos
    if (textSymbol && textSymbol.length) {
        const textNode = new DOMParser().parseFromString(textSymbol[0], "text/xml").firstChild
        const canvas = document.createElement('canvas');
        const context = canvas.getContext("2d");
        context.font = [textNode.attributes["font-size"].value + "px", textNode.attributes["font-family"]?.value || "", textNode.attributes["font-weight"]?.value || ""].join(" ");
        _txtWidth = context.measureText(textNode.innerText || textNode.innerHTML).width + (parseInt(textNode.attributes["stroke-width"]?.value || 0) * 2);
    }
    //const viewBox = getSVGViewBox(TC.Util.formatTemplate(svgTemplate, { width: _symbolDefaultWidth, height: _symbolDefaultHeight, viewBox: '', inner: aux.join('') }));
    return [{
        src: 'data:image/svg+xml;base64,' + window.btoa(TC.Util.formatTemplate(svgTemplate, {
            width: Math.max(_txtWidth || 0, _symbolDefaultWidth, exceptionalWidth),
            height: Math.max(_symbolDefaultHeight, exceptionalHeight),
            viewBox: '',//'viewBox="' + Object.entries(viewBox).map((entry) => entry[1]).join(" ") + '"',
            inner: aux.join('')
        })),
        value:text
    }];
}

const createSymbolizer = async function (rules,layer) {
    var retorno  = new Array(2);
    const promArray = rules.map(async (rule,index) => {        
        const aux = await internalCreateSymbolizer(rule, rule.title || rule.name || "",layer,index);
        retorno.splice(index,0,...aux);
        return aux;
    });
    await Promise.all(promArray);
    return retorno;
};
const getImageSymbolizer = async function (graphic, sizeH,centered) {
    //return decodeURIComponent(graphic["external-graphic-url"]);
    const imgTemplate = '<image x="{x}" y="{y}" width="{width}" height="{height}" href="{url}" style="transform-origin:50% 50%" />';

    var url = graphic["external-graphic-url"] ? graphic["external-graphic-url"] : graphic.url;

    if (!url) {
        throw new Error("URL vacía");
    }
    //esto para solucionar el problema de geoserver hasta que se publique nueva versión
    if (url.indexOf("image/png") && graphic["external-graphic-type"] && graphic["external-graphic-type"] == "image/svg+xml") {
        url = url.replace("image/png", "image/svg+xml");
    }
    try {
        const imageSize = await getImageSize(url);
        let x = 0, y = 0;
        let sizeW;
        if (imageSize.width > _symbolDefaultWidth && imageSize.height > _symbolDefaultHeight) {
            sizeW = imageSize.width * sizeH / Math.max(sizeH, imageSize.height);
        }
        else {
            sizeW = imageSize.width;
            sizeH = imageSize.height;
        }
        if (imageSize.height < _symbolDefaultHeight) {
            y = (_symbolDefaultHeight - imageSize.height) / 2;
        }
        else if (sizeH < _symbolDefaultHeight) {
            y = (_symbolDefaultHeight - sizeH) / 2;
        }
        if (sizeW < _symbolDefaultWidth) {
            x = (_symbolDefaultWidth - sizeW) / 2;
        }
        if (centered) {
            x = (_symbolDefaultWidth - sizeW) / 2;
        }
        if (graphic.geometry)
            switch (true) {
                case graphic.geometry.indexOf("endPoint")>=0:
                    x = _symbolDefaultWidth - sizeW
                    break;
            }
        return {
            data: TC.Util.formatTemplate(imgTemplate, { x: x, y: y, width: sizeW, height: Math.min(sizeH, imageSize.height), url: imageSize.base64Data }),
            imageSize: {
                width: sizeW < _symbolDefaultWidth ? _symbolDefaultWidth : sizeW,
                height: sizeH < _symbolDefaultHeight ? _symbolDefaultHeight : sizeH
            }
        };       
    }
    catch (err) {
        throw new Error("img load error");
    }
}

const UrlContentToDataUri=function(url) {
    return fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise(callback => {
            let reader = new FileReader();
            reader.onload = function () { callback(this.result) };
            reader.readAsDataURL(blob);
        }));
}


const getImageSize = function (base64dataOrUrl) {
    return new Promise(function (resolve, reject) {
        var i = new Image();
        i.onload = async function () {
            let dataUrl;
            if (base64dataOrUrl.startsWith("http")) {
                dataUrl = await UrlContentToDataUri(i.src);
                //dataUrl = (await TC.Util.imgToDataUrl(i.src)).dataUrl;
            }
            resolve({ width: i.width, height: i.height, base64Data: dataUrl ? dataUrl : base64dataOrUrl });
        };
        i.onerror = function (err) {
            reject(err);
        }
        i.src = base64dataOrUrl.startsWith("http") ? TC.proxify(base64dataOrUrl): base64dataOrUrl;
    });
}

const getTextSymbolizer = async function (textSymbolyzer, text) {

    const textTemplate = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" {styles}>' + (text || "ABC") + '</text>';
    if (textSymbolyzer?.fonts?.length) {        
        const currentFont = textSymbolyzer.fonts.map((font) => Object.assign(font, { "font-family": font["font-family"].join(",") }))[0]
        const styles = Object.entries(currentFont).reduce((vi, va) => { return vi.concat(va[0] + '="' + va[1] + '"') }, []);
        if (textSymbolyzer["fill"])
            styles.push('fill="' + textSymbolyzer["fill"] + '"');
        if (textSymbolyzer["fill-opacity"])
            styles.push('fill-opacity="' + textSymbolyzer["fill-opacity"] + '"');
        if (textSymbolyzer.halo) {
            styles.push('stroke="' + textSymbolyzer.halo.fill + '"');
            if (Object.prototype.hasOwnProperty.call(textSymbolyzer.halo, "fill-opacity"))
                styles.push('stroke-opacity="' + textSymbolyzer.halo['fill-opacity'] + '"');                
            styles.push('stroke-width="' + Math.round(textSymbolyzer.halo.radius) + '"');
            styles.push('paint-order="stroke"');
        }
        return TC.Util.formatTemplate(textTemplate, {  styles: styles.join(" ") });
    }    
    return "";
}

const getFontSymbolizer = (graphic, size) => {
    const textPattern = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="{font}" font-size="{size}px" {style} >&#{char};</text>';
    const regex = /ttf:\/\/(?<font>.+)\#(?<char>\d+)/gmi;
    const groups = regex.exec(graphic.mark).groups;
    return TC.Util.formatTemplate(textPattern, { size: size, font: groups.font, char: groups.char, style: createStyles(graphic) });
};

class LayerLegend extends WebComponentControl {
    CLASS = className;
    #classSelector = '.' + className;
    #layer;
    #parent;
    #map;
    static = false;
    #on3DMode = false;
    #wcsLayer = false;

    constructor() {
        super(...arguments);
        const self = this;

        self.initProperty('layerId');
        self.initProperty('static');

        self.#layer = self.options.layer;
    }

    async replaceSymbolizer(node, legendObject) {
        const self = this;
        if (node.children?.length) {
            for (var i = node.children.length - 1; i >= 0; i--) {
                await self.replaceSymbolizer(node.children[i], legendObject);
            }
        }
        else {
            if (node.name) {
                legendObject = legendObject?.reduce((acc, va) => va ? acc.concat(va) : acc, [])
                var legendNode = legendObject.findByProperty("layerName", node.name.substring(node.name.indexOf(":") + 1)) ||
                    (self.#layer.names.includes(node.name) && legendObject.length == self.#layer.names.length ?
                        legendObject[self.#layer.names.indexOf(node.name)]
                        : null)
                if (!legendNode) {
                    node.parent.children.splice(node.parent.children.indexOf(node), 1);
                    node = null;
                }
                else {
                    try {
                        node.legend = legendNode.rules ? await createSymbolizer(legendNode.rules, self.#layer) : [{ src: legendNode.src }];
                    }
                    catch (err) {
                        console.error(err);
                        //node.legend = node.legend
                    }

                }
            }

        }
    }

    async getLegend() {
        const self = this;
        if (!self.#layer || !self.#layer.map || !(self.#layer instanceof SITNA.layer.Raster)) return;
        if (!self.#layer.availableNames.some((layername) => self.#layer.isVisibleByScale(layername)) && self.#on3DMode) {
            self.innerHTML = "";
            return
        }
        self.innerHTML = "";
        (self.#layer?.map || self.#map).magnifier.hideMagnifier();
        self.classList.add(loadingClassName);
        if (self.#layer.getVisibility() || self.#on3DMode) {
            try {
                var legendObject = await self.#layer.getLegend(self.#on3DMode || self.#wcsLayer);
                legendObject = legendObject?.filter((data) => data);
                if (legendObject && legendObject.length)
                    await self.setData(legendObject);
                else
                    await self.setData(false);
            }            
            catch (err) {
                await self.setData(null);
                self.unBindZoomEvent();
            }

        }
        else
            await self.setData(false);

    }
    async setData(legendData) {
        const self = this;
        const tree = self.#layer.getNestedTree ? self.#layer.getNestedTree() : self.#layer.getTree();
        if (typeof (legendData) === 'boolean' && !legendData) {
            self.classList.remove(loadingClassName);
        }
        else {
            if (legendData && legendData.length)
                await self.replaceSymbolizer(tree, legendData);
            self.renderData(tree, function () {
                self.classList.remove(loadingClassName);
                self.querySelector(".tc-ctl-legend-node").dataset["layerId"] = self.dataset.layerId;
                self.dispatchEvent(new CustomEvent('update', {
                    composed: true,
                    bubbles: true
                }));   
            });
        }
    }

    async register(map) {
        const self = this;

        self.controller = new AbortController();

        const layer = map.layers.findByProperty("id", this.dataset.layerId);
        if (!(layer instanceof SITNA.layer.Raster)) return;

        self.#wcsLayer = (await layer.describeLayer?.(true))?.every((dl) => dl.owsType === "WCS");
        self.#on3DMode = map.on3DView;
        self.#map = map;
        if (!self.#layer)
            self.#layer = layer;        
        
        let timer = null;
        const _onZoomEvent = function (_e) {
            if (timer) {
                clearTimeout(timer)
                timer = null;
            }
            timer = setTimeout(() => {
                self.getLegend();
            }, 300);
        };
        const _onHideEvent = function (event) {
            if (event.layer.getVisibility() || self.#on3DMode)
                self.getLegend();
        }
        
        self.unBindZoomEvent = () => {
            map.off(Consts.event.ZOOM, _onZoomEvent);
        }        

        if (!self.#wcsLayer && !self.#on3DMode) {
            map.on(Consts.event.ZOOM, _onZoomEvent);
            map.on(Consts.event.LAYERVISIBILITY, _onHideEvent);
        }

        map.on(Consts.event.LAYERREMOVE, function (_e) {
            if (_e.layer === self.#layer) {
                map.off(Consts.event.ZOOM, _onZoomEvent);
                self.parentNode?.removeChild(self)
                self.remove();
            }
        }, { signal: self.controller.signal });

        map.on(Consts.event.LAYERVISIBILITY, _onHideEvent, { signal: self.controller.signal });

        if (!map.magnifier) {
            map.magnifier = new ImageMagnifier(3, {
                textToOpen: Util.getLocaleString(map.options.locale, "clickToEnlarge"),
                textToClose: Util.getLocaleString(map.options.locale, "clickToClose")
            });
            //map.magnifier.register(map);
            document.body.appendChild(map.magnifier);            
        }

        map.on(TC.Consts.event.VIEWCHANGE, function (_e) {
            if (_e.currentTarget.on3DView) {
                self.#on3DMode = true;
                //unbind map events
                map.off(Consts.event.ZOOM, _onZoomEvent);
                map.off(Consts.event.LAYERVISIBILITY, _onHideEvent);
                self.getLegend();
            }
                
            else {
                self.#on3DMode = false;
                //bind map events
                map.on(Consts.event.ZOOM, _onZoomEvent);
                map.on(Consts.event.LAYERVISIBILITY, _onHideEvent);
                self.getLegend();
            }
            
        }, { signal: self.controller.signal })

        self.getLegend();
    }
    async unregister(map) {
        this.controller.abort();
        this.controller = null;
        if (this?.#map?.magnifier && this?.#map.controls.filter((c) => c.tagName === this.tagName).length===1) this.#map.magnifier = null; 
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-legend-node.mjs');
        self.template = module.default;
    }
    
}

customElements.get(elementName) || customElements.define(elementName, LayerLegend);
TC.control.LayerLegend = LayerLegend;
export default LayerLegend;
export async function CreateSymbolizer(rules,layer) {
    return await createSymbolizer(rules,layer);
}