const { useFile, parseResponse } = require("../utils.js");
const { handleError } = require('./common.js');

module.exports = {
  name: 'register-account',

  init: function () {
    const queue = this.queue;
    const account = queue.data.account;
    const file = account.getCacheFiles().account;
    const api = account.api;

    useFile(function () {
      return api.accountRequest({ email: account.options.email })
        .then(parseResponse)
        .then(function (response) {
          if (response.status < 300) {
            return response;
          }

          throw new api.ResponseError(response.data);
        })
    }, file)
      .then(function (response) {
        queue.trigger('success', response);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  error: handleError,
  success: function (response) {
    const queue = this.queue;

    if (!response.headers.location) {
      queue.trigger('error', new Error('Required Location header is missing in response. Can\'t continue.'));

      return;
    }

    const account = queue.data.account;

    account.orders = response.data.orders || '';
    account.api.setKID(response.headers.location);

    queue.next();
  }
}
