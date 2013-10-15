pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]

var pmatrix = projection(0, innerWidth / 2, 0, 500, -1, 1)
  , paths = []

  , canv, ctx, program, pos
  , r, g, b
  , lineBuffers
  , red, green, blue

pathgl.fragment = [ "precision mediump float;"
                  , "uniform float r, g, b;"
                  , "void main(void) {"
                  , "  gl_FragColor = vec4(r, g, b, 1.0);"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);"
                , "}"
                ].join('\n')
