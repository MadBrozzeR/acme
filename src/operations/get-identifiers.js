module.exports = {
  name: 'get-identifiers',

  init: function () {
    const order = this.params.order;

    this.queue.trigger('success', order.domains || {});
  },
  success: function (domains) {
    this.params.resolve(domains);

    this.queue.next();
  }
}
