const { ApiRequest } = require('../src/api.js');
const { mockData } = require('./mocks/index.js');
const { privateKey } = require('./data.js');
const { checkRequest } = require('./utils.js');

function createApi (api = 'http://localhost:5084') {
  return new ApiRequest(api)
    .setKey(privateKey)
    .setKID('http://localhost:5084/KID');
}

module.exports = {
  skip: false,

  'should create ApiRequest module with proper attributes': function (resolve) {
    const { equals } = this.suit;
    const apiRequest = createApi();

    equals(apiRequest.api, 'localhost', 'Wrong api host recognition');
    equals(apiRequest.port, 5084, 'Wrong api port recognition');
    equals(apiRequest.protocol, 'http', 'Wrong api protocol recognition');

    resolve();
  },
  'should return api path in getPath method': function (resolve) {
    const { equals } = this.suit;

    const apiRequest = createApi('https://example.com:222/url-should-be-ignored');

    equals(apiRequest.getPath('/directory'), 'https://example.com:222/directory', 'Failed to get path with slash');
    equals(apiRequest.getPath(), 'https://example.com:222', 'Failed to get path without slash');
    equals(apiRequest.getPath('http://localhost:333/path'), 'http://localhost:333/path', 'Failed to get path from full path');

    resolve();
  },
  'should get directory record from api': function (resolve, reject) {
    const { suit: { equals }, data: { mocks } } = this;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.getDirectory()
      .then(function (response) {
        if (!response) {
          throw 'Request wasn\'t handled properly';
        }

        const requests = mocks.collect();

        equals(requests.length, 1, 'Wrong request count sent');
        equals(requests[0].method, 'GET', 'Wrong method used');
        equals(requests[0].path, '/directory', 'Wrong path requested');

        resolve();
      })
      .catch(reject);
  },
  'should send proper sequence of data on request method': function (resolve, reject) {
    const { suit, data: { mocks } } = this;
    const { equals } = suit;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.request('/new-order', { dataToSend: 'test' }, { useJWK: true })
      .then(function () {
        const requests = mocks.collect();

        equals(requests.length, 3, 'Wrong request count');
        checkRequest(suit, requests[0], { prefix: '[directory]', path: '/directory', method: 'GET' });
        checkRequest(suit, requests[1], { prefix: '[nonce]', path: '/new-nonce', method: 'HEAD' });
        checkRequest(suit, requests[2], { prefix: '[request]', path: '/new-order', method: 'POST' });

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwiandrIjp7ImUiOiJBUUFCIiwibiI6InJWR0pLRHY0VGF6YTNJSzJQX3JjaGVUMFh5ZFBqajQ4RTdLZ0h5dF9MTzJSUllEX09FQ05qTlU3NE1lWDl4eHdEMzNvNXBibkhFUFBZdDVmWVBweWlRIiwia3R5IjoiUlNBIn19', 'Wrong protected field data');
        equals(requestData.payload, 'eyJkYXRhVG9TZW5kIjoidGVzdCJ9', 'Wrong payload field data');
        equals(requestData.signature, 'lfJKl7FCfmmYyH1sy15DF26yLl0aQ5Z4lzq6YIaRf6dn57JHnZxbauCLBoF1zqXNY_gLtBHV8W7AoUUnX6vW9Q', 'Wrong signature field data');

        return apiRequest.request('http://localhost:5084/second-request');
      })
      .then(function () {
        const requests = mocks.collect();

        equals(requests.length, 1, 'Wrong request count in second request');
        checkRequest(suit, requests[0], { prefix: '[second]', path: '/second-request', method: 'POST' });

        const requestData = JSON.parse(requests[0].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiRjk3N2JsSWRIVGpCbHFfNVpHdXJlc2ZrWmZlNW1wZUVuOEtEeG9HTWpUWm1xbjgiLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc2Vjb25kLXJlcXVlc3QiLCJraWQiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvS0lEIn0', 'Wrong protected field data for POST-AS-GET');
        equals(requestData.payload, '', 'Wrong payload field data for POST-AS-GET');
        equals(requestData.signature, 'aCNs0aDmsvks2TDuGaJoToICi80Vo5ZPMN_-Lnm1kTq_y59bJjzwXFdKy_ahcWJcNSs3C1WyGYrliMVosN2wTQ', 'Wrong signature field data for POST-AS-GET');
      })
      .then(resolve)
      .catch(reject);
  },
  'should send proper newAccount request': function (resolve, reject) {
    const { suit, data: { mocks } } = this;
    const { equals } = suit;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.accountRequest({ email: 'someone@example.com' })
      .then(function () {
        const requests = mocks.collect();

        checkRequest(suit, requests[2], { path: '/sub/new-acct', method: 'POST' })

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc3ViL25ldy1hY2N0IiwiandrIjp7ImUiOiJBUUFCIiwibiI6InJWR0pLRHY0VGF6YTNJSzJQX3JjaGVUMFh5ZFBqajQ4RTdLZ0h5dF9MTzJSUllEX09FQ05qTlU3NE1lWDl4eHdEMzNvNXBibkhFUFBZdDVmWVBweWlRIiwia3R5IjoiUlNBIn19', 'Wrong protected field data');
        equals(requestData.payload, 'eyJ0ZXJtc09mU2VydmljZUFncmVlZCI6dHJ1ZSwiY29udGFjdCI6WyJtYWlsdG86c29tZW9uZUBleGFtcGxlLmNvbSJdfQ', 'Wrong payload field data');
        equals(requestData.signature, 'ebRVgYDOAkZAZaYLsJSVZL-BkusrX82SJd0qznKE_5xiW5BskycwX7fNDYSHI-1w9LAm1LWef72Rlrtau82Yaw', 'Wrong signature field data');
      })
      .then(resolve)
      .catch(reject);
  },
  'should send proper newOrder request with one domain': function (resolve, reject) {
    const { suit, data: { mocks } } = this;
    const { equals } = suit;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.orderRequest('example.com')
      .then(function () {
        const requests = mocks.collect();

        checkRequest(suit, requests[2], { path: '/new-order', method: 'POST' })

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L0tJRCJ9', 'Wrong protected field data');
        equals(requestData.payload, 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoiZXhhbXBsZS5jb20ifV19', 'Wrong payload field data');
        equals(requestData.signature, 'eRfL8uJjTgHDX6j4pjre799LmJQ5q8bY7iqMwcAE4KQZUV14pBN8uBfz6aBhy_fnhUO0eVgxXY1x_y81e_LKJA', 'Wrong signature field data');
      })
      .then(resolve)
      .catch(reject);
  },
  'should send proper newOrder request with several domains and extra fields': function (resolve, reject) {
    const { suit, data: { mocks } } = this;
    const { equals } = suit;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.orderRequest(
      ['example.com', 'sub1.example.com', 'sub2.example.com'],
      { notBefore: new Date('2022-10-23'), notAfter: new Date('2022-12-20') },
    )
      .then(function () {
        const requests = mocks.collect();

        checkRequest(suit, requests[2], { path: '/new-order', method: 'POST' })

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvbmV3LW9yZGVyIiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L0tJRCJ9', 'Wrong protected field data');
        equals(requestData.payload, 'eyJpZGVudGlmaWVycyI6W3sidHlwZSI6ImRucyIsInZhbHVlIjoiZXhhbXBsZS5jb20ifSx7InR5cGUiOiJkbnMiLCJ2YWx1ZSI6InN1YjEuZXhhbXBsZS5jb20ifSx7InR5cGUiOiJkbnMiLCJ2YWx1ZSI6InN1YjIuZXhhbXBsZS5jb20ifV0sIm5vdEJlZm9yZSI6IjIwMjItMTAtMjNUMDA6MDA6MDAuMDAwWiIsIm5vdEFmdGVyIjoiMjAyMi0xMi0yMFQwMDowMDowMC4wMDBaIn0', 'Wrong payload field data');
        equals(requestData.signature, 'hkNA3r109So9jKmoqsJbbpQojfCxVoJO8fX2jNu_bPlr2WxRp4uD0xnykk2Hvknno5mHPCsnn-LpL46rZjnCjg', 'Wrong signature field data');
      })
      .then(resolve)
      .catch(reject);
  },
  'should send proper validation request': function (resolve, reject) {
    const { suit, data: { mocks } } = this;
    const { equals } = suit;

    const apiRequest = createApi();

    mocks.attach(mockData);

    return apiRequest.validationRequest('http://localhost:5084/something/12345678')
      .then(function () {
        const requests = mocks.collect();

        checkRequest(suit, requests[2], { path: '/something/12345678', method: 'POST' })

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc29tZXRoaW5nLzEyMzQ1Njc4Iiwia2lkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDg0L0tJRCJ9', 'Wrong protected field data');
        equals(requestData.payload, 'e30', 'Wrong payload field data');
        equals(requestData.signature, 'JPioj46GVejttNfxRcw_MW0_7TiMTTMjT-eFJmWg4KQ7PvcYCQJZz5NQngsfrT6js7Mxg0M_SbagigD1AiCkXA', 'Wrong signature field data');
      })
      .then(resolve)
      .catch(reject);
  }
}
