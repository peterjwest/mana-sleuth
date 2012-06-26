module.exports = function(request, cheerio, util) {
  var gatherer = {};
  gatherer.router = require('./router.js');
  gatherer.scraper = require('./scraper.js')(gatherer.router, request, cheerio, util);
  return gatherer;
};
