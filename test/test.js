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

svg.selectAll('path').data(data).enter().append('path')
.attr('d', function (d) { return d })
.attr('stroke', '#333')
.attr('fill', 'none')

var fills = data.map(function () { return [1, 1, 1].map(Math.random) })

canvas.datum(data).call(pathgl.stroke(function (d, i) { return fills[i] }))
