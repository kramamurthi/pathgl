function pathgl(canvas) {
  return init('string' == typeof canvas ? d3.select(canvas).node() :
              canvas instanceof d3.selection ? canvas.node() :
              canvas
             )
}

var ctx

this.pathgl = pathgl
