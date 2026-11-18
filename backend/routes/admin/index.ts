/**
 * Everything under /api/admin. The JWT gate is applied once here, so a new
 * admin router can't be added without it.
 */
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import contentRouter from './content';
import chroniclesRouter from './chronicles';
import passagesRouter from './passages';
import mediaRouter from './media';
import uploadRouter from './upload';

const router = Router();
router.use(authMiddleware);

router.use('/upload', uploadRouter);
router.use(contentRouter);
router.use(chroniclesRouter);
router.use(passagesRouter);
router.use(mediaRouter);

export default router;
