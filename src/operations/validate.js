const { parseResponse, updateOrderFields } = require("../utils.js");
const { STATUS } = require('../constants.js');
const { handleError } = require('./common.js');

module.exports = {
  name: 'validate',

  init: function () {
    const { order } = this.params;
    const { queue } = this;

    order.getStatus().then(function (status) {
      switch (status) {
        case STATUS.INVALID:
          throw new Error('The certificate will not be issued. Consider this order process abandoned.');
          break;
        case STATUS.PENDING:
          queue.trigger('request');
          break;
        default:
          queue.trigger('success');
          break;
      }
    })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },

  request: function () {
    const challenges = this.params.challenges;
    const api = this.params.order.account.api;
    const queue = this.queue;
    this.data = {
      retries: this.params.retries,
    };
    const promises = [];

    for (const domain in challenges) {
      if (challenges[domain].status === STATUS.PENDING) {
        promises.push(api.validationRequest(challenges[domain].url).then(parseResponse));
      }
    }

    if (promises.length) {
      Promise.all(promises)
        .then(function (responses) {
          for (let index = 0 ; index < responses.length ; ++index) {
            if (responses[index].status >= 300) {
              return queue.trigger('error', new api.ResponseError(responses[index]))
            }
          }

          queue.trigger('timer');
        })
        .catch(function (error) {
          queue.trigger('error', error);
        });
    } else if (isValid) {
      queue.trigger('timer');
    }
  },
  timer: function () {
    const {
      checkDelay,
      retries,
      order,
    } = this.params;
    const api = order.account.api
    const data = this.data;
    const queue = this.queue;

    if (!data.retries--) {
      queue.trigger('error', new Error('Failed to validate after ' + retries + ' retries'));

      return;
    }

    order.getInfo()
      .then(function (response) {
        if (response.status < 300) {
          switch (response.data.status) {
            case STATUS.INVALID:
              throw new Error('The certificate will not be issued. Consider this order process abandoned.')
            case STATUS.PENDING:
              data.timeout = setTimeout(function () {
                queue.trigger('timer');
              }, checkDelay);
              break;
            case STATUS.VALID:
            case STATUS.READY:
              queue.trigger('prepare', response);
              break;
          }
        } else {
          throw new api.ResponseError(response);
        }
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  error: handleError,
  prepare: function (response) {
    updateOrderFields(this.params.order, response);
    this.queue.trigger('success');
  },
  success: function () {
    this.params.resolve(this.params.order);
    this.queue.next();
  }
}
