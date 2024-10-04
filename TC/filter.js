import TC from '../TC';
TC.filter = {};

TC.filter.Operators = [
    "PropertyIsEqualTo",
    "PropertyIsGreaterThan",
    "PropertyIsGreaterThanOrEqualTo",
    "PropertyIsLessThan",
    "PropertyIsLessThanOrEqualTo",
    "PropertyIsNotEqualTo",
    "PropertyIsLike",
    "PropertyIsNull",
    "PropertyIsBetween",
    "Within",
    "Intersects",
    "Bbox"
]

TC.filter.Filter = function (tagName) {
    this.tagName_ = tagName;
    
    this._defaultNSURL = "http://www.opengis.net/ogc";
    this._defaultPrefixNS = this._wfsPrefixNS = "ogc";
    this._fieldTitle = "PropertyName";

    this._defaultNSURL = this._wfsNSURL = "http://www.opengis.net/ogc";
    this._wfs2prefixNS = "fes";
    this._wfs2NSURL = "http://www.opengis.net/fes/2.0";
    this._wfs2FieldTitle = "ValueReference";
    this._escapeAttrName = "escape";
    this._wfs2EscapeAttrName = "escapeChar";    
};



TC.filter.Filter.prototype.getTagName = function () {
    return this.tagName_;
};
TC.filter.Filter.prototype.setTagName = function (_text) {    
    return this.tagName_;
};

TC.filter.Filter.prototype.writeFilterCondition_ = function () {

    //return Util.formatTemplate('<{prefix}:{tag}>{children}</{prefix}:{tag}>', {prefix:"ogc",tag:filter.getTagName(),children:""});
    var filter = this;
    const prefix = this._defaultPrefixNS;
    const NSURL = this._defaultNSURL;
    const gmlVersion = this._defaultNSURL === this._wfs2NSURL ? '/3.2' : ''
    const inner = this.writeInnerCondition_(filter);
    return `<${prefix}:Filter xmlns:${prefix}="${NSURL}" xmlns:gml="http://www.opengis.net/gml${gmlVersion}">${inner}</${prefix}:Filter>`;

    /*ol.xml.pushSerializeAndPop(item,
        ol.format.WFS.GETFEATURE_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory(filter.getTagName()),
        [filter], objectStack);*/
}
TC.filter.Filter.prototype.writeInnerCondition_ = function (filter) {
    if (filter != this) {
        filter._defaultNSURL = this._defaultNSURL;
        filter._defaultPrefixNS = this._defaultPrefixNS;
        filter._fieldTitle = this._fieldTitle;
    }

    return filter.write();
};
TC.filter.Filter.prototype.writeInnerArrayCondition_ = function (_filters) {
    const parent = this;
    return parent.conditions.reduce(function (vi, va, _index) {
        return (vi instanceof TC.filter.Filter ? parent.writeInnerCondition_(vi) : vi) + parent.writeInnerCondition_(va);
    });
}

TC.filter.Filter.prototype.getText = function (wfsVersion) {    
    if (wfsVersion && parseFloat(wfsVersion,10) >= 2) {
        this._defaultPrefixNS = this._wfs2prefixNS;
        this._defaultNSURL = this._wfs2NSURL;
        this._fieldTitle = this._wfs2FieldTitle;
        this._escapeAttrName = this._wfs2EscapeAttrName;
    }
    return this.writeFilterCondition_();
};

TC.filter.Filter.prototype.readText = function (text) {
    if (text.indexOf(this._wfs2prefixNS) > -1 && 
        text.indexOf(this._wfs2NSURL) > -1 &&
        text.indexOf(this._wfs2FieldTitle) > -1 &&
        text.indexOf(this._wfs2EscapeAttrName) > -1) {
        this._defaultPrefixNS = this._wfs2prefixNS;
        this._defaultNSURL = this._wfs2NSURL;
        this._fieldTitle = this._wfs2FieldTitle;
        this._escapeAttrName = this._wfs2EscapeAttrName;
    }

    return this.readFilterCondition_(text);    
};

TC.filter.Filter.prototype.toString = function () {
    return this.write();
};

TC.filter.Filter.prototype.clone = function () {
    const result = new this.constructor();
    Object.assign(result, this);
    return result;
};

TC.filter.Filter.prototype.readFilterCondition_ = function (text) {
    this.setTagName(text);
    return this.readInnerCondition_(text);    
}
TC.filter.Filter.prototype.readInnerCondition_ = function (text) {
    //if (filter != this) {        
    //    filter._fieldTitle = this._fieldTitle;
    //}

    //if (filter instanceof TC.filter.LogicalNary) {
    //    return filter.write()
    //}
    //else if (filter instanceof TC.filter.ComparisonBinary) {
    //    return filter.write();
    //}
    //else if (filter instanceof TC.filter.Comparison) {
    //    return filter.write();
    //}
    //else if (filter instanceof TC.filter.Spatial) {
    //    return filter.write();
    //}
    //else if (filter instanceof TC.filter.Function) {
    //    return filter.write();
    //}
    //else
        return filter.read(text);
};

TC.filter.and = function (_conditions) {
    var params = [null].concat(Array.prototype.slice.call(arguments));
    return new (Function.prototype.bind.apply(TC.filter.And, params))();
};

TC.filter.or = function (_conditions) {
    var params = [null].concat(Array.prototype.slice.call(arguments));
    return new (Function.prototype.bind.apply(TC.filter.Or, params))();
};

TC.filter.not = function (condition) {
    return new TC.filter.Not(condition);
};


TC.filter.intersects = function () {
    if (Object.prototype.toString.call(arguments[0]) !== "[object String]")
        return new TC.filter.Intersects(null, arguments[0], arguments[1]);
    else
        return new TC.filter.Intersects(arguments[0], arguments[1], arguments[2]);
};


TC.filter.within = function () {
    if (Object.prototype.toString.call(arguments[0]) !== "[object String]")
        return new TC.filter.Within(null, arguments[0], arguments[1]);
    else
        return new TC.filter.Within(arguments[0], arguments[1], arguments[2]);
};


TC.filter.equalTo = function (propertyName, expression, opt_matchCase) {
    return new TC.filter.EqualTo(propertyName, expression, opt_matchCase);
};

TC.filter.notEqualTo = function (propertyName, expression, opt_matchCase) {
    return new TC.filter.NotEqualTo(propertyName, expression, opt_matchCase);
};

TC.filter.lessThan = function (propertyName, expression) {
    return new TC.filter.LessThan(propertyName, expression);
};

TC.filter.lessThanOrEqualTo = function (propertyName, expression) {
    return new TC.filter.LessThanOrEqualTo(propertyName, expression);
};

TC.filter.greaterThan = function (propertyName, expression) {
    return new TC.filter.GreaterThan(propertyName, expression);
};

TC.filter.greaterThanOrEqualTo = function (propertyName, expression) {
    return new TC.filter.GreaterThanOrEqualTo(propertyName, expression);
};

TC.filter.isNull = function (propertyName) {
    return new TC.filter.IsNull(propertyName);
};

TC.filter.between = function (propertyName, lowerBoundary, upperBoundary) {
    return new TC.filter.IsBetween(propertyName, lowerBoundary, upperBoundary);
};

TC.filter["function"] = function (functionName, params) {
    return new TC.filter.Function(functionName, params);
};

TC.filter.like = function (propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
    return new TC.filter.IsLike(propertyName, pattern,
        opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase);
};

TC.filter.LogicalNary = function (tagName, _conditions) {

    TC.filter.Filter.call(this, tagName);

    this.conditions = Array.prototype.slice.call(arguments, 1);
};
TC.inherit(TC.filter.LogicalNary, TC.filter.Filter);

TC.filter.LogicalNary.prototype.clone = function () {
    const result = TC.filter.Filter.prototype.clone.call(this);
    this.conditions = this.conditions.map((f) => f.clone());
    return result;
};

TC.filter.And = function (_conditions) {
    var params = ['And'].concat(Array.prototype.slice.call(arguments));
    TC.filter.LogicalNary.apply(this, params);
};
TC.inherit(TC.filter.And, TC.filter.LogicalNary);

TC.filter.Or = function (_conditions) {
    var params = ['Or'].concat(Array.prototype.slice.call(arguments));
    TC.filter.LogicalNary.apply(this, params);
};
TC.inherit(TC.filter.Or, TC.filter.LogicalNary);

TC.filter.LogicalNary.prototype.write = function () {
    const prefix = this._defaultPrefixNS;
    const tag = this.getTagName();
    const inner = this.writeInnerArrayCondition_();
    return `<${prefix}:${tag}>${inner}</${prefix}:${tag}>`;
}

TC.filter.Not = function (condition) {
    this.condition = condition;
    TC.filter.Filter.call(this, 'Not');
    
};
TC.inherit(TC.filter.Not, TC.filter.Filter);


TC.filter.Not.prototype.clone = function () {
    const result = TC.filter.Filter.clone.call(this);
    result.condition = this.condition.clone();
    return result;
};

TC.filter.Filter.prototype.write = function () {
    const prefix = this._defaultPrefixNS;
    const tag = this.getTagName();
    const inner = this.writeInnerCondition_(this.condition);
    return `<${prefix}:${tag}>${inner}</${prefix}:${tag}>`;
}

TC.filter.Comparison = function (tagName, propertyName) {

    TC.filter.Filter.call(this, tagName);

    this.propertyName = propertyName;
};
TC.inherit(TC.filter.Comparison, TC.filter.Filter);

TC.filter.Comparison.prototype.write = function () {
    var values = '';
    const prefix = this._defaultPrefixNS;
    //isbetween
    if (this.LowerBoundary && this.UpperBoundary) {
        const getBoundary = function (boundary) {
            return boundary instanceof TC.filter.Filter ? boundary.write() : `<${prefix}:Literal>${boundary}</${prefix}:Literal>`;
        }
        const lowerBoundary = getBoundary(this.LowerBoundary);
        const upperBoundary = getBoundary(this.UpperBoundary);
        values = `<${prefix}:LowerBoundary>${lowerBoundary}</${prefix}:LowerBoundary><${prefix}:UpperBoundary>${upperBoundary}</${prefix}:UpperBoundary>`;
    }
    if (this.pattern) {
        values = `<${prefix}:Literal><![CDATA[${this.pattern}]]></${prefix}:Literal>`;
    }
    if (this.params) {
        if (Array.isArray(this.params)) {
            values = this.params.reduce(function (a, b, i) {
                var fmt = function (text) {
                    return `<${prefix}:Literal><![CDATA[${text}]]></${prefix}:Literal>`;
                }
                return (i > 0 ? a : fmt(a)) + fmt(b);
            });
        }
        else {
            values = `<${prefix}:Literal><![CDATA[${this.params}]]></${prefix}:Literal>`;
        }
    }

    const tag = this.getTagName();
    const matchCase = typeof (this.matchCase) !== "undefined" ? " matchCase=\"" + this.matchCase + "\"" : "";
    const escape = typeof (this.escapeChar) !== "undefined" ? (" " + this._escapeAttrName + "=\"" + this.escapeChar + "\"") : "";
    const singleChar = typeof (this.singleChar) !== "undefined" ? " singleChar=\"" + this.singleChar + "\"" : "";
    const wildCard = typeof (this.wildCard) !== "undefined" ? " wildCard=\"" + this.wildCard + "\"" : "";
    const fieldTitle = this._fieldTitle;
    return `<${prefix}:${tag}${matchCase}${escape}${singleChar}${wildCard}><${prefix}:${fieldTitle}>${this.propertyName}</${prefix}:${fieldTitle}>${values}</${prefix}:${tag}>`;
}

TC.filter.ComparisonBinary = function (
    tagName, propertyName, expression, opt_matchCase) {

    TC.filter.Comparison.call(this, tagName, propertyName);

    this.expression = expression;

    this.matchCase = opt_matchCase;
};
TC.inherit(TC.filter.ComparisonBinary, TC.filter.Comparison);

TC.filter.ComparisonBinary.prototype.write = function () {
    const prefix = this._defaultPrefixNS;
    const fieldTitle = this._fieldTitle;
    const tag = this.getTagName();
    const matchCase = typeof (this.matchCase) !== "undefined" ? " matchCase=\"" + this.matchCase + "\"" : "";
    const value = this.propertyName instanceof TC.filter.Filter ? `${this.propertyName.write()}` : `<${prefix}:${fieldTitle}>${this.propertyName}</${prefix}:${fieldTitle}>`;
    const expression = this.expression instanceof TC.filter.Filter ? this.expression.write() : `<${prefix}:Literal><![CDATA[${this.expression}]]></${prefix}:Literal>`;
    return `<${prefix}:${tag}${matchCase}>${value}${expression}</${prefix}:${tag}>`;
}
TC.filter.EqualTo = function (propertyName, expression, opt_matchCase) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsEqualTo', propertyName, expression, opt_matchCase);
};
TC.inherit(TC.filter.EqualTo, TC.filter.ComparisonBinary);

TC.filter.GreaterThan = function (propertyName, expression) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsGreaterThan', propertyName, expression);
};
TC.inherit(TC.filter.GreaterThan, TC.filter.ComparisonBinary);

TC.filter.GreaterThanOrEqualTo = function (propertyName, expression) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};
TC.inherit(TC.filter.GreaterThanOrEqualTo, TC.filter.ComparisonBinary);

TC.filter.LessThan = function (propertyName, expression) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsLessThan', propertyName, expression);
};
TC.inherit(TC.filter.LessThan, TC.filter.ComparisonBinary);

TC.filter.LessThanOrEqualTo = function (propertyName, expression) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};
TC.inherit(TC.filter.LessThanOrEqualTo, TC.filter.ComparisonBinary);

TC.filter.NotEqualTo = function (propertyName, expression, opt_matchCase) {
    TC.filter.ComparisonBinary.call(this, 'PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
};
TC.inherit(TC.filter.NotEqualTo, TC.filter.ComparisonBinary);

TC.filter.IsLike = function (propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
    TC.filter.Comparison.call(this, 'PropertyIsLike', propertyName);

    this.pattern = pattern;

    this.wildCard = (opt_wildCard !== undefined) ? opt_wildCard : '*';

    this.singleChar = (opt_singleChar !== undefined) ? opt_singleChar : '.';

    this.escapeChar = (opt_escapeChar !== undefined) ? opt_escapeChar : '!';

    this.matchCase = opt_matchCase;
};
TC.inherit(TC.filter.IsLike, TC.filter.Comparison);

TC.filter.IsNull = function (propertyName) {
    TC.filter.Comparison.call(this, 'PropertyIsNull', propertyName);
};
TC.inherit(TC.filter.IsNull, TC.filter.Comparison);

TC.filter.IsBetween = function (propertyName, lowerBoundary, upperBoundary) {
    TC.filter.Comparison.call(this, 'PropertyIsBetween', propertyName);
    this.LowerBoundary = lowerBoundary;
    this.UpperBoundary = upperBoundary;
};
TC.inherit(TC.filter.IsBetween, TC.filter.Comparison);

TC.filter.Function = function (functionName, params) {
    TC.filter.Filter.call(this, functionName);
    this.params = params
};
TC.inherit(TC.filter.Function, TC.filter.Filter);

TC.filter.Filter.fromText = function (gml) {
    //var cntrtr = function (node) {
    //    const tagName = node.tagName;
    //    const filter = fnc(tagName.substring(tagName.indexOf(":") + 1));
    //    filter._defaultNSURL = tagName.substring(0, tagName.indexOf(":"));
    //    return filter;
    //}
    var fnc = (node) => {
        const filterType = node.tagName.substring(node.tagName.indexOf(":") + 1);
        var filter;
        
        switch (filterType) {
            case "PropertyIsEqualTo":
                filter = new TC.filter.EqualTo();
                break;
            case "PropertyIsGreaterThan":
                filter = new TC.filter.GreaterThan();
                break;
            case "PropertyIsGreaterThanOrEqualTo":
                filter = new TC.filter.GreaterThanOrEqualTo();
                break;
            case "PropertyIsLessThan":
                filter = new TC.filter.LessThan();
                break;
            case "PropertyIsLessThanOrEqualTo":
                filter = new TC.filter.LessThanOrEqualTo();
                break;
            case "PropertyIsNotEqualTo":
                filter = new TC.filter.NotEqualTo();
                break;
            case "PropertyIsLike":
                filter = new TC.filter.IsLike();
                break;
            case "PropertyIsNull":
                filter = new TC.filter.IsNull();
                break;
            case "PropertyIsBetween":
                filter = new TC.filter.IsBetween();
                break;
            default:
                filter = new TC.filter[filterType]();
        }

        const propertyName = node.querySelector(filter._fieldTitle + "," + filter._wfs2FieldTitle)?.innerHTML;
        const propertyValue = node.querySelector("Literal")?.innerHTML;
        filter._defaultNSURL = node.tagName.substring(0, tagName.indexOf(":"));

        if (propertyName)
            filter.propertyName = propertyName;
        if (filter instanceof TC.filter.IsLike) {
            filter.pattern = propertyValue;
        }
        if (filter instanceof TC.filter.IsBetween) {
            filter.LowerBoundary = node.querySelector("LowerBoundary > Literal")?.innerHTML;
            filter.UpperBoundary = node.querySelector("UpperBoundary > Literal")?.innerHTML;
        }
        if (filter instanceof TC.filter.ComparisonBinary) {
            filter.expression = propertyValue;
        }
        if (filter instanceof TC.filter.Spatial) {
            const coordinates = node.childNodes[1].textContent.split(" ").reduce((vi, va, index, array) =>
            {
                if (index % 2 === 1)
                    vi.push([
                        parseFloat(array[index - 1]),
                        parseFloat(va)
                    ]);
                return vi;
            }, [])
            switch (node.childNodes[1].tagName.substr(4)) {
                case "Polygon":
                    filter.geometry = new SITNA.feature.Polygon(coordinates);
                    break;
                case "LineString":
                    filter.geometry = new SITNA.feature.Polyline(coordinates);
                    break;
                //TODO: El resto...
            }
        }

        filter.conditions = Array.from(node.childNodes).filter((c) => 
            TC.filter.Operators.includes(c.tagName.substring(c.tagName.indexOf(":") + 1))
        ).reduce(function (vi, va) {
            vi.push(fnc(va)); return vi;
        }, []);
        return filter;
    };
    var doc = new DOMParser().parseFromString(gml, "application/xml");
    const tagName = doc.firstElementChild.firstElementChild.tagName;    
    const filter = fnc(doc.firstElementChild.firstElementChild);            
    
    return filter;
}

TC.filter.Function.prototype.write = function () {
    var values = '';
    const prefix = this._defaultPrefixNS;
    if (this.params) {
        var _paramsToText = function (param, prefix) {
            if (typeof (param) === "string") {
                return `<${prefix}:Literal><![CDATA[${param}]]></${prefix}:Literal>`;
            }
            if (typeof (param) === "object") {
                var _text = '';
                for (var key in param) {
                    _text = _text + `<${prefix}:${key}>${param[key]}</${prefix}:${key}>`;
                }
                return _text;
            }
        }
        if (Array.isArray(this.params)) {
            values = this.params.reduce(function (a, b, i) {
                var fmt = function (param) {
                    return _paramsToText(param, prefix);
                }
                return (i > 1 ? a : fmt(a)) + fmt(b);
            });
        }
        else {
            values = _paramsToText(this.params, this._defaultPrefixNS);
        }
    }
    const tag = this.getTagName();
    return `<${prefix}:Function name="${tag}">${values}</${prefix}:Function>`;
};

TC.filter.Spatial = function (tagName, geometryName, geometry, opt_srsName) {
    TC.filter.Filter.call(this, tagName);
    this.geometryName = geometryName;
    this.geometry = geometry;
    this.srsName = opt_srsName;
    this.wrap = new TC.wrap.Filter(this);
};

TC.filter.Spatial.prototype.clone = function () {
    const result = TC.filter.Filter.prototype.clone.call(this);
    result.wrap = new TC.wrap.Filter(result);
    return result;
}

TC.wrap.Filter = function (filter) {
    this.parent = filter;
};

TC.wrap.Filter.prototype.getAxisOrientation = function () {
    // Establecemos el srsName a EPSG:xxxx o urn:x-ogc:def:crs:EPSG:xxxx dependiendo del orden de eje de coordenadas del CRS.
    // Esto se debe a que GeoServer hace asunciones en el orden de los ejes dependiendo del formato de srsName que se use.
    // Más información: https://docs.geoserver.org/latest/en/user/services/wfs/basics.html#wfs-basics-axis
    var srsName = this.parent.srsName;
    if (srsName) {
        const match = srsName.match(/\d{4,6}$/);
        if (match) {
            const code = match[0];
            const def = ol.proj.get(srsName);
            if (def) {
                return ((def.axisOrientation_ === 'neu' ? 'urn:x-ogc:def:crs:EPSG:' : 'EPSG:') + code);
            }
        }
    }
    return srsName;
};

TC.inherit(TC.filter.Spatial, TC.filter.Filter);

TC.filter.Spatial.prototype.write = function () {
    const prefix = this._defaultPrefixNS;
    const tag = this.getTagName();
    const fieldTitle = this._fieldTitle;
    const name = this.geometryName;
    const geometry = this.geometry instanceof TC.filter.Function ? this.writeInnerCondition_(this.geometry) : this.geometry.wrap.toGML(undefined, this.wrap.getAxisOrientation());
    if (this.geometryName) {
        return `<${prefix}:${tag}><${prefix}:${fieldTitle}>${name}</${prefix}:${fieldTitle}>${geometry}</${prefix}:${tag}>`;
    }
    else {
        return `<${prefix}:${tag}><${prefix}:${fieldTitle}/>${geometry}</${prefix}:${tag}>`;
    }
};

TC.filter.bbox = function () {
    if (Object.prototype.toString.call(arguments[0]) !== "[object String]")
        return new TC.filter.Bbox(null, arguments[0], arguments[1]);
    else
        return new TC.filter.Bbox(arguments[0], arguments[1], arguments[2]);
};

TC.filter.BBOX = TC.filter.Bbox = function (geometryName, extent, opt_srsName) {
    TC.filter.Filter.call(this, 'BBOX');
    this.geometryName = geometryName;
    this.extent = extent;
    this.srsName = opt_srsName;
};
TC.inherit(TC.filter.Bbox, TC.filter.Spatial);

TC.filter.Bbox.prototype.clone = function () {
    const result = TC.filter.Spatial.prototype.clone.call(this);
    result.extent = this.extent.slice();
    return result;
};

TC.filter.Bbox.prototype.write = function () {
    const srsName = typeof (this.srsName) !== "undefined" ? " srsName=\"" + this.srsName + "\"" : "";
    const lowerCorner = this.extent[0] + ' ' + this.extent[1];
    const upperCorner = this.extent[2] + ' ' + this.extent[3];
    const bbox = `<gml:Envelope${srsName}><gml:lowerCorner>${lowerCorner}</gml:lowerCorner><gml:upperCorner>${upperCorner}</gml:upperCorner></gml:Envelope>`;
    const prefix = this._defaultPrefixNS;
    const tag = this.getTagName();
    const fieldTitle = this._fieldTitle;
    const name = this.geometryName;
    if (this.geometryName) {
        return `<${prefix}:${tag}><${prefix}:${fieldTitle}>${name}</${prefix}:${fieldTitle}>${bbox}</${prefix}:${tag}>`;
    }
    else {
        return `<${prefix}:${tag}><${prefix}:${fieldTitle}/>${bbox}</${prefix}:${tag}>`;
    }
};

TC.filter.Intersects = function (geometryName, geometry, opt_srsName) {
    TC.filter.Spatial.call(this, 'Intersects', geometryName, geometry, opt_srsName);
};
TC.inherit(TC.filter.Intersects, TC.filter.Spatial);

TC.filter.Within = function (geometryName, geometry, opt_srsName) {
    TC.filter.Spatial.call(this, 'Within', geometryName, geometry, opt_srsName);
};
TC.inherit(TC.filter.Within, TC.filter.Spatial);

const filter = TC.filter;
export default filter;