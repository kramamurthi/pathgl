function svgDomProxy(el) {
  var proxy = extend(Object.create(svgDomProxy.prototype), {
    tagName: el.tagName
  , id: id++
  , attr: { stroke: 'black' }
  })

  scene.push(proxy)
  return proxy
}

function querySelector(query) {
  return scene[0]
}
function querySelectorAll(query) {
  return scene
}

svgDomProxy.prototype =
    { fill: function (val) {

      }

    , d: function (d) {
        this.path && extend(this.path, { coords: [], length: 0 })

        if (d.match(/NaN/)) return console.warn('path is invalid')

        parse.call(this, d)
      }

    , stroke: function (d) {
        render()
      }

    , 'stroke-width': function (value) {
        ctx.lineWidth(value)
      }

    , getAttribute: function (name) {
        return this.attr[name]
      }

    , setAttribute: function (name, value) {
        this.attr[name] = value
        this[name](value)
      }

    , removeAttribute: function (name) {
        this.attr[name] = null
      }

    , textContent: noop
    , removeEventListener: noop
    , addEventListener: noop
    }
