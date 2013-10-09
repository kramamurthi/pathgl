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

d3.queue = function (fn) {
  var args = [].slice.call(arguments, 1)
  d3.timer(function () {
    fn.apply(null, args)
    return true
  })
}

function pathgl (canvas) {
  pathgl.init(canvas.node())
  canvas.tween ? canvas.tween('fuak', function (d) { return amg.bind(null, d) }) : amg(canvas.datum())
  function amg (d, t) { d.map(wrap).forEach(process, t) }
}

function wrap(d, i) {
  if ('string' === typeof d) d = d[i] = { d: d }
  d.fill = d.fill || d3.functor([1, 1, 1])
  return d
}

var pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1)
  , log = console.log.bind(console)
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

pathgl.init = once(init)

pathgl.stroke = function (_) {
  if (! _) return paths.stroke
  paths.stroke = _
  paths.forEach(inter)
  return this
}

function inter(path, i) {
  path.interpolateStroke = d3.interpolateRgb(path.stroke || '#000',
                                             path.stroke = paths.stroke(path, i))
  return path
}

function process (datum) {
  var str = datum.d
    , split = str.split(/([A-Za-z])/)
              .map(function(d) { return d.trim().toLowerCase() })
              .filter(function(d) { return d })
    , i = 0, action, coords

  var path = addToBuffer(datum)

  if (path.coords.length) return render(+ this)

  while (i < split.length) {
    action = actions[split[i++]]
    path.coords.push(coords = split[i++] || '')
    if (! action.call) throw new Error(action + ' ' + split[i - 1] + ' is not yet implemented')
    coords ? twoEach(coords.split(' '), action, path) : action.call(path, coords)
  }
}

function addToBuffer(datum) {
  var k = paths.filter(function (d) { return d.d == datum.d })
  if (k.length) return k[0]
  paths.push(lineBuffers = [])
  return inter(extend(paths[paths.length - 1], datum, { coords: [] }), paths.length - 1)
}

function moveTo(x, y) {
  pos = [x, canv.height - y]
}

function extend (a, b) {
  if (arguments.length > 2) [].forEach.call(arguments, function (b) { extend(a, b) })
  else for (var k in b) a[k] = b[k]
  return a
}

function closePath() {
  lineTo.apply(0, this.coords[0].split(' '))
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

function render(t) {
  //ctx.clear(ctx.COLOR_BUFFER_BIT)
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
  for (var j = 0; j < paths.length; j++)
    for (var i = 0; i < paths[j].length; i++)
      d3.queue(enclose.bind(null,
                            paths[j][i],
                            paths[j].interpolateStroke(t || 1)
                           ))

}

function setStroke (rgb){
  window.x = rgb
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

function initContext(canvas) {
  canv = canvas
  ctx = canvas.getContext('webgl', { antialias: false })
  pos = [0, canvas.height]

  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
  ctx.lineWidth(5)
}

function init(canvas) {
  initContext(canvas)
  initShaders(ctx)
  return pathgl
}

function twoEach(list, fn, ctx) {
  var l = list.length - 1, i = 0
  while(i < l) fn.call(ctx, list[i++], list[i++])
}

function once (fn) {
  var called, args = [].slice.call(arguments, 1)
  return function () {
    if (called) return
    called = true
    fn.apply(null, [].concat.apply(args, arguments))
  }
}

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

this.pathgl = pathgl
