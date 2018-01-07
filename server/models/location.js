const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  description: String,
  isActive: {type: Boolean, default: false},
  image: Object,
  lat: {type: Number, default: 49.1226},
  lng: {type: Number, default: 9.211},
  lvl: {type: Number, default: 0},
  heat: {type: Number, default: 0}
});

/** @class Location */
const Location = mongoose.model('Location', LocationSchema);

module.exports = Location;