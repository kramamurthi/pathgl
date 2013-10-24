pathgl.supportedAttributes =
  [ 'd'
  , 'stroke'
  , 'strokeWidth'
  ]

pathgl.fragment = [ "precision mediump float;"
                  , "uniform vec4 rgb;"
                  , "void main(void) {"
                  , "  gl_FragColor = rgb;"
                  , "}"
                  ].join('\n')

pathgl.vertex = [ "attribute vec3 aVertexPosition;"
                , "uniform mat4 uPMatrix;"
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);"
                , "}"
                ].join('\n')
