var methods = { m: moveTo
              , z: closePath
              , l: lineTo

              , h: horizontalLine
              , v: verticalLine
              , c: curveTo
              , s: shortCurveTo
              , q: quadraticBezier
              , t: smoothQuadraticBezier
              , a: elipticalArc
              }


function horizontalLine() {}
function verticalLine() {}
function curveTo() {}
function shortCurveTo() {}
function quadraticBezier() {}
function smoothQuadraticBezier () {}
function elipticalArc(){}

function parse (str) {
  var path = addToBuffer(this)

  if (path.length) return render()

  str.match(/[a-z][^a-z]*/ig).forEach(function (segment, i, wow) {
    var instruction = methods[segment[0].toLowerCase()]
      , coords = segment.slice(1).trim().split(/,| /g)

    ;[].push.apply(path.coords, coords)
    if (instruction.name == 'closePath' && wow[i+1]) instruction.call(path, wow[i+1])


    instruction.call ?
      twoEach(coords, instruction, path) :
      console.error(instruction + ' ' + segment[0] + ' is not yet implemented')
  })
}

function moveTo(x, y) {
  pos = [x, canv.height - y]
}
var subpathStart
function closePath(next) {
  subpathStart = pos
  lineTo.apply(this, /m/i.test(next) ?
               next.slice(1).trim().split(/,| /g)
                   : this.coords.slice(0, 2)
              )
}


function lineTo(x, y) {
  addLine.apply(this, pos.concat(pos = [x, canv.height - y]))
}
