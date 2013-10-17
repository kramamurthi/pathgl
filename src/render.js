//make data[] on canvas the array of proxies
function addToBuffer(datum) {
  var k = paths.filter(function (d) { return d.id == datum.id })

  if (k.length) return k[0]
  paths.push(datum.path = [])

  return extend(datum.path, { coords: [], id: datum.id })
}

function addLine(x1, y1, x2, y2) {
  var index = this.push(ctx.createBuffer()) - 1
  var vertices = [x1, y1, 0, x2, y2, 0]
  ctx.bindBuffer(ctx.ARRAY_BUFFER, this[index])
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW)

  this[index].itemSize = 3
  this[index].numItems = vertices.length / 3
}

function render(datum) {
  //ctx.clear(ctx.COLOR_BUFFER_BIT)
  for (var i = 0; i < datum.path.length; i++)
    d3.queue(enclose,
             datum.path[i],
             datum.attr.stroke || 'black'
            )
}

function setStroke (rgb){
  ctx.uniform1f(r, rgb.r / 256)
  ctx.uniform1f(g, rgb.g / 256)
  ctx.uniform1f(b, rgb.b / 256)
}

//move to render
function enclose(buffer, rgb){
  setStroke(d3.rgb(rgb))
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
  ctx.vertexAttribPointer(program.vertexPositionLoc, buffer.itemSize, ctx.FLOAT, false, 0, 0)
  ctx.drawArrays(ctx.LINE_STRIP, 0, buffer.numItems)
}
