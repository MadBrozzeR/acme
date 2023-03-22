const https = require('https');
const http = require('http');
const { LETS_ENCRYPT_API } = require('./constants.js');
const { getJWS, getJWSAuth } = require('./crypting.js');
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

const URL_RE = /^(https?:\/\/)?([^\/:]+)(?::(\d+))?(\/.*)?$/;

function request (path, params = {}) {
  const requestParams = {
    method: params.method || 'GET',
    headers: params.headers || {},
  };

  const urlMatch = URL_RE.exec(path);
  let protocol;

  if (urlMatch) {
    protocol = urlMatch[1] === 'http://' ? http : https;
    requestParams.hostname = urlMatch[2];
    requestParams.port = urlMatch[3] ? parseInt(urlMatch[3], 10) : undefined;
    requestParams.path = urlMatch[4];
  } else {
    protocol = params.protocol === 'http' ? http : https;
    requestParams.hostname = params.api || API;
    requestParams.path = path;
    requestParams.port = params.port;
  }

  return new Promise(function (resolve, reject) {
    const request = protocol.request(requestParams, function (response) {
      resolve(new Response(response));
    });

    request.on('error', reject);

    request.end(params.body || '');
  });
}

function ApiRequest (api = LETS_ENCRYPT_API) {
  this.key = null;
  this.jwk = null;
  this.kid = null;
  this.directory = null;
  this.api = LETS_ENCRYPT_API;

  api && this.setAPI(api);
}
ApiRequest.prototype.setAPI = function (api) {
  const urlMatch = api && URL_RE.exec(api);

  if (urlMatch) {
    this.api = urlMatch[2];
    this.protocol = urlMatch[1] === 'http://' ? 'http' : 'https';
    this.port = urlMatch[3] ? parseInt(urlMatch[3], 10) : undefined;
  }

  return this;
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

  this.setJWK(getJWSAuth(key));

  return this;
}
ApiRequest.prototype.getPath = function (path) {
  if (path && path.substring(0,4) === 'http') {
    return path;
  }

  return (this.protocol ? (this.protocol + '://') : 'https://') +
    (this.api || LETS_ENCRYPT_API) +
    (this.port ? (':' + this.port) : '') +
    (path ? (path[0] === '/' ? path : ('/' + path)) : '');
}

ApiRequest.prototype.request = async function (path, body = '', { useJWK } = {}) {
  if (!this.key) {
    throw new Error('Private key is not set. "setKey" method');
  }

  if (useJWK && !this.jwk) {
    this.setJWK(getJWSAuth(this.key));
  }

  if (!useJWK && !this.kid) {
    throw new Error('kid field is required');
  }

  const directory = await this.getDirectory();

  const nonce = await request(this.getPath(directory.newNonce), { method: 'HEAD' })
    .then(function (response) {
      return response.getHeader('replay-nonce');
    });

  if (path[0] === '$') {
    path = directory[path.substring(1)];
  }

  const url = this.getPath(path);

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

  return request(this.getPath(path), {
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

  return this.request('$newAccount', body, { useJWK: true });
}

ApiRequest.prototype.orderRequest = function (domains, { notBefore, notAfter } = {}) {
  const order = { identifiers: getIdentifiers(domains) };

  if (notBefore instanceof Date) {
    order.notBefore = notBefore.toJSON();
  }

  if (notAfter instanceof Date) {
    order.notAfter = notAfter.toJSON();
  }

  return this.request('$newOrder', order);
};
ApiRequest.prototype.getDirectory = function () {
  const api = this;
  if (this.directory) {
    return Promise.resolve(this.directory);
  }
  return request(this.getPath('/directory'))
    .then(function (response) {
      return response.json();
    })
    .then(function (response) {
      return api.directory = response;
    });
}
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
  return request(this.getPath('/directory'))
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      return json.meta.termsOfService;
    });
}

module.exports.ApiRequest = ApiRequest;
