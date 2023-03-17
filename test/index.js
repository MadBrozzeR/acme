const http = require('http');
const { TestSuit } = require('./suit/index.js');
const { Acount } = require('../index.js');
const { createServer } = require('./server.js');

createServer(5084).then(function (mockData) {
  new TestSuit({ mocks: mockData }).test({
    'Api module': require('./api.js'),
  }).result(function (unsuccessfull) {
    mockData.server.close();

    if (unsuccessfull) {
      process.exit(1);
    }
  });
});
