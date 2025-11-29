const Hotel = require("../../models/hotel.model");
const Room = require("../../models/room.model");
const Tour = require("../../models/tour.model");
const paginationHelper = require("../../helper/pagination");
const { convertToSlug } = require("../../helper/convertToSlug");

// [GET]/api/v1/admin/hotels
module.exports.index = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách khách sạn"
        });
    } else {
        try {
            let find = { deleted: false };

            // Search
            if (req.query.search) {
                const keywordRegex = new RegExp(req.query.search, "i");

                const stringSlug = convertToSlug(req.query.search);
                const stringSlugRegex = new RegExp(stringSlug, "i");
                find.$or = [
                    { name: keywordRegex },
                    { slug: stringSlugRegex }
                ];
            }

            if (req.query.status) {
                find.status = req.query.status;
            };

            // sort
            const sort = {};
            if (req.query.sortKey && req.query.sortValue) {
                sort[req.query.sortKey] = req.query.sortValue;
            }

            // pagination
            const countRecords = await Hotel.countDocuments(find);
            let objPagination = paginationHelper(
                {
                    currentPage: 1,
                    limitItems: 10
                },
                req.query,
                countRecords
            );
            // end pagination

            const hotels = await Hotel.find(find).sort(sort).limit(objPagination.limitItems).skip(objPagination.skip);
            res.json({
                code: 200,
                message: "Danh sách khách sạn",
                data: hotels,
                totalPage: objPagination.totalPage
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error: " + error.message
            });
        }
    }
}

// [GET]/api/v1/admin/hotels/:hotelId
module.exports.indexRoom = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách room của khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const room = await Room.find({
                hotel_id: hotelId
            });
            res.json({
                code: 200,
                message: "Danh sách room của khách sạn",
                data: room
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error: " + error
            });
        }
    }
}

// [POST]/api/v1/admin/hotels/create
module.exports.createPost = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_create")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền tạo khách sạn"
        });
    } else {
        try {
            const hotel = new Hotel(req.body);
            const data = await hotel.save();
            res.json({
                code: 200,
                message: "Tạo thành công",
                data: data
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [POST]/api/v1/admin/hotels/create/:hotelId
module.exports.createPostRoom = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền tạo phòng khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const room = new Room({
                hotel_id: hotelId,
                name: req.body.name,
                price: req.body.price,
                amenities: req.body.amenities,
                availableRooms: parseInt(req.body.availableRooms),
                images: req.body.images
            });
            const data = await room.save();
            res.json({
                code: 200,
                message: "Tạo thành công",
                data: data
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/hotels/edit/:hotelId
module.exports.editHotel = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const updatedHotel = await Hotel.findOneAndUpdate(
                { _id: hotelId, deleted: false },
                req.body,
                { new: true }
            );
            if (!updatedHotel) {
                return res.json({
                    code: 404,
                    message: "Khách sạn không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Cập nhật thành công",
                data: updatedHotel
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/hotels/edit/:hotelId/:roomId
module.exports.editRoom = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền chỉnh sửa phòng khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const roomId = req.params.roomId;
            const updatedRoom = await Room.findOneAndUpdate(
                {
                    _id: roomId,
                    hotel_id: hotelId
                }
                ,
                req.body,
                { new: true }
            );
            if (!updatedRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Cập nhật thành công",
                data: updatedRoom
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/hotels/changeStatus/:status/:hotelId
module.exports.changeStatus = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const status = req.params.status;
            const statusHotel = await Hotel.findOneAndUpdate(
                {
                    _id: hotelId,
                    deleted: false
                }
                ,
                {
                    status: status
                },
                { new: true }
            );

            const statusRoom = await Room.updateMany(
                {
                    hotel_id: hotelId
                }
                ,
                {
                    status: status
                },
                { new: true }
            );
            if (!statusHotel) {
                return res.json({
                    code: 404,
                    message: "Khách sạn không tồn tại hoặc đã bị xoá"
                });
            }

            if (!statusRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Cập nhật thành công",
                statusHotel: statusHotel,
                statusRoom: statusRoom
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/hotels/changeStatus/:status/:hotelId/:roomId
module.exports.changeStatusRoom = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái room khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const roomId = req.params.roomId;
            const status = req.params.status;
            const statusRoom = await Room.findOneAndUpdate(
                {
                    _id: roomId,
                    hotel_id: hotelId
                }
                ,
                {
                    status: status
                },
                { new: true }
            );

            if (!statusRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Cập nhật thành công",
                statusRoom: statusRoom
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [DELETE]/api/v1/admin/hotels/delete/:hotelId
module.exports.deleteHotel = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const dataRoom = await Room.deleteMany(
                {
                    hotel_id: hotelId
                });

            const dataHotel = await Hotel.findOneAndDelete(
                {
                    _id: hotelId,
                    deleted: false
                });
            if (!dataRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }

            if (!dataHotel) {
                return res.json({
                    code: 404,
                    message: "khách sạn không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Xóa thành công",
                dataRoom: dataRoom,
                dataHotel: dataHotel
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [DELETE]/api/v1/admin/hotels/delete/:hotelId/:roomId
module.exports.deleteRoom = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa room khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const roomId = req.params.roomId;
            const dataRoom = await Room.findOneAndDelete(
                {
                    _id: roomId,
                    hotel_id: hotelId
                });


            if (!dataRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }

            res.json({
                code: 200,
                message: "Xóa thành công",
                dataRoom: dataRoom,
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [GET]/api/v1/admin/hotels/detail/:hotelId
module.exports.detail = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem chi tiết khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const dataHotel = await Hotel.findOne(
                {
                    _id: hotelId,
                    deleted: false
                });

            const dataRoom = await Room.findOne(
                {
                    hotel_id: hotelId,
                });
            if (!dataHotel) {
                return res.json({
                    code: 404,
                    message: "Khách sạn không tồn tại hoặc đã bị xoá"
                });
            }

            if (!dataRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Xóa thành công",
                dataHotel: dataHotel,
                dataRoom: dataRoom
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/hotels/stockRoom/:stock/:hotelId/:roomId
module.exports.stock = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái room khách sạn"
        });
    } else {
        try {
            const hotelId = req.params.hotelId;
            const roomId = req.params.roomId;
            const stock = parseInt(req.params.stock);
            const stockRoom = await Room.findOneAndUpdate(
                {
                    _id: roomId,
                    hotel_id: hotelId
                }
                ,
                {
                    availableRooms: stock
                },
                { new: true }
            );

            if (!stockRoom) {
                return res.json({
                    code: 404,
                    message: "Room không tồn tại hoặc đã bị xoá"
                });
            }
            res.json({
                code: 200,
                message: "Cập nhật thành công",
                stockRoom: stockRoom
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error:" + error
            });
        }
    }
};

// [GET]/api/v1/admin/hotels/get-all-tours
module.exports.getAllTours = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("hotel_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách tour"
        });
    } else {
        try {
            const tours = await Tour.find({ 
                deleted: false,
                status: "active"
            }).select('_id title code');
            
            res.json({
                code: 200,
                message: "Danh sách tour",
                data: tours
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Error: " + error.message
            });
        }
    }
};