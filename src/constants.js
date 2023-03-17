module.exports.LETS_ENCRYPT_API = 'acme-v02.api.letsencrypt.org';

module.exports.STATUS = {
  INVALID: 'invalid',
  PENDING: 'pending',
  READY: 'ready',
  PROCESSING: 'processing',
  VALID: 'valid',
};

module.exports.CHALLENGE = {
  HTTP1: 'http-01',
  DNS1: 'dns-01',
  TLS1: 'tls-sni-01', // Reserved
  TLS2: 'tls-sni-02', // Reserved
};

module.exports.DEFAULT_VALIDATION_OPTIONS = {
  checkDelay: 2000,
  retries: 7,
};
