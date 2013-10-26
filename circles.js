var w = innerWidth
  , h = innerHeight

var data = d3.range(1e3).map(function (d) { return [ Math.random() * w
                                                   , Math.random() * h ] })

var c = d3.select(pathgl('canvas'))
        .attr('height', h)
        .attr('width', w)
        .selectAll('circle').data(data).enter().append('circle')
        .attr('cx', function (d) { return d[0] })
        .attr('cy', function (d) { return d[1] })
        .attr('r', 15)
        .attr('fill', random_color)

function random_color() { return '#' + Math.floor(Math.random() * 0xffffff).toString(16) }