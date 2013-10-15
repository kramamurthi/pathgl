var svgDomProxy =
    { fill: function (val) {

      }

    , d: function (d) {
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

function dom(el) {
  return extend(Object.create(svgDomProxy), {
    attr: {},
    tagName: el.tagName
  })
}