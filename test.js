var canvas = d3.select('canvas')
  , svg = d3.select('svg')
  , dim = { height: 500, width: innerWidth * .499 }

canvas.attr(dim)
svg.style(dim)

var data = [ 'm 0 0 l 10 10 60 60 70 400 z'
           , 'm 50 60 l 60 50 50 60 40 50 50 40 60 50 z'

           , 'M 536.9357503463519 310L554.2562584220407'
           + ' 320L554.2562584220407 340L536.9357503463519 '
           + '350L519.6152422706631 340L519.6152422706631 320Z'
           ].map(function (d) { return d.toUpperCase() })

var strokes = ['red', 'blue', 'green']
var svgPath = svg.style('background', '#333').selectAll('path').data(data).enter().append('path')

svgPath.attr('d', function (d) { return d })
.attr('stroke-width', 5)
.attr('stroke', stroke)
.attr('fill', 'none')
.transition().duration(1000)
.each('end', function k(el, i) {
  if (i != svgPath.size() - 1) return
  strokes = rando()
  svgPath.transition().duration(1500).delay(500).attr('stroke', stroke)
  .each('end', k)
})

var gl = pathgl.stroke(stroke)
canvas.datum(data)
.call(gl)
.transition().duration(1000)
.each('end', function k(selection) {
  canvas.call(gl).transition().duration(1500).delay(500).call(gl.stroke(stroke))
  .each('end', k)
})

function stroke(d, i) {
  return strokes[i]
}

function rando() {
  return data.map(function () { return '#' + Math.floor(Math.random() * 0xffffff).toString(16) })
}