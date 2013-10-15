function addToBuffer(datum) {
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

function render(t) {
  ctx.clear(ctx.COLOR_BUFFER_BIT)
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
  for (var j = 0; j < paths.length; j++)
    for (var i = 0; i < paths[j].length; i++)
      d3.queue(enclose.bind(null,
                            paths[j][i],
                            d3.rgb('white')
                           ))
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

;