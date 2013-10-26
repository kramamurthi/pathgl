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
                , "uniform vec3 xyz;"
                , "void main(void) {"
                , "  gl_Position = uPMatrix * vec4(xyz + aVertexPosition, 1.0);"
                , "}"
                ].join('\n')



pathgl.fragment = [
  "precision mediump float;"
, "uniform vec4 rgb;"
, 'void main(void) {'

, 'float time = 100.0;'
, 'vec2 position = gl_FragCoord.xy / vec2(1000, 500);'
, 'float color = 0.0;'

, 'color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + sin( position.y * tan( time / 15.0 ) * 10.0 );'
, 'color += sin( position.y * tan( time / 10.0 ) * 40.0 ) + sin( position.x * sin( time / 25.0 ) * 40.0 );'
, 'color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );'
, 'color *= sin( time / 10.0 ) * 0.5;'
, 'gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + cos(time / 3.0) ) * 0.75 ), 1.0 );'
, '}'
].join('\n');