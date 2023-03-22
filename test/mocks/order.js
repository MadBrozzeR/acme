module.exports.newOrder = {
  status: 201,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 12:47:46 GMT',
    'content-type': 'application/json',
    'connection': 'close',
    'boulder-requester': '995569897',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'location': 'http://localhost:5084/order/995569897/168511849427',
    'replay-nonce': 'F977blIdHTjBlq_5ZGuresfkZfe5mpeEn8KDxoGMjTZmqn8',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: {
    status: 'pending',
    expires: '2023-03-13T12:47:46Z',
    identifiers: [
      {
        type: 'dns',
        value: 'example.com'
      },
      {
        type: 'dns',
        value: 'sub.example.com'
      },
      {
        type: 'dns',
        value: 'sub1.example.com'
      }
    ],
    authorizations: [
      'http://localhost:5084/authz/208626448057',
      'http://localhost:5084/authz/208626448067',
      'http://localhost:5084/authz/208626448077',
    ],
    finalize: 'http://localhost:5084/finalize/995569897/168511849427'
  }
}

module.exports.authorizationPending = {
  status: 200,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 12:47:46 GMT',
    'content-type': 'application/json',
    'connection': 'close',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: {
    identifier: {
      type: 'dns',
      value: 'sub.example.com'
    },
    status: 'pending',
    expires: '2023-03-13T12:47:46Z',
    challenges: [
      {
        type: 'http-01',
        status: 'pending',
        url: 'http://localhost:5084/chall/208665084747/vY7eRg',
        token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s'
      },
      {
        type: 'dns-01',
        status: 'pending',
        url: 'http://localhost:5084/chall/208665084747/WTsGpw',
        token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s'
      },
      {
        type: 'tls-alpn-01',
        status: 'pending',
        url: 'http://localhost:5084/chall/208665084747/CjxeiA',
        token: '36Dv8UY1YYlm85h7QQNWRBq0PvmDKQ9nvnVs_5HOq_s'
      }
    ]
  }
};

module.exports.authorizationValid = {
  status: 200,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 12:47:46 GMT',
    'content-type': 'application/json',
    'connection': 'close',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: {
    identifier: {
      type: 'dns',
      value: 'example.com'
    },
    status: 'valid',
    expires: '2023-04-05T11:10:36Z',
    challenges: [
      {
        type: 'http-01',
        status: 'valid',
        url: 'http://localhost:5084/chall/208626448057/RQl2-A',
        token: 'gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE',
        validationRecord: [
          {
            url: 'http://example.com/.well-known/acme-challenge/gaW1F_vpIqGuNgNiArezA3Lk334Bdk4xzwyyKqYuClE',
            hostname: 'example.com',
            port: '80',
            addressesResolved: [
              '127.0.0.1'
            ],
            addressUsed: '127.0.0.1'
          }
        ],
        validated: '2023-03-06T11:10:25Z'
      }
    ]
  }
};

module.exports.orderInfo = {
  status: 200,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 13:07:17 GMT',
    'content-type': 'application/json',
    'connection': 'close',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: {
    status: 'ready',
    expires: '2023-03-13T12:47:46Z',
    identifiers: [
      {
        type: 'dns',
        value: 'example.com'
      },
      {
        type: 'dns',
        value: 'sub.example.com'
      },
      {
        type: 'dns',
        value: 'sub1.example.com'
      }
    ],
    authorizations: [
      'http://localhost:5084/authz/208626448057',
      'http://localhost:5084/authz/208626448067',
      'http://localhost:5084/authz/208626448077',
    ],
    finalize: 'http://localhost:5084/finalize/995569897/168511849427'
  }
};

module.exports.finalize = {
  status: 200,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 15:40:30 GMT',
    'content-type': 'application/json',
    'connection': 'close',
    'boulder-requester': '995569897',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'location': 'http://localhost:5084/order/995569897/168511849427',
    'replay-nonce': 'A5FE9XVuDGnRMjfDr8PaF6seCJXiMKwjCN4Ny-r4nmJm5hA',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: {
    status: 'valid',
    expires: '2023-03-13T12:47:46Z',
    identifiers: [
      {
        type: 'dns',
        value: 'example.com'
      },
      {
        type: 'dns',
        value: 'sub.example.com'
      },
      {
        type: 'dns',
        value: 'sub1.example.com'
      }
    ],
    authorizations: [
      'http://localhost:5084/authz/208626448057',
      'http://localhost:5084/authz/208626448067',
      'http://localhost:5084/authz/208626448077',
    ],
    finalize: 'http://localhost:5084/finalize/995569897/168511849427',
    certificate: 'http://localhost:5084/cert/03b4601321c9afdadc903b2b7da67f53aafe'
  }
};

module.exports.certificate = {
  status: 200,
  headers: {
    'server': 'nginx',
    'date': 'Mon, 06 Mar 2023 15:52:36 GMT',
    'content-type': 'application/pem-certificate-chain',
    'connection': 'close',
    'cache-control': 'public, max-age=0, no-cache',
    'link': '<http://localhost:5084/directory>;rel=\'index\', <http://localhost:5084/acme/cert/03b4601321c9afdadc903b2b7da67f53aafe/1>;rel=\'alternate\'',
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=604800'
  },
  data: '-----BEGIN CERTIFICATE-----\naaaaaaaaaaaa\n-----END CERTIFICATE-----',
}
