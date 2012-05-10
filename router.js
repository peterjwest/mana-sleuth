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
  var urls = {};
  ['details', 'printings'].map(function(type) {
    //var imageType = (type == 'image' ? '&type=card' : '');
    var queryString = 'multiverseid=' + id + (part ? '&part='+part : '');
    urls[type] = router.domain + router.paths[type] + queryString;
  });
  return urls;
};

router.categories = function() {
  return router.domain + router.paths.advanced;
};