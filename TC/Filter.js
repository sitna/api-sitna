TC.filter = {};

TC.filter.Filter = function (tagName) {
    this.tagName_ = tagName;
};

TC.filter.Filter.prototype.getTagName = function () {
    return this.tagName_;
};

TC.filter.Filter.prototype.writeFilterCondition_ = function () {

    //return '<{prefix}:{tag}>{childs}</{prefix}:{tag}>'.format({prefix:"ogc",tag:filter.getTagName(),childs:""});
    var filter = this;
    return '<{prefix}:Filter xmlns:ogc=\"http://www.opengis.net/ogc\">{inner}</{prefix}:Filter>'.format({
        prefix: "ogc",
        tag: filter.getTagName(),
        inner: this.writeInnerCondition_(filter)
    });

    /*ol.xml.pushSerializeAndPop(item,
        ol.format.WFS.GETFEATURE_SERIALIZERS_,
        ol.xml.makeSimpleNodeFactory(filter.getTagName()),
        [filter], objectStack);*/
}
TC.filter.Filter.prototype.writeInnerCondition_ = function (filter) {

    if (filter instanceof TC.filter.LogicalNary) {
        return filter.write()
    }
    else if (filter instanceof TC.filter.ComparisonBinary) {
        return filter.write();
    }
    else if (filter instanceof TC.filter.Comparison) {
        return filter.write();
    }
    else if (filter instanceof TC.filter.Spatial) {
        return filter.write();
    }
    else
        return filter.write();
};
TC.filter.Filter.prototype.writeInnerArrayCondition_ = function (filters) {
    return filters.reduce(function (vi, va, index) {
        return (vi instanceof TC.filter.Filter ? vi.writeInnerCondition_(vi) : vi) + va.writeInnerCondition_(va);
    });
}

TC.filter.Filter.prototype.getText = function () {
    return this.writeFilterCondition_();
};

TC.filter.and = function (conditions) {
    var params = [null].concat(Array.prototype.slice.call(arguments));
    return new (Function.prototype.bind.apply(TC.filter.And, params));
};

TC.filter.or = function (conditions) {
    var params = [null].concat(Array.prototype.slice.call(arguments));
    return new (Function.prototype.bind.apply(TC.filter.Or, params));
};

TC.filter.not = function (condition) {
    return new TC.filter.Not(condition);
};

TC.filter.bbox = function (geometryName, extent, opt_srsName) {
    return new TC.filter.Bbox(geometryName, extent, opt_srsName);
};

TC.filter.intersects = function (geometryName, geometry, opt_srsName) {
    return new TC.filter.Intersects(geometryName, geometry, opt_srsName);
};


TC.filter.within = function (geometryName, geometry, opt_srsName) {
    return new TC.filter.Within(geometryName, geometry, opt_srsName);
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

TC.filter.LogicalNary = function (tagName, conditions) {

    TC.filter.Filter.call(this, tagName);

    this.conditions = Array.prototype.slice.call(arguments, 1);
};
TC.inherit(TC.filter.LogicalNary, TC.filter.Filter);

TC.filter.And = function (conditions) {
    var params = ['And'].concat(Array.prototype.slice.call(arguments));
    TC.filter.LogicalNary.apply(this, params);
};
TC.inherit(TC.filter.And, TC.filter.LogicalNary);

TC.filter.Or = function (conditions) {
    var params = ['Or'].concat(Array.prototype.slice.call(arguments));
    TC.filter.LogicalNary.apply(this, params);
};
TC.inherit(TC.filter.Or, TC.filter.LogicalNary);

TC.filter.LogicalNary.prototype.write = function () {
    return '<{prefix}:{tag}>{inner}</{prefix}:{tag}>'.format({
        prefix: "ogc",
        tag: this.getTagName(),
        inner: this.writeInnerArrayCondition_(this.conditions)
    });
}

TC.filter.Not = function (condition) {

    TC.filter.Filter.call(this, 'Not');
    this.condition = condition;
};
TC.inherit(TC.filter.Not, TC.filter.Filter);

TC.filter.Bbox = function (geometryName, extent, opt_srsName) {

    TC.filter.Filter.call(this, 'BBOX');

    this.geometryName = geometryName;

    this.extent = extent;

    this.srsName = opt_srsName;
};
TC.inherit(TC.filter.Bbox, TC.filter.Filter);

TC.filter.Comparison = function (tagName, propertyName) {

    TC.filter.Filter.call(this, tagName);

    this.propertyName = propertyName;
};
TC.inherit(TC.filter.Comparison, TC.filter.Filter);

TC.filter.Comparison.prototype.write = function () {
    var values = '';
    //isbetween
    if (this.lowerBoundary && this.upperBoundary)
        values = '<ogc:LowerBoundary><ogc:Literal>{LowerBoundary}</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>{UpperBoundary}</ogc:Literal></ogc:UpperBoundary>'.format({
            LowerBoundary: this.lowerBoundary,
            UpperBoundary: this.upperBoundary
        });
    if (this.pattern)
        values = '<ogc:Literal>{Pattern}</ogc:Literal>'.format({
            Pattern: this.pattern
        });
    if (this.params)
        if ($.isArray(this.params))
            values = this.params.reduce(function (a, b, i) {
                var fmt = function (text) {
                    return '<ogc:Literal>{value}</ogc:Literal>'.format({ value: text });
                }
                return (i > 0 ? a : fmt(a)) + fmt(b);
            });
        else
            values = '<ogc:Literal>{value}</ogc:Literal>'.format({ value: this.params });

    return '<{prefix}:{tag}{matchCase}{escape}{singleChar}{wildCard}><{prefix}:PropertyName>{name}</{prefix}:PropertyName>{values}</{prefix}:{tag}>'.format({
        prefix: "ogc",
        tag: this.getTagName(),
        matchCase: (typeof (this.matchCase) !== "undefined" ? " matchCase=\"" + this.matchCase + "\"" : ""),
        escape: (typeof (this.escapeChar) !== "undefined" ? " escape=\"" + this.escapeChar + "\"" : ""),
        singleChar: (typeof (this.singleChar) !== "undefined" ? " singleChar=\"" + this.singleChar + "\"" : ""),
        wildCard: (typeof (this.wildCard) !== "undefined" ? " wildCard=\"" + this.wildCard + "\"" : ""),
        name: this.propertyName,
        values: values
    });
}

TC.filter.ComparisonBinary = function (
    tagName, propertyName, expression, opt_matchCase) {

    TC.filter.Comparison.call(this, tagName, propertyName);

    this.expression = expression;

    this.matchCase = opt_matchCase;
};
TC.inherit(TC.filter.ComparisonBinary, TC.filter.Comparison);

TC.filter.ComparisonBinary.prototype.write = function () {
    return '<{prefix}:{tag}{matchCase}><{prefix}:PropertyName>{name}</{prefix}:PropertyName><{prefix}:Literal>{value}</{prefix}:Literal></{prefix}:{tag}>'.format({
        prefix: "ogc",
        tag: this.getTagName(),
        matchCase: (typeof (this.matchCase) !== "undefined" ? " matchCase=\"" + this.matchCase + "\"" : ""),
        //escape:(typeof(this.escapeChar)!=="undefined"? " escape=\"" + this.escapeChar+ "\"":""),
        //singleChar:(typeof(this.singleChar)!=="undefined"? " singleChar=\"" + this.singleChar+ "\"":""),
        //wildCard:(typeof(this.wildCard)!=="undefined"? " wildCard=\"" + this.wildCard+ "\"":""),
        name: this.propertyName,
        value: this.expression
    });
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
    this.lowerBoundary = lowerBoundary;
    this.upperBoundary = upperBoundary;
};
TC.inherit(TC.filter.IsBetween, TC.filter.Comparison);

TC.filter.Function = function (fuctionName, params) {
    TC.filter.Comparison.call(this, 'Function', fuctionName);
    this.params = params
};
TC.inherit(TC.filter.Function, TC.filter.Comparison);


TC.filter.Spatial = function (tagName, geometryName, geometry, opt_srsName) {
    TC.filter.Filter.call(this, tagName);
    this.geometryName = geometryName || 'the_geom';
    this.geometry = geometry;
    this.srsName = opt_srsName;
};
TC.inherit(TC.filter.Spatial, TC.filter.Filter);

TC.filter.Spatial.prototype.write = function () {
    return '<{prefix}:{tag}><{prefix}:PropertyName>{name}</{prefix}:PropertyName>{geometry}</{prefix}:{tag}>'.format({
        prefix: "ogc",
        tag: this.getTagName(),
        name: this.geometryName,
        srsName: (typeof (this.srsName) !== "undefined" ? " srsName=\"" + this.srsName + "\"" : ""),
        geometry: this.geometry.wrap.toGML()
    });
};

TC.filter.Bbox = function (geometryName, extent, opt_srsName) {
    TC.filter.Filter.call(this, 'BBOX');
    this.geometryName = geometryName;
    this.extent = extent;
    this.srsName = opt_srsName;
};
TC.inherit(TC.filter.Bbox, TC.filter.Filter);

TC.filter.Bbox.prototype.write = function () {
    var bbox = '<gml:Envelope{srsName}><gml:lowerCorner>{lowerCorner}</gml:lowerCorner><gml:upperCorner>{upperCorner}</gml:upperCorner></gml:Envelope>'
	.format({
	    srsName: (typeof (this.srsName) !== "undefined" ? " srsName=\"" + this.srsName + "\"" : ""),
	    lowerCorner: (this.extent[0] + ' ' + this.extent[1]),
	    upperCorner: (this.extent[2] + ' ' + this.extent[3])
	});
    return '<{prefix}:{tag}><{prefix}:PropertyName>{name}</{prefix}:PropertyName>{BBOX}</{prefix}:{tag}>'.format({
        prefix: "ogc",
        tag: this.getTagName(),
        name: this.geometryName,
        BBOX: bbox
    });
};

TC.filter.Intersects = function (geometryName, geometry, opt_srsName) {
    TC.filter.Spatial.call(this, 'Intersects', geometryName, geometry, opt_srsName);
};
TC.inherit(TC.filter.Intersects, TC.filter.Spatial);

TC.filter.Within = function (geometryName, geometry, opt_srsName) {
    TC.filter.Spatial.call(this, 'Within', geometryName, geometry, opt_srsName);
};
TC.inherit(TC.filter.Within, TC.filter.Spatial);