const lineTemplate = '<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {style} shape-rendering="crispEdges" >Sorry, your browser does not support inline SVG.</line>';
const polygonTemplate = '<polygon points="0,0 {width},0 {width},{height} 0,{height} 0,0" {style} >Sorry, your browser does not support inline SVG.</polygon>';
const circleTemplate = '<circle cx="{x}" cy="{y}" r="{radius}" {style} >Sorry, your browser does not support inline SVG.</circle>';
const squareTemplate = '<rect  x="{x}" y="{y}" width="{width}" height="{height}" {style} {transform}>Sorry, your browser does not support inline SVG.</rect >';
const triangleTemplate = '<polygon points="{points}" {style} >Sorry, your browser does not support inline SVG.</polygon>';

export { lineTemplate as line, circleTemplate as circle, polygonTemplate as polygon, squareTemplate as square, triangleTemplate as triangle };