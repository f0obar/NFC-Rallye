function UserException(message, suggestion) {
  this.message = message;
  this.suggestion = suggestion;
}

module.exports = UserException;