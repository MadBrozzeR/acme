module.exports.nonce = {
  status: 204,
  headers: {
    'cache-control': 'public, max-age=0, no-cache',
    'date': 'Fri, 17 Mar 2023 16:33:15 GMT',
    'link': '<http://localhost:5084/directory>;rel=\'index\'',
    'replay-nonce': 'A5FEMjlINiHF80qxuyUCMTVZOBg6dfM6sXsdM26jsYxlrsk',
    'server': 'nodejs',
    'strict-transport-security': 'max-age=604800',
    'x-frame-options': 'DENY'
  }
}
module.exports.directory = {
  status: 200,
  headers: {
    'cache-control': 'public, max-age=0, no-cache',
    'content-type': 'application/json',
    'date': 'Thu, 16 Mar 2023 20:51:47 GMT',
    'server': 'nginx',
    'strict-transport-security': 'max-age=604800',
    'x-frame-options': 'DENY'
  },
  data: {
    Eo6BxYULorg: 'Pretty random itn\'t it?',
    keyChange: 'http://localhost:5084/key-change',
    meta: {
      caaIdentities: [
        'localhost'
      ],
      termsOfService: 'http://localhost:5084/terms',
      website: 'https://localhost:5084'
    },
    newAccount: 'http://localhost:5084/sub/new-acct',
    newNonce: 'http://localhost:5084/new-nonce',
    newOrder: 'http://localhost:5084/new-order',
    renewalInfo: 'http://localhost:5084/renewalInfo/',
    revokeCert: 'http://localhost:5084/revoke-cert'
  }
}
