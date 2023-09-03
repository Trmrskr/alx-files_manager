import express from 'express';
import AppController from '../controllers/AppController';
/**
 * App controller module
 */

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

export default router;
