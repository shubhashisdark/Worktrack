export function sendSuccess(res, { data = null, message, meta, statusCode = 200 } = {}) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function sendError(res, { statusCode = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong', details } = {}) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(statusCode).json({ success: false, error });
}
