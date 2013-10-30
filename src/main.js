function pathgl(canvas) {
  return init('string' == typeof canvas ? d3.select(canvas).node() :
              canvas instanceof d3.selection ? canvas.node() :
              canvas
             )
}

pathgl.shaderParameters = {
  rgb: [0,0,0, 0]
, xyz: [0,0,0]
, time: [0]
, resolution: [ innerWidth, innerHeight ]
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
