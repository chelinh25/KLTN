const Order = require("../../models/order.model");
const paginationHelper = require("../../helper/pagination");
const Tour = require("../../models/tour.model");
const Hotel = require("../../models/hotel.model");
const Room = require("../../models/room.model");
const tourHelper = require("../../helper/tours");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// [GET]/api/v1/admin/orders
module.exports.index = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem danh sách đơn hàng"
        });
    } else {
        let find = {};

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            find.$or = [
                { orderCode: searchRegex }
            ];
        }

        if (req.query.startDate || req.query.endDate) {
            find.createdAt = {};
            if (req.query.startDate) {
                find.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setDate(end.getDate() + 1);
                find.createdAt.$lt = end;
            }
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
        const countRecords = await Order.countDocuments(find);
        let objPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems: 10
            },
            req.query,
            countRecords
        );
        // end pagination

        const orders = await Order.find(find).sort(sort).limit(objPagination.limitItems).skip(objPagination.skip);

        res.json({
            orders: orders,
            totalPage: objPagination.totalPage
        });
    }
};

// [PATCH]/api/v1/admin/orders/changeStatus/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái đơn hàng"
        });
    } else {
        try {
            const status = req.params.status;
            const id = req.params.id;

            await Order.updateOne({
                _id: id
            }, {
                status: status
            });

            res.json({
                code: 200,
                message: "Cập nhật trạng thái thành công!"
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Có lỗi " + error
            });
        }
    }
};

// [GET]/api/v1/admin/orders/detail/:id
module.exports.detail = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem chi tiết đơn hàng"
        });
    } else {
        const id = req.params.id;
        const order = await Order.findOne({
            _id: id
        });
        const tours = [];
        for (const item of order.tours) {
            const tourInfo = await Tour.findOne({
                _id: item.tour_id
            });
            tours.push({
                tourInfo: tourInfo,
                quantity: item.quantity,
                priceNew: tourHelper.priceNewTour(tourInfo)
            });
        }

        const hotels = [];
        for (const item of order.hotels) {
            const hotelInfo = await Hotel.findOne({
                _id: item.hotel_id
            });
            const rooms = [];
            for (const room of item.rooms) {
                const roomInfo = await Room.findOne({
                    _id: room.room_id
                });
                rooms.push({
                    roomInfo: roomInfo,
                    quantity: room.quantity,
                    checkIn: room.checkIn,
                    checkOut: room.checkOut,
                    price: room.price
                });
            }
            hotels.push({
                hotelInfo: hotelInfo,
                rooms: rooms
            });
        } res.json({
            code: 200,
            message: "Lấy thông tin đơn hàng thành công!",
            data: {
                order: order,
                tours: tours,
                hotels: hotels
            }
        });
    }
};

// [DELETE]/api/v1/admin/orders/delete/:id
module.exports.delete = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_delete")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xóa đơn hàng"
        });
    } else {
        try {
            const id = req.params.id;
            await Order.deleteOne({
                _id: id
            });

            res.json({
                code: 200,
                message: "Xóa đơn hàng thành công!"
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Lỗi" + error
            });
        }
    }
};

// [PATCH]/api/v1/admin/orders/reFundStatus/:id
module.exports.reFundStatus = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_edit")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền cập nhật trạng thái đơn hàng"
        });
    } else {
        try {
            const id = req.params.id;

            await Order.updateOne({
                _id: id,
                status: "cancelled"
            }, {
                status: "refund"
            });

            res.json({
                code: 200,
                message: "Cập nhật trạng thái thành công!"
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Có lỗi " + error
            });
        }
    }
};

// [GET]/api/v1/admin/orders/statistics
module.exports.statistics = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xem thống kê đơn hàng"
        });
    } else {
        try {
            let find = {};

            // Filter by status
            if (req.query.status) {
                find.status = req.query.status;
            }

            // Filter by date range
            if (req.query.startDate || req.query.endDate) {
                find.createdAt = {};
                if (req.query.startDate) {
                    find.createdAt.$gte = new Date(req.query.startDate);
                }
                if (req.query.endDate) {
                    const end = new Date(req.query.endDate);
                    end.setDate(end.getDate() + 1);
                    find.createdAt.$lt = end;
                }
            }

            // Filter by year and month
            if (req.query.year) {
                const year = parseInt(req.query.year);
                const startOfYear = new Date(year, 0, 1);
                const endOfYear = new Date(year + 1, 0, 1);
                
                find.createdAt = find.createdAt || {};
                find.createdAt.$gte = startOfYear;
                find.createdAt.$lt = endOfYear;

                if (req.query.month) {
                    const month = parseInt(req.query.month);
                    const startOfMonth = new Date(year, month - 1, 1);
                    const endOfMonth = new Date(year, month, 1);
                    
                    find.createdAt.$gte = startOfMonth;
                    find.createdAt.$lt = endOfMonth;
                }
            }

            // Get all matching orders without pagination
            const orders = await Order.find(find);

            // Process statistics
            const statistics = {};

            orders.forEach((order) => {
                const date = new Date(order.createdAt);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                const key = `${month}/${year}`;

                if (!statistics[key]) {
                    statistics[key] = {
                        month: `${month}/${year}`,
                        tours: 0,
                        hotels: 0,
                        totalPrice: 0,
                        tourRevenue: 0,
                        hotelRevenue: 0,
                    };
                }

                if (order.tours && order.tours.length > 0) {
                    order.tours.forEach((tour) => {
                        const stock = tour.timeStarts && tour.timeStarts.length > 0 ? tour.timeStarts[0].stock || 0 : 0;
                        statistics[key].tours += stock;
                        statistics[key].tourRevenue += (tour.price || 0) * stock;
                    });
                }

                if (order.hotels && order.hotels.length > 0) {
                    order.hotels.forEach((hotel) => {
                        if (hotel.rooms && hotel.rooms.length > 0) {
                            hotel.rooms.forEach((room) => {
                                statistics[key].hotels += room.quantity || 0;
                                statistics[key].hotelRevenue += (room.price || 0) * (room.quantity || 0);
                            });
                        }
                    });
                }

                statistics[key].totalPrice = statistics[key].tourRevenue + statistics[key].hotelRevenue;
            });

            const result = Object.values(statistics).sort((a, b) => {
                const [monthA, yearA] = a.month.split("/");
                const [monthB, yearB] = b.month.split("/");
                return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
            });

            res.json({
                code: 200,
                message: "Lấy dữ liệu thống kê thành công!",
                data: result,
                totalItems: result.length,
            });
        } catch (error) {
            res.json({
                code: 500,
                message: "Có lỗi " + error
            });
        }
    }
};

// [GET]/api/v1/admin/orders/export-excel
module.exports.exportExcel = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xuất báo cáo"
        });
    }

    try {
        let find = { status: "paid" };

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            find.createdAt = {};
            if (req.query.startDate) {
                find.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setDate(end.getDate() + 1);
                find.createdAt.$lt = end;
            }
        }

        // Filter by year and month
        if (req.query.year) {
            const year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            
            find.createdAt = find.createdAt || {};
            find.createdAt.$gte = startOfYear;
            find.createdAt.$lt = endOfYear;

            if (req.query.month) {
                const month = parseInt(req.query.month);
                const startOfMonth = new Date(year, month - 1, 1);
                const endOfMonth = new Date(year, month, 1);
                
                find.createdAt.$gte = startOfMonth;
                find.createdAt.$lt = endOfMonth;
            }
        }

        const orders = await Order.find(find).sort({ createdAt: -1 });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Báo cáo doanh thu');

        // Add headers
        worksheet.columns = [
            { header: 'Thời gian', key: 'date', width: 20 },
            { header: 'Mã đơn hàng', key: 'orderCode', width: 20 },
            { header: 'Loại', key: 'type', width: 15 },
            { header: 'Tên sản phẩm', key: 'name', width: 40 },
            { header: 'Số lượng', key: 'quantity', width: 12 },
            { header: 'Giá (VNĐ)', key: 'price', width: 18 },
            { header: 'Tổng tiền (VNĐ)', key: 'total', width: 18 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add data
        for (const order of orders) {
            const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
            
            // Add tour items
            if (order.tours && order.tours.length > 0) {
                for (const tour of order.tours) {
                    const tourInfo = await Tour.findOne({ _id: tour.tour_id });
                    const stock = tour.timeStarts && tour.timeStarts.length > 0 ? tour.timeStarts[0].stock || 0 : 0;
                    const price = tour.price || 0;
                    const total = price * stock;
                    
                    worksheet.addRow({
                        date: orderDate,
                        orderCode: order.orderCode,
                        type: 'Tour',
                        name: tourInfo ? tourInfo.title : 'N/A',
                        quantity: stock,
                        price: price,
                        total: total
                    });
                }
            }

            // Add hotel items
            if (order.hotels && order.hotels.length > 0) {
                for (const hotel of order.hotels) {
                    const hotelInfo = await Hotel.findOne({ _id: hotel.hotel_id });
                    
                    if (hotel.rooms && hotel.rooms.length > 0) {
                        for (const room of hotel.rooms) {
                            const roomInfo = await Room.findOne({ _id: room.room_id });
                            const quantity = room.quantity || 0;
                            const price = room.price || 0;
                            const total = price * quantity;
                            
                            worksheet.addRow({
                                date: orderDate,
                                orderCode: order.orderCode,
                                type: 'Hotel',
                                name: hotelInfo ? `${hotelInfo.name} - ${roomInfo ? roomInfo.name : 'N/A'}` : 'N/A',
                                quantity: quantity,
                                price: price,
                                total: total
                            });
                        }
                    }
                }
            }
        }

        // Format number columns
        worksheet.getColumn('price').numFmt = '#,##0';
        worksheet.getColumn('total').numFmt = '#,##0';

        // Generate filename based on filters
        let filename = 'bao-cao-doanh-thu';
        if (req.query.year) {
            filename += `-${req.query.year}`;
            if (req.query.month) {
                filename += `-thang${req.query.month}`;
            }
        } else if (req.query.startDate && req.query.endDate) {
            const start = new Date(req.query.startDate);
            const end = new Date(req.query.endDate);
            filename += `-${start.toLocaleDateString('vi-VN').replace(/\//g, '-')}-den-${end.toLocaleDateString('vi-VN').replace(/\//g, '-')}`;
        } else {
            filename += `-${Date.now()}`;
        }
        filename += '.xlsx';

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Lỗi xuất Excel:", error);
        res.status(500).json({
            code: 500,
            message: "Có lỗi khi xuất báo cáo: " + error.message
        });
    }
};

// [GET]/api/v1/admin/orders/export-pdf
module.exports.exportPDF = async (req, res) => {
    const permissions = req.roles.permissions;
    if (!permissions.includes("order_view")) {
        return res.json({
            code: 400,
            message: "Bạn không có quyền xuất báo cáo"
        });
    }

    try {
        let find = { status: "paid" };

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            find.createdAt = {};
            if (req.query.startDate) {
                find.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setDate(end.getDate() + 1);
                find.createdAt.$lt = end;
            }
        }

        // Filter by year and month
        if (req.query.year) {
            const year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            
            find.createdAt = find.createdAt || {};
            find.createdAt.$gte = startOfYear;
            find.createdAt.$lt = endOfYear;

            if (req.query.month) {
                const month = parseInt(req.query.month);
                const startOfMonth = new Date(year, month - 1, 1);
                const endOfMonth = new Date(year, month, 1);
                
                find.createdAt.$gte = startOfMonth;
                find.createdAt.$lt = endOfMonth;
            }
        }

        const orders = await Order.find(find).sort({ createdAt: -1 });

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Generate filename based on filters
        let filename = 'bao-cao-doanh-thu';
        if (req.query.year) {
            filename += `-${req.query.year}`;
            if (req.query.month) {
                filename += `-thang${req.query.month}`;
            }
        } else if (req.query.startDate && req.query.endDate) {
            const start = new Date(req.query.startDate);
            const end = new Date(req.query.endDate);
            filename += `-${start.toLocaleDateString('vi-VN').replace(/\//g, '-')}-den-${end.toLocaleDateString('vi-VN').replace(/\//g, '-')}`;
        } else {
            filename += `-${Date.now()}`;
        }
        filename += '.pdf';

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
        );

        doc.pipe(res);

        // Add Unicode font support (using built-in Courier for simplicity)
        doc.font('Courier');

        // Title
        doc.fontSize(18).text('BAO CAO DOANH THU', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
        doc.moveDown(2);

        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 120;
        const col3 = 180;
        const col4 = 250;
        const col5 = 350;
        const col6 = 410;
        const col7 = 480;

        doc.fontSize(8);
        doc.font('Courier-Bold');
        doc.text('Thoi gian', col1, tableTop);
        doc.text('Ma don', col2, tableTop);
        doc.text('Loai', col3, tableTop);
        doc.text('Ten', col4, tableTop);
        doc.text('SL', col5, tableTop);
        doc.text('Gia', col6, tableTop);
        doc.text('Tong', col7, tableTop);
        
        doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 20;
        doc.font('Courier');

        // Add data
        for (const order of orders) {
            const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
            
            // Add tour items
            if (order.tours && order.tours.length > 0) {
                for (const tour of order.tours) {
                    const tourInfo = await Tour.findOne({ _id: tour.tour_id });
                    const stock = tour.timeStarts && tour.timeStarts.length > 0 ? tour.timeStarts[0].stock || 0 : 0;
                    const price = tour.price || 0;
                    const total = price * stock;
                    
                    if (y > 750) {
                        doc.addPage();
                        y = 50;
                    }
                    
                    doc.text(orderDate.substring(0, 10), col1, y, { width: 65 });
                    doc.text(order.orderCode.substring(0, 10), col2, y, { width: 55 });
                    doc.text('Tour', col3, y, { width: 65 });
                    doc.text(tourInfo ? tourInfo.title.substring(0, 20) : 'N/A', col4, y, { width: 95 });
                    doc.text(stock.toString(), col5, y, { width: 55 });
                    doc.text((price / 1000).toFixed(0) + 'K', col6, y, { width: 65 });
                    doc.text((total / 1000).toFixed(0) + 'K', col7, y, { width: 65 });
                    
                    y += 20;
                }
            }

            // Add hotel items
            if (order.hotels && order.hotels.length > 0) {
                for (const hotel of order.hotels) {
                    const hotelInfo = await Hotel.findOne({ _id: hotel.hotel_id });
                    
                    if (hotel.rooms && hotel.rooms.length > 0) {
                        for (const room of hotel.rooms) {
                            const roomInfo = await Room.findOne({ _id: room.room_id });
                            const quantity = room.quantity || 0;
                            const price = room.price || 0;
                            const total = price * quantity;
                            
                            if (y > 750) {
                                doc.addPage();
                                y = 50;
                            }
                            
                            doc.text(orderDate.substring(0, 10), col1, y, { width: 65 });
                            doc.text(order.orderCode.substring(0, 10), col2, y, { width: 55 });
                            doc.text('Hotel', col3, y, { width: 65 });
                            const hotelName = hotelInfo ? hotelInfo.name : 'N/A';
                            doc.text(hotelName.substring(0, 20), col4, y, { width: 95 });
                            doc.text(quantity.toString(), col5, y, { width: 55 });
                            doc.text((price / 1000).toFixed(0) + 'K', col6, y, { width: 65 });
                            doc.text((total / 1000).toFixed(0) + 'K', col7, y, { width: 65 });
                            
                            y += 20;
                        }
                    }
                }
            }
        }

        doc.end();

    } catch (error) {
        console.error("Lỗi xuất PDF:", error);
        res.status(500).json({
            code: 500,
            message: "Có lỗi khi xuất báo cáo: " + error.message
        });
    }
};