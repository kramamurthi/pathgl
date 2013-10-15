var svgDomProxy =
    { fill: function (val) {

      }

    , d: function (d) {
        parse.call(this, d)
      }

    , stroke: function (d) {
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
  console.log(name)
  return extend(Object.create(svgDomProxy), {
    attr: {},
    tagName: el.tagName
  })
}