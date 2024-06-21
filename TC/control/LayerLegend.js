import TC from '../../TC';
import Consts from '../Consts';
//import { Defaults } from '../Cfg';
import Util from '../Util';
import WebComponentControl from './WebComponentControl';

import ImageMagnifier from './ImageMagnifier';

TC.control = TC.control || {};

const className = 'tc-ctl-layer-legend';
const elementName = 'sitna-layer-legend';
const loadingClassName = 'tc-ctl-layer-legend-loading';

const _defaultPolygonValues = {
    fill: "transparent",
    stroke:"transparent",
    "stroke-width": 1
}
const _defaultCircleValues = {
    fill: "transparent",
    stroke: "transparent",
    "stroke-width": 1
}
const _symbolDefaultWidth = 20;
const _symbolDefaultHeight = 20;

const createStyles = function (symbolizer) {    
    const _styles = [];
    for (var i in symbolizer) {
        _styles.push(i + '="' + symbolizer[i] + '"');
    }
    return _styles.join(' ');
}

const createSymbolizer = async function (rule) {
    const svgTemplate = '<svg xmlns="http://www.w3.org/2000/svg" height="{height}" width="{width}" {viewBox}>{inner}</svg>';
    const lineTemplate = '<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {style} >Sorry, your browser does not support inline SVG.</line>';
    const polygonTemplate = '<polygon points="0,0 {width},0 {width},{height} 0,{height} 0,0" {style} >Sorry, your browser does not support inline SVG.</polygon>';    
    const circleTemplate ='<circle cx="{x}" cy="{y}" r="{radius}" {style} >Sorry, your browser does not support inline SVG.</circle>'
    

    const symbolizersProms = (rule.graphics && !TC.Util.isEmptyObject(rule.graphics) && !rule.symbolizers.every(symbol => symbol.Text))? [getImageSymbolizer(rule.graphics)]:
        rule.symbolizers.map(async (symbol, _idx, array) => {        
            const innerText = [];
            const size = array.reduce((vi, va) => { return (!va?.Point?.size || va?.Point?.size <= vi) ? vi : va.Point.size }, 0);
        if (symbol.Line) {
            if (symbol.Line["graphic-stroke"]) {
                innerText.push(await getImageSymbolizer(symbol.Line["graphic-stroke"].graphics[0]));
            }
            else
                innerText.push(TC.Util.formatTemplate(lineTemplate, { x1: 0, y1: _symbolDefaultHeight / 2, x2: _symbolDefaultWidth, y2: _symbolDefaultHeight / 2, style: createStyles(symbol.Line) }));
        }
        if (symbol.Point) {
            for (var i = 0; i < symbol.Point?.graphics.length; i++) {
                if (symbol.Point?.graphics[i].mark)
                {
                    const graphic = symbol.Point.graphics[i]
                    switch (graphic.mark) {
                        case "circle":
                            innerText.push(TC.Util.formatTemplate(circleTemplate, { x: _symbolDefaultWidth / 2, y: _symbolDefaultHeight / 2, radius: symbol.Point.size/2, style: createStyles(Object.assign({}, _defaultCircleValues, graphic))}))
                            break;
                    }                    
                }
                else
                    innerText.push(await getImageSymbolizer(symbol.Point?.graphics[i], parseInt(size) - parseInt(symbol.Point.size)));
            }
        }
        if (symbol.Polygon) {
            innerText.push(TC.Util.formatTemplate(polygonTemplate, {
                width: _symbolDefaultWidth, height: _symbolDefaultHeight, style: createStyles(Object.assign({}, _defaultPolygonValues, symbol.Polygon))
            }));
        }
        if (symbol.Text) {
            innerText.push(await getTextSymbolizer(symbol.Text));
        }
        return innerText;
    });
    const aux = await Promise.all(symbolizersProms);
    const textSymbol = aux.find(a => a.find && a.find(b => b.indexOf("text")>=0));
    var _txtWidth;
    //medir textos
    if (textSymbol && textSymbol.length) {
        const textNode=new DOMParser().parseFromString(textSymbol[0], "text/xml").firstChild
        const canvas = document.createElement('canvas');
        const context = canvas.getContext("2d");        
        context.font = [textNode.attributes["font-size"].value + "px", textNode.attributes["font-family"].value, textNode.attributes["font-weight"].value].join(" ");
        _txtWidth = context.measureText(textNode.innerText || textNode.innerHTML).width + (parseInt(textNode.attributes["stroke-width"]?.value || 0)*2);
    }
    //const viewBox = getSVGViewBox(TC.Util.formatTemplate(svgTemplate, { width: _symbolDefaultWidth, height: _symbolDefaultHeight, viewBox: '', inner: aux.join('') }));
    return 'data:image/svg+xml;base64,' + window.btoa(TC.Util.formatTemplate(svgTemplate, {
        width: _txtWidth || _symbolDefaultWidth,
        height: _symbolDefaultHeight,
        viewBox: '',//'viewBox="' + Object.entries(viewBox).map((entry) => entry[1]).join(" ") + '"',
        inner: aux.join('')
    }));

};
const getImageSymbolizer = async function (graphic, _1sizeDiff) {
    //return decodeURIComponent(graphic["external-graphic-url"]);
    const imgTemplate = '<image x="{x}" y="{y}" width="{width}" height="{height}" href="{url}" />';

    var url = graphic["external-graphic-url"] ? graphic["external-graphic-url"] : graphic.url;

    if (!url) {        
        return "";
    }
        

    //esto para solucionar el problema de geoserver hasta que se publique nueva versión
    if (url.indexOf("image/png") && graphic["external-graphic-type"] && graphic["external-graphic-type"] == "image/svg+xml") {
        url = url.replace("image/png", "image/svg+xml");
    }
    try {
        const imageSize = await getImageSize(url);
        let _imgY = (_symbolDefaultHeight - imageSize.height) / 2;
        let _imgX = (_symbolDefaultWidth - imageSize.width) / 2;
        let _imgW = imageSize.width;
        let _imgH = imageSize.height;

        if (imageSize.height > _symbolDefaultHeight) {
            if (imageSize.width > _symbolDefaultWidth) {
                let ratio = Math.min(_symbolDefaultWidth / imageSize.width, _symbolDefaultHeight / imageSize.height)
                _imgX = imageSize.width * ratio === _symbolDefaultWidth ? 0 : (_symbolDefaultWidth - (imageSize.width * ratio)) / 2
                _imgY = imageSize.height * ratio === _symbolDefaultHeight ? 0 : (_symbolDefaultHeight - (imageSize.height * ratio)) / 2
                //_imgX = _imgY = 0;
                _imgW = imageSize.width * ratio === _symbolDefaultWidth ? _symbolDefaultWidth : imageSize.width * ratio;
                _imgH = imageSize.height * ratio === _symbolDefaultHeight ? _symbolDefaultHeight : imageSize.height * ratio
                    ;
            }
        }

        return TC.Util.formatTemplate(imgTemplate, { x: _imgX, y: _imgY, width: _imgW, height: _imgH, url: url });
    }
    catch (err) {
        return "";
    }
    
    
}
const getImageSize = function (base64data) {
    return new Promise(function (resolve,reject) {
        var i = new Image();
        i.onload = function () {
            resolve({ width: i.width, height: i.height });
        };
        i.onerror = function (err) {
            reject(err);
        }
        i.src = base64data;
    })
    
}
//const getSVGViewBox = function (svg) {
//    const aux = document.createElement("p");
//    aux.innerHTML = svg;  
//    document.body.appendChild(aux);
//    const graphics = Array.from(aux.querySelectorAll("svg g:not([fill='white'][stroke='white']) > path"))
//    let viewBox = { x: 0, y: 0, width: _symbolDefaultWidth, height: _symbolDefaultHeight }
//    if (graphics.length)
//        viewBox = graphics.reduce(function (vi, va) {
//        const bbox = va.getBBox();
//        return {
//            x: Math.min(vi.x, bbox.x),
//            y: Math.min(vi.y, bbox.y),
//            width: Math.max(vi.width, bbox.width),
//            height: Math.max(vi.height, bbox.height)
//        }
//        }, { x: 1000, y: 1000, width: 0, height: 0 });
//    document.body.removeChild(aux);
//    return viewBox;
//}
const getTextSymbolizer = async function (textSymbolyzer, text) {

    const textTemplate = '<text x="{x}" y="{y}" {styles}>' + (text || "ABC") + '</text>';
    var x = 0;
    if (textSymbolyzer?.fonts?.length) {
        const index = textSymbolyzer?.fonts.findIndex(font => document.fonts.check(font["font-size"] + "px " + font['font-family'].join(",")));
        if (index>=0) {
            const currentFont = textSymbolyzer?.fonts[index];
            const styles = Object.entries(currentFont).reduce((vi, va) => { return vi.concat(va[0] + '="' + va[1] + '"') }, []);            
            if (textSymbolyzer["fill"])
                styles.push('fill="' + textSymbolyzer["fill"] + '"');
            if (textSymbolyzer["fill-opacity"])
                styles.push('fill-opacity="' + textSymbolyzer["fill-opacity"] + '"');
            if (textSymbolyzer.halo) {
                styles.push('stroke="' + textSymbolyzer.halo.fill + (Object.prototype.hasOwnProperty.call(textSymbolyzer.halo, "fill-opacity") ? (255 / textSymbolyzer.halo['fill-opacity']).toString(16) : "") + '"');
                x = Math.round(textSymbolyzer.halo.radius);
                styles.push('stroke-width="' + x + '"');
                styles.push('paint-order="stroke"');
            }
            return TC.Util.formatTemplate(textTemplate, { x: x, y: currentFont["font-size"], styles: styles.join(" ") });
        }        
    }
    if (textSymbolyzer?.graphics?.length) {
        return await getImageSymbolizer(textSymbolyzer.graphics[0])
    }
    return "";
        
}


class LayerLegend extends WebComponentControl {
    CLASS = className;
    #classSelector = '.' + className;
    #layer;
    #parent;
    static= false;

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
                        node.legend = legendNode.rules ? await Promise.all(await legendNode.rules
                            .map(async (rule) => {
                                return {
                                    src: await createSymbolizer(rule) || node.legend[0].src,
                                    value: rule.title || rule.name
                                }
                            })) : [{ src: legendNode.src }];
                    }
                    catch (err) {
                        console.error(err);
                        node.legend = node.legend
                    }

                }
            }

        }
    }
    
    async getLegend() {
        const self = this;
        if (self.#layer && !self.#layer.map) return;
        if (!self.#layer.availableNames.some((layername) => self.#layer.isVisibleByScale(layername))) {
            self.innerHTML = "";
            return
        };
        self.innerHTML = "";
        self.#layer.map.magnifier.hideMagnifier();
        self.classList.add(loadingClassName);
        if (self.#layer.getVisibility()) {
            try {
                var legendObject = await self.#layer.getLegend();
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
                self.#layer.map.getControlsByClass(TC.control.Legend)[0].update();

                self.#layer.map.magnifier.addNode(self.querySelectorAll(".tc-ctl-legend-watch img"), 4);
                //self.#layer.map.magnifier.#hideMagnifier();
            });
        }
    }
    
    register(map) {
        const self = this;
        const layer = map.layers.findByProperty("id", this.dataset.layerId);
        
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
        
        map.on(Consts.event.LAYERVISIBILITY, function (event) {
            if (event.layer.getVisibility())
                self.getLegend();
        });
        self.unBindZoomEvent = () => {
            map.off(Consts.event.ZOOM, _onZoomEvent);
        }
        map.on(Consts.event.ZOOM, _onZoomEvent);

        map.on(Consts.event.LAYERREMOVE, function (_e) {
            if (_e.layer === self.#layer) {
                map.off(Consts.event.ZOOM, _onZoomEvent);
                self.parentNode?.removeChild(self)
                self.remove();
            }            
        });

        if (!map.magnifier) {
            map.magnifier = new ImageMagnifier(3, {
                textToOpen: Util.getLocaleString(map.options.locale, "clickToEnlarge"),
                textToClose: Util.getLocaleString(map.options.locale, "clickToClose")
            });
            document.body.appendChild(map.magnifier);
        }
        
        self.getLegend();
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
export async function CreateSymbolizer(rule) {
    return await createSymbolizer(rule);
}