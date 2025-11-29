const express = require('express');
const router = express.Router();

const controller = require("../../controllers/client/checkout.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");
const validate = require("../../validates/client/cancelOrder.validate");

router.get('/', authMiddleware.requireAuth, controller.index);
router.post('/order', authMiddleware.requireAuth, controller.order);
router.post("/payment/:orderId", authMiddleware.requireAuth, controller.createPayment);
router.get('/verify-payment', controller.verifyPayment);
router.get('/success', controller.paymentCallback);
router.patch('/cancel/:orderId', authMiddleware.requireAuth, validate.cancelOrder, controller.cancel);

module.exports = router;