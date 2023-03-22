module.exports.handleError = function handleError (error) {
  if (this.params.reject instanceof Function) {
    this.params.reject(error);
  } else if (this.data.account.handlers.error instanceof Function) {
    this.data.account.handlers.error(error);
  }

  this.queue.clear();
  this.queue.next();

  throw error;
}
