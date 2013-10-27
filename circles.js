var w = innerWidth
  , h = innerHeight

pathgl.forceRerender = true

d3.select('canvas').attr('height', innerHeight).attr('width', innerWidth)

var data = d3.range(1e3).map(function (d) { return [ Math.random() * w / 2
                                                   , Math.random() * h  / 2] })

var c = d3.select(pathgl('canvas'))
        .attr('height', h)
        .attr('width', w)
        .selectAll('circle').data(data).enter().append('circle')
        .attr('cx', function (d) { return d[0] })
        .attr('cy', function (d) { return d[1] })
        .attr('r', function () { return Math.random() * 10 + 5 })
        .attr('fill', 'red')

function random_color() { return '#' + Math.floor(Math.random() * 0xffffff).toString(16) }

d3.select('canvas').on('click', function () {
  c.transition().duration(1000)
  .attr('cx', function (){ return Math.random() * innerWidth})
  .attr('cy', function (){ return Math.random() * innerHeight})
})
