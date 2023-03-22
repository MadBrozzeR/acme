const { PEM } = require('mbr-pem');
const { createKeyPair, getCSR, extractPublicKey, privateKeyToPEM } = require("../crypting.js");
const { useFile, base64url, parseResponse, updateOrderFields } = require("../utils.js");
const { STATUS } = require('../constants.js');
const { handleError } = require('./common.js');

module.exports = {
  init: function () {
    const { order } = this.params;
    const queue = this.queue;
    this.data = {};

    order.getStatus()
      .then(function (status) {
        switch (status) {
          case STATUS.READY:
            queue.trigger('keys');
            break;
          case STATUS.VALID:
            queue.trigger('success');
            break;
          case STATUS.INVALID:
            throw new Error('The certificate will not be issued. Consider this order process abandoned.');
          case STATUS.PENDING:
            throw new Error('The server does not believe that the client has fulfilled the requirements.  Check the "authorizations" array for entries that are still pending.');
        }
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });

  },
  keys: function () {
    const { order, keyLength, key } = this.params;
    const file = order.account.getCacheFiles().keys;
    const queue = this.queue;

    if (key) {
      const keys = {
        privateKey: privateKeyToPEM(key),
      };
      keys.publicKey = extractPublicKey(keys.privateKey);

      queue.trigger('csr', keys);
    } else {
      createKeyPair({ file, keyLength })
        .then(function (keys) {
          queue.trigger('csr', keys);
        })
        .catch(function (error) {
          queue.trigger('error', error);
        });
    }
  },
  csr: function (keys) {
    this.data.keys = keys;
    const queue = this.queue;
    const { fields, order } = this.params;
    const domains = Object.keys(order.domains);
    const file = order.account.getCacheFiles().csr;

    useFile(function () {
      const csr = getCSR({ commonName: fields.commonName, san: domains }, keys);

      return csr.toString();
    }, file, { format: 'text' })
      .then(function (csr) {
        queue.trigger('request', csr);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  request: function (csrPlain) {
    const { order } = this.params;
    const api = order.account.api;
    const file = order.account.getCacheFiles().finalize;
    const csr = PEM.parse(csrPlain)[0].readDER();
    const queue = this.queue;

    useFile(function () {
      return api.request(order.finalizeUrl, { csr: base64url(csr.raw) })
        .then(parseResponse)
        .then(function (response) {
          if (response.status < 300) {
            return response;
          }

          throw new api.ResponseError(response);
        });
    }, file)
      .then(function (response) {
        updateOrderFields(order, response);
        queue.trigger('success', response);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  error: handleError,
  success: function (response) {
    this.params.order.keys = this.data.keys;
    this.params.resolve(this.params.order);

    this.queue.next();
  }
}
