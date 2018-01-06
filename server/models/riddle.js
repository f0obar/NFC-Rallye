const mongoose = require('mongoose');

const RiddleSchema = new mongoose.Schema({
  name: String,
  image: Object,
  code: String,
  description: String,
  answer: String,
  choices: [String],
  hint: String,
  location: {type: mongoose.Schema.Types.ObjectId, ref: 'Location'},
  heat: Number,
  isActive: {type: Boolean, default: true}
});

/** @class Riddle */
const Riddle = mongoose.model('Riddle', RiddleSchema);

module.exports = Riddle;