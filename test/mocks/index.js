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
      return orderMocks.orderPending;
    case '/authz/208626448057':
      return orderMocks.authorization({ id: '208626448057', domain: 'example.com', status: 'valid' });
    case '/authz/208626448067':
      return orderMocks.authorization({ id: '208626448067', domain: 'sub.example.com', status: 'pending' });
    case '/authz/208626448077':
      return orderMocks.authorization({ id: '208626448077', domain: 'sub1.example.com', status: 'pending' });
    case '/order/995569897/168511849427':
      return orderMocks.orderReady;
    case '/finalize/995569897/168511849427':
      return orderMocks.orderValid;
    case '/cert/03b4601321c9afdadc903b2b7da67f53aafe':
      return orderMocks.certificate;
    default:
      return null;
  }
}

function mockDataOrderReady (request) {
  switch (request.path) {
    case '/directory':
      return commonMocks.directory;
    case '/new-nonce':
      return commonMocks.nonce;
    case '/sub/new-acct':
      return accountMocks.newAccount;
    case '/new-order':
      return orderMocks.orderReady;
    case '/authz/208626448057':
      return orderMocks.authorization({ id: '208626448057', domain: 'example.com', status: 'ready' });
    case '/authz/208626448067':
      return orderMocks.authorization({ id: '208626448067', domain: 'sub.example.com', status: 'ready' });
    case '/authz/208626448077':
      return orderMocks.authorization({ id: '208626448077', domain: 'sub1.example.com', status: 'ready' });
    case '/order/995569897/168511849427':
      return orderMocks.orderReady;
    case '/finalize/995569897/168511849427':
      return orderMocks.orderValid;
    case '/cert/03b4601321c9afdadc903b2b7da67f53aafe':
      return orderMocks.certificate;
  }
}

module.exports = { mockData, mockDataOrderReady };
