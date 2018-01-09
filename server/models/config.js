const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  _id: String,
  value: {type: String, required: true}
});

const Config = mongoose.model('Config', ConfigSchema);

async function set(key, value) {
  console.log('invoking setter for', key, ":", value);
  await Config.findOneAndUpdate({_id: key}, {value: value}, {upsert: true});
}

async function get(key) {
  console.log('invoking getter for', key);
  const result = await Config.findById(key).exec();
  return result ? result.value : ""
}

async function getLoginData() {
  const result = await Config.find({_id: {$in: ['username', 'password']}});
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

