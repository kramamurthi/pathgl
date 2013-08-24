var get = document.querySelector.bind(document)
  , canvas = get('canvas')
  , svg = get('svg')

  , width = canvas.height = svg.style.height = 500
  , height = canvas.width = svg.style.width = innerWidth * .499

function appendPath(d) {
  var path = document.createElement('path')
  svg.appendChild(path)
  path.d = d
}

var tests = [ 'm 0 0 l 10 10 60 60 70 400 z'
            , 'm 50 60 l 60 50 50 60 40 50 50 40 60 50 z'
            ].map(function (d) { return d.toUpperCase() })

function draw(d) {
  d3.select('svg').append('path')
  .attr('d', d)
  .attr('stroke', '#333')
  .attr('fill', 'none')
}

var path = pathgl.init()

tests.forEach(draw)
tests.forEach(function (d, i) {
  path
  .stroke([.5, Math.random(), Math.random()])
  .draw(d)
})
