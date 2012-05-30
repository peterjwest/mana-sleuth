module.exports = function(pageSize, totalItems, current) {
  var pager = {
    pageSize: pageSize,
    totalItems: totalItems,
    current: current
  };

  pager.totalPages = function() {
    return Math.ceil(pager.totalItems / pager.pageSize);
  };

  pager.pagination = function() {
    var variation = 2;
    var lastPage = pager.totalPages();
    var width = 3 + 2 * variation;
    var distanceFrom = {start: pager.current - 1, end: lastPage - pager.current};
    var ellipsis = {
      start: lastPage > width + 2 && distanceFrom.start > 2 + variation,
      end: lastPage > width + 2 && distanceFrom.end > 2 + variation
    };
    var before = ellipsis.start ? pager.current - variation - Math.max(2 + variation - distanceFrom.end, 0) : 1;
    var after = ellipsis.end ? pager.current + variation + Math.max(2 + variation - distanceFrom.start, 0) : lastPage;

    var pages = [];
    pages.push({name: "Prev", number: pager.current - 1, disabled: pager.current == 1});
    if (ellipsis.start) {
      pages.push({name: 1, number: 1});
      pages.push({name: "...", disabled: true});
    }
    for (var i = before; i <= after; i++) {
      pages.push({name: i, number: i, active: i == pager.current});
    }
    if (ellipsis.end) {
      if (pager.current < lastPage - 2 - variation) pages.push({name: "...", disabled: true});
      pages.push({name: lastPage, number: lastPage});
    }
    pages.push({name: "Next", disabled: pager.current == lastPage, number: pager.current + 1});
    return pages;
  };

  return pager;
};