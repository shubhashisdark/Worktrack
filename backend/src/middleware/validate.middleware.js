import { AppError } from '../utils/AppError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    return next();
  };
}
