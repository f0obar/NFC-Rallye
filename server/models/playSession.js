var mongoose = require('mongoose');

var PlaySessionSchema = new mongoose.Schema({
    lastUpdated: Date,
    locationsToVisit: [String],
    locationCount: Number,
    task: String, // won, solveRiddle, findLocation
    riddleID: String,
    locationID: String
});

module.exports = mongoose.model('PlaySession', PlaySessionSchema);