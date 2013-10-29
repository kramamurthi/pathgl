pathgl
======
This is a function that lets you control webgl with d3.

#usage
```
var selector = pathgl('canvas') || 'svg'
d3.select(selector).append('circle')
.attr('r', 100)
.attr('cx',50)
.attr('cy',50)
```
if webgl is available then your circles will be WEBGL, if not, fallback to svg.
It just werks.

Alternatively:
```
d3.select('#youaremycanvasandiloveyou').call(pathgl)
.append('circle')
```

### TODO ###
fill: tesselate shapes into triangles 
transform: translate

* Make parser comply with spec

* stroke
  * thickness
  * dasharray
  * length
  * opacity
  * color

* fill
  * pattern
  * gradient + shaders
  * color
  * opacity

* antialiasing
* event listeners
