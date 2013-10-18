function pathgl(canvas, svg) {
  init(d3.select(canvas).node())
  return ctx ? canvas : svg
}

var id = 0
  , scene = []
  , pos = []

  , pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1)
  
  , canv, ctx, program
  , r, g, b

this.pathgl = pathgl
