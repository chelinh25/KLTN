const express = require('express');
const router = express.Router();

const controller = require("../../controllers/admin/order.controller");

router.get('/export-excel', controller.exportExcel);
router.get('/export-pdf', controller.exportPDF);
router.get('/statistics', controller.statistics);
router.get('/', controller.index);
router.patch('/changeStatus/:status/:id', controller.changeStatus);
router.patch('/reFundStatus/:id', controller.reFundStatus);
router.get('/detail/:id', controller.detail);
router.delete('/delete/:id', controller.delete);

module.exports = router;