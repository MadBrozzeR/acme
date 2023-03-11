const { PEM } = require('mbr-pem');
const { NetQueue } = require('mbr-queue');
const { ApiRequest } = require('./api.js');
const { CHALLENGE } = require('./constants.js');
const { createKeyPair, getThumb } = require('./crypting.js');
const createAccountOperation = require('./operations/create-account.js');
const registerAccountOperation = require('./operations/register-account.js');
const { Order } = require('./order.js');

function Account (options = {}) {
  this.options = options;
  this.privateKey;
  this.publicKey;
  this.api = new ApiRequest();
  this.orders = '';

  this.queue = new NetQueue();
  this.queue.data = {
    account: this
  }
}

Account.prototype.create = function (params) {
  this.queue.push(createAccountOperation, params);
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
  this.options = {
    ...this.options,
    ...options,
  };

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

Account.create = function (params) {
  return new Account().create(params);
}
/**
 * Complete certificate issue request.
 * @param {string | string[]} domains - domain and subdomain list;
 * @param {string} [challengeType] - challenge tipe, like 'http-01' or 'dns-01' (default 'http-01');
 * @param {object} csrFields - field list to include in certificate request;
 * @param {string} csrFields.commonName - common came in csr;
 * @param { (challenges) => Promise<void> } validation - function to be called when challenges
 *  are ready; returned Promise should be resolved when CA can validate domains.
 */
Account.prototype.requestCertificateIssue = function (params) {
  const { domains, challengeType = CHALLENGE.HTTP1, csrFields, validation } = params;

  const order = account.createOrder(domains);

  order.getAllChallenges(challengeType)
    .then(function (challenges) {
      return validation(challenges)
        .then(function () {
          return challenges;
        });
    })
    .then(function (challenges) {
      order.validate(challenges);
      order.finalize(csrFields);
      return order.getCertificate()
        .then(function (certificate) {
          return {
            keys: order.keys ? {
              privateKey: order.keys.privateKey.toString(),
              publicKey: order.keys.publicKey.toString(),
            },
            certificate: certificate;
          };
        })
    });
}
Account.prototype.getCacheFiles = function () {
  return this.options.cache || {};
}

module.exports = { Account };
