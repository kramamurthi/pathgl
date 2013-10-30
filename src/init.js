var canvas
function init(c) {
  canvas = c
  ctx = initContext(canvas)
  initShaders()
  override(canvas)
  d3.select(canvas).on('mousemove.pathgl', mousemoved)
  d3.timer(run_loop)
  return ctx ? canvas : null
}

function mousemoved() {
  //set scene hover here
  var m = d3.mouse(this)
  pathgl.mouse = [m[0] / innerWidth, m[1] / innerHeight]
}

function run_loop(elapsed) {
  if (canvas.__rerender__ || pathgl.forceRerender)
    ctx.uniform1f(program.time, pathgl.time = elapsed / 1000),
    pathgl.mouse && ctx.uniform2fv(program.mouse, pathgl.mouse),
    canvas.__scene__.forEach(drawPath)
  canvas.__rerender__ = false
  }

function override(canvas) {
  return extend(canvas,
                { appendChild: svgDomProxy
                , querySelectorAll: querySelectorAll
                , querySelector: querySelector
                , __scene__: []
                , __pos__: []
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

  each(pathgl.shaderParameters, bindUniform)

  program.vertexPosition = ctx.getAttribLocation(program, "aVertexPosition")
  ctx.enableVertexAttribArray(program.vertexPosition)

  program.uPMatrix = ctx.getUniformLocation(program, "uPMatrix")
  ctx.uniformMatrix4fv(program.uPMatrix, 0, projection(0, innerWidth / 2, 0, 500, -1, 1))
}

function bindUniform(val, key) {
  program[key] = ctx.getUniformLocation(program, key)
  if (val) ctx['uniform' + val.length + 'fv'](program[key], val)
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