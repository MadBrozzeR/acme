const { createKeyPair, getJWSAuth } = require('../crypting.js');

module.exports = {
  init: function () {
    const queue = this.queue;
    const params = this.params;

    this.data = {};

    createKeyPair(params)
      .then(function (keys) {
        if (!keys.privateKey) {
          queue.trigger('error', new Error('Private key is required'))
        } else {
          queue.trigger('jws', keys);
        }
      })
      .catch(function (error) {
        queue.triger('error', error);
      });
  },
  error: function (error) {
    this.queue.clear();

    throw error;
  },
  success: function (jws) {
    const account = this.queue.data.account;
    const keys = this.data.keys;

    account.privateKey = keys.privateKey;
    account.publicKey = keys.publicKey;
    account.jws = jws;
    account.api.setKey(keys.privateKey);
    account.api.setJWK(jws);

    this.queue.next();
  },
  jws: function (keys) {
    const queue = this.queue;
    this.data.keys = keys;

    getJWSAuth(keys)
      .then(function (jws) {
        queue.trigger('success', jws);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  }
}
