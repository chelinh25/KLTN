const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);
const TourSchema = new mongoose.Schema({
    title: String,
    code: String,
    images: Array,
    price: Number,
    discount: Number,
    information: String,
    schedule: String,
    timeStarts: [
        {
            timeDepart: Date,
            stock: Number,
        }
    ],
    category_id: {
        type: String,
        default: ""
    },
    sold: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    gathering: String,
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    status: {
        type: String,
        default: "active"
    },
    slug: {
        type: String,
        slug: "title",
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });
const Tour = mongoose.model('Tour', TourSchema, "tours");
module.exports = Tour;