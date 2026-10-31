import { Router } from 'express';
import {
  getNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  deleteNotificationHandler,
} from './notification.controller.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', getNotificationsHandler);
router.patch('/:id/read', markNotificationReadHandler);
router.patch('/mark-all-read', markAllNotificationsReadHandler);
router.patch('/read-all', markAllNotificationsReadHandler); // Backward compatibility
router.delete('/:id', deleteNotificationHandler);

export default router;
