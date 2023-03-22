const { createKeyPair, getJWSAuth } = require('../crypting.js');
const { handleError } = require('./common.js');

module.exports = {
  init: function () {
    const queue = this.queue;
    const params = this.params;
    const { account } = queue.data;

    createKeyPair(params)
      .then(function (keys) {
        if (!keys.privateKey) {
          queue.trigger('error', new Error('Private key is required'))
        } else {
          queue.trigger('success', keys.privateKey);
        }
      })
      .catch(function (error) {
        queue.triger('error', error);
      });
  },
  error: handleError,
  success: function (key) {
    this.queue.data.account.setup({ key: key });

    this.queue.next();
  }
}
