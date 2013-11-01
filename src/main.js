function pathgl(canvas) {
  canvas = 'string' == typeof canvas ? d3.select(canvas).node() :
    canvas instanceof d3.selection ? canvas.node() :
    canvas
  return init(canvas)
}

pathgl.shaderParameters = {
  rgb: [0, 0, 0, 0]
, xy: [0, 0]
, time: [0]
, rotation: [0, 1]
, resolution: [innerWidth, innerHeight]
, mouse: pathgl.mouse = [0, 0]
}

pathgl.initShaders = initShaders

pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]


var ctx

this.pathgl = pathgl
