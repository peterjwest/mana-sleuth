module.exports = function(itemsPerPage, totalItems, current) {
  const pager = {
    itemsPerPage: parseInt(itemsPerPage),
    totalItems: parseInt(totalItems),
    current: parseInt(current),
    totalPages: Math.ceil(totalItems / itemsPerPage),
    pages: []
  };

  const variation = 1;
  const withArrows = pager.totalPages > (2 * variation + 3);
  const before = Math.min(Math.max(pager.current - variation, 2), pager.totalPages - 1 - 2 * variation);
  const after = before + 2 * variation;

  if (withArrows) {
    pager.pages.push({name: 1, number: 1, active: pager.current == 1});
    pager.pages.push({number: Math.max(pager.current - 1, 1), left: true, disabled: pager.current == 1});
    for (let i = before; i <= after; i++) {
      pager.pages.push({name: i, number: i, active: i == pager.current});
    }
    pager.pages.push({number: Math.min(pager.current + 1, pager.totalPages), right: true, disabled: pager.current == pager.totalPages});
    pager.pages.push({name: pager.totalPages, number: pager.totalPages, active: pager.current == pager.totalPages});
  }
  else {
    for (let i = 1; i <= pager.totalPages; i++) {
      pager.pages.push({name: i, number: i, active: i == pager.current});
    }
  }

  return pager;
};
