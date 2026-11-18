import { Department } from '../modules/departments/department.model.js';
import { Employee } from '../modules/employees/employee.model.js';

/**
 * Returns all Employee ObjectIds that a Manager is authorized to oversee:
 * 1) Direct reports (employee.managerId === managerEmployeeId)
 * 2) Members of departments managed by this manager (department.managerId === managerEmployeeId)
 */
export async function getManagedEmployeeIds(managerEmployeeId) {
  if (!managerEmployeeId) return [];

  const managedDepts = await Department.find({ managerId: managerEmployeeId }).select('_id').lean();
  const managedDeptIds = managedDepts.map((d) => d._id);

  const query = {
    $or: [{ managerId: managerEmployeeId }],
  };
  if (managedDeptIds.length > 0) {
    query.$or.push({ departmentId: { $in: managedDeptIds } });
  }

  const teamEmployees = await Employee.find(query).select('_id').lean();
  const idSet = new Set(teamEmployees.map((e) => String(e._id)));
  idSet.delete(String(managerEmployeeId));
  return Array.from(idSet);
}

/**
 * Checks whether the current actor (req.user + req.employee) can access a target employee's record.
 */
export async function canAccessEmployee(actorUser, actorEmployee, targetEmployeeId) {
  if (!actorUser || !targetEmployeeId) return false;
  if (actorUser.role === 'admin') return true;
  if (actorEmployee && String(actorEmployee._id) === String(targetEmployeeId)) return true;

  if (actorUser.role === 'manager' && actorEmployee) {
    const managedIds = await getManagedEmployeeIds(actorEmployee._id);
    return managedIds.includes(String(targetEmployeeId));
  }

  return false;
}
