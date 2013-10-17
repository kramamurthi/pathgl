//make data[] on canvas the array of proxies
function addToBuffer(datum) {
  var k = paths.filter(function (d) { return d.id == datum.id })
  if (k.length) return k[0]

  paths.push(datum.path = [])

  return extend(paths[paths.length - 1], datum, { coords: [] })
}

function addLine(x1, y1, x2, y2) {
  var index = this.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]
  ctx.bindBuffer(ctx.ARRAY_BUFFER, this[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  this[index].itemSize = 3
  this[index].numItems = vertices.length / 3
}

var changed
d3.timer(function () {
  if (! changed) return; else changed = false
  for (var j = 0; j < paths.length; j++){
    setStroke(d3.rgb(paths[j].attr.stroke || '#000'))
    for (var i = 0; i < paths[j].length; i++) {
      enclose(paths[j][i])
    }
  }
})

function render(t) {
  //ctx.clear(ctx.COLOR_BUFFER_BIT)
  changed = true
}

function setStroke (rgb){
  ctx.uniform1f(r, rgb.r / 256)
  ctx.uniform1f(g, rgb.g / 256)
  ctx.uniform1f(b, rgb.b / 256)
}

function enclose(buffer, rgb){
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer )
  ctx.vertexAttribPointer(program.vertexPositionLoc, buffer.itemSize, ctx.FLOAT, false, 0, 0)
  ctx.drawArrays(ctx.LINE_STRIP, 0, buffer.numItems)
}

;