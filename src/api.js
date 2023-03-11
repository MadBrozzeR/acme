const https = require('https');
const { API } = require('./constants.js');
const { getJWS } = require('./crypting.js');
const { getIdentifiers } = require('./utils.js');

function Response (response) {
  this.raw = response;
}
Response.prototype.data = function () {
  const response = this.raw;

  return new Promise(function (resolve, reject) {
    const data = [];
    let length = 0;

    response.on('data', function (chunk) {
      data.push(chunk);
      length += chunk.length;
    });

    response.on('end', function () {
      resolve(Buffer.concat(data, length));
    });
  });
}
Response.prototype.json = function () {
  return this.data().then(JSON.parse);
}
Response.prototype.isOk = function () {
  return this.raw.statusCode < 300 && this.raw.statusCode >= 200;
}
Response.prototype.getHeader = function (name) {
  return this.raw.headers[name];
}

const URL_RE = /(https?):\/\/([^\/]+)(.*)/;

function request (path, params = {}) {
  const requestParams = {
    method: params.method || 'GET',
    headers: params.headers || {},
  };

  const urlMatch = URL_RE.exec(path);

  if (urlMatch) {
    requestParams.hostname = urlMatch[2];
    requestParams.path = urlMatch[3];
  } else {
    requestParams.hostname = API;
    requestParams.path = path;
  }

  return new Promise(function (resolve, reject) {
    const request = https.request(requestParams, function (response) {
      resolve(new Response(response));
    });

    request.on('error', reject);

    request.end(params.body || '');
  });
}

function ApiRequest (key) {
  this.key = key;
  this.jwk = null;
  this.kid = null;
}
ApiRequest.prototype.setJWK = function (auth) {
  this.jwk = auth;

  return this;
}
ApiRequest.prototype.setKID = function (auth) {
  this.kid = auth;

  return this;
}
ApiRequest.prototype.setKey = function (key) {
  this.key = key;

  return this;
}

ApiRequest.prototype.request = async function (path, body = '', { useJWK } = {}) {
  if (!this.key) {
    throw new Error('Private key is not set. "setKey" method');
  }

  if (useJWK && !this.jwk) {
    throw new Error('jwk is required');
  }

  if (!useJWK && !this.kid) {
    throw new Error('kid field is required');
  }

  const nonce = await request('/acme/new-nonce', { method: 'HEAD' })
    .then(function (response) {
      return response.getHeader('replay-nonce');
    });

  const url = path.substring(0, 4) === 'http'
    ? path
    : 'https://' + API + path;

  const head = {
    alg:'RS256',
    nonce: nonce,
    url: url,
  };
  if (useJWK) {
    head.jwk = this.jwk;
  } else {
    head.kid = this.kid;
  }

  const jws = JSON.stringify(getJWS(head, body, this.key));

  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/jose+json'
    },
    body: jws,
  });
}

ApiRequest.prototype.accountRequest = function ({ email }) {
  const apiRequest = this;
  const body = { termsOfServiceAgreed: true };

  if (email) {
    body.contact = body.contact || [];

    if (email instanceof Array) {
      for (let index = 0 ; index < email.length ; ++index) {
        body.contact.push('mailto:' + email[index]);
      }
    } else {
      body.contact.push('mailto:' + email);
    }
  }

  return this.request('/acme/new-acct', body, { useJWK: true });
}

ApiRequest.prototype.orderRequest = function (domains, { notBefore, notAfter } = {}) {
  const order = { identifiers: getIdentifiers(domains) };

  if (notBefore instanceof Date) {
    order.notBefore = notBefore.toJSON();
  }

  if (notAfter instanceof Date) {
    order.notAfter = notAfter.toJSON();
  }

  return this.request('/acme/new-order', order);
};
ApiRequest.prototype.validationRequest = function (url) {
  return this.request(url, {});
};
ApiRequest.ResponseError = function (response) {
  this.data = response.data;
}
ApiRequest.ResponseError.prototype.toString = function () {
  return JSON.stringify(this.data, null, 2);
}

module.exports.getTermsOfService = function getTermsOfService () {
  return request('/directory')
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      return json.meta.termsOfService;
    });
}

module.exports.ApiRequest = ApiRequest;
module.exports.request = request;
