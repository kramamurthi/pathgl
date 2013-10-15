var compressor = require('uglify-js')
  , fs = require('fs')
  , source = './src/'
  , orig = fs.readdirSync(source)
           .sort()
           .map(concat)
           .join('')

fs.writeFileSync('pathgl.js', orig)

fs.writeFileSync('pathgl.min.js',
                 compressor.minify(orig, { fromString: true }).code
                )

function concat (file) {
  return '' + fs.readFileSync(source + file)
}