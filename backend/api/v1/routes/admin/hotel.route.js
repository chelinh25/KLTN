const express = require('express');
const multer = require("multer");
const router = express.Router();

const controller = require("../../controllers/admin/hotel.controller");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
const validate = require("../../validates/admin/hotel.validate");
const upload = multer();

router.get("/", controller.index);
router.get("/get-all-tours", controller.getAllTours);
router.get("/:hotelId", controller.indexRoom);
router.post('/create',
    upload.fields([{ name: 'images', maxCount: 10 }]),
    uploadCloud.uploadFields,
    validate.hotelValidate,
    controller.createPost
);
router.post('/create/:hotelId',
    upload.fields([{ name: 'images', maxCount: 10 }]),
    uploadCloud.uploadFields,
    validate.roomValidate,
    controller.createPostRoom
);
router.patch('/edit/:hotelId',
    upload.fields([{ name: 'images', maxCount: 10 }]),
    uploadCloud.uploadFields,
    controller.editHotel
);
router.patch('/edit/:hotelId/:roomId',
    upload.fields([{ name: 'images', maxCount: 10 }]),
    uploadCloud.uploadFields,
    controller.editRoom
);

router.patch("/changeStatus/:status/:hotelId", controller.changeStatus);
router.patch("/changeStatus/:status/:hotelId/:roomId", controller.changeStatusRoom);
router.delete("/delete/:hotelId", controller.deleteHotel);
router.delete("/delete/:hotelId/:roomId", controller.deleteRoom);
router.get("/detail/:hotelId", controller.detail);
router.patch("/stockRoom/:stock/:hotelId/:roomId", controller.stock);
module.exports = router;