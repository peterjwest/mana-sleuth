const { map } = require('lodash');

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

  req.route.data = { ...req.query, ...data };

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

  const query = map(route.data, (value, name) => name + "=" + String(value).replace(/\s/g, "+")).join("&");
  if (query) url += "?" + query;

  return url;
};

router.url = function(route, params) {
  return router.encode({route, data: { ...route.data, ...params }});
};

module.exports = router;
