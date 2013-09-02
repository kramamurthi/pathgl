//stroke
// thickness
// dasharray
// length
// opacity
// color

//fill
// pattern
// gradient + shaders
// color
// opacity

//99% usecase is d3 so add expose methods for naked later

d3.queue = function (fn) {
  var args = [].slice.call(arguments, 1)
  d3.timer(function () {
    fn.apply(null, args)
    return true
  })
}

function pathgl (canvas) {
  canvas.datum().map(function (d, i) {
    if ('string' === typeof d) d = canvas.datum()[i] = { d: d }
    d.rgb = [1, 1, 1].map(Math.random)
    return d
  }).forEach(draw)
}

var pmatrix = [0.0031446540880503146, 0, 0, 0, 0, 0.004, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]
  , log = console.log.bind(console)
  , stroke = [1, 1, 1]
  , paths = []

  , canv, ctx, program, pos
  , r, g, b
  , lineBuffers
  , red, green, blue

var actions = { m: moveTo
              , z: closePath
              , l: lineTo

              , h: 'horizontalLine'
              , v: 'verticalLine'
              , c: 'curveTo'
              , s: 'shortCurveTo'
              , q: 'quadraticBezier'
              , t: 'smoothQuadraticBezier'
              , a: 'elipticalArc'
              }

pathgl.fragment = [ "precision mediump float;"
                  , "uniform float r;"
                  , "uniform float g;"
                  , "uniform float b;"
                  , "void main(void) {"
                  , "gl_FragColor = vec4(r, g, b, 1.0);"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "void main(void) {"
                , "gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);"
                , "}"
                ].join('\n')

pathgl.init = init

pathgl.stroke = function (_) {
  if (! _) return stroke
  stroke = _
  return this
}

function draw (datum) {
  var str = datum.d
    , split = str.split(/([A-Za-z])/)
              .map(function(d) { return d.trim().toLowerCase() })
              .filter(function(d) { return d })
    , i = 0, action, coords, j

  paths.push(lineBuffers = [])
  paths[paths.length - 1].rgb = datum.rgb

  while (i < split.length) {
    action = actions[split[i++]]
    coords = split[i++] || ''
    if (! action.call) throw new Error(action + ' ' + split[i - 1] + ' is not yet implemented')
    coords ? twoEach(coords.split(' '), action) : action(coords)
  }
}

function moveTo(x, y) {
  pos = [x, canv.height - y]
}

function closePath() {
  render()
}

function lineTo(x, y) {
  addLine.apply(0, pos.concat(pos = [x, canv.height - y]))
}

function compileShader (type, src) {
  var shader = ctx.createShader(type)
  ctx.shaderSource(shader, src)
  ctx.compileShader(shader)
  if (! ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(shader))
  return shader
}

function initShaders() {
  var vertexShader = compileShader(ctx.VERTEX_SHADER, pathgl.vertex)
  var fragmentShader = compileShader(ctx.FRAGMENT_SHADER, pathgl.fragment)
  program = ctx.createProgram()
  ctx.attachShader(program, vertexShader)
  ctx.attachShader(program, fragmentShader)
  ctx.linkProgram(program)

  r = ctx.getUniformLocation(program, 'r')
  g = ctx.getUniformLocation(program, 'g')
  b = ctx.getUniformLocation(program, 'b')

  if (! ctx.getProgramParameter(program, ctx.LINK_STATUS)) return log("Shader is broken")

  ctx.useProgram(program)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
}

function addLine(x1, y1, x2, y2) {
  var index = lineBuffers.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]
  ctx.bindBuffer(ctx.ARRAY_BUFFER, lineBuffers[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  lineBuffers[index].itemSize = 3
  lineBuffers[index].numItems = vertices.length / 3
}

function render() {
  //ctx.clear(ctx.COLOR_BUFFER_BIT)
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
  for(var j = 0; j < paths.length; j++)
    for (var i = 0; i < paths[j].length; i++)
      d3.queue(dry(paths[j][i], paths[j].rgb))
}

function setStroke (rgb){
  ctx.uniform1f(r, rgb[0])
  ctx.uniform1f(g, rgb[1])
  ctx.uniform1f(b, rgb[2])
}

function dry(buffer, rgb){
  return function () {
    setStroke(rgb)
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer )
    ctx.vertexAttribPointer(program.vertexPositionLoc, buffer.itemSize, ctx.FLOAT, false, 0, 0)
    ctx.drawArrays(ctx.LINE_STRIP, 0, buffer.numItems)
  }
}

function initContext() {
  canv = document.querySelector("canvas")
  ctx = canv.getContext('webgl', { antialias: false })
  pos = [0, canv.height]

  ctx.clearColor(0.0, 0.0, 0.0, 1.0)
  ctx.viewportWidth = canv.width
  ctx.viewportHeight = canv.height
}

function init() {
  initContext()
  initShaders()
  return pathgl
}

function twoEach(list, fn) {
  var l = list.length - 1, i = 0
  while(i < l) fn(list[i++], list[i++])
}