const { useFile } = require("../utils.js");
const { handleError } = require('./common.js');

module.exports = {
  name: 'get-all-challenges',

  init: function () {
    const queue = this.queue;
    const domains = this.params.order.domains;
    const type = this.params.type;
    const file = this.queue.data.account.getCacheFiles().challenges;

    useFile(function () {
      const promises = [];

      for (const domain in domains) {
        promises.push(domains[domain].getChallenge(type));
      }

      if (promises.length) {
        return Promise.all(promises);
      }
    }, file)
      .then(function (result) {
        queue.trigger('success', result);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  error: handleError,
  success: function (result) {
    this.params.resolve(result);

    this.queue.next();
  }
}
