var canvas = d3.select('canvas')
  , svg = d3.select('svg')
  , dim = { height: 500, width: innerWidth * .499 }

canvas.attr(dim)
svg.style(dim)

var data = [ 'm 0 0 l 10 10 60 60 70 400 z'
           , 'm 50 60 l 60 50 50 60 40 50 50 40 60 50 z'
           ].map(function (d) { return d.toUpperCase() })

svg.selectAll('path').data(data).enter().append('path')
.attr('d', function (d) { return d })
.attr('stroke', '#333')
.attr('fill', 'none')

canvas.datum(data).call(pathgl)