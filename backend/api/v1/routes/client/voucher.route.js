const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/voucher.controller");

router.get("/check/:code", controller.checkVoucher);
router.get("/", controller.getAllVouchers);

module.exports = router;
