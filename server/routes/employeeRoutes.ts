import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController.js';

const router = Router();

router.get('/employees', EmployeeController.getAll);
router.post('/employees', EmployeeController.create);
router.post('/employees/login', EmployeeController.userLogin);
router.patch('/employees/:id/password', EmployeeController.updatePassword);
router.delete('/employees/:id', EmployeeController.delete);
router.get('/employees/:id', EmployeeController.getById);
router.get('/departments', EmployeeController.getDepartments);
router.post('/seed', EmployeeController.reseed);
router.post('/clear-all', EmployeeController.clearAll);
router.post('/admin/login', EmployeeController.adminLogin);

export default router;
