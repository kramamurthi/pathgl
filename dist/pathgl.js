function init(canvas) {
  initContext(canvas)
  initShaders(ctx)
  override(canvas)
  return ctx
}

function override(canvas) {
  return extend(canvas,
                { appendChild: svgDomProxy
                , querySelectorAll: querySelectorAll
                , querySelector: querySelector
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

  var shaderParameters = {
      rgb: [0,0,0, 0]
    //, uPmatrix: pmatrix
    , xyz: [0,0,0]
    , time: [0]
    , resolution: [innerWidth, innerHeight]
  }

  each(shaderParameters, bindUniform)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
 }

function bindUniform(val, key) {
  program[key] = ctx.getUniformLocation(program, key)
  console.log(key, val.length)
  if (val) ctx['uniform' + val.length  +  'fv'](program[key], val)
}

function initContext(canvas) {
  canv = canvas
  ctx = canvas.getContext('webgl')
  if (! ctx) return
  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
}


function each(obj, fn) {
  for(var key in obj) fn(obj[key], key, obj)
}function pathgl(canvas, svg) {
  init(d3.select(canvas).node())
  return ctx ? canvas : svg
}

var id = 0
  , scene = [] //array of objects
  , pos = [] //current subpath position

  , pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1) //ortho

  , canv, ctx, program
  , r, g, b // shader params
  , rerender

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
  pos = [x, canv.height - y]
}

var subpathStart
function closePath(next) {
  subpathStart = pos
  lineTo.apply(this, /m/i.test(next) ? next.slice(1).trim().split(/,| /g) : this.coords[0])
}


function lineTo(x, y) {
  addLine.apply(this, pos.concat(pos = [x, canv.height - y]))
}
function svgDomProxy(el) {
  if (! (this instanceof svgDomProxy)) return new svgDomProxy(el);

  scene.push(this)

  this.tagName = el.tagName
  this.id = id++
  this.attr = { stroke: 'black'
              , fill: 'black'
              }
}

function querySelector(query) {
  return querySelectorAll('query')[0]
}
function querySelectorAll(query) {
  return scene
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

    , d: function (d) {
        this.path && extend(this.path, { coords: [], length: 0 })

        if (d.match(/NaN/)) return console.warn('path is invalid')

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
  setStroke(d3.rgb(this.attr.fill))
  ctx.uniform3f(program.xyz, this.attr.cx || 0, this.attr.cy || 0, 0)

  //points = flatten(points)
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

function circlePoints(r) {
  var a = []
  for (var i = 0; i < 360; i+=50)
    a.push(50 + r * Math.cos(i * Math.PI / 180),
           50 + r * Math.sin(i * Math.PI / 180),
           0
          )
  return a
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

d3.timer(function (elapsed) {
  ctx.uniform1f(program.time, pathgl.time = elapsed)
  scene.forEach(drawPath)
})

function drawPath(node) {
  setStroke(d3.rgb(node.attr.stroke))

  var path = node.path

  for (var i = 0; i < path.length; i++) {
    ctx.bindBuffer(ctx.ARRAY_BUFFER, path[i])
    ctx.vertexAttribPointer(program.vertexPositionLoc, path[i].itemSize, ctx.FLOAT, false, 0, 0)
    ctx.drawArrays(ctx.LINE_STRIP, 0, path[i].numItems)
  }
}

function render() {
  rerender = true
}

function setStroke (c){
  ctx.uniform4f(program.rgb,
                c.r / 256,
                c.g / 256,
                c.b / 256,
                1.0)
}
pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]

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
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(xyz + aVertexPosition, 1.0);"
                , "}"
                ].join('\n')


pathgl.fragment = [
  "precision mediump float;"
, "uniform float time;"
, "uniform vec2 mouse;"
, "uniform vec2 resolution;"
, "const float fog_density = 1.05;"
, "vec2 rand22(in vec2 p)"
, "{"
, "return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));"
, "}"
, "float rand12(vec2 p)"
, "{"
, "return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5357);"
, "}"
, "vec2 rand21(float p)"
, "{"
, "return fract(vec2(sin(p * 591.32), cos(p * 391.32)));"
, "}"
, "vec3 voronoi(in vec2 x)"
, "{"
, "vec2 n = floor(x); // grid cell id"
, "vec2 f = fract(x); // grid internal position"
, "vec2 mg; // shortest distance..."
, "vec2 mr; // ..and second shortest distance"
, "float md = 8.0, md2 = 8.0;"
, ""
, "for(int j = -1; j <= 1; j ++)"
, "{"
, "for(int i = -1; i <= 1; i ++)"
, "{"
, "vec2 g = vec2(float(i), float(j)); // cell id"
, "vec2 o = rand22(n + g); // offset to edge point"
, "vec2 r = g + o - f;"
, ""
, "float d = max(abs(r.x), abs(r.y)); // distance to the edge"
, ""
, "if(d < md)"
, "{md2 = md; md = d; mr = r; mg = g;}"
, "else if(d < md2)"
, "{md2 = d;}"
, "}"
, "}"
, "return vec3(n + mg, md2 - md);"
, "}"
, ""
, "#define A2V(a) vec2(sin((a) * 6.28318531 / 100.0), cos((a) * 6.28318531 / 100.0))"
, ""
, "vec2 rotate(vec2 p, float a)"
, "{"
, "return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));"
, "}"
, ""
, "vec3 intersect(in vec3 o, in vec3 d, vec3 c, vec3 u, vec3 v)"
, "{"
, "vec3 q = o - c;"
, "return vec3("
, "dot(cross(u, v), q),"
, "dot(cross(q, u), d),"
, "dot(cross(v, q), d)) / dot(cross(v, u), d);"
, "}"
, ""
, "void main( void )"
, "{"
, "vec2 uv = gl_FragCoord.xy / resolution.xy;"
, "uv = uv * 2.0 - 1.0;"
, "uv.x *= resolution.x / resolution.y;"
, ""
, ""
, "vec3 ro = vec3(10, 10.0, time * 0.0);"
, "ro.y = 0.0;"
, "vec3 ta = vec3(10.0, 512.0, 5.0);"
, ""
, "vec3 ww = normalize(ro - ta);"
, "vec3 uu = normalize(cross(ww, normalize(vec3(0.0, 1.0, 0.0))));"
, "vec3 vv = normalize(cross(uu, ww));"
, "vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.0 * ww);"
, ""
, "vec3 its;"
, "float v, g;"
, "vec3 inten = vec3(0.0);"
, ""
, "for(int i = 0; i < 16; i ++)"
, "{"
, "float layer = float(i);"
, "its = intersect(ro, rd, vec3(0.0, -5.0 - layer * 5.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));"
, "if(its.x > 0.0)"
, "{"
, "vec3 vo = voronoi((its.yz + time*2.0) * 0.05 + 8.0 * rand21(float(i)));"
, "v = exp(-100.0 * (vo.z - 0.02));"
, ""
, "float fx = 0.0;"
, ""
, "if(i == 6)"
, "{"
, "float crd = 0.0;//fract(time * 0.2) * 50.0 - 25.0;"
, "float fxi = cos(vo.x * 0.2 + time * 1.5);//abs(crd - vo.x);"
, "fx = clamp(smoothstep(0.9, 1.0, fxi), 0.0, 0.9) * 1.0 * rand12(vo.xy);"
, "fx *= exp(-3.0 * vo.z) * 2.0;"
, "}"
, "if (mod(float(i),3.0) < 1.0)"
, "inten.r += v * 0.1 + fx;"
, "else if (mod(float(i),3.0) < 2.0)"
, "inten.g += v * 0.1 + fx;"
, "else if (mod(float(i),3.0) < 3.0)"
, "inten.b += v * 0.1 + fx;"
, "}"
, "}"
, ""
, "vec3 col = pow(vec3(inten.r, (inten.g * 0.5), inten.b), 0.5 * vec3(cos(time*5.0)/6.0+0.33)); //pow(base color, glow amount)"
, ""
, "gl_FragColor = vec4(col, 199.0);"
, "}"

].join('\n');function extend (a, b) {
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