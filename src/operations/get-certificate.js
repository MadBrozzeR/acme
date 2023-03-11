const { STATUS } = require('../constants.js');
const { useFile } = require('../utils.js');

module.exports = {
  init: function () {
    const order = this.params.order;
    const queue = this.queue;

    if (order.certificateUrl) {
      queue.trigger('download');
    } else {
      order.getStatus()
        .then(function (status) {
          switch (status) {
            case STATUS.INVALID:
              throw new Error('The certificate will not be issued. Consider this order process abandoned.')
            case STATUS.PENDING:
              throw new Error('The server does not believe that the client has fulfilled the requirements. Check the "authorizations" array for entries that are still pending.');
            case STATUS.READY:
              throw new Error('The server agrees that the requirements have been fulfilled, and is awaiting finalization. Submit a finalization request.')
            case STATUS.PROCESSING:
              throw new Error('The certificate is being issued. Send a POST-as-GET request after the time given in the Retry-After header field of the response, if any.')
            case STATUS.VALID:
              if (order.certificateUrl) {
                queue.trigger('download');
              } else {
                throw new Error('Something went wrong. The order status is "valid", but the certificate link is absent. Cannot proceed.');
              }
              break;
            default:
              throw new Error('Unknown status received: ' + status);
          }
        })
        .catch(function (error) {
          queue.trigger('error', error);
        });
    }
  },
  download: function () {
    const url = this.params.order.certificateUrl;
    const api = this.params.order.account.api;
    const queue = this.queue;
    const file = this.params.order.account.getCacheFiles().certificate;

    useFile(function () {
      return api.request(url)
        .then(function (response) {
          if (response.raw.statusCode < 300) {
            return response.data();
          }

          throw new Error('Failed to fetch certificat. Status: ' + response.raw.statusCode);
        })
    }, file, { format: 'text' })
      .then(function (data) {
        queue.trigger('success', data);
      })
      .catch(function (error) {
        queue.trigger('error', error);
      });
  },
  error: function (error) {
    this.params.reject(error);
    this.queue.clear();
  },
  success: function (data) {
    this.params.resolve(data);
    this.queue.next();
  }
};
