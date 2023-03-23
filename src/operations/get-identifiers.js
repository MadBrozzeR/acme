module.exports = {
  name: 'get-identifiers',

  init: function () {
    const order = this.params.order;

    this.queue.trigger('success', order.domains || {});
  },
  success: function (domains) {
    this.params.callback(domains);

    this.queue.next();
  }
}
