const commonMocks = require('./common.js');
const accountMocks = require('./account.js');
const orderMocks = require('./order.js');

function mockData (request) {
  switch (request.path) {
    case '/directory':
      return commonMocks.directory;
    case '/new-nonce':
      return commonMocks.nonce;
    case '/sub/new-acct':
      return accountMocks.newAccount;
    case '/new-order':
      return orderMocks.newOrder;
    case '/authz/208626448057':
      return orderMocks.authorizationValid;
    case '/authz/208626448067':
      return orderMocks.authorizationPending;
    case '/authz/208626448077':
      return orderMocks.authorizationPending;
    case '/order/995569897/168511849427':
      return orderMocks.orderInfo;
    case '/finalize/995569897/168511849427':
      return orderMocks.finalize;
    case '/cert/03b4601321c9afdadc903b2b7da67f53aafe':
      return orderMocks.certificate;
    default:
      return null;
  }
}

module.exports = { mockData };
