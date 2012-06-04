module.exports = function(itemsPerPage, totalItems, current) {
  var pager = {
    itemsPerPage: itemsPerPage,
    totalItems: totalItems,
    current: current,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    pages: []
  };

  var variation = 1;
  var width = 5 + 2 * variation;
  var distanceFrom = {start: pager.current - 1, end: pager.totalPages - pager.current};
  var withArrows = pager.totalPages > (2 * variation + 3);
  var before = Math.min(Math.max(pager.current - variation, 2), pager.totalPages - 1 - 2 * variation);
  var after = before + 2 * variation;

  if (withArrows) {
    pager.pages.push({name: 1, number: 1, active: pager.current == 1});
    pager.pages.push({number: Math.max(pager.current - 1, 1), left: true, disabled: pager.current == 1});
    for (var i = before; i <= after; i++) {
      pager.pages.push({name: i, number: i, active: i == pager.current});
    }
    pager.pages.push({number: pager.current + 1, right: true, disabled: pager.current == pager.totalPages});
    pager.pages.push({name: pager.totalPages, number: pager.totalPages, active: pager.current == pager.totalPages});
  }
  else {
    for (var i = 1; i <= pager.totalPages; i++) {
      pager.pages.push({name: i, number: i, active: i == pager.current});
    }
  }

  return pager;
};