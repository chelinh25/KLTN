const Hotel = require("../../models/hotel.model");
const Room = require("../../models/room.model");

// [GET]/api/v1/hotels
module.exports.index = async (req, res) => {
    const hotels = await Hotel.find({
        status: 'active',
        deleted: false
    });
    res.json(hotels);
};

// [GET]/api/v1/hotels/:hotelId
module.exports.detailHotel = async (req, res) => {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findOne({
        _id: hotelId,
        deleted: false
    });

    const rooms = await Room.find({
        hotel_id: hotelId
    });
    res.json({
        code: 200,
        hotel: hotel,
        rooms: rooms
    });
};

// [GET]/api/v1/hotels/:hotelId/:roomId
module.exports.detailRoom = async (req, res) => {
    const hotelId = req.params.hotelId;
    const roomId = req.params.roomId;

    const room = await Room.findOne({
        _id: roomId,
        hotel_id: hotelId
    });
    res.json({
        code: 200,
        room: room
    });
};

// [GET]/api/v1/hotels/by-tour/:tourId
module.exports.getHotelsByTour = async (req, res) => {
    try {
        const tourId = req.params.tourId;
        const hotels = await Hotel.find({
            tour_id: tourId,
            status: 'active',
            deleted: false
        });
        
        // Lấy thông tin phòng cho mỗi khách sạn
        const hotelsWithRooms = await Promise.all(
            hotels.map(async (hotel) => {
                const rooms = await Room.find({
                    hotel_id: hotel._id
                });
                return {
                    ...hotel.toObject(),
                    rooms: rooms
                };
            })
        );

        res.json({
            code: 200,
            message: "Danh sách khách sạn theo tour",
            data: hotelsWithRooms
        });
    } catch (error) {
        res.json({
            code: 500,
            message: "Error: " + error.message
        });
    }
};