;function init(canvas) {
  initContext(canvas)
  initShaders(ctx)
  canvas.appendChild = dom
  return ctx
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

  if (! ctx.getProgramParameter(program, ctx.LINK_STATUS)) return console.error("Shader is broken")

  ctx.useProgram(program)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
}

function initContext(canvas) {
  canv = canvas
  pos = [0, canv.height]

  ctx = canvas.getContext('webgl', { antialias: false })
  if (! ctx) return
  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
  ctx.lineWidth(5)
}
function pathgl(canvas, svg) {
  init(d3.select(canvas).node())
  return ctx ? canvas : svg
}

this.pathgl = pathgl
var methods = { m: moveTo
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

function parse (str) {
  var path = addToBuffer(this)

  if (path.coords.length) return render(+ this)

  str.match(/[a-z][^a-z]*/ig).forEach(function (segment) {
    var instruction = methods[segment[0].toLowerCase()]
      , coords = segment.slice(1).trim().split(/,| /g)

    ;[].push.apply(path.coords, coords)

    instruction ?
      twoEach(coords, instruction, path) :
      console.error(segment[0] + ' ' + segment[0] + ' is not yet implemented')
  })
}

function moveTo(x, y) {
  pos = [x, canv.height - y]
}

function closePath() {
  lineTo.apply(0, this.coords.slice(0, 2))
  render()
}

function lineTo(x, y) {
  addLine.apply(0, pos.concat(pos = [x, canv.height - y]))
}
var svgDomProxy =
    { fill: function (val) {

      }

    , d: function (d) {
        parse.call(this, d)
      }

    , stroke: function (d) {
        render()
      }

    , getAttribute: function (name) {
        return this.attr[name]
      }

    , setAttribute: function (name, value) {
        this.attr[name] = value
        this[name](value)
      }

    , removeAttribute: function (name) {
        this.attr[name] = null
      }

    , textContent: noop
    , removeEventListener: noop
    , addEventListener: noop
}

function dom(el) {
  return extend(Object.create(svgDomProxy), {
    attr: {},
    tagName: el.tagName
  })
}function addToBuffer(datum) {
  var k = paths.filter(function (d) { return d.__data__d == datum.__data__ })
  if (k.length) return k[0]

  paths.push(lineBuffers = [])
  return extend(paths[paths.length - 1], datum, { coords: [] })
}

function addLine(x1, y1, x2, y2) {
  var index = lineBuffers.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]
  ctx.bindBuffer(ctx.ARRAY_BUFFER, lineBuffers[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  lineBuffers[index].itemSize = 3
  lineBuffers[index].numItems = vertices.length / 3
}

var count = 0
function render(t) {
  ctx.clear(ctx.COLOR_BUFFER_BIT)
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
  for (var j = 0; j < paths.length; j++)
    for (var i = 0; i < paths[j].length; i++)
      d3.queue(enclose,
               paths[j][i],
               paths[j].attr.stroke || '#000'
              )
}

function setStroke (rgb){
  ctx.uniform1f(r, rgb.r / 256)
  ctx.uniform1f(g, rgb.g / 256)
  ctx.uniform1f(b, rgb.b / 256)
}

function enclose(buffer, rgb){
  setStroke(d3.rgb(rgb))
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer )
  ctx.vertexAttribPointer(program.vertexPositionLoc, buffer.itemSize, ctx.FLOAT, false, 0, 0)
  ctx.drawArrays(ctx.LINE_STRIP, 0, buffer.numItems)
}

;pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]

var pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1)
  , paths = []

  , canv, ctx, program, pos
  , r, g, b
  , lineBuffers
  , red, green, blue

pathgl.fragment = [ "precision mediump float;"
                  , "uniform float r, g, b;"
                  , "void main(void) {"
                  , "  gl_FragColor = vec4(r, g, b, 1.0);"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);"
                , "}"
                ].join('\n')
;function extend (a, b) {
  if (arguments.length > 2) [].forEach.call(arguments, function (b) { extend(a, b) })
  else for (var k in b) a[k] = b[k]
  return a
}

function twoEach(list, fn, ctx) {
  if (list.length == 1) fn.call(ctx)

  var l = list.length - 1, i = 0
  while(i < l) fn.call(ctx, list[i++], list[i++])
}

function noop () {}

function projection(l, r, b, t, n, f) {
  var rl = r - l
    , tb = t - b
    , fn = f - n

  return [ 2 / rl, 0, 0, 0
         , 0, 2 / tb, 0, 0
         , 0, 0, -2 / fn, 0

         , (l + r) / -rl
         , (t + b) / -tb
         , (f + n) / -fn
         , 1
         ]
}

d3.queue = function (fn) {
  var args = [].slice.call(arguments, 1)
  d3.timer(function () {
    fn.apply(null, args)
    return true
  })
}