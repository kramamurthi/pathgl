var canvas
function init(c) {
  canvas = c
  ctx = initContext(canvas)
  initShaders()
  override(canvas)
  d3.select(canvas).on('mousemove.pathgl', mousemoved)
  d3.timer(run_loop)
  return ctx ? canvas : null
}

function mousemoved() {
  //set scene hover here
  var m = d3.mouse(this)
  pathgl.mouse = [m[0] / innerWidth, m[1] / innerHeight]
}

function run_loop(elapsed) {
  if (canvas.__rerender__ || pathgl.forceRerender)
    ctx.uniform1f(program.time, pathgl.time = elapsed / 1000),
    pathgl.mouse && ctx.uniform2fv(program.mouse, pathgl.mouse),
    canvas.__scene__.forEach(drawPath)
  canvas.__rerender__ = false
  }

function override(canvas) {
  return extend(canvas,
                { appendChild: svgDomProxy
                , querySelectorAll: querySelectorAll
                , querySelector: querySelector
                , __scene__: []
                , __pos__: []
                , __program__: void 0
                , __id__: 0
                })
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
  ctx.useProgram(program)

  if (! ctx.getProgramParameter(program, ctx.LINK_STATUS)) return console.error("Shader is broken")

  each(pathgl.shaderParameters, bindUniform)

  program.vertexPosition = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPosition)

  program.uPMatrix = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.uPMatrix, 0, projection(0, innerWidth / 2, 0, 500, -1, 1))
}

function bindUniform(val, key) {
  program[key] = ctx.getUniformLocation(program, key)
  if (val) ctx['uniform' + val.length + 'fv'](program[key], val)
}

function initContext(canvas) {
  var ctx = canvas.getContext('webgl')
  if (! ctx) return
  ctx.viewportWidth = canvas.width || innerWidth
  ctx.viewportHeight = canvas.height || innerHeight
  return ctx
}


function each(obj, fn) {
  for(var key in obj) fn(obj[key], key, obj)
}function pathgl(canvas) {
  return init('string' == typeof canvas ? d3.select(canvas).node() :
              canvas instanceof d3.selection ? canvas.node() :
              canvas
             )
}

pathgl.shaderParameters = {
  rgb: [0, 0, 0, 0]
, xyz: [0, 0, 0]
, time: [0]
, rotation: [0, 0]
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
var methods = { m: moveTo
              , z: closePath
              , l: lineTo

              , h: horizontalLine
              , v: verticalLine
              , c: curveTo
              , s: shortCurveTo
              , q: quadraticBezier
              , t: smoothQuadraticBezier
              , a: elipticalArc
              }


function horizontalLine() {}
function verticalLine() {}
function curveTo() {}
function shortCurveTo() {}
function quadraticBezier() {}
function smoothQuadraticBezier () {}
function elipticalArc(){}

function group(coords) {
  var s = []
  twoEach(coords, function (a, b) { s.push([a, b]) })
  return s

}
function parse (str) {
  var path = addToBuffer(this)

  if (path.length) return render()

  str.match(/[a-z][^a-z]*/ig).forEach(function (segment, i, wow) {
    var instruction = methods[segment[0].toLowerCase()]
      , coords = segment.slice(1).trim().split(/,| /g)

    ;[].push.apply(path.coords, group(coords))
    if (instruction.name == 'closePath' && wow[i+1]) return instruction.call(path, wow[i+1])

    instruction.call ?
      twoEach(coords, instruction, path) :
      console.error(instruction + ' ' + segment[0] + ' is not yet implemented')
  })
}

function moveTo(x, y) {
  pos = [x, canvas.height - y]
}

var subpathStart
function closePath(next) {
  subpathStart = pos
  lineTo.apply(this, /m/i.test(next) ? next.slice(1).trim().split(/,| /g) : this.coords[0])
}


function lineTo(x, y) {
  addLine.apply(this, pos.concat(pos = [x, canvas.height - y]))
}
function svgDomProxy(el, canvas) {
  if (! (this instanceof svgDomProxy)) return new svgDomProxy(el, this);

  canvas.__scene__.push(this)

  this.tagName = el.tagName
  this.id = canvas.__id__++
  this.attr = { stroke: 'black'
              , fill: 'black'
              }
}

function querySelector(query) {
  return this.querySelectorAll(query)[0]
}
function querySelectorAll(query) {
  return this.__scene__
}

var types = []

svgDomProxy.prototype =
    {
      r: function () {
        addToBuffer(this)
        this.path.coords = circlePoints(this.attr.r)
        this.buffer = buildBuffer(this.path.coords)
        drawPolygon.call(this, this.buffer)
      }
    , cx: function (cx) {
        this.buffer && drawPolygon.call(this, this.buffer)
      }
    , cy: function (cy) {
        this.buffer && drawPolygon.call(this, this.buffer)
      }

    , fill: function (val) {
        if (this.tagName == 'PATH') return
        drawPolygon.call(this, this.buffer
                         // .map(function (d) { return d.map(integer).filter(identity) })
                         // .map(function (d) { d.push(0); return d })
                         // .filter(function (d) { return d.length == 3 })
                   )
      }

    , transform: function (d) {
        var parse = d3.transform(d)
        this.attr.translateX = parse.translate[0]
        this.attr.translateY = parse.translate[1]
        var radians = parse.rotate * Math.PI / 180
        this.attr.rotation = [ Math.sin(radians), Math.cos(radians) ]
      }

    , d: function (d) {
        this.path && extend(this.path, { coords: [], length: 0 })

        if (d.match(/NaN/)) return console.warn('path is invalid')

        render()

        parse.call(this, d)
      }

    , stroke: function (d) {
        render()
      }

    , 'stroke-width': function (value) {
        ctx.lineWidth(value)
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

var circleProto = extend(Object.create(svgDomProxy), {
  r: ''
, cx: ''
, cy: ''
})

var pathProto = extend(Object.create(svgDomProxy), {
  d: ''
})


function buildBuffer(points){
  var buffer = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(points), ctx.STATIC_DRAW)
  buffer.numItems = points.length / 3
  return buffer
}

function drawPolygon(buffer) {
  if (! this.attr) return
  ctx.uniform3f(program.xyz, this.attr.cx || 0, this.attr.cy || 0, 0)

  // points = flatten(points)
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)

  ctx.vertexAttribPointer(0, 3, ctx.FLOAT, false, 0, 0)

  ctx.drawArrays(ctx.TRIANGLE_FAN, 0, buffer.numItems)
}

var flatten = function(input) {
  var output = []
  input.forEach(function(value) {
    Array.isArray(value) ? [].push.apply(output, value) : output.push(value)
  })
  return output
}

var memo = {}
function circlePoints(r) {
  if (memo[r]) return memo[r]

  var a = []
  for (var i = 0; i < 360; i+=25)
    a.push(50 + r * Math.cos(i * Math.PI / 180),
           50 + r * Math.sin(i * Math.PI / 180),
           0
          )

  return memo[r] = a
}
function addToBuffer(datum) {
  return extend(datum.path = [], { coords: [], id: datum.id })
}

function addLine(x1, y1, x2, y2) {
  var index = this.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]

  ctx.bindBuffer(ctx.ARRAY_BUFFER, this[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  this[index].itemSize = 3
  this[index].numItems = vertices.length / 3
}

function drawPath(node) {
  if (node.buffer) drawPolygon.call(node, node.buffer)

  setStroke(d3.rgb(node.attr.stroke))
  ctx.uniform3f(program.xyz, node.attr.translateX || 0, node.attr.translateY || 0, 0)
  ctx.uniform2fv(program.rotation, node.attr.rotation)

  var path = node.path

  for (var i = 0; i < path.length; i++) {
    ctx.bindBuffer(ctx.ARRAY_BUFFER, path[i])
    ctx.vertexAttribPointer(program.vertexPositionLoc, path[i].itemSize, ctx.FLOAT, false, 0, 0)
    ctx.drawArrays(ctx.LINE_STRIP, 0, path[i].numItems)
  }
}

function render() {
  canvas.__rerender__ = true
}

function setStroke (c) {
  ctx.uniform4f(program.rgb,
                c.r / 256,
                c.g / 256,
                c.b / 256,
                1.0)
}
pathgl.fragment = [ "precision mediump float;"
                  , "uniform vec4 rgb;"
                  , "uniform float time;"
                  , "uniform vec2 resolution;"
                  , "void main(void) {"
                  , "  gl_FragColor = rgb;"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "uniform vec3 xyz;"
                , "uniform vec2 rotation;"
                , "void main(void) {"
                , "vec3 rotatedPosition = vec3(aVertexPosition.x * rotation.y + aVertexPosition.y * rotation.y, "
                                            + "aVertexPosition.y * rotation.y + aVertexPosition.x * rotation.x,"
                                            + "aVertexPosition.z);"
                , "  gl_Position = uPMatrix * vec4(xyz + rotatedPosition, 1.0);"
                , "}"
                ].join('\n')
function extend (a, b) {
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