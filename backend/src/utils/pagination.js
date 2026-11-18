export function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 100, defaultSortBy = 'createdAt', defaultSortOrder = 'desc', allowedSortFields = [] } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  let sortBy = typeof query.sortBy === 'string' && query.sortBy.trim() ? query.sortBy.trim() : defaultSortBy;
  if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort, sortBy, sortOrder: sortOrder === 1 ? 'asc' : 'desc' };
}

export function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
