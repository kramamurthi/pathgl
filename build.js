var compressor = require('uglify-js')
  , fs = require('fs')
  , source = './src/'

build()
fs.watch('src', build)


function build(_, file) {
  var orig = fs.readdirSync(source)
             .filter(emacs)
             .sort()
             .map(concat)
             .join('')
    , safe = '+ function() {' + orig + ' }()'

  console.log('rebuilding ' + (file ? file : ''))

  fs.writeFileSync('pathgl.js', orig)

  fs.writeFileSync('pathgl.min.js',
                   compressor.minify(orig, { fromString: true }).code
                  )
}


function concat (file) {
  return '' + fs.readFileSync(source + file)
}


function emacs(file) {
  return ! /#/.test(file)
}