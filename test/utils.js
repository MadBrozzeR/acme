function getRequest (requests, url) {
  for (let index = 0 ; index < requests.length ; ++index) {
    if (requests[index].path === url) {
      return requests[index];
    }
  }

  return null;
}

function checkRequestData (suit, request, params, { prefix = '' } = {}) {
  if (!request) {
    throw prefix + 'Request has not been sent';
  }
  const data = JSON.parse(request.data);
  checkFields(suit, data, params, { prefix });
}

function checkRequest (suit, request, params) {
  const prefix = params.prefix || '';
  if (!request) {
    throw prefix + 'Request has not been sent';
  }
  (params.method) && suit.equals(request.method, params.method, prefix + 'Method doesn\'t match');
  (params.path) && suit.equals(request.path, params.path, prefix + 'Path doesn\'t match');
}

function checkFields (suit, object, compare, { prefix = '' } = {}) {
  for (const field in compare) {
    suit.equals(object[field], compare[field], prefix + 'Wrong ' + field + ' field data');
  }
}

module.exports = { getRequest, checkRequestData, checkRequest, checkFields };
