module.exports = {
  newAccount: {
    status: 200,
    headers: {
      'server': 'nginx',
      'date': 'Mon, 06 Mar 2023 09:12:57 GMT',
      'content-type': 'application/json',
      'connection': 'close',
      'boulder-requester': '995569897',
      'cache-control': 'public, max-age=0, no-cache',
      'link': '<http://localhost:5084/directory>;rel=\'index\'',
      'location': 'http://localhost:5084/acct/995569897',
      'replay-nonce': '327C6LIXDjichetGI_p8YmzS42Z4z_zXLLUIcxdX3TXe3EA',
      'x-frame-options': 'DENY',
      'strict-transport-security': 'max-age=604800'
    },
    data: {
      key: {
        kty: 'RSA',
        n: 'something',
        e: 'AQAB'
      },
      contact: [
        'mailto:user@example.com'
      ],
      initialIp: '46.188.60.72',
      createdAt: '2023-03-05T23:50:46Z',
      status: 'valid'
    }
  }
}
