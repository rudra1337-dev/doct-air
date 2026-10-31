import { Router } from 'express';
import { getProfile, updateProfile } from './user.controller.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
