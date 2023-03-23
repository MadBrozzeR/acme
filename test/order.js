const { Account } = require('../index.js');
const { privateKey } = require('./data.js');
const { mockData } = require('./mocks/index.js');
const { getRequest, checkRequestData, checkRequest, checkFields } = require('./utils.js');

function createOrder(domains = ['example.com', 'sub.example.com', 'sub1.example.com'], params) {
  return Account.create(undefined, { api: 'http://localhost:5084', key: privateKey })
    .then(function (account) {
      return account.createOrder(domains, params);
    });
}

const CERTIFICATE = '-----BEGIN CERTIFICATE-----\naaaaaaaaaaaa\n-----END CERTIFICATE-----';

module.exports = {
  'should create new order with one domain': function (resolve, reject) {
    const { data: { mocks}, suit } = this;

    mocks.attach(mockData);

    createOrder('myexample.comp')
      .then(function (order) {
        const request = getRequest(mocks.collect(), '/new-order');

        checkRequestData(suit, request, {
          protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiMzI3QzZMSVhEamljaGV0R0lfcDhZbXpTNDJaNHpfelhMTFVJY3hkWDNUWGUzRUEiLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L2FjY3QvOTk1NTY5ODk3In0',
          payload: 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoibXlleGFtcGxlLmNvbXAifV19',
          signature: 'DL0RFvk1IEb32GaogbL1oGNrC6slEhvdsYnOLUh9DZsdnRRgax5-_TxGv3WpWoFwXrRkE6usxuHdoizjf8cKgQ',
        });
      })
      .then(resolve)
      .catch(reject);
  },
  'should create new order with multiple domains': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    createOrder()
      .then(function () {
        const request = getRequest(mocks.collect(), '/new-order');

        checkRequestData(suit, request, {
          protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiMzI3QzZMSVhEamljaGV0R0lfcDhZbXpTNDJaNHpfelhMTFVJY3hkWDNUWGUzRUEiLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L2FjY3QvOTk1NTY5ODk3In0',
          payload: 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoiZXhhbXBsZS5jb20ifSx7InR5cGUiOiJkbnMiLCJ2YWx1ZSI6InN1Yi5leGFtcGxlLmNvbSJ9LHsidHlwZSI6ImRucyIsInZhbHVlIjoic3ViMS5leGFtcGxlLmNvbSJ9XX0',
          signature: 'NxwHT7amcPJgdshtLFhG4QDLqlCAHLolw15aAINQaMSlPio7sOKlf2BYQdoInJxlYr--dCoiGJmqXp-UUHaLyw',
        });
      })
      .then(resolve)
      .catch(reject);
  },
  'should collect identifiers from order': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    createOrder()
      .then(function (order) {
        return order.getIdentifiers();
      })
      .then(function (identifiers) {
        suit.equals('example.com' in identifiers, true, 'example.com identifier is missing');
        suit.equals('sub.example.com' in identifiers, true, 'sub.example.com identifier is missing');
        suit.equals(identifiers['example.com'].authorization, 'http://localhost:5084/authz/208626448057', 'Wrong authoriztion field');
        suit.equals(identifiers['sub.example.com'].authorization, 'http://localhost:5084/authz/208626448067', 'Wrong authoriztion field');
        suit.equals(identifiers['example.com'].name, 'example.com', 'Wrong name field');
        suit.equals(identifiers['sub.example.com'].name, 'sub.example.com', 'Wrong name field');
      })
      .then(resolve)
      .catch(reject);
  },
  'should get all challenges': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    const order = createOrder()
      .then(function (order) {
        return order.getAllChallenges();
      })
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
          url: 'http://localhost:5084/chall/208626448067/vY7eRg',
          token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
          key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
          validationRecord: null
        });
        checkFields(suit, result[2], {
          type: 'http-01',
          identifier: 'sub1.example.com',
          status: 'pending',
          url: 'http://localhost:5084/chall/208626448077/vY7eRg',
          token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
          key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
          validationRecord: null
        });
      })
      .then(resolve)
      .catch(reject);
  },
  'should request order info': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    createOrder()
      .then(function (order) {
        return order.getInfo()
          .then(function (info) {
            const request = getRequest(mocks.collect(), '/order/995569897/168511849427');

            if (!request) {
              throw 'Request has not been sent';
            }

            suit.equals(order.status, 'ready', 'Wrong order status');
          })
      })
      .then(resolve)
      .catch(reject);
  },
  'should send validation requests': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    createOrder()
      .then(function (order) {
        return order.getAllChallenges()
          .then(function (challenges) {
            return order.validate(challenges);
          })
          .then(function (result) {
            const request = getRequest(mocks.collect(), '/order/995569897/168511849427');

            if (!request) {
              throw 'Request has not been sent';
            }

            suit.equals(order.status, 'ready', 'Wrong order status');
          })
      })
      .then(resolve)
      .catch(reject);
  },
  'should send finalize request and download certificate': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    createOrder()
      .then(function (order) {
        return order.getInfo()
          .then(function () {
            return order.finalize({ commonName: 'other.com' }, { key: privateKey });
          })
          .then(function () {
            const request = getRequest(mocks.collect(), '/finalize/995569897/168511849427');

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
                  protected: 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRTlYVnVER25STWpmRHI4UGFGNnNlQ0pYaU1Ld2pDTjROeS1yNG5tSm01aEEiLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvY2VydC8wM2I0NjAxMzIxYzlhZmRhZGM5MDNiMmI3ZGE2N2Y1M2FhZmUiLCJraWQiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvYWNjdC85OTU1Njk4OTcifQ',
                  payload: '',
                  signature: 'QaagshfwCFC7ob9fvxn0K0tRJj-Mj2z24B6kpLRDYuf_7QnzUjUhPNy_E1eqsTqDOb48kW8XRdRcpgMWS7ceOA',
                });

                suit.equals(
                  data.toString(),
                  CERTIFICATE,
                  'Wrong download certificate result'
                );
              })
          })
      })
      .then(resolve)
      .catch(reject);
  },
  'should go through all certificate issue process': function (resolve, reject) {
    const { data: { mocks }, suit } = this;

    mocks.attach(mockData);

    new Account({ api: 'http://localhost:5084', key: privateKey })
      .create()
      .then(function (account) {
        return account.requestCertificateIssue({
          domains: ['example.com', 'sub.example.com', 'sub1.example.com'],
          csrFields: { commonName: 'example.com' },
          orderKey: privateKey,
          validation: function (challenges) {
            const requests = mocks.collect();
            const accountRequest = getRequest(requests, '/sub/new-acct');
            const orderRequest = getRequest(requests, '/new-order');
            const auths = [
              getRequest(requests, '/authz/208626448057'),
              getRequest(requests, '/authz/208626448067'),
              getRequest(requests, '/authz/208626448077'),
            ];
            checkRequestData(suit, accountRequest, {
              payload: 'eyJ0ZXJtc09mU2VydmljZUFncmVlZCI6dHJ1ZX0'
            }, { prefix: '[account]' });
            checkRequestData(suit, orderRequest, {
              payload: 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoiZXhhbXBsZS5jb20ifSx7InR5cGUiOiJkbnMiLCJ2YWx1ZSI6InN1Yi5leGFtcGxlLmNvbSJ9LHsidHlwZSI6ImRucyIsInZhbHVlIjoic3ViMS5leGFtcGxlLmNvbSJ9XX0'
            }, { prefix: '[order]' });
            checkRequestData(suit, auths[0], undefined, { prefix: '[order]' });
            checkRequestData(suit, auths[1], undefined, { prefix: '[order]' });
            checkRequestData(suit, auths[2], undefined, { prefix: '[order]' });
            checkFields(suit, challenges[0], {
              status: 'valid',
              identifier: 'example.com',
              url: 'http://localhost:5084/chall/208626448057/RQl2-A',
              token: 'gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE',
              key: 'gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
            });
            checkFields(suit, challenges[1], {
              identifier: 'sub.example.com',
              status: 'pending',
              url: 'http://localhost:5084/chall/208626448067/vY7eRg',
              token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
              key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
            });
            checkFields(suit, challenges[2], {
              identifier: 'sub1.example.com',
              status: 'pending',
              url: 'http://localhost:5084/chall/208626448077/vY7eRg',
              token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s',
              key: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s.d7GAEzos3M9j4MWFo68aL9z-TiAOMtaGzr8YElpROTc',
            });

            return Promise.resolve();
          }
        })
      })
      .then(function (result) {
        const requests = mocks.collect();
        const ready = [
          getRequest(requests, '/chall/208626448057/RQl2-A'),
          getRequest(requests, '/chall/208626448067/vY7eRg'),
          getRequest(requests, '/chall/208626448077/vY7eRg'),
        ];
        const checkRequest = getRequest(requests, '/order/995569897/168511849427');
        const finalizationRequest = getRequest(requests, '/finalize/995569897/168511849427');
        const downloadRequest = getRequest(requests, '/cert/03b4601321c9afdadc903b2b7da67f53aafe');

        if (ready[0]) {
          throw 'Unnecessary request without pending status has been sent';
        }

        checkRequestData(suit, ready[1], { payload: 'e30' }, '[ready 1]');
        checkRequestData(suit, ready[2], { payload: 'e30' }, '[ready 2]');
        checkRequestData(suit, checkRequest, undefined, '[check]');
        checkRequestData(suit, finalizationRequest, { payload: 'eyJjc3IiOiJNSUlCSERDQnh3SUJBREFXTVJRd0VnWURWUVFERXd0bGVHRnRjR3hsTG1OdmJUQmNNQTBHQ1NxR1NJYjNEUUVCQVFVQUEwc0FNRWdDUVFDdFVZa29PX2hOck5yY2dyWV8tdHlGNVBSZkowLU9QandUc3FBZkszOHM3WkZGZ1A4NFFJMk0xVHZneDVmM0hIQVBmZWptbHVjY1E4OWkzbDlnLW5LSkFnTUJBQUdnVERCS0Jna3Foa2lHOXcwQkNRNHhQVEE3TURrR0ExVWRFUVF5TURDQ0MyVjRZVzF3YkdVdVkyOXRnZzl6ZFdJdVpYaGhiWEJzWlM1amIyMkNFSE4xWWpFdVpYaGhiWEJzWlM1amIyMHdEUVlKS29aSWh2Y05BUUVMQlFBRFFRQUQ0dU04d3pRWFA2OTNRbVVtUUlscEFoZm0xd2pQTnZPWWstZGlIeTVQeERPSVdmZ1d2Y19KYktQSTVwMW12X2NybGY1eEM1Yk54aUdLUmRyWm9fM2cifQ' }, { prefix: '[finalization]' });
        checkRequestData(suit, downloadRequest, undefined, { prefix: '[download]' });
        checkFields(suit, result.keys, {
          publicKey: '-----BEGIN PUBLIC KEY-----\n' +
            'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAK1RiSg7+E2s2tyCtj/63IXk9F8nT44+\n' +
            'PBOyoB8rfyztkUWA/zhAjYzVO+DHl/cccA996OaW5xxDz2LeX2D6cokCAwEAAQ==\n' +
            '-----END PUBLIC KEY-----',
          privateKey: privateKey
        });
        suit.equals(
          result.certificate.toString(),
          CERTIFICATE,
          'Wrong certificate data'
        );
      })
      .then(resolve)
      .catch(reject);
  }
};
