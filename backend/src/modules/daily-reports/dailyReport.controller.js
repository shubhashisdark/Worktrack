import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as dailyReportService from './dailyReport.service.js';

export const create = asyncHandler(async (req, res) => {
  const report = await dailyReportService.createOrUpdateDailyReport({
    payload: req.body,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { statusCode: 201, data: report, message: 'Daily report saved' });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await dailyReportService.listDailyReports({
    query: req.query,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const report = await dailyReportService.getDailyReportById({
    reportId: req.params.id,
    actorUser: req.user,
    actorEmployee: req.employee,
  });
  return sendSuccess(res, { data: report });
});

export const addNote = asyncHandler(async (req, res) => {
  const report = await dailyReportService.addManagerNote({
    reportId: req.params.id,
    managerNote: req.body.managerNote,
    actorUser: req.user,
    actorEmployee: req.employee,
    ipAddress: req.ip,
  });
  return sendSuccess(res, { data: report, message: 'Manager note saved' });
});
