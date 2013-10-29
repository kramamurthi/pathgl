pathgl.initShaders = initShaders

function init(canvas) {
  ctx = initContext(canvas)
  initShaders()
  override(canvas)
  d3.select(canvas).on('mousemove', function () { pathgl.mouse = d3.mouse(this) })
  d3.timer(function (elapsed) {
    if (canvas.__rerender__ || pathgl.forceRerender)
      ctx.uniform1f(program.time, pathgl.time = elapsed / 1000),
      pathgl.mouse && ctx.uniform2fv(program.mouse, pathgl.mouse),
      canvas.__scene__.forEach(drawPath)
  })
  return ctx
}

function override(canvas) {
  return extend(canvas,
                { appendChild: svgDomProxy
                , querySelectorAll: querySelectorAll
                , querySelector: querySelector
                , __scene__: []
                , __pos__: []
                , __ctx__: void 0
                , __program__: void 0
                , __id__: 0
                })
}

function compileShader (type, src) {
  var shader = ctx.createShader(type)
  ctx.shaderSource(shader, src)
  ctx.compileShader(shader)
  if (! ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(shader))
  return shader
}

function initShaders() {
  var vertexShader = compileShader(ctx.VERTEX_SHADER, pathgl.vertex)
  var fragmentShader = compileShader(ctx.FRAGMENT_SHADER, pathgl.fragment)
  program = ctx.createProgram()
  ctx.attachShader(program, vertexShader)
  ctx.attachShader(program, fragmentShader)

  ctx.linkProgram(program)
  ctx.useProgram(program)

  if (! ctx.getProgramParameter(program, ctx.LINK_STATUS)) return console.error("Shader is broken")

  var shaderParameters = {
      rgb: [0,0,0, 0]
    //, uPmatrix: pmatrix
    , xyz: [0,0,0]
    , time: [0]
    , resolution: [ innerWidth, innerHeight ]
    , mouse: pathgl.mouse = [0, 0]
  }

  each(shaderParameters, bindUniform)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, projection(0, innerWidth / 2, 0, 500, -1, 1))
 }

function bindUniform(val, key) {
  program[key] = ctx.getUniformLocation(program, key)
  if (val) ctx['uniform' + val.length  +  'fv'](program[key], val)
}

function initContext(canvas) {
  var ctx = canvas.getContext('webgl')
  if (! ctx) return
  ctx.viewportWidth = canvas.width || innerWidth
  ctx.viewportHeight = canvas.height || innerHeight
  return ctx
}


function each(obj, fn) {
  for(var key in obj) fn(obj[key], key, obj)
}