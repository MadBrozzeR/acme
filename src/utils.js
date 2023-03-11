const fs = require('fs');
const URLUNSAFE_RE = /[\/+=]/g;
const URLSAFE = { '/': '_', '+': '-' };

function base64url (buffer) {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer);
  }

  return buffer.toString('base64').replace(URLUNSAFE_RE, function (match) {
    return URLSAFE[match] || '';
  });
}

function getIdentifiers (list) {
  const result = [];

  for (let index = 0 ; index < list.length ; ++index) {
    result.push({
      type: 'dns',
      value: list[index]
    });
  }

  return result;
}

const CT_JSON_RE = /application\/.*json/;

async function parseResponse(response) {
  const data = CT_JSON_RE.test(response.raw.headers['content-type'])
    ? await response.json()
    : await response.data();

  return {
    status: response.raw.statusCode,
    headers: response.raw.headers,
    data: data,
  };
}

function makeBuffers (object) {
  if (!object) {
    return object;
  }

  if (object.type === 'Buffer' && object.data instanceof Array) {
    return Buffer.from(object.data);
  }

  if (object instanceof Object) {
    for (const key in object) {
      object[key] = makeBuffers(object[key]);
    }
  }

  return object;
}

const convert = {
  from: function (format, data) {
    switch (format) {
      case 'json':
        return makeBuffers(JSON.parse(data.toString()));
      case 'text':
        return data.toString();
      default:
        return data;
    }
  },
  to: function (format, data) {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'text':
        return data.toString();
      default:
        return data;
    }
  }
}

function useFile(callback, file = '', { format = 'json' } = {}) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      try {
        resolve(callback());
      } catch (error) {
        reject(error);
      }

      return;
    }

    fs.readFile(file, function (error, data) {
      if (error) {
        let result;

        try {
          result = callback();
        } catch (error) {
          reject(error);

          return;
        }

        if (result instanceof Promise) {
          result
            .then(function (data) {
              const dataToWrite = convert.to(format, data);

              fs.writeFile(file, dataToWrite, function (error) {
                if (error) {
                  reject(error);
                } else {
                  resolve(convert.from(format, dataToWrite));
                }
              });
            })
            .catch(reject);
        } else {
          const dataToWrite = convert.to(format, result);

          fs.writeFile(file, dataToWrite, function (error) {
            if (error) {
              reject(error);
            } else {
              resolve(convert.from(format, dataToWrite));
            }
          });
        }
      } else {
        resolve(convert.from(format, data));
      }
    });
  });
};

function updateOrderFields (order, response) {
  const result = {
    status: response.data.status,
    expires: response.data.expires,
    notBefore: response.data.notBefore,
    notAfter: response.data.notAfter,
    finalizeUrl: response.data.finalize,
    certificateUrl: response.data.certificate,
  };

  for (const key in result) {
    if (result[key] !== undefined) {
      order[key] = result[key];
    }
  }

  return order;
}

module.exports = { base64url, getIdentifiers, parseResponse, useFile, updateOrderFields };
