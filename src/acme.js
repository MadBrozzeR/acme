const { Account } = require('./account.js');

const account = Account.create({ file: './ast.pem' }).setup({
  cache: {
    account: './accountResp.json',
    order: './orderResp.json',
    challenges: './challenges.json',
    csr: './req.csr',
    finalize: './finalize.json',
    keys: './order-keys.pem',
    certificate: './cert.pem',
  }
});

const order = account.createOrder('madbr.ru');

order.getAllChallenges('http-01').then(function (challenges) {
  order.validate(challenges);
  order.finalize({ commonName: 'madbr.ru' });
  order.getCertificate()
    .then(function (certificate) {
      console.log('Certificate received');
      console.log(certificate);
    });
});
