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
