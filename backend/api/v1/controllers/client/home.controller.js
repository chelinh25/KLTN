const Tour = require("../../models/tour.model");
const Hotel = require("../../models/hotel.model");
const Review = require("../../models/hotelReview.model");
const Order = require("../../models/order.model");

// [GET]/api/v1/
module.exports.index = async (req, res) => {
    // top tours
    const topSallers = await Tour.find({
        status: "active",
        deleted: false
    }).sort({ sold: "desc" }).limit(5);

    // featured tours
    const newTours = await Tour.find({
        status: "active",
        deleted: false,
        featured: true
    }).sort({ createdAt: -1 }).limit(5);

    // top hotels
    const topHotelSallers = await Hotel.find({
        status: "active",
        deleted: false
    }).sort({ sold: "desc" }).limit(5);

    // top star hotels
    const hotels = await Hotel.find({
        status: "active",
        deleted: false
    });

    const hotelWithRating = [];

    for (const item of hotels) {
        const reviews = await Review.find({ hotel_id: item._id });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;

            hotelWithRating.push({
                hotel: item,
                averageRating
            });
        } else {
            hotelWithRating.push({
                hotel: item,
                averageRating: null
            });
        }
    }

    const topRatedHotels = hotelWithRating
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Order.deleteMany({
        status: "pending",
        createdAt: { $lt: fifteenMinutesAgo }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Tour.updateMany(
        {},
        {
            $pull: {
                timeStarts: {
                    timeDepart: { $lt: today }
                }
            }
        }
    );

    res.json({
        topSallers: topSallers,
        newTours: newTours,
        topHotelSallers: topHotelSallers,
        topRatedHotels: topRatedHotels
    });
};