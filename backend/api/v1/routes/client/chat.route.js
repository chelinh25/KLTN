const express = require('express');
const router = express.Router();

const controller = require("../../controllers/client/chat.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

router.get('/', authMiddleware.requireAuth, controller.getChatHistory);
router.post('/', authMiddleware.optionalAuth, controller.getChatResponse);
router.patch('/clear', authMiddleware.requireAuth, controller.clearChat);

module.exports = router;