module.exports = function(itemsPerPage, totalItems, current) {
  var pager = {
    itemsPerPage: itemsPerPage,
    totalItems: totalItems,
    current: current,
    pages: Math.ceil(totalItems / itemsPerPage)
  };

  pager.pagination = function() {
    var variation = 1;
    var width = 5 + 2 * variation;
    var distanceFrom = {start: pager.current - 1, end: pager.pages - pager.current};
    var ellipsis = {
      start: pager.pages > width && distanceFrom.start > 2 + variation,
      end: pager.pages > width && distanceFrom.end > 2 + variation
    };
    var before = ellipsis.start ? pager.current - variation - Math.max(2 + variation - distanceFrom.end, 0) : 1;
    var after = ellipsis.end ? pager.current + variation + Math.max(2 + variation - distanceFrom.start, 0) : pager.pages;

    var pages = [];
    if (ellipsis.start) {
      pages.push({name: 1, number: 1});
      pages.push({name: "...", disabled: true});
    }
    for (var i = before; i <= after; i++) {
      pages.push({name: i, number: i, active: i == pager.current});
    }
    if (ellipsis.end) {
      if (pager.current < pager.pages - 2 - variation) pages.push({name: "...", disabled: true});
      pages.push({name: pager.pages, number: pager.pages});
    }
    return pages;
  };

  return pager;
};