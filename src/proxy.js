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
