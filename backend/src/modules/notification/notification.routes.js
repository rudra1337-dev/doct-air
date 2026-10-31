import { Router } from 'express';
import {
  getNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
} from './notification.controller.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', getNotificationsHandler);
router.patch('/:id/read', markNotificationReadHandler);
router.patch('/read-all', markAllNotificationsReadHandler);

export default router;
