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
    var lastPage = pager.totalPages();
    var before = Math.max(pager.current - 2, 1);
    var after = Math.min(pager.current + 2, lastPage);
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