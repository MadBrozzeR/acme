const crypto = require('crypto');
const { spawn } = require('child_process');
const { PEM, Chunk } = require('mbr-pem');
const { base64url, useFile } = require('./utils.js');

function ssl(params, { onStderr, input } = {}) {
  return new Promise(function (resolve, reject) {
    const ssl = spawn('openssl', params);
    const data = [];
    let length = 0;

    ssl.stdout.on('data', function (chunk) {
      data.push(chunk);
      length += chunk.length;
    });
    (onStderr instanceof Function) && ssl.stderr.on('data', onStderr)

    ssl.on('close', function (code) {
      if (code) {
        reject(code);
      } else {
        resolve(Buffer.concat(data, length));
      }
    });

    if (input) {
      ssl.stdin.end(input);
    }
  });
};

const EXPONENT_RE = /Exponent: (\d+)/;
const MODULUS_RE = /^Modulus=([A-F0-9]+)/;

function getExponent (text) {
  const number = parseInt(text, 10);
  const buffer = Buffer.allocUnsafe(4);

  buffer.writeUInt32BE(number);

  for (let index = 0 ; index < buffer.length ; ++index) {
    if (buffer[index] > 0) {
      return base64url(buffer.subarray(index));
    }
  }
}

function genRSA (length = 4096) {
  return ssl(['genrsa', length]);
}

function hash (algorithm, data) {
  const hash = crypto.createHash(algorithm);
  hash.update(data);

  return hash.digest();
}

function createKeys(length = 4096) {
  const result = {
    privateKey: null,
    publicKey: null
  };

  return genRSA(length)
    .then(function (privateKey) {
      result.privateKey = privateKey;

      return ssl(['rsa', '-pubout'], { input: privateKey });
    })
    .then(function (publicKey) {
      result.publicKey = publicKey;

      return result;
    });
}

module.exports.getJWSAuth = function getJWSAuth ({ publicKey }) {
  if (publicKey instanceof PEM) {
    publicKey = publicKey.toString();
  }

  return Promise.all([
    ssl(['rsa', '-pubin', '-text', '-noout'], { input: publicKey }),
    ssl(['rsa', '-pubin', '-modulus', '-noout'], { input: publicKey })
  ]).then(function ([textOut, modulusOut]) {
    const exponentMatch = EXPONENT_RE.exec(textOut);
    const modulusMatch = MODULUS_RE.exec(modulusOut);

    if (exponentMatch && modulusMatch) {
      const exponent = getExponent(exponentMatch[1]);
      const modulus = base64url(
        Buffer.from(modulusMatch[1], 'hex')
      );

      return {
        e: exponent,
        kty: 'RSA',
        n: modulus
      };
    } else {
      return Promise.reject(new Error('Unmatched'));
    }
  });
}

module.exports.getThumb = function getThumb (auth) {
  return base64url(hash('sha256', JSON.stringify(auth)));
}

function sign (data, key) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);

  return sign.sign(key);
}

module.exports.getJWS = function getJWS (head, body, key) {
  if (key instanceof PEM) {
    key = key.toString();
  }
  const header = base64url(JSON.stringify(head));
  const payload = body ? base64url(JSON.stringify(body)) : '';
  const signature = base64url(sign(header + '.' + payload, key));

  return { 'protected': header, payload, signature };
}

module.exports.getCSR = function ({ commonName, san }, { privateKey, publicKey }) {
  if (privateKey instanceof PEM) {
    privateKey = privateKey.toString();
  }

  if (!(publicKey instanceof PEM)) {
    publicKey = PEM.parse(publicKey)[0];
  }

  const cnField = new Chunk(Chunk.TYPES.SET, [
    new Chunk(Chunk.TYPES.SEQUENCE, [
      new Chunk(Chunk.TYPES.OBJECT, '2.5.4.3'),
      new Chunk(Chunk.TYPES.PRINTABLE, commonName)
    ])
  ]);
  const publicKeyData = publicKey.readDER();
  const sanData = (san && san.length)
    && new Chunk(Chunk.TYPES.SEQUENCE, san.map(function (name) {
      return new Chunk(0x82, Buffer.from(name))
    })) || null;

  const extenstionRequest = sanData && new Chunk(Chunk.TYPES.SEQUENCE, [
    new Chunk(Chunk.TYPES.OBJECT, '1.2.840.113549.1.9.14'),
    new Chunk(Chunk.TYPES.SET, [
      new Chunk(Chunk.TYPES.SEQUENCE, [
        new Chunk(Chunk.TYPES.SEQUENCE, [
          new Chunk(Chunk.TYPES.OBJECT, '2.5.29.17'),
          new Chunk(Chunk.TYPES.OCTET, sanData.raw)
        ])
      ])
    ])
  ]);
  const extensions = extenstionRequest ? extenstionRequest.raw : Buffer.alloc(0);
  const body = new Chunk(Chunk.TYPES.SEQUENCE, [
    new Chunk(Chunk.TYPES.INTEGER, 0),
    new Chunk(Chunk.TYPES.SEQUENCE, [
      cnField,
    ]),
    publicKeyData,
    new Chunk(0xa0, extensions),
  ]);

  const bodyHash = new Chunk(Chunk.TYPES.SEQUENCE, [
    new Chunk(Chunk.TYPES.SEQUENCE, [
      new Chunk(Chunk.TYPES.OBJECT, '2.16.840.1.101.3.4.2.1'),
      Chunk.Null,
    ]),
    new Chunk(Chunk.TYPES.OCTET, hash('sha256', body.raw))
  ]);

  const signatureAlgorithm = new Chunk(Chunk.TYPES.SEQUENCE, [
    new Chunk(Chunk.TYPES.OBJECT, '1.2.840.113549.1.1.11'),
    Chunk.Null,
  ]);

  const signature = new Chunk(Chunk.TYPES.BIT, crypto.privateEncrypt(privateKey, bodyHash.raw));

  const csr = new Chunk(Chunk.TYPES.SEQUENCE, [
    body,
    signatureAlgorithm,
    signature,
  ]);

  return new PEM(PEM.TYPE.CERTIFICATE_REQUEST, csr.raw);
}

module.exports.createKeyPair = function createKeyPair ({ file = '', keyLength = 4096 } = {}) {
  return useFile(
    () => createKeys(keyLength)
      .then(function (keys) {
        return keys.privateKey.toString() + '\n' + keys.publicKey.toString();
      }),
    file,
    { format: 'plain' }
  )
    .then(function (raw) {
      const pems = PEM.parse(raw);
      const result = {};

      for (let index = 0 ; index < pems.length ; ++index) {
        if (pems[index].type === PEM.TYPE.RSA_PRIVATE_KEY) {
          result.privateKey = pems[index];
        } else if (pems[index].type === PEM.TYPE.PUBLIC_KEY) {
          result.publicKey = pems[index];
        }
      }

      return result;
    });
}

module.exports.createKeys = createKeys;
module.exports.genRSA = genRSA;
