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
var pathgl = {}
  , pmatrix = [0.0031446540880503146, 0, 0, 0, 0, 0.004, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]
  , log = console.log.bind(console)
  , canvas, ctx, program, pos
  , r, g, b, stroke = [1, 1, 1]

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
pathgl.draw = draw

pathgl.stroke = function (_) {
  if (! _) return stroke
  stroke = _
  return this
}

function draw (str) {
  var split = str.split(/([A-Za-z])/)
              .map(function(d) { return d.trim().toLowerCase() })
              .filter(function(d) { return d })
    , i = 0, action, coords, j
  while (i < split.length) {
    action = actions[split[i++]]
    coords = split[i++] || ''
    if (! action.bind) throw new Error(action + ' ' + split[i - 1] + ' is not yet implemented')
    coords ? twoEach(coords.split(' '), action) : action(coords)
  }
}

function moveTo(x, y) {
  pos = [x, canvas.height - y]
}

function closePath() {
  render()
}

function lineTo(x, y) {
  addLine.apply(0, pos.concat(pos = [x, canvas.height - y]))
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

var lineBuffers = [];

function addLine(x1, y1, x2, y2) {
  var index = lineBuffers.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]
  ctx.bindBuffer(ctx.ARRAY_BUFFER, lineBuffers[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  lineBuffers[index].itemSize = 3
  lineBuffers[index].numItems = vertices.length / 3
}

function render() {
  ctx.clear(ctx.COLOR_BUFFER_BIT)

  ctx.uniform1f(r, stroke[0])
  ctx.uniform1f(g, stroke[1])
  ctx.uniform1f(b, stroke[2])

  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)

  for (var i = 0; i < lineBuffers.length; i++) {
    dry(i)()
    //setTimeout(dry(i), 500 * i)
  }
}

function dry(i){
  return function () {
    ctx.bindBuffer(ctx.ARRAY_BUFFER, lineBuffers[i])
    ctx.vertexAttribPointer(program.vertexPositionLoc, lineBuffers[i].itemSize, ctx.FLOAT, false, 0, 0)
    ctx.drawArrays(ctx.LINE_STRIP, 0, lineBuffers[i].numItems)
  }
}

function initContext() {
  canvas = document.querySelector("canvas")
  ctx = canvas.getContext('webgl', { antialias: false })
  pos = [0, canvas.height]

  ctx.clearColor(0.0, 0.0, 0.0, 1.0)
  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
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
