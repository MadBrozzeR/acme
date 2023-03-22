const { Account } = require('../index.js');
const { privateKey } = require('./data.js');
const { mockData } = require('./mocks/index.js');
const { getRequest, checkRequestData, checkRequest, checkFields } = require('./utils.js');

function createOrder(domains = ['example.com', 'sub.example.com', 'sub1.example.com'], params) {
  return Account.create(undefined, { api: 'http://localhost:5084', key: privateKey })
    .createOrder(domains, params);
}

module.exports = {
  'should create new order with one domain': function (resolve, reject) {
    const { data: { mocks}, suit } = this;

    mocks.attach(mockData);

    const order = createOrder('myexample.comp');
    order.account.on({
      error: reject,
      success: function () {
        const request = getRequest(mocks.collect(), '/new-order');

        checkRequestData(suit, request, {
          protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L2FjY3QvOTk1NTY5ODk3In0',
          payload: 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoibXlleGFtcGxlLmNvbXAifV19',
          signature: 'aDeOUxkorxhc_lzSupmnDoN4FzlwaCEor3jio2BZVF1HhgpBYmSOKBmSWJOxjDf5zjJb6x6MrRJWxOlpKlvwoA',
        });

        resolve();
      }
    });
  },
  'should create new order with multiple domains': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
      success: function () {
        const request = getRequest(mocks.collect(), '/new-order');

        checkRequestData(suit, request, {
          protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L2FjY3QvOTk1NTY5ODk3In0',
          payload: 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoiZXhhbXBsZS5jb20ifSx7InR5cGUiOiJkbnMiLCJ2YWx1ZSI6InN1Yi5leGFtcGxlLmNvbSJ9LHsidHlwZSI6ImRucyIsInZhbHVlIjoic3ViMS5leGFtcGxlLmNvbSJ9XX0',
          signature: 'NPpcLjmtV3zjR7eZ35CowaOSQKaKVzitNWgGTRV91mYmHcBsnJAsLeC3DOtAA_1ZfIFNYMGG_J8FwaXVjY7RxA',
        });

        resolve();
      }
    });
  },
  'should collect identifiers from order': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
    });
    order.getIdentifiers(function (identifiers) {
      suit.equals('example.com' in identifiers, true, 'example.com identifier is missing');
      suit.equals('sub.example.com' in identifiers, true, 'sub.example.com identifier is missing');
      suit.equals(identifiers['example.com'].authorization, 'http://localhost:5084/authz/208626448057', 'Wrong authoriztion field');
      suit.equals(identifiers['sub.example.com'].authorization, 'http://localhost:5084/authz/208626448067', 'Wrong authoriztion field');
      suit.equals(identifiers['example.com'].name, 'example.com', 'Wrong name field');
      suit.equals(identifiers['sub.example.com'].name, 'sub.example.com', 'Wrong name field');

      resolve();
    });
  },
  'should get all challenges': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
    });
    order.getAllChallenges()
      .then(function (result) {
        const requests = mocks.collect();
        checkRequest(suit, getRequest(requests, '/authz/208626448057'), { method: 'POST' });
        checkRequest(suit, getRequest(requests, '/authz/208626448067'), { method: 'POST' });
        checkRequest(suit, getRequest(requests, '/authz/208626448077'), { method: 'POST' });

        suit.equals(result.length, 3, 'Wrong result count');
        checkFields(suit, result[0], {
          type: 'http-01',
          status: 'valid',
          identifier: 'example.com',
          url: 'http://localhost:5084/chall/208626448057/RQl2-A',
          token: 'gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE',
          key: 'gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
        });
        checkFields(suit, result[1], {
          type: 'http-01',
          identifier: 'sub.example.com',
          expires: '2023-03-13T12:47:46Z',
          status: 'pending',
          url: 'http://localhost:5084/chall/208665084747/vY7eRg',
          token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
          key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
          validationRecord: null
        });
        checkFields(suit, result[2], {
          type: 'http-01',
          identifier: 'sub.example.com',
          status: 'pending',
          url: 'http://localhost:5084/chall/208665084747/vY7eRg',
          token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
          key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
          validationRecord: null
        });

        resolve();
      });
  },
  'should request order info': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
      success: function () {
        order.getInfo()
          .then(function (info) {
            const request = getRequest(mocks.collect(), '/order/995569897/168511849427');

            if (!request) {
              throw 'Request has not been sent';
            }

            suit.equals(order.status, 'ready', 'Wrong order status');

            resolve();
          })
          .catch(reject);
      }
    });
  },
  'should send validation requests': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
    });
    order.getAllChallenges()
      .then(function (challenges) {
        return order.validate(challenges)
      })
      .then(function (result) {
        const request = getRequest(mocks.collect(), '/order/995569897/168511849427');

        if (!request) {
          throw 'Request has not been sent';
        }

        suit.equals(order.status, 'ready', 'Wrong order status');

        resolve();
      })
      .catch(reject);
  },
  'should send finalize request and download certificate': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder();
    order.account.on({
      error: reject,
      success: function () {
        order.getInfo()
          .then(function () {
            return order.finalize({ commonName: 'other.com' }, { key: privateKey });
          })
          .then(function () {
            const request = getRequest(mocks.collect(), '/finalize/995569897/168511849427');

            if (!request) {
              throw 'Request has not been sent';
            }

            checkRequestData(suit, request, {
              protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvZmluYWxpemUvOTk1NTY5ODk3LzE2ODUxMTg0OTQyNyIsImtpZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTA4NC9hY2N0Lzk5NTU2OTg5NyJ9',
              payload: 'eyJjc3IiOiJNSUlCR2pDQnhRSUJBREFVTVJJd0VBWURWUVFERXdsdmRHaGxjaTVqYjIwd1hEQU5CZ2txaGtpRzl3MEJBUUVGQUFOTEFEQklBa0VBclZHSktEdjRUYXphM0lLMlBfcmNoZVQwWHlkUGpqNDhFN0tnSHl0X0xPMlJSWURfT0VDTmpOVTc0TWVYOXh4d0QzM281cGJuSEVQUFl0NWZZUHB5aVFJREFRQUJvRXd3U2dZSktvWklodmNOQVFrT01UMHdPekE1QmdOVkhSRUVNakF3Z2d0bGVHRnRjR3hsTG1OdmJZSVBjM1ZpTG1WNFlXMXdiR1V1WTI5dGdoQnpkV0l4TG1WNFlXMXdiR1V1WTI5dE1BMEdDU3FHU0liM0RRRUJDd1VBQTBFQUwwdlFNcE5vcFU2dVBaTW1YMl9zdTBEWjVSZHJkTUFtOTc5anBVTENSUElmNERKMThNQlk4NThCYWxHdlZxandmZzc1TG82Xy0ybmNmLW5qNGtLMDF3In0',
              signature: 'Tm_HuYsJxtif2EtckohSiwNhDtvHKCBYCnkrJF5PQmQ4QBt_bRs8dY_Tl_dHVKOJldCVVmbnVNdVO8QOeRNdFg',
            });

            return order.getCertificate()
              .then(function (data) {
                const request = getRequest(mocks.collect(), '/cert/03b4601321c9afdadc903b2b7da67f53aafe');

                if (!request) {
                  throw 'Request has not been sent';
                }

                checkRequestData(suit, request, {
                  protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvY2VydC8wM2I0NjAxMzIxYzlhZmRhZGM5MDNiMmI3ZGE2N2Y1M2FhZmUiLCJraWQiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvYWNjdC85OTU1Njk4OTcifQ',
                  payload: '',
                  signature: 'oOWcabOyeoTDFISntLleHq6Gt1ivNjC8I9ptmH7nerT2kp2TK6ZGzXJVl15qlOoPrmZ_7NZOjP8J0J3Gu5-isQ',
                });

                suit.equals(
                  data.toString(),
                  '-----BEGIN CERTIFICATE-----\naaaaaaaaaaaa\n-----END CERTIFICATE-----',
                  'Wrong download certificate result'
                );

                resolve();
              })
          })
          .catch(reject);
      }
    });
  },
};
