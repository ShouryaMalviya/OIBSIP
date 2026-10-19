import { Router } from 'express';
import * as pricingController from '../controllers/pricing.controller.js';

const router = Router();

router.post('/calculate-custom', pricingController.calculateCustomPrice);

export default router;
