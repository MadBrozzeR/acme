const { useFile, parseResponse, updateOrderFields } = require("../utils.js");
const { Identifier } = require('../identifier.js');

module.exports = {
  init: function () {
    const queue = this.queue;
    const api = queue.data.account.api;
    const file = queue.data.account.getCacheFiles().order;
    const domains = (this.params.domains instanceof Array)
      ? this.params.domains : [this.params.domains];
    const params = this.params.params;

    useFile(function () {
      return api.orderRequest(domains, params)
        .then(parseResponse)
        .then(function (response) {
          if (response.status < 300) {
            return response;
          }

          throw new api.ResponseError(response.data);
        });
    }, file)
      .then(function (response) {
        queue.trigger('prepare', response);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  prepare: function (response) {
    const order = this.params.order;
    const result = updateOrderFields({
      id: response.headers.location,
      domains: {},
    }, response);
    const { identifiers, authorizations } = response.data;

    for (let index = 0 ; index < identifiers.length ; ++index) {
      result.domains[identifiers[index].value] =
        new Identifier(order, identifiers[index].value)
          .setAuth(authorizations[index]);
    }

    this.queue.trigger('success', result);
  },
  error: function (error) {
    this.queue.clear();

    throw error;
  },
  success: function (result) {
    const order = this.params.order;

    Object.assign(order, result);

    this.queue.next();
  }
}
