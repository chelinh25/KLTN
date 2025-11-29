const express = require('express');
const router = express.Router();

const controller = require("../../controllers/client/hotel.controller");

router.get('/', controller.index);
router.get('/by-tour/:tourId', controller.getHotelsByTour);
router.get('/:hotelId', controller.detailHotel);
router.get('/:hotelId/:roomId', controller.detailRoom);

module.exports = router;