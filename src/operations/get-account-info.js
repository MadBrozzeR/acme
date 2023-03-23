const { useFile, parseResponseErrorHandled } = require('../utils.js');
const { handleError } = require('./common.js');

module.exports = {
  name: 'get-account-info',

  init: function () {
    const queue = this.queue;
    const account = this.queue.data.account;
    const file = account.getCacheFiles().accountInfo;

    if (!account.api.kid) {
      queue.trigger('error', new Error('No account reference (KID) found. Should register account first'));
    }

    useFile(function () {
      return account.api.request(account.api.kid)
        .then(parseResponseErrorHandled);
    }, file)
      .then(function (response) {
        queue.trigger('success', response.data);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      })
  },

  error: handleError,
  success: function (info) {
    this.params.resolve(info);
    this.queue.next();
  }
}
