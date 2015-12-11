var mongoose = require('mongoose');

var LocationSchema   = new mongoose.Schema({
    name: String,
    description: String,
    isActive: {type: Boolean, default: false},
    image: Object,
    heat: {type: Number,default: 0}
});

module.exports = mongoose.model('Location', LocationSchema);