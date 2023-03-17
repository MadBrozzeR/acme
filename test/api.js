const { ApiRequest } = require('../src/api.js');
const apiMocks = require('./mocks/common.js');
const { privateKey } = require('./data.js');

function mockData (request) {
  switch (request.path) {
    case '/directory':
      return apiMocks.directory;
    case '/new-nonce':
      return apiMocks.nonce;
    default:
      return null;
  }
}

function checkRequest(suit, request, params) {
  const prefix = params.prefix ? ('[' + params.prefix + '] ') : '';
  (params.method) && suit.equals(request.method, params.method, prefix + 'Method doesn\'t match');
  (params.path) && suit.equals(request.path, params.path, prefix + 'Path doesn\'t match');
}

function createApi (api = 'http://localhost:5084') {
  return new ApiRequest(api)
    .setKey(privateKey)
    .setJWK({e: 'something', kty: 'RSA', n: 'modulus'})
    .setKID('http://localhost:5084/KID');
}

module.exports = {
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

    return apiRequest.request('/random-request', { dataToSend: 'test' }, { useJWK: true })
      .then(function () {
        const requests = mocks.collect();

        equals(requests.length, 3, 'Wrong request count');
        checkRequest(suit, requests[0], { prefix: 'directory', path: '/directory', method: 'GET' });
        checkRequest(suit, requests[1], { prefix: 'nonce', path: '/new-nonce', method: 'HEAD' });
        checkRequest(suit, requests[2], { prefix: 'request', path: '/random-request', method: 'POST' });

        const requestData = JSON.parse(requests[2].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvcmFuZG9tLXJlcXVlc3QiLCJqd2siOnsiZSI6InNvbWV0aGluZyIsImt0eSI6IlJTQSIsIm4iOiJtb2R1bHVzIn19', 'Wrong protected field data');
        equals(requestData.payload, 'eyJkYXRhVG9TZW5kIjoidGVzdCJ9', 'Wrong payload field data');
        equals(requestData.signature, 'qxgnmA8_2DyAfq11E3qGG_P9ap6DVInhBL65QdvyL7j2boaCbvUa9LWsadNoSQGfObq_10HdVwRJumdIzvaP1g', 'Wrong signature field data');

        return apiRequest.request('http://localhost:5084/second-request');
      })
      .then(function () {
        const requests = mocks.collect();

        equals(requests.length, 2, 'Wrong request count in second request');
        checkRequest(suit, requests[1], { prefix: 'second', path: '/second-request', method: 'POST' });

        const requestData = JSON.parse(requests[1].data);

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc2Vjb25kLXJlcXVlc3QiLCJraWQiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvS0lEIn0', 'Wrong protected field data for POST-AS-GET');
        equals(requestData.payload, '', 'Wrong payload field data for POST-AS-GET');
        equals(requestData.signature, 'g13PxKm3MZPSRhG-c7-hGH8amVFbHbwIV-ce-Clba1TrLf_qV6zg1L4GdoyWOVsgnYJ-G6Z5bUVbPVGQsKlPlw', 'Wrong signature field data for POST-AS-GET');
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

        equals(requestData.protected, 'eyJhbGciOiJSUzI1NiIsIm5vbmNlIjoiQTVGRU1qbElOaUhGODBxeHV5VUNNVFZaT0JnNmRmTTZzWHNkTTI2anNZeGxyc2siLCJ1cmwiOiJodHRwOi8vbG9jYWxob3N0OjUwODQvc3ViL25ldy1hY2N0IiwiandrIjp7ImUiOiJzb21ldGhpbmciLCJrdHkiOiJSU0EiLCJuIjoibW9kdWx1cyJ9fQ', 'Wrong protected field data');
        equals(requestData.payload, 'eyJ0ZXJtc09mU2VydmljZUFncmVlZCI6dHJ1ZSwiY29udGFjdCI6WyJtYWlsdG86c29tZW9uZUBleGFtcGxlLmNvbSJdfQ', 'Wrong payload field data');
        equals(requestData.signature, 'dqscBV8Zobriug54HnEIPgT55N73Av2ZkmGfBtXO5fAZy3eZaC2KnfEPs4ysqlEEVp3swC3zjbljk5INCOrEEQ', 'Wrong signature field data');
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
