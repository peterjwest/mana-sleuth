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
    var before = Math.max(pager.current - (pager.current <= 5 ? variation + 2 : variation), 1);
    var after = Math.min(pager.current + (pager.current <= 5 ? variation + 5 - pager.current : variation), lastPage);
    var pages = [];
    pages.push({name: "Prev", disabled: pager.current == 1});
    if (before > 1) {
      pages.push({name: 1, active: false});
    }
    if (before > 2) {
      pages.push({name: "...", disabled: true})
    }
    for (var i = before; i <= after; i++) {
      pages.push({name: i, active: i == pager.current});
    }
    if (after < lastPage - 1) {
      pages.push({name: "...", disabled: true})
    }
    if (after < lastPage) {
      pages.push({name: lastPage, active: false});
    }
    pages.push({name: "Next", disabled: pager.current == lastPage});
    return pages;
  };

  return pager;
};