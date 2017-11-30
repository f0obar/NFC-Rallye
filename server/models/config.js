const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  _id: String,
  value: {type: String, required: true}
});

const Model = mongoose.model('Config', ConfigSchema);

async function set(key, value) {
  console.log('invoking setter');
  await Model.findOneAndUpdate({_id: key}, {value: value}, {upsert: true}).exec();
}

async function get(key) {
  console.log('invoking getter');
  const result = await Model.findById(key).exec();
  return result ? result.value : ""
}

async function getLoginData() {
  const result = await Model.find({_id: {$in: ['username', 'password']}}).exec();
  const dataObject = {};
  result.forEach(function (field) {
    dataObject[field._id] = field.value;
  });
  return dataObject;
}

module.exports = {
  set: set,
  get: get,
  getLoginData: getLoginData
};

