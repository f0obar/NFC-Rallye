const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlaySessionSchema = new Schema({
  lastUpdated: Date,
  groupName: {type: String, unique: true},
  password: String,
  token: {type: String, unique: true},
  startDate: Date,
  endDate: Date,
  points: {type: Number, default: 0},
  locationsToVisit: [String],
  locationCount: Number,
  solvedRiddles: [{type: Schema.Types.ObjectId, ref: 'SolvedRiddle'}],
  task: String, // won, solveRiddle, findLocation
  riddle: {type: Schema.Types.ObjectId, ref: 'Riddle'},
  location: {type: Schema.Types.ObjectId, ref: 'Location'},
  image: Object
});

/** @class PlaySession */
const PlaySession = mongoose.model('PlaySession', PlaySessionSchema);

module.exports = PlaySession;