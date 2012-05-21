var router = exports;

router.domain = 'http://gatherer.wizards.com';
router.paths = {
  advanced: '/Pages/Advanced.aspx?',
  cards: '/Pages/Search/Default.aspx?',
  details: '/Pages/Card/Details.aspx?',
  original: '/Pages/Card/Details.aspx?printed=true&',
  printings: '/Pages/Card/Printings.aspx?',
  image: '/Handlers/Image.ashx?'
};

router.cards = function(expansion) {
  var params = 'output=checklist&set=|['+encodeURIComponent('"'+expansion+'"')+']';
  return router.domain + router.paths.cards+params;
};

router.card = function(id, part) {
  return router.domain + router.paths['details'] + 'multiverseid=' + id + (part ? '&part='+part : '');
};

router.printings = function(id) {
  return router.domain + router.paths['printings'] + 'multiverseid=' + id;
};

router.image = function(id, part) {
  return router.domain + router.paths['image'] + 'type=card&multiverseid=' + id + (part ? '&part='+part : '');
};

router.categories = function() {
  return router.domain + router.paths.advanced;
};