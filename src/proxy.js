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

svgDomProxy.prototype =
    { fill: function (val) {
        drawPolygon(this.path.coords)
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

function drawPolygon(points) {
  var itemSize = 3
  var numItems = points.length / itemSize
  ctx.clear(ctx.COLOR_BUFFER_BIT);
  points = points.map(function (d) { return parseInt(d, 0) }).filter(function (d) { return d })
  var posBuffer = ctx.createBuffer()
  //debugger
  console.log(points)
  ctx.bindBuffer(ctx.ARRAY_BUFFER, posBuffer)
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(points), ctx.STATIC_DRAW)
  ctx.vertexAttribPointer(program.vertexPositionLoc, itemSize, ctx.FLOAT, false, 0, 0)

  ctx.drawArrays(ctx.TRIANGLE_FAN, 0, numItems)
}