const { Account } = require('../src/account.js');
const { parsePrivateKey } = require('../src/crypting.js');
const { privateKey } = require('./data.js');
const { mockData } = require('./mocks/index.js');

function createAccount () {
  return new Account({ api: 'http://localhost:5084', key: privateKey }).create();
}

module.exports = {
  'should create new account and send register request': function (resolve, reject) {
    const { suit, data: { mocks } } = this;

    mocks.attach(mockData);

    new Account({ api: 'http://localhost:5084' })
      .create({ keyLength: 512 })
      .on({
        error: reject,
        success: function () {
          const account = this;
          const requests = mocks.collect();
          const keyData = parsePrivateKey(account.privateKey);

          suit.equals(keyData.modulus.length, 64, 'Wrong key modulus length');
          suit.equals(requests.length, 3, 'Wrong request count');
          suit.equals(requests[2].path, '/sub/new-acct', 'Wrong request path');

          resolve();
        }
      });
  },
  'should create account with given key and send certain request': function (resolve, reject) {
    const { suit, data: { mocks } } = this;

    mocks.attach(mockData);

    createAccount().on({
      error: reject,
      success: function () {
        const requests = mocks.collect();

        const data = JSON.parse(requests[2].data);
        suit.equals(data.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc3ViL25ldy1hY2N0IiwiandrIjp7ImUiOiJBUUFCIiwibiI6InJWR0pLRHY0VGF6YTNJSzJQX3JjaGVUMFh5ZFBqajQ4RTdLZ0h5dF9MTzJSUllEX09FQ05qTlU3NE1lWDl4eHdEMzNvNXBibkhFUFBZdDVmWVBweWlRIiwia3R5IjoiUlNBIn19', 'Wrong protected field data');
        suit.equals(data.payload, 'eyJ0ZXJtc09mU2VydmljZUFncmVlZCI6dHJ1ZX0', 'Wrong payload field data');
        suit.equals(data.signature, 'gN9C8tE3gcC87SHC5lpYEtdT-D9HB-splWJVlGtK99Lyoq9rcUiBvhbLkuF4iKJk0zbLkTVLjQZqTQE23-93fw', 'Wrong signature field data');

        resolve();
      }
    });
  },
  'should get correct thumbprint': function (resolve, reject) {
    const { suit, data: { mocks } } = this;

    mocks.attach(mockData);

    createAccount().on({
      error: reject,
      success: function () {
        const thumbprint = this.getThumbprint();

        suit.equals(thumbprint, 'd7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc', 'Wrong thumbprint');

        resolve();
      }
    });
  }
};
