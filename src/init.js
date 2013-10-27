function init(canvas) {
  initContext(canvas)
  initShaders(ctx)
  override(canvas)
  return ctx
}

function override(canvas) {
  return extend(canvas,
                { appendChild: svgDomProxy
                , querySelectorAll: querySelectorAll
                , querySelector: querySelector
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
    , resolution: [innerWidth, innerHeight]
  }

  each(shaderParameters, bindUniform)

  program.vertexPositionLoc = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPositionLoc)

  program.pMatrixLoc = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.pMatrixLoc, 0, pmatrix)
 }

function bindUniform(val, key) {
  program[key] = ctx.getUniformLocation(program, key)
  console.log(key, val.length)
  if (val) ctx['uniform' + val.length  +  'fv'](program[key], val)
}

function initContext(canvas) {
  canv = canvas
  ctx = canvas.getContext('webgl')
  if (! ctx) return
  ctx.viewportWidth = canvas.width
  ctx.viewportHeight = canvas.height
}


function each(obj, fn) {
  for(var key in obj) fn(obj[key], key, obj)
}