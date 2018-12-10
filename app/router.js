const util = require('../util/util.js');

const router = {};

router.routes = {
  '': ['query', 'page']
};

router.decode = function(req, res, next) {
  req.route = {name: req.params[0] || ""};
  const params = (req.params[1] || "").split("/");
  const data = {};

  (router.routes[req.route.name] || []).map(function(arg, i) {
    if (params[i]) data[arg] = params[i];
  });

  req.route.data = util.merge(req.query, data);

  next();
};

router.encode = function(route) {
  let url = '/'+route.name;
  (router.routes[route.route] || []).map(function(arg) {
    if (route.data[arg]) {
      url += '/'+route.data[arg];
      delete route.data[arg];
    }
  });

  const query = util.dehash(route.data, function(value, name) { return name+"="+util.cast("string", value).replace(/\s/g, "+"); }).join("&");
  if (query) url += "?" + query;

  return url;
};

router.url = function(route, params) {
  const data = util.merge(route.data, params);
  return router.encode(route, data);
};

module.exports = router;
