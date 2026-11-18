import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as feedbackService from './feedback.service.js';

export const create = asyncHandler(async (req, res) => {
  const fb = await feedbackService.createFeedback({
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: fb, message: 'Feedback submitted' });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await feedbackService.listFeedback({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});
