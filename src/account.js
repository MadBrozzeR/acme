const { PEM } = require('mbr-pem');
const { NetQueue } = require('mbr-queue');
const { ApiRequest } = require('./api.js');
const { CHALLENGE } = require('./constants.js');
const { createKeyPair, getThumb, privateKeyToPEM } = require('./crypting.js');
const createAccountOperation = require('./operations/create-account.js');
const registerAccountOperation = require('./operations/register-account.js');
const getAccountInfoOperation = require('./operations/get-account-info.js');
const { Order } = require('./order.js');

const queueHandlers = {
  error: function (error) {
    const account = this.data.account;
    account.handlers.error && account.handlers.error.call(account, error);
  },
  end: function (data) {
    const account = this.data.account;
    account.handlers.success && account.handlers.success.call(account, data);
  },
}

function Account (options = {}) {
  const account = this;
  this.options;
  this.privateKey;
  this.api = new ApiRequest();
  this.orders = '';
  this.handlers = {};

  this.queue = new NetQueue().on(queueHandlers);
  this.queue.data = {
    account: this
  }

  this.setup(options);
}

Account.prototype.create = function (params) {
  if (!this.privateKey) {
    this.queue.push(createAccountOperation, params);
  }

  this.queue.push(registerAccountOperation);

  return this;
}

/**
 * Set account options
 * @param {string} [email] - cache data to disk for debug puposes;
 * @param {object} [cache] - cache data to disk for debug puposes;
 * @param {string} [cache.account] - account register response;
 * @param {string} [cache.order] - order creation response;
 * @param {string} [cache.challenges] - requested challenges response;
 * @param {string} [cache.csr] - generated csr file;
 * @param {string} [cache.finalize] - finalization response;
 * @param {string} [cache.keys] - generated keys;
 * @param {string} [cache.certificate] - certificate received from CA;
 */
Account.prototype.setup = function (options = {}) {
  this.options = this.options ? {
    ...this.options,
    ...options,
  } : options;

  const key = options.key && privateKeyToPEM(options.key);

  options.api && this.api.setAPI(options.api);
  key && (this.privateKey = key) && this.api.setKey(key);

  return this;
}
Account.prototype.createOrder = function (domains, params) {
  return new Order(this, domains, params);
}
Account.prototype.getThumbprint = function () {
  if (this.thumb) {
    return this.thumb;
  }

  return this.thumb = getThumb(this.api.jwk);
}

Account.create = function (params, options) {
  return new Account(options).create(params);
}
/**
 * Complete certificate issue request.
 * @param {string | string[]} domains - domain and subdomain list;
 * @param {string} [challengeType] - challenge tipe, like 'http-01' or 'dns-01' (default 'http-01');
 * @param {string} [orderKey] - provide private key for order or create new key pair otherwise;
 * @param {object} csrFields - field list to include in certificate request;
 * @param {string} csrFields.commonName - common came in csr;
 * @param { (challenges) => Promise<void> } validation - function to be called when challenges
 *  are ready; returned Promise should be resolved when CA can validate domains.
 */
Account.prototype.requestCertificateIssue = function (params) {
  const {
    domains, challengeType = CHALLENGE.HTTP1, csrFields, validation, orderKey
  } = params;

  const order = this.createOrder(domains);

  return order.getAllChallenges(challengeType)
    .then(function (challenges) {
      return validation(challenges)
        .then(function () {
          return challenges;
        });
    })
    .then(function (challenges) {
      order.validate(challenges);
      order.finalize(csrFields, { key: orderKey });
      return order.getCertificate()
        .then(function (certificate) {
          return {
            keys: order.keys ? {
              privateKey: order.keys.privateKey.toString(),
              publicKey: order.keys.publicKey.toString(),
            } : null,
            certificate: certificate,
          };
        })
    });
}
Account.prototype.getCacheFiles = function () {
  return this.options.cache || {};
}
Account.prototype.on = function (listeners) {
  for (const handler in listeners) {
    if (listeners[handler] instanceof Function) {
      this.handlers[handler] = listeners[handler];
    }
  }

  return this;
}
Account.prototype.getInfo = function () {
  const account = this;

  return new Promise(function (resolve, reject) {
    account.queue.push(getAccountInfoOperation, {
      resolve: resolve,
      reject: reject,
    });
  });
}

module.exports = { Account };
