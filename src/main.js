function pathgl(canvas, svg) {
  init(d3.select(canvas).node())
  return ctx ? canvas : svg
}

var id = 0
  , scene = [] //array of objects
  , pos = [] //current subpath position

  , pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1) //ortho

  , canv, ctx, program
  , r, g, b // shader params
  , rerender

this.pathgl = pathgl
