module.exports = function(util) {
  var router = {};

  router.routes = {
    cards: ['query', 'page']
  };

  router.decode = function(req, res, next) {
    req.route = {name: req.params[0] || ""};
    var params = (req.params[1] || "").split("/");
    var data = {};

    (router.routes[req.route.name] || []).map(function(arg, i) {
      if (params[i]) data[arg] = params[i];
    });

    req.route.data = util.merge(req.query, data);

    next();
  };

  router.encode = function(route) {
    var url = '/'+route.name;
    (router.routes[route.route] || []).map(function(arg) {
      if (route.data[arg]) {
        url += '/'+route.data[arg];
        delete route.data[arg];
      }
    });

    var query = util.dehash(route.data, function(value, name) { return name+"="+util.cast("string", value).replace(/\s/g, "+"); }).join("&");
    if (query) url += "?" + query;

    return url;
  };

  router.url = function(route, params) {
    var data = util.merge(route.data, params);
    return router.encode(route, data);
  };

  return router;
};
