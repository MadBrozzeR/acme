const createOrderOperation = require('./operations/create-order.js');
const getIdentifiersOperation = require('./operations/get-identifiers.js');
const getAllChallengesOperation = require('./operations/get-all-challenges.js');
const validationOperation = require('./operations/validate.js');
const finalizeOperation = require('./operations/finalize.js');
const getCertificateOperation = require('./operations/get-certificate.js');
const { parseResponse, updateOrderFields } = require('./utils.js');
const { DEFAULT_VALIDATION_OPTIONS } = require('./constants.js');

function Order (account, domains, params) {
  this.account = account;

  if (domains) {
    this.create(domains, params);
  }
}
Order.prototype.create = function (domains, params = {}) {
  this.account.queue.push(createOrderOperation, {
    order: this,
    domains: domains,
    params: params,
    resolve: params.onSuccess,
    reject: params.onError,
  });

  return this;
}
Order.prototype.getIdentifiers = function (callback) {
  this.account.queue.push(getIdentifiersOperation, {
    order: this,
    callback: callback,
  });

  return this;
}
Order.prototype.getAllChallenges = function (type) {
  const account = this.account;
  const order = this;

  return new Promise(function (resolve, reject) {
    account.queue.push(getAllChallengesOperation, {
      type: type,
      order: order,
      callback: resolve,
      reject: reject,
    });
  });
}
Order.prototype.validate = function (challenges, params = {}) {
  const order = this;
  return new Promise(function (resolve, reject) {
    order.account.queue.push(validationOperation, {
      order: order,
      challenges: challenges,
      checkDelay: params.checkDelay || DEFAULT_VALIDATION_OPTIONS.checkDelay,
      retries: params.retries || DEFAULT_VALIDATION_OPTIONS.retries,
      resolve: resolve,
      reject: reject,
    });
  });
}
Order.prototype.getInfo = function () {
  if (!this.id) {
    throw new Error('Order is not created yet');
  }

  const order = this;

  return this.account.api.request(this.id)
    .then(parseResponse)
    .then(function (response) {
      updateOrderFields(order, response);

      return response;
    });
}
Order.prototype.getStatus = function () {
  if (this.status) {
    return Promise.resolve(this.status);
  }

  const order = this;

  return this.getInfo()
    .then(function (info) {
      return info.data.status;
    });
}
Order.prototype.finalize = function (fields, { keyLength, key } = {}) {
  const order = this;

  return new Promise(function (resolve, reject) {
    order.account.queue.push(finalizeOperation, {
      order: order,
      fields: fields,
      keyLength: keyLength,
      key: key,
      resolve: resolve,
      reject: reject,
    });
  });
}
Order.prototype.getCertificate = function () {
  const order = this;

  return new Promise(function (resolve, reject) {
    order.account.queue.push(getCertificateOperation, {
      order: order,
      resolve: resolve,
      reject: reject,
    });
  });
}

module.exports = { Order };
