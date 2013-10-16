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

  try {
    fs.writeFileSync('dist/pathgl.js', orig)
    fs.writeFileSync('dist/pathgl.min.js',
                     compressor.minify(orig, { fromString: true }).code
                    )
  } catch (e) { console.log(e) }

}


function concat (file) {
  return '' + fs.readFileSync(source + file)
}


function emacs(file) {
  return ! /#/.test(file)
}