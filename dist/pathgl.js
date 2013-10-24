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

  rgb = ctx.getUniformLocation(program, 'rgb')

  if (! ctx.getProgramParameter(program, ctx.LINK_STATUS)) return console.error("Shader is broken")

  ctx.useProgram(program)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
}

function initContext(canvas) {
  canv = canvas


  ctx = canvas.getContext('webgl', { antialias: false })
  if (! ctx) return
  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
}
function pathgl(canvas, svg) {
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
  this.attr = { stroke: 'black' }
}

function querySelector(query) {
  return scene[0]
}
function querySelectorAll(query) {
  return scene
}

function circle (r, cx, cy) {
  var result = []
  for(var i = 0; i < 2 * 3.14; i++)
    result.push((Math.sin(i) * r) + cx,
                (Math.cos(i) * r) + cy
               )
  return result
}

svgDomProxy.prototype =
    {
      r: function () {}
    , cx: function () {}
    , cy: function () {
        this.path.coords = circle(this.attr.r,
                                  this.attr.cx,
                                  this.attr.cy
                                 )
      }

    , fill: function (val) {
        function integer(d) { return parseInt(d, 10) }
        function identity(d) { return d }
        drawPolygon(this.path.coords
                    .map(function (d) { return d.map(integer).filter(identity) })
                    .filter(function (d) { return d.length == 2 }))
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

var circ = extend(Object.create(svgDomProxy), {
  r: ''
, cx: ''
, cy: ''

})

var path = extend(Object.create(svgDomProxy), {
  d: ''
})

function drawPolygon(points) {
  return
  ctx.uniform4f(shaderProgram.colorLoc, 1.0, 0.0, 0.0, Math.random());
  var itemSize = 3
  var numItems = points.length / itemSize
  //ctx.clear(ctx.COLOR_BUFFER_BIT);
  var posBuffer = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, posBuffer)
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(flat(points)), ctx.STATIC_DRAW)
  ctx.vertexAttribPointer(0, itemSize, ctx.FLOAT, false, 0, 0)

  ctx.drawArrays(ctx.TRIANGLE_FAN, 0, numItems)
}


var flatten = function(input, shallow, output) {
  if (shallow && input.every(Array.isArray)) {
    return [].concat.apply(output, input);
  }
  d3.each(input, function(value) {
    if (Array.isArray(value) || value.toString().match(/Arguments/)) {
      shallow ? [].push.apply(output, value) : flatten(value, shallow, output);
    } else {
      output.push(value);
    }
  });
  return output;
};


function flat (a) {
  return flatten(a, true, [])
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

d3.timer(function () {
  if (rerender)
    ctx.clear(ctx.COLOR_BUFFER_BIT),
    rerender = scene.forEach(drawPath)
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
  ctx.uniform4fv(rgb,
                 [c.r / 256,
                  c.g / 256,
                  c.b / 256,
                  1.0])

}
pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]

pathgl.fragment = [ "precision mediump float;"
                  , "uniform vec4 rgb;"
                  , "void main(void) {"
                  , "  gl_FragColor = rgb;"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);"
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